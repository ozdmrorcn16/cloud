"""CHECK-IN SURESI VE TEKRAR KURALI - CANLI dogrulama.

Kullanicinin karari (2026-09-07) ve ayni gun yaptigi KAPSAM
DUZELTMESI: "Kural mekan listesi icin gecerli. Ana sayfa ve profil
akisi paylasilanlar oldugu gibi kaliyor, kisi paylasima ozel duzenleme
ve silme yapabiliyor."

  - Check-in 1 SAAT "su an burada" kalir.
  - HER check-in KENDI kaydi: check_in_yap her zaman yeni satir aciyor.
    Boylece her ziyaret ana sayfada ve profilde AYRI bir paylasim ve
    kisi her birini ayri ayri duzenleyip silebiliyor.
  - Teklestirme ve 24 saat suzgeci YALNIZCA mekan sayfasinin listesinde
    (mekan_son_check_inler): son 24 saat, kisi basina tek satir, en
    yenisi.
  - Liderlik her zaman 3 kisi ve satir sayiyor, yani her check-in
    sayaci artiriyor.

Jest Supabase'i mock'luyor, yani bu davranisi GOREMEZ. Ayni sinif hata
bu projede yasandi: 66 test yesilken ekran canlida hic calismiyordu.

Betik IDEMPOTENT: bastan ve sondan kendi actigi satirlari siliyor,
gercek veriye dokunmuyor. Guvenle yeniden kosulur.

Kullanim (mobil/.env yuklu kabukta):
    python araclar/check-in-tekrar-canli-test.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']

EPOSTA, SIFRE = 'test0@slooin.test', 'test1234'

gecti, kaldi = 0, 0


def kontrol(ad: str, sonuc: bool, ayrinti: str = '') -> None:
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print(f'  OK   {ad}')
    else:
        kaldi += 1
        print(f'  HATA {ad}  {ayrinti}')


yonetici = create_client(URL, SERVICE)
istemci = create_client(URL, ANON)

oturum = istemci.auth.sign_in_with_password({'email': EPOSTA, 'password': SIFRE})
ben = oturum.user.id
print(f'Giris: {EPOSTA}  ({ben})')

# TEST MEKANI: Hozee (Nilufer, Bursa).
#
# Kimlik DOGRUDAN yaziliyor, adla aranmiyor: `mekanlar` 5,9 milyon
# satir ve `ad` uzerinde tam esitlik indeksi yok (yalnizca
# `tr_kucuk(ad)` uzerinde trigram GIN var). `eq('ad', 'Hozee')`
# PostgREST'in 8 saniyelik sinirinda zaman asimina duesuyor - denendi.
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'
print(f'Mekan: Hozee  ({MEKAN_ID})')

def kendi_satirlarim():
    return (
        yonetici.table('check_inler')
        .select('id, olusturma_zamani, bitis_zamani, konum, not_metni')
        .eq('kullanici_id', ben)
        .eq('mekan_id', MEKAN_ID)
        .order('olusturma_zamani', desc=True)
        .execute()
        .data
    )


def temizle():
    for satir in kendi_satirlarim():
        yonetici.table('check_inler').delete().eq('id', satir['id']).execute()


print('\nBaslangic temizligi...')
temizle()
kontrol('baslangicta bu mekanda kaydim yok', len(kendi_satirlarim()) == 0)

# MEKANIN KENDI KOORDINATI. check_in_yap 1 km kontrolu yapiyor.
# Nilufer merkezi (40.2261, 28.8656) KULLANILAMAZ - Hozee oraya 5.157 m
# uzakta, yani check-in reddedilirdi. Degerler canli semadan olculdu
# (ST_Y/ST_X); mekan tasinirsa betik ilk check-in'de yuksek sesle
# patlar, sessizce yanlis sonuc vermez.
LAT, LNG = 40.210416, 28.92262

print('\n1) ILK check-in')
ilk = istemci.rpc(
    'check_in_yap',
    {
        'p_mekan_id': MEKAN_ID,
        'p_lat': LAT,
        'p_lng': LNG,
        'p_not_metni': 'ilk not',
        'p_bulunurluk': 'herkese_acik',
    },
).execute().data

satirlar = kendi_satirlarim()
kontrol('tek satir olustu', len(satirlar) == 1, f'{len(satirlar)} satir')
kontrol('not yazildi', satirlar and satirlar[0]['not_metni'] == 'ilk not')

bitis = datetime.fromisoformat(satirlar[0]['bitis_zamani'].replace('Z', '+00:00'))
olusma = datetime.fromisoformat(satirlar[0]['olusturma_zamani'].replace('Z', '+00:00'))
sure = bitis - olusma
kontrol(
    'canlilik suresi 1 SAAT',
    timedelta(minutes=59) < sure < timedelta(minutes=61),
    f'olculen {sure}',
)
ilk_id = satirlar[0]['id']

print('\n2) Ayni mekana IKINCI check-in -> YENI PAYLASIM beklenir')
# Kapsam duzeltmesi buraya bakiyor: paylasimlar oldugu gibi kaliyor,
# yani ikinci ziyaret ana sayfada ve profilde AYRI bir kayit.
istemci.rpc(
    'check_in_yap',
    {
        'p_mekan_id': MEKAN_ID,
        'p_lat': LAT,
        'p_lng': LNG,
        'p_not_metni': 'ikinci ziyaret',
        'p_bulunurluk': 'herkese_acik',
    },
).execute()

satirlar = kendi_satirlarim()
kontrol('YENI SATIR ACILDI', len(satirlar) == 2, f'{len(satirlar)} satir')
ilki = [s for s in satirlar if s['id'] == ilk_id]
kontrol('ilk paylasim YERINDE', len(ilki) == 1)
kontrol(
    'ilk paylasimin notu DEGISMEDI',
    ilki and ilki[0]['not_metni'] == 'ilk not',
    f'okunan {ilki[0]["not_metni"] if ilki else "-"}',
)
kontrol(
    'ilk paylasimin zamani DEGISMEDI',
    ilki
    and datetime.fromisoformat(ilki[0]['olusturma_zamani'].replace('Z', '+00:00'))
    == olusma,
)
kontrol(
    'yalnizca YENISI canli (tek aktif check-in kurali)',
    sum(1 for s in satirlar if s['konum'] is not None) == 1,
)

print('\n3) Iki paylasim AYRI AYRI duzenlenebiliyor')
# Kullanicinin ifadesi: "kisi paylasima ozel duzenleme ve silme
# yapabiliyor". Duzenleme yolu check_in_notunu_guncelle RPC'si.
istemci.rpc(
    'check_in_notunu_guncelle',
    {'p_check_in_id': ilk_id, 'p_not': 'ilk not duzenlendi'},
).execute()
satirlar = kendi_satirlarim()
ilki = [s for s in satirlar if s['id'] == ilk_id]
digeri = [s for s in satirlar if s['id'] != ilk_id]
kontrol(
    'ILK paylasimin notu degisti',
    ilki and ilki[0]['not_metni'] == 'ilk not duzenlendi',
)
kontrol(
    'IKINCI paylasim ETKILENMEDI',
    digeri and digeri[0]['not_metni'] == 'ikinci ziyaret',
)


print('\n4) mekan_son_check_inler: 24 saat + kisi basina TEK satir')
son = istemci.rpc(
    'mekan_son_check_inler', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}
).execute().data
benimkiler = [s for s in son if s['kullanici_id'] == ben]
kontrol(
    'listede bir kez gorunuyorum (iki satirim olsa da)',
    len(benimkiler) == 1,
    f'{len(benimkiler)} kez',
)
kontrol(
    'listedeki kayit EN YENISI',
    benimkiler and benimkiler[0]['not_metni'] == 'ikinci ziyaret',
    f'okunan {benimkiler[0]["not_metni"] if benimkiler else "-"}',
)

print('\n5) mekan_liderlik: HER ZAMAN en fazla 3 kisi')
lider = istemci.rpc('mekan_liderlik', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}).execute().data
kontrol('limit 20 istense de 3 donuyor', len(lider) <= 3, f'{len(lider)} satir')
benim = [s for s in lider if s['kullanici_id'] == ben]
kontrol(
    'sayacim 2 (iki ayri satir)',
    benim and benim[0]['check_in_sayisi'] == 2,
    f'okunan {benim[0]["check_in_sayisi"] if benim else "-"}',
)

print('\n6) Eski kayit 24 saati doldurunca listeden DUSER')
yonetici.table('check_inler').update(
    {'olusturma_zamani': (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()}
).eq('id', ilk_id).execute()
son = istemci.rpc(
    'mekan_son_check_inler', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}
).execute().data
kontrol(
    'listede hala TEK kaydim var (eskisi dustu)',
    len([s for s in son if s['kullanici_id'] == ben]) == 1,
)
kontrol(
    'satir SILINMEDI, yalnizca listeden dustu',
    len(kendi_satirlarim()) == 2,
    'anilar korunmali',
)

print('\nTemizlik...')
temizle()
kontrol('acilan satirlarin hepsi silindi', len(kendi_satirlarim()) == 0)

print(f'\n{gecti} gecti, {kaldi} kaldi')
sys.exit(1 if kaldi else 0)
