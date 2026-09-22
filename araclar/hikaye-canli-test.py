"""HIKAYELER - CANLI TEST (2026-09-22).

Jest Supabase'i mock'ladigi icin sunucu kurali orada gorulemez. Olculen:
  1. A hikaye ekler (fotograf kovaya, RPC satiri) - yol sahipligi zorunlu.
  2. Arkadas B `hikaye_akisi`nde gorur (gordum=false), yabanci C gormez.
  3. B goruntuler -> A'nin akisinda goruntulenme_sayisi 1, B'de gordum=true;
     A kendi hikayesini goruntuleyince kayit olusmaz.
  4. `hikaye_goruntuleyenler` yalnizca sahibe (B icin bos).
  5. Kova: B dosyayi imzalayip okuyabilir, C okuyamaz.
  6. 10 aktif hikaye siniri.
  7. B hikayeyi sikayet eder (hedef 'hikaye'); C edemez; A kendi hikayesini edemez.
  8. Moderator gizler -> B artik gormez; gizlemeyi kaldirir -> gorur.
  9. verilerimi_disa_aktar: hikayelerim + hikaye_goruntulemelerim.
 10. hikaye_sil yolu doner, dosya kovadan silinir; B artik gormez.
 11. anon hicbir RPC'yi cagiramaz.
Actiklarini siler. Kosum: python araclar/hikaye-canli-test.py
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
SERVIS = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
KOVA = 'hikaye-medyalari'
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'  # Hozee
JPEG = bytes.fromhex(
    'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432'
    'ffc0000b080001000101011100ffc40014000100000000000000000000000000000009ffc40014100100000000000000000000000000000000ffda0008010100003f00d2cf20ffd9'
)

sonuclar = []
def kontrol(ad, kosul, ek=''):
    kosul = bool(kosul)
    sonuclar.append(kosul)
    print(('OK   ' if kosul else 'FAIL ') + ad + (f'  [{ek}]' if ek else ''))

def giris(eposta):
    c = create_client(URL, ANON)
    c.auth.sign_in_with_password({'email': eposta, 'password': 'test1234'})
    return c, c.auth.get_user().user.id

a, a_id = giris('test0@slooin.test')
A_KIMLIGI = [a_id]
b, b_id = giris('test1@slooin.test')
c, c_id = giris('test2@slooin.test')

def yukle(istemci, uid, n):
    yol = f'{uid}/hikaye-canli-{int(time.time()*1000)}-{n}.jpg'
    istemci.storage.from_(KOVA).upload(yol, JPEG, {'content-type': 'image/jpeg'})
    return yol

def akista(istemci, hid):
    # p_kullanici: bir kisinin hikayeleri (profil yolu). Serit dali
    # yalnizca kendim + arkadaslarim oldugu icin yabanciyi buradan
    # olcmek gerekiyor (2026-09-22).
    return [h for h in istemci.rpc('hikaye_akisi', {'p_kullanici': A_KIMLIGI[0]}).execute().data if h['id'] == hid]

acilanlar = []
yollar = []
bag_kurdum = False
c_bag_kaldir = False
try:
    # On kosul: B, A'nin arkadasi; C degil.
    zaten = a.table('takipler').select('durum').eq('takip_eden_id', b_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data
    if not zaten:
        b.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        bag_kurdum = True
    c_bag = a.table('takipler').select('durum').eq('takip_eden_id', c_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data
    if c_bag:
        c.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        c_bag_kaldir = True

    # 1. ekle
    yol = yukle(a, a_id, 1); yollar.append(yol)
    h = a.rpc('hikaye_ekle', {'p_fotograf': yol, 'p_yazi': 'canli test', 'p_mekan_id': MEKAN_ID}).execute().data
    acilanlar.append(h['id'])
    kontrol('A hikaye ekledi', h['fotograf'] == yol and h['yazi'] == 'canli test')
    try:
        a.rpc('hikaye_ekle', {'p_fotograf': f'{b_id}/x.jpg'}).execute()
        kontrol('baskasinin yolu reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('baskasinin yolu reddedilir', 'sana ait degil' in str(e))

    # 2. gorunurluk
    bg = akista(b, h['id']); cg = akista(c, h['id'])
    kontrol('arkadas B akista gorur (gordum=false, mekan adi dolu)', bool(bg) and bg[0]['gordum'] is False and bg[0]['mekan_adi'])
    kontrol('yabanci C gormez', not cg)

    # 3. goruntuleme
    b.rpc('hikaye_goruntulendi', {'p_hikaye_id': h['id']}).execute()
    a.rpc('hikaye_goruntulendi', {'p_hikaye_id': h['id']}).execute()  # kendi - kayit yok
    ag = akista(a, h['id']); bg = akista(b, h['id'])
    kontrol('A: goruntulenme_sayisi 1 (kendi izlemesi sayilmaz)', ag and ag[0]['goruntulenme_sayisi'] == 1, str(ag[0]['goruntulenme_sayisi']) if ag else '-')
    kontrol('B: gordum=true', bg and bg[0]['gordum'] is True)

    # 4. goruntuleyenler
    ga = a.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': h['id']}).execute().data
    gb = b.rpc('hikaye_goruntuleyenler', {'p_hikaye_id': h['id']}).execute().data
    kontrol('goruntuleyenler yalnizca sahibe (A: [B], B: [])', [g['kullanici_id'] for g in ga] == [b_id] and gb == [])

    # 5. kova
    imza_b = b.storage.from_(KOVA).create_signed_url(yol, 60)
    kontrol('B dosyayi imzalayabilir', bool(imza_b.get('signedURL') or imza_b.get('signedUrl')))
    try:
        imza_c = c.storage.from_(KOVA).create_signed_url(yol, 60)
        kontrol('C dosyayi imzalayamaz', not (imza_c.get('signedURL') or imza_c.get('signedUrl')), str(imza_c)[:60])
    except Exception as e:
        kontrol('C dosyayi imzalayamaz', True, str(e)[:60])

    # 5b. GORUNURLUK (2026-09-22): "herkese_acik" secilen hikayeyi
    # YABANCI da gorur; engel her iki halde de mutlak.
    y_acik = yukle(a, a_id, 99); yollar.append(y_acik)
    h_acik = a.rpc('hikaye_ekle', {'p_fotograf': y_acik, 'p_gorunurluk': 'herkese_acik'}).execute().data
    acilanlar.append(h_acik['id'])
    kontrol('herkese acik hikaye yabanciya GORUNUR', bool(akista(c, h_acik['id'])))
    kontrol('herkese acik hikaye serit akisina DUSMEZ (yabancida)',
            not [x for x in c.rpc('hikaye_akisi').execute().data if x['id'] == h_acik['id']])
    try:
        a.rpc('hikaye_ekle', {'p_fotograf': yukle(a, a_id, 98), 'p_gorunurluk': 'yanlis'}).execute()
        kontrol('gecersiz gorunurluk reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('gecersiz gorunurluk reddedilir', 'Gecersiz gorunurluk' in str(e))

    # 6. 10 siniri
    # DIKKAT: test0 gercek bir hesap (byorcun) ve uzerinde kullanicinin
    # kendi hikayeleri olabilir - onlara DOKUNULMAZ. Sinira kadar kac
    # hikaye kaldigini sayip yalnizca o kadar acilir, yoksa test kendi
    # kurdugu duzende degil kullanicinin verisinde patlar (2026-09-22).
    mevcut = len(a.table('hikayeler').select('id').eq('kullanici_id', a_id).gt('bitis', 'now()').execute().data)
    for i in range(mevcut + 1, 11):
        y = yukle(a, a_id, i); yollar.append(y)
        acilanlar.append(a.rpc('hikaye_ekle', {'p_fotograf': y}).execute().data['id'])
    try:
        y = yukle(a, a_id, 11); yollar.append(y)
        acilanlar.append(a.rpc('hikaye_ekle', {'p_fotograf': y}).execute().data['id'])
        kontrol('11. hikaye reddedilir', False, 'kabul edildi!')
    except Exception as e:
        kontrol('11. hikaye reddedilir', 'en fazla 10' in str(e))

    # 7. sikayet
    b.rpc('sikayet_gonder', {'p_hedef_tur': 'hikaye', 'p_hedef_id': h['id'], 'p_sebep': 'taciz', 'p_aciklama': 'canli test'}).execute()
    kontrol('B hikayeyi sikayet etti', True)
    for kim, ist in (('C (gormeyen)', c), ('A (kendi)', a)):
        try:
            ist.rpc('sikayet_gonder', {'p_hedef_tur': 'hikaye', 'p_hedef_id': h['id'], 'p_sebep': 'taciz'}).execute()
            kontrol(f'{kim} sikayet edemez', False, 'kabul edildi!')
        except Exception as e:
            kontrol(f'{kim} sikayet edemez', 'sikayet edemezsin' in str(e))

    # 8. moderator (servis rolu ile moderator olarak degil; moderasyon RPC'leri AAL2 ister -
    #    burada service role dogrudan sutunu yazarak ayni etkiyi olcuyoruz)
    if SERVIS:
        sv = create_client(URL, SERVIS)
        sv.table('hikayeler').update({'moderasyon_gizli': True}).eq('id', h['id']).execute()
        kontrol('moderasyon gizli -> B gormez', not akista(b, h['id']))
        sv.table('hikayeler').update({'moderasyon_gizli': False}).eq('id', h['id']).execute()
        kontrol('gizleme kalkti -> B gorur', bool(akista(b, h['id'])))

    # 9. disa aktarim
    d = a.rpc('verilerimi_disa_aktar').execute().data
    kontrol('disa aktarim: hikayelerim + goruntulemelerim', any(x['id'] == h['id'] for x in d['hikayelerim']) and any(x['hikaye_id'] == h['id'] for x in d['hikaye_goruntulemelerim']))

    # 10. sil
    silinen = a.rpc('hikaye_sil', {'p_hikaye_id': h['id']}).execute().data
    kontrol('hikaye_sil yolu doner', silinen == yol)
    a.storage.from_(KOVA).remove([yol]); yollar.remove(yol)
    kalanlar = [d['name'] for d in a.storage.from_(KOVA).list(a_id)]
    kontrol('dosya kovadan silindi', os.path.basename(yol) not in kalanlar)
    kontrol('B artik gormez', not akista(b, h['id']))
    acilanlar.remove(h['id'])

    # 11. anon
    try:
        create_client(URL, ANON).rpc('hikaye_akisi').execute()
        kontrol('anon hikaye_akisi cagiramaz', False, 'kabul edildi!')
    except Exception as e:
        kontrol('anon hikaye_akisi cagiramaz', True, str(e)[:50])
finally:
    for hid in acilanlar:
        try:
            a.rpc('hikaye_sil', {'p_hikaye_id': hid}).execute()
        except Exception as e:
            print('temizlik:', e)
    if yollar:
        try:
            a.storage.from_(KOVA).remove(yollar)
        except Exception as e:
            print('temizlik (kova):', e)
    if SERVIS:
        try:
            create_client(URL, SERVIS).table('sikayetler').delete().eq('hedef_tur', 'hikaye').eq('sikayet_eden_id', b_id).execute()
        except Exception as e:
            print('temizlik (sikayet):', e)
    if bag_kurdum:
        try:
            b.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (bag):', e)
    if c_bag_kaldir:
        try:
            c.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (C bag):', e)

print(f'\n{sum(sonuclar)}/{len(sonuclar)} gecti')
raise SystemExit(0 if all(sonuclar) else 1)
