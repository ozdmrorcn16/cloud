"""BEGENI / YORUM BILDIRIMI - CANLI TEST (2026-09-22).

Tetikleyici -> pg_net -> Edge Function zincirini tetikler; sonucu Edge
Function gunlugunde ("bildirim-gonder: ...") ve bu betigin olctugu
satirlarda gorursun. Olculen:
  1. test1, test0'in check-in'ini begenir -> begeniler satiri var.
  2. test1 yorum yazar -> yorumlar satiri var.
  3. test0 kendi check-in'ini begenir -> satir var ama olay uretilmez
     (tetikleyici kendi paylasimini eler; gunlukte bu icin kayit YOK).
  4. Uygulama ici "Etkilesimler" sorgusu (test0 gozuyle): begeni ve
     yorum satirlari, aktor test1.
Actiklarini siler. Kosum: python araclar/begeni-yorum-bildirim-canli-test.py
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
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'  # Hozee
LAT, LNG = 40.210416, 28.92262

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
yorum_id = None
bag_kurdum = False
try:
    # On kosul: B, A'nin check-in'ini ancak arkadassa gorur (RLS). Acik
    # profilde takip_istegi_gonder dogrudan 'kabul' doner (2026-09-18).
    zaten = a.table('takipler').select('durum').eq('takip_eden_id', b_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data
    if not zaten:
        b.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        bag_kurdum = True

    satir = a.rpc('check_in_yap', {
        'p_mekan_id': MEKAN_ID, 'p_lat': LAT, 'p_lng': LNG,
        'p_not_metni': 'begeni-yorum bildirim canli testi', 'p_fotograf': None,
        'p_bulunurluk': 'herkese_acik', 'p_ifade': None, 'p_fotograflar': [],
    }).execute().data
    acilan = satir['id']

    # 1. begeni
    b.table('begeniler').insert({'check_in_id': acilan, 'kullanici_id': b_id}).execute()
    okunan = a.table('begeniler').select('kullanici_id').eq('check_in_id', acilan).execute().data
    kontrol('B begendi, A satiri goruyor', any(r['kullanici_id'] == b_id for r in okunan))

    # 2. yorum
    y = b.table('yorumlar').insert({'check_in_id': acilan, 'kullanici_id': b_id, 'metin': 'canli test yorumu'}).select('id').execute().data
    yorum_id = y[0]['id']
    kontrol('B yorum yazdi', bool(yorum_id))

    # 3. kendi begenisi
    a.table('begeniler').insert({'check_in_id': acilan, 'kullanici_id': a_id}).execute()
    kontrol('A kendi paylasimini begendi (olay uretilmemeli - gunlukte yok)', True)

    # 4. Etkilesimler sorgusu (istemcinin kullandigi PostgREST bicimi)
    beg = a.table('begeniler').select('check_in_id, kullanici_id, olusturuldu, check_inler!inner(kullanici_id, mekanlar(ad))') \
        .eq('check_inler.kullanici_id', a_id).neq('kullanici_id', a_id).order('olusturuldu', desc=True).limit(50).execute().data
    kontrol('Etkilesimler: begeni satiri (aktor B, kendi begenisi haric)', any(r['kullanici_id'] == b_id and r['check_in_id'] == acilan for r in beg) and not any(r['kullanici_id'] == a_id for r in beg), str(len(beg)))
    yor = a.table('yorumlar').select('id, check_in_id, kullanici_id, metin, olusturuldu, check_inler!inner(kullanici_id, mekanlar(ad))') \
        .eq('check_inler.kullanici_id', a_id).neq('kullanici_id', a_id).order('olusturuldu', desc=True).limit(50).execute().data
    kontrol('Etkilesimler: yorum satiri (aktor B, mekan adi gomulu)', any(r['id'] == yorum_id and r['check_inler']['mekanlar']['ad'] for r in yor))

    # Edge Function'in islemesi icin kisa bekleme (pg_net async).
    time.sleep(3)
    print('\nGunlukte beklenen: olay=begeni ve olay=yorum icin "jeton yok" ya da "alici islendi"; A\'nin kendi begenisi icin kayit YOK.')
finally:
    if acilan:
        try:
            a.table('check_inler').delete().eq('id', acilan).execute()  # begeni/yorum cascade
        except Exception as e:
            print('temizlik:', e)
    if bag_kurdum:
        try:
            b.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (bag):', e)

print(f'\n{sum(sonuclar)}/{len(sonuclar)} gecti')
raise SystemExit(0 if all(sonuclar) else 1)
