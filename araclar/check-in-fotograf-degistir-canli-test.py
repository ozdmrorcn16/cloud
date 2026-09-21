"""CHECK-IN FOTOGRAFLARINI DEGISTIR / KALDIR - CANLI TEST (2026-09-21/22).

Jest Supabase'i mock'ladigi icin sunucu kurali orada gorulemez. Olculen:
  1. check_in_yap p_fotograflar ile iki fotografli check-in acar; `fotograf`
     (generated) ilk eleman.
  2. check_in_fotograflarini_guncelle: [y1,y2] -> [y2,y3] kaldirilan [y1];
     kullanici y1'i kovadan SILEBILIR ve dosya gercekten gider.
  3. 6 yol -> 'En fazla 5 fotograf eklenebilir'.
  4. Baskasinin klasorundeki yol -> 'Bu fotograf sana ait degil'.
  5. Baskasinin check-in'i -> 'Bu paylasim bulunamadi'.
  6. Tekil sarmalayici check_in_fotografini_guncelle hala calisir (eski OTA).
  7. Hepsini kaldir ([]) -> fotograflar bos, fotograf null, kaldirilanlar doner.
  8. mekan_fotograflari fotograf basina satir verir.
  9. verilerimi_disa_aktar check_inler bloguna `fotograflar` koyar.
 10. anon cagiramaz.
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

def yukle(n):
    yol = f'{a_id}/canli-{int(time.time() * 1000)}-{n}.jpg'
    a.storage.from_(KOVA).upload(yol, JPEG, {'content-type': 'image/jpeg'})
    yollar.append(yol)
    return yol

def kovada(yol):
    return os.path.basename(yol) in [d['name'] for d in a.storage.from_(KOVA).list(a_id)]

def guncelle(istemci, cid, liste):
    return istemci.rpc('check_in_fotograflarini_guncelle', {'p_check_in_id': cid, 'p_fotograflar': liste}).execute().data

acilan = None
yollar = []
try:
    y1, y2 = yukle(1), yukle(2)

    # 1. p_fotograflar ile check-in
    satir = a.rpc('check_in_yap', {
        'p_mekan_id': MEKAN_ID, 'p_lat': LAT, 'p_lng': LNG,
        'p_not_metni': 'coklu fotograf canli testi', 'p_fotograf': None,
        'p_bulunurluk': 'herkese_acik', 'p_ifade': None, 'p_fotograflar': [y1, y2],
    }).execute().data
    acilan = satir['id']
    kontrol('check_in_yap p_fotograflar ile iki fotograf yazar', satir.get('fotograflar') == [y1, y2], str(satir.get('fotograflar')))
    kontrol('generated `fotograf` = ilk fotograf', satir.get('fotograf') == y1)

    # 2. degistir: [y1,y2] -> [y2,y3]
    y3 = yukle(3)
    kaldirilan = guncelle(a, acilan, [y2, y3])
    kontrol('kaldirilan eski yollar [y1] doner', kaldirilan == [y1], str(kaldirilan))
    okunan = a.table('check_inler').select('fotograf, fotograflar').eq('id', acilan).single().execute().data
    kontrol('satirda [y2,y3]; fotograf = y2', okunan['fotograflar'] == [y2, y3] and okunan['fotograf'] == y2)
    a.storage.from_(KOVA).remove([y1])
    kontrol('y1 kovadan GERCEKTEN silindi', not kovada(y1))
    yollar.remove(y1)

    # 3. 6 yol
    try:
        guncelle(a, acilan, [y2, y3, y2, y3, y2, y3])
        kontrol('6 fotograf reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('6 fotograf reddedilir', 'En fazla 5' in str(e), str(e)[:70])

    # 4. baskasinin klasoru
    try:
        guncelle(a, acilan, [y2, f'{b_id}/x.jpg'])
        kontrol('baskasinin yolu reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('baskasinin yolu reddedilir', 'sana ait degil' in str(e), str(e)[:70])

    # 5. baskasinin check-in'i
    try:
        guncelle(b, acilan, [])
        kontrol("baskasinin check-in'i degistirilemez", False, 'kabul edildi!')
    except Exception as e:
        kontrol("baskasinin check-in'i degistirilemez", 'bulunamadi' in str(e), str(e)[:70])

    # 6. tekil sarmalayici (eski OTA)
    y4 = yukle(4)
    eski = a.rpc('check_in_fotografini_guncelle', {'p_check_in_id': acilan, 'p_fotograf': y4}).execute().data
    okunan = a.table('check_inler').select('fotograflar').eq('id', acilan).single().execute().data
    kontrol('tekil sarmalayici: satir [y4], ilk kaldirilan doner', okunan['fotograflar'] == [y4] and eski in (y2, y3), str(eski))
    a.storage.from_(KOVA).remove([y2, y3]); yollar.remove(y2); yollar.remove(y3)

    # 8. mekan galerisi fotograf basina satir
    y5 = yukle(5)
    guncelle(a, acilan, [y4, y5])
    galeri = a.rpc('mekan_fotograflari', {'p_mekan_id': MEKAN_ID, 'p_limit': 60, 'p_ofset': 0}).execute().data
    benimkiler = [g['fotograf'] for g in galeri if g['id'] == acilan]
    kontrol('mekan_fotograflari iki satir (sira korunur)', benimkiler == [y4, y5], str(benimkiler))

    # 9. disa aktarim
    dosya = a.rpc('verilerimi_disa_aktar').execute().data
    benim = [c for c in dosya['check_inler'] if c['id'] == acilan]
    kontrol('disa aktarimda fotograflar var', bool(benim) and benim[0].get('fotograflar') == [y4, y5])

    # 7. hepsini kaldir
    kaldirilan = guncelle(a, acilan, [])
    okunan = a.table('check_inler').select('fotograf, fotograflar').eq('id', acilan).single().execute().data
    kontrol('hepsini kaldir: fotograflar [] ve fotograf null', okunan['fotograflar'] == [] and okunan['fotograf'] is None)
    kontrol('kaldirilanlar [y4,y5]', sorted(kaldirilan) == sorted([y4, y5]), str(kaldirilan))
    a.storage.from_(KOVA).remove([y4, y5]); yollar.remove(y4); yollar.remove(y5)
    kontrol('kaldirilan dosyalar kovada yok', not kovada(y4) and not kovada(y5))

    # 10. anon
    try:
        create_client(URL, ANON).rpc('check_in_fotograflarini_guncelle', {'p_check_in_id': acilan, 'p_fotograflar': []}).execute()
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
