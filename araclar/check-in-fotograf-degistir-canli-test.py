"""CHECK-IN FOTOGRAFINI DEGISTIR / KALDIR - CANLI TEST (2026-09-21).

Jest Supabase'i mock'ladigi icin sunucu kurali orada gorulemez. Olculen:
  1. Kullanici kendi klasorune fotograf yukler; RPC yolu satira yazar,
     eski yol yoktu -> null doner.
  2. Ikinci fotograf: RPC ESKI yolu dondurur; kullanici eski dosyayi
     kovadan SILEBILIR (yeni delete politikasi + kendi klasoru okuma
     istisnasi) ve dosya gercekten gider.
  3. Baskasinin klasorundeki yol -> 'Bu fotograf sana ait degil'.
  4. Baskasinin check-in'i -> 'Bu paylasim bulunamadi'.
  5. Kaldir (null) -> satirda fotograf null, eski yol doner.
  6. anon cagiramaz.
Actigi satir ve dosyalari siler. Kosum: python araclar/check-in-fotograf-degistir-canli-test.py
"""
import os
import time

from supabase import create_client

BURASI = os.path.dirname(os.path.abspath(__file__))
for satir in open(os.path.join(BURASI, '..', 'mobil', '.env'), encoding='utf-8'):
    satir = satir.strip()
    if satir and not satir.startswith('#') and '=' in satir:
        k, v = satir.split('=', 1)
        os.environ.setdefault(k, v.strip().strip('"'))

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
KOVA = 'check-in-fotograflari'
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'  # Hozee
LAT, LNG = 40.210416, 28.92262
# 1x1 JPEG (kova image/jpeg istiyor)
JPEG = bytes.fromhex(
    'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432'
    'ffc0000b080001000101011100ffc40014000100000000000000000000000000000009ffc40014100100000000000000000000000000000000ffda0008010100003f00d2cf20ffd9'
)

sonuclar = []
def kontrol(ad, kosul, ek=''):
    sonuclar.append(kosul)
    print(('OK   ' if kosul else 'FAIL ') + ad + (f'  [{ek}]' if ek else ''))

a = create_client(URL, ANON)
a.auth.sign_in_with_password({'email': 'test0@slooin.test', 'password': 'test1234'})
a_id = a.auth.get_user().user.id
b = create_client(URL, ANON)
b.auth.sign_in_with_password({'email': 'test1@slooin.test', 'password': 'test1234'})
b_id = b.auth.get_user().user.id

acilan = None
yollar = []
try:
    satir = a.rpc('check_in_yap', {
        'p_mekan_id': MEKAN_ID, 'p_lat': LAT, 'p_lng': LNG,
        'p_not_metni': 'fotograf degistir canli testi', 'p_fotograf': None,
        'p_bulunurluk': 'herkese_acik', 'p_ifade': None,
    }).execute().data
    acilan = satir['id']

    # 1. ilk fotograf
    yol1 = f'{a_id}/canli-{int(time.time())}-1.jpg'
    a.storage.from_(KOVA).upload(yol1, JPEG, {'content-type': 'image/jpeg'})
    yollar.append(yol1)
    eski = a.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': yol1}).execute().data
    kontrol('ilk fotograf: eski yol yok, RPC null doner', eski is None, str(eski))
    okunan = a.table('check_inler').select('fotograf').eq('id', acilan).single().execute().data
    kontrol('satirda yeni yol', okunan['fotograf'] == yol1)

    # 2. ikinci fotograf -> eski doner, eski silinebilir
    yol2 = f'{a_id}/canli-{int(time.time())}-2.jpg'
    a.storage.from_(KOVA).upload(yol2, JPEG, {'content-type': 'image/jpeg'})
    yollar.append(yol2)
    eski = a.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': yol2}).execute().data
    kontrol('ikinci fotograf: RPC eski yolu dondurur', eski == yol1, str(eski))
    a.storage.from_(KOVA).remove([yol1])
    kalanlar = [d['name'] for d in a.storage.from_(KOVA).list(a_id)]
    kontrol('eski dosya kovadan GERCEKTEN silindi', os.path.basename(yol1) not in kalanlar)
    kontrol('yeni dosya kovada duruyor', os.path.basename(yol2) in kalanlar)
    yollar.remove(yol1)

    # 3. baskasinin klasoru
    try:
        a.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': f'{b_id}/x.jpg'}).execute()
        kontrol('baskasinin yolu reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('baskasinin yolu reddedilir', 'sana ait degil' in str(e), str(e)[:80])

    # 4. baskasinin check-in'i
    try:
        b.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': None}).execute()
        kontrol("baskasinin check-in'i degistirilemez", False, 'kabul edildi!')
    except Exception as e:
        kontrol("baskasinin check-in'i degistirilemez", 'bulunamadi' in str(e), str(e)[:80])
    okunan = a.table('check_inler').select('fotograf').eq('id', acilan).single().execute().data
    kontrol('B denemesinden sonra yol degismedi', okunan['fotograf'] == yol2)

    # 5. kaldir
    eski = a.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': None}).execute().data
    kontrol('kaldir: eski yol doner', eski == yol2, str(eski))
    okunan = a.table('check_inler').select('fotograf').eq('id', acilan).single().execute().data
    kontrol('kaldir: satirda fotograf null', okunan['fotograf'] is None)
    a.storage.from_(KOVA).remove([yol2])
    kalanlar = [d['name'] for d in a.storage.from_(KOVA).list(a_id)]
    kontrol('kaldirilan dosya kovadan silindi', os.path.basename(yol2) not in kalanlar)
    yollar.remove(yol2)

    # 6. anon
    try:
        create_client(URL, ANON).rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': None}).execute()
        kontrol('anon cagiramaz', False, 'kabul edildi!')
    except Exception as e:
        kontrol('anon cagiramaz', True, str(e)[:60])
finally:
    if acilan:
        try:
            a.table('check_inler').delete().eq('id', acilan).execute()
        except Exception as e:
            print('temizlik:', e)
    if yollar:
        try:
            a.storage.from_(KOVA).remove(yollar)
        except Exception as e:
            print('temizlik (kova):', e)

print(f'\n{sum(sonuclar)}/{len(sonuclar)} gecti')
raise SystemExit(0 if all(sonuclar) else 1)
