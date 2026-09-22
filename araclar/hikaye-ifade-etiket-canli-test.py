"""HIKAYEYE IFADE VE ARKADAS ETIKETI - CANLI TEST (2026-09-22).

Jest Supabase'i mock'ladigi icin asagidaki kurallarin HICBIRI orada
gorulemez; hepsi sunucuda:
  1. Sozlukte olmayan ifade reddedilir; gecerli ifade akista doner.
  2. Arkadas olmayan etiketlenemez; kisi kendini etiketleyemez.
  3. `etiket_onayi_gerekli` KAPALI olanda etiket aninda 'onaylandi' ve
     akista gorunur.
  4. ACIK olanda 'bekliyor': akista GORUNMEZ, kisi kendi bekleyen
     listesinde gorur, onaylayinca gorunur, reddedince duser.
  5. Etiket tablosuna dogrudan insert reddedilir (yalnizca RPC).
  6. verilerimi_disa_aktar: etiketleyende `etiketlediklerim` + `ifade`,
     etiketlenende `hikaye_etiketlerim`.
  7. anon yeni RPC'leri cagiramaz.
Actiklarini siler. Kosum: python araclar/hikaye-ifade-etiket-canli-test.py
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
KOVA = 'hikaye-medyalari'
JPEG = bytes.fromhex(
    'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432'
    'ffc0000b080001000101011100ffc40014000100000000000000000000000000000009ffc40014100100000000000000000000000000000000ffda0008010100003f00d2cf20ffd9'
)

sonuclar = []


def kontrol(ad, kosul, ek=''):
    kosul = bool(kosul)
    sonuclar.append(kosul)
    print(('OK   ' if kosul else 'FAIL ') + ad + (f'  [{ek}]' if ek else ''))


def hata(cagri):
    """Cagri hata verirse mesaji, vermezse None doner."""
    try:
        cagri()
        return None
    except Exception as e:  # noqa: BLE001 - mesaji olcmek istiyoruz
        return str(e)


def giris(eposta):
    c = create_client(URL, ANON)
    c.auth.sign_in_with_password({'email': eposta, 'password': 'test1234'})
    return c, c.auth.get_user().user.id


a, a_id = giris('test0@slooin.test')
b, b_id = giris('test1@slooin.test')
c, c_id = giris('test2@slooin.test')


def yukle(istemci, uid, n):
    yol = f'{uid}/ifade-etiket-{int(time.time() * 1000)}-{n}.jpg'
    istemci.storage.from_(KOVA).upload(yol, JPEG, {'content-type': 'image/jpeg'})
    return yol


def akis_satiri(istemci, hid):
    for h in istemci.rpc('hikaye_akisi').execute().data:
        if h['id'] == hid:
            return h
    return None


acilanlar = []
yollar = []
bag_kurdum = False
c_bag_kaldir = False
b_onay_eski = None
try:
    # On kosul: B, A'nin arkadasi (iki yonlu 'kabul'); C degil.
    zaten = a.table('takipler').select('durum').eq('takip_eden_id', a_id).eq(
        'takip_edilen_id', b_id).eq('durum', 'kabul').execute().data
    if not zaten:
        a.rpc('takip_istegi_gonder', {'p_kullanici_id': b_id}).execute()
        bag_kurdum = True
    c_bag = a.table('takipler').select('durum').eq('takip_eden_id', a_id).eq(
        'takip_edilen_id', c_id).eq('durum', 'kabul').execute().data
    if c_bag:
        a.rpc('takibi_birak', {'p_kullanici_id': c_id}).execute()
        c_bag_kaldir = True

    ifade = a.table('ifadeler').select('slug').limit(1).execute().data[0]['slug']
    b_onay_eski = b.table('profiller').select('etiket_onayi_gerekli').eq(
        'id', b_id).single().execute().data['etiket_onayi_gerekli']

    # --- 1. Ifade -------------------------------------------------------
    yol = yukle(a, a_id, 1)
    yollar.append(yol)
    m = hata(lambda: a.rpc('hikaye_ekle', {
        'p_fotograf': yol, 'p_ifade': 'boyle-bir-ifade-yok'}).execute())
    kontrol('sozlukte olmayan ifade REDDEDILIR', m and 'Gecersiz ifade' in m, m)

    # --- 2. Etiket kapilari ---------------------------------------------
    m = hata(lambda: a.rpc('hikaye_ekle', {
        'p_fotograf': yol, 'p_etiketler': [c_id]}).execute())
    kontrol('arkadas OLMAYAN etiketlenemez', m and 'arkadas' in m.lower(), m)

    m = hata(lambda: a.rpc('hikaye_ekle', {
        'p_fotograf': yol, 'p_etiketler': [a_id]}).execute())
    kontrol('kisi KENDINI etiketleyemez', m and 'Kendini' in m, m)

    yabanci = f'{b_id}/calinti.jpg'
    m = hata(lambda: a.rpc('hikaye_ekle', {'p_fotograf': yabanci}).execute())
    kontrol('baskasinin klasorundeki yol REDDEDILIR', m and 'sana ait degil' in m, m)

    # --- 3. Onay KAPALI: aninda onaylanmis -------------------------------
    b.table('profiller').update({'etiket_onayi_gerekli': False}).eq('id', b_id).execute()
    h1 = a.rpc('hikaye_ekle', {
        'p_fotograf': yol, 'p_yazi': 'ifade ve etiket', 'p_ifade': ifade,
        'p_etiketler': [b_id]}).execute().data
    acilanlar.append(h1['id'])
    satir = akis_satiri(a, h1['id'])
    kontrol('akis ifadeyi donduruyor', satir and satir['ifade'] == ifade,
            satir and satir['ifade'])
    kontrol('onay KAPALI iken etiket aninda gorunur',
            satir and len(satir['etiketler']) == 1
            and satir['etiketler'][0]['kullaniciId'] == b_id,
            satir and satir['etiketler'])
    kontrol('etiketlenen B de etiketi goruyor',
            (akis_satiri(b, h1['id']) or {}).get('etiketler'))

    # --- 4. Onay ACIK: bekliyor ------------------------------------------
    b.table('profiller').update({'etiket_onayi_gerekli': True}).eq('id', b_id).execute()
    yol2 = yukle(a, a_id, 2)
    yollar.append(yol2)
    h2 = a.rpc('hikaye_ekle', {
        'p_fotograf': yol2, 'p_etiketler': [b_id]}).execute().data
    acilanlar.append(h2['id'])
    satir = akis_satiri(a, h2['id'])
    kontrol('onay ACIK iken etiket akista GORUNMEZ',
            satir is not None and satir['etiketler'] == [], satir and satir['etiketler'])
    bekleyen = b.rpc('bekleyen_hikaye_etiketlerim').execute().data
    kontrol('B bekleyen listesinde goruyor',
            any(x['hikaye_id'] == h2['id'] for x in bekleyen), len(bekleyen))
    kontrol('A baskasinin bekleyenini gormuyor',
            not any(x['hikaye_id'] == h2['id']
                    for x in a.rpc('bekleyen_hikaye_etiketlerim').execute().data))

    b.rpc('hikaye_etiketini_yanitla', {'p_hikaye_id': h2['id'], 'p_onay': True}).execute()
    kontrol('onaylayinca akista gorunur',
            len((akis_satiri(a, h2['id']) or {}).get('etiketler') or []) == 1)
    m = hata(lambda: b.rpc('hikaye_etiketini_yanitla', {
        'p_hikaye_id': h2['id'], 'p_onay': True}).execute())
    kontrol('ayni etiket IKINCI kez yanitlanamaz', m and 'bulunamadi' in m, m)

    # Reddetme: bir hikaye daha, bu kez 'reddedildi'.
    yol3 = yukle(a, a_id, 3)
    yollar.append(yol3)
    h3 = a.rpc('hikaye_ekle', {'p_fotograf': yol3, 'p_etiketler': [b_id]}).execute().data
    acilanlar.append(h3['id'])
    b.rpc('hikaye_etiketini_yanitla', {'p_hikaye_id': h3['id'], 'p_onay': False}).execute()
    kontrol('reddedilen etiket akista GORUNMEZ',
            (akis_satiri(a, h3['id']) or {}).get('etiketler') == [])
    kontrol('C (yabanci) A hikayesini hic gormuyor', akis_satiri(c, h1['id']) is None)

    # --- 5. Dogrudan yazma kapali ----------------------------------------
    m = hata(lambda: b.table('hikaye_etiketleri').insert(
        {'hikaye_id': h1['id'], 'kullanici_id': c_id, 'durum': 'onaylandi'}).execute())
    kontrol('etiket tablosuna DOGRUDAN insert reddedilir', m is not None, m)

    # --- 6. Veri disa aktarim --------------------------------------------
    da = a.rpc('verilerimi_disa_aktar').execute().data
    benim = [x for x in da['hikayelerim'] if x['id'] == h1['id']]
    kontrol('disa aktarimda hikaye ifadesi var',
            benim and benim[0]['ifade'] == ifade, benim and benim[0].get('ifade'))
    kontrol('disa aktarimda etiketlediklerim var',
            benim and benim[0]['etiketlediklerim'],
            benim and benim[0].get('etiketlediklerim'))
    db_ = b.rpc('verilerimi_disa_aktar').execute().data
    kontrol('etiketlenenin dosyasinda hikaye_etiketlerim var',
            any(x['durum'] in ('onaylandi', 'reddedildi') for x in db_['hikaye_etiketlerim']),
            len(db_['hikaye_etiketlerim']))

    # --- 7. anon ----------------------------------------------------------
    anonim = create_client(URL, ANON)
    for rpc in ('hikaye_ekle', 'bekleyen_hikaye_etiketlerim', 'hikaye_etiketini_yanitla'):
        m = hata(lambda r=rpc: anonim.rpc(r, {}).execute())
        kontrol(f'anon {rpc} cagiramaz', m is not None, m and m[:60])
finally:
    for hid in acilanlar:
        try:
            a.rpc('hikaye_sil', {'p_hikaye_id': hid}).execute()
        except Exception:
            pass
    for y in yollar:
        try:
            a.storage.from_(KOVA).remove([y])
        except Exception:
            pass
    if b_onay_eski is not None:
        b.table('profiller').update({'etiket_onayi_gerekli': b_onay_eski}).eq(
            'id', b_id).execute()
    if bag_kurdum:
        try:
            a.rpc('takibi_birak', {'p_kullanici_id': b_id}).execute()
        except Exception:
            pass
    if c_bag_kaldir:
        try:
            a.rpc('takip_istegi_gonder', {'p_kullanici_id': c_id}).execute()
        except Exception:
            pass

print(f'\n{sum(sonuclar)}/{len(sonuclar)}')
raise SystemExit(0 if all(sonuclar) else 1)
