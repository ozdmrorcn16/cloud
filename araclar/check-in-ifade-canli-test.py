"""CHECK-IN IFADESI - CANLI TEST (2026-09-21).

Jest Supabase'i mock'ladigi icin sunucu kurali orada gorulemez. Olculen:
  1. Gecersiz ifade slug'i -> 'Gecersiz ifade' ile REDDEDILIR.
  2. Gecerli ifade -> satira yazilir, RLS ile okunur.
  3. Ifadesiz check-in -> ifade null (geri uyumluluk).
  4. Sozluk tablosu anon/authenticated okunur, 108 satir.
  5. verilerimi_disa_aktar check_inler bloguna `ifade` koyar.
Actigi satirlari siler. Kosum: python araclar/check-in-ifade-canli-test.py
(mobil/.env okunur; hesap test0@slooin.test, mekan Hozee - check-in-tekrar
testiyle ayni sabitler).
"""
import os
import sys

from supabase import create_client

BURASI = os.path.dirname(os.path.abspath(__file__))
for satir in open(os.path.join(BURASI, '..', 'mobil', '.env'), encoding='utf-8'):
    satir = satir.strip()
    if satir and not satir.startswith('#') and '=' in satir:
        k, v = satir.split('=', 1)
        os.environ.setdefault(k, v.strip().strip('"'))

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
EPOSTA, SIFRE = 'test0@slooin.test', 'test1234'
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'  # Hozee
LAT, LNG = 40.210416, 28.92262

sonuclar = []
def kontrol(ad, kosul, ek=''):
    sonuclar.append(kosul)
    print(('OK   ' if kosul else 'FAIL ') + ad + (f'  [{ek}]' if ek else ''))

istemci = create_client(URL, ANON)
istemci.auth.sign_in_with_password({'email': EPOSTA, 'password': SIFRE})
acilanlar = []

def check_in(ifade):
    return istemci.rpc('check_in_yap', {
        'p_mekan_id': MEKAN_ID, 'p_lat': LAT, 'p_lng': LNG,
        'p_not_metni': 'ifade canli testi', 'p_fotograf': None,
        'p_bulunurluk': 'herkese_acik', 'p_ifade': ifade,
    }).execute().data

try:
    # 4. sozluk
    sozluk = istemci.table('ifadeler').select('slug, kategori, etiket').execute().data
    kontrol('ifadeler sozlugu okunur ve 108 satir', len(sozluk) == 108, str(len(sozluk)))
    kontrol("sozlukte 'kahve-keyfi' etiketi duzgun Turkce", any(s['slug'] == 'kahve-keyfi' and s['etiket'] == 'Kahve keyfi' for s in sozluk))

    # 1. gecersiz
    try:
        satir = check_in('olmayan-ifade')
        acilanlar.append(satir['id'])
        kontrol('gecersiz ifade reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('gecersiz ifade reddedilir', 'Gecersiz ifade' in str(e), str(e)[:80])

    # 2. gecerli
    satir = check_in('kahve-keyfi')
    acilanlar.append(satir['id'])
    kontrol('gecerli ifade satira yazilir (RPC donusu)', satir.get('ifade') == 'kahve-keyfi', str(satir.get('ifade')))
    okunan = istemci.table('check_inler').select('id, ifade, not_metni').eq('id', satir['id']).single().execute().data
    kontrol('ifade RLS ile okunur', okunan['ifade'] == 'kahve-keyfi')

    # 3. ifadesiz
    satir2 = check_in(None)
    acilanlar.append(satir2['id'])
    kontrol('ifadesiz check-in null ifade ile olusur', satir2.get('ifade') is None)

    # 5. disa aktarim
    dosya = istemci.rpc('verilerimi_disa_aktar').execute().data
    benim = [c for c in dosya['check_inler'] if c['id'] == satir['id']]
    kontrol('disa aktarimda ifade var', bool(benim) and benim[0].get('ifade') == 'kahve-keyfi')
finally:
    for cid in acilanlar:
        try:
            istemci.table('check_inler').delete().eq('id', cid).execute()
        except Exception as e:
            print('temizlik hatasi', cid, e)
    print(f'{len(acilanlar)} test satiri silindi')

print(f'\n{sum(sonuclar)}/{len(sonuclar)} dogrulama gecti')
sys.exit(0 if all(sonuclar) else 1)
