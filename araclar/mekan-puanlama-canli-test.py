"""MEKAN PUANLAMA - CANLI dogrulama (2026-09-13).

Kullanicinin istegi: Swarm'daki gibi puanlama (Kotu / Iyi / Harika).
Kurallarin HEPSI sunucuda (`20260913110000`); jest Supabase'i
mock'ladigi icin hicbiri jest'te gorulemiyor.

Olculenler:
   1. Kimliksiz cagri reddediliyor
   2. Orada HIC check-in yapmamis kisi puan veremiyor
   3. Check-in yapmis kisi puan verebiliyor, ozet sayisi artiyor
   4. Ikinci oy YENI SATIR ACMIYOR, oncekini guncelliyor (kisi basina tek)
   5. Kisi kendi oyunu goruyor, BASKASI onun oyunu goremiyor
   6. 3 oydan az varken puan NULL, sayilar yine geliyor
   7. 3 oyla puan hesaplaniyor ve formul dogru: Harika,Harika,Iyi ->
      (10+10+7)/3 = 9,0
   8. Gecersiz seviye (0, 4) reddediliyor
   9. Tabloya dogrudan erisim kapali (anon anahtarla select bos/hata)
  10. Disa aktarimda 'mekan_puanlarim' var
  11. Temizlik: eklenen oylar ve gecici check-in'ler silindi

Betik gecici check-in satirlarini SERVICE ROLE ile ekliyor (check_in_yap
1 km kurali ister; burada yalnizca "orada bulunmus" kaydi gerekiyor) ve
sonunda siliyor. Gercek veriye dokunmuyor.

Kosum (mobil/.env yuklu kabukta):
    python araclar/mekan-puanlama-canli-test.py
"""
import os
import sys

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SR = os.environ['SUPABASE_SERVICE_ROLE_KEY']
SIFRE = os.environ.get('TEST_HESAP_SIFRESI', 'test1234')
HESAPLAR = ['test0@slooin.test', 'test1@slooin.test', 'test2@slooin.test']

y = create_client(URL, SR)
gecti = kaldi = 0


def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print('  OK   ' + ad)
    else:
        kaldi += 1
        print('  HATA ' + ad + '  ' + str(ayrinti))


def hata_verdi(cagri):
    try:
        cagri()
        return False, ''
    except Exception as e:  # noqa: BLE001
        return True, str(e)


def giris(eposta):
    c = create_client(URL, ANON)
    c.auth.sign_in_with_password({'email': eposta, 'password': SIFRE})
    return c


def ozet(c, mekan_id):
    return c.rpc('mekan_puan_ozeti', {'p_mekan_id': mekan_id}).execute().data[0]


# Test mekani: 'GORUNURLUK-TEST' mekanlari check-in'lere acik ve
# kullaniciya gorunmuyor. Yoksa en yakin test kaydi.
mekan = y.table('mekanlar').select('id, ad').like('ad', 'GORUNURLUK-TEST%').limit(1).execute().data
if not mekan:
    raise SystemExit('Test mekani bulunamadi')
mekan_id = mekan[0]['id']
print('mekan: ' + mekan[0]['ad'])

kimlikler = {}
for u in y.auth.admin.list_users():
    if u.email in HESAPLAR:
        kimlikler[u.email] = u.id
if len(kimlikler) < 3:
    raise SystemExit('Uc test hesabi gerekiyor: ' + str(kimlikler))

eklenen_ci = []
try:
    # Onceki kosumdan artik kalmasin.
    for e in HESAPLAR:
        y.table('mekan_puanlari').delete().eq('mekan_id', mekan_id).eq('kullanici_id', kimlikler[e]).execute()

    # 1. kimliksiz
    anon = create_client(URL, ANON)
    h, m = hata_verdi(lambda: anon.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 3}).execute())
    kontrol('kimliksiz cagri reddediliyor', h and 'Kimlik' in m, m)

    # 2. check-in yapmamis kisi
    a = giris(HESAPLAR[0])
    onceden = y.table('check_inler').select('id').eq('mekan_id', mekan_id).eq('kullanici_id', kimlikler[HESAPLAR[0]]).execute().data
    if onceden:
        print('  (test0 bu mekanda zaten check-in yapmis, 2. olcum atlanacak)')
    else:
        h, m = hata_verdi(lambda: a.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 3}).execute())
        kontrol('check-in yapmamis kisi puan veremiyor', h and 'check-in' in m, m)
        kontrol('ozet: puan_verebilir false', ozet(a, mekan_id)['puan_verebilir'] is False)

    # Gecici check-in'ler (service role): uc hesap da "orada bulunmus".
    for e in HESAPLAR:
        if e == HESAPLAR[0] and onceden:
            continue
        r = y.table('check_inler').insert({
            'mekan_id': mekan_id,
            'kullanici_id': kimlikler[e],
            'kullanici_adi': 'PUAN-TEST',
            'not_metni': 'PUAN-TEST-GECICI',
            'bulunurluk': 'gizli',
            'gorunurluk': 'kimse',
            # Suresi gecmis bir ani: konum yok, bitis gecmiste.
            'bitis_zamani': '2026-01-01T00:00:00Z',
        }).execute().data
        eklenen_ci.append(r[0]['id'])

    # 3. check-in yapmis kisi puan verebiliyor
    a = giris(HESAPLAR[0])
    kontrol('ozet: puan_verebilir true', ozet(a, mekan_id)['puan_verebilir'] is True)
    a.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 2}).execute()
    o = ozet(a, mekan_id)
    kontrol('ilk oy sayildi (iyi=1, toplam=1)', o['iyi'] == 1 and o['toplam'] == 1, o)

    # 4. ikinci oy guncelliyor
    a.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 3}).execute()
    o = ozet(a, mekan_id)
    kontrol('ikinci oy yeni satir acmadi (harika=1, iyi=0, toplam=1)',
            o['harika'] == 1 and o['iyi'] == 0 and o['toplam'] == 1, o)

    # 5. kendi oyunu goruyor, baskasi gormuyor
    kontrol('kisi kendi oyunu goruyor', o['benim_puanim'] == 3, o)
    b = giris(HESAPLAR[1])
    ob = ozet(b, mekan_id)
    kontrol('baskasi onun oyunu gormuyor (benim_puanim null)', ob['benim_puanim'] is None, ob)

    # 6. 3'ten az oy: puan null, sayilar var
    kontrol('3 oydan az: puan null ama harika=1 geliyor', ob['puan'] is None and ob['harika'] == 1, ob)

    # 7. formul
    b.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 3}).execute()
    c = giris(HESAPLAR[2])
    c.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 2}).execute()
    o = ozet(c, mekan_id)
    kontrol('3 oyla puan geldi: Harika,Harika,Iyi -> 9.0',
            o['toplam'] == 3 and float(o['puan']) == 9.0, o)

    # 8. gecersiz seviye
    h, m = hata_verdi(lambda: c.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 4}).execute())
    kontrol('gecersiz seviye (4) reddediliyor', h, m)
    h, m = hata_verdi(lambda: c.rpc('mekan_puanla', {'p_mekan_id': mekan_id, 'p_puan': 0}).execute())
    kontrol('gecersiz seviye (0) reddediliyor', h, m)

    # 9. tabloya dogrudan erisim
    h, m = hata_verdi(lambda: c.table('mekan_puanlari').select('*').execute())
    dogrudan = None if h else c.table('mekan_puanlari').select('*').execute().data
    kontrol('tabloya dogrudan select kapali (hata ya da bos)', h or dogrudan == [], m or dogrudan)

    # 10. disa aktarim
    d = c.rpc('verilerimi_disa_aktar').execute().data
    kontrol("disa aktarimda 'mekan_puanlarim' var ve oyu tasiyor",
            isinstance(d.get('mekan_puanlarim'), list) and any(p.get('puan') == 2 for p in d['mekan_puanlarim']),
            str(d.get('mekan_puanlarim'))[:200])
finally:
    for e in HESAPLAR:
        y.table('mekan_puanlari').delete().eq('mekan_id', mekan_id).eq('kullanici_id', kimlikler[e]).execute()
    for ci in eklenen_ci:
        y.table('check_inler').delete().eq('id', ci).execute()
    kalan = y.table('mekan_puanlari').select('mekan_id').eq('mekan_id', mekan_id).execute().data
    kontrol('temizlik: oylar ve gecici check-inler silindi', kalan == [] , kalan)

print('\n%d gecti, %d kaldi' % (gecti, kaldi))
sys.exit(1 if kaldi else 0)
