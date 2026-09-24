"""ANLIK ARSIVI - CANLI TEST (2026-09-24).

Kullanicinin karari: anliklar seritte 24 saat, sonra YALNIZCA SAHIBININ
arsivinde suresiz; gorenler/ifadeler 24 saatte silinir. Jest Supabase'i
mock'ladigi icin bu kurallar orada gorulemez. Olculen:
  1. Aktif anlik: arkadas B seritte gorur; A arsivinde de gorur.
  2. Suresi doldurulunca (servis rolu bitis'i geri alir):
     - A'nin arsivinde (anlik_arsivim) DURUYOR,
     - A'nin kendi seridinde (hikaye_akisi) YOK,
     - B artik ne akista ne kisinin hikayelerinde goremez,
     - B fotografi imzalayamaz; A imzalayabilir.
  3. B suresi dolmus anliga ifade atamaz / gorme kaydi yazamaz.
  4. anon anlik_arsivim cagiramaz.
  5. HESAP SILME anlik fotografini kovadan siler (hesap-sil v8):
     gecici hesap + anlik + taze giris -> silindi -> dosya yok.
Actiklarini siler. Kosum: python araclar/anlik-arsivi-canli-test.py
"""
import os
import time

import requests
from supabase import create_client

BURASI = os.path.dirname(os.path.abspath(__file__))
for satir in open(os.path.join(BURASI, '..', 'mobil', '.env'), encoding='utf-8'):
    satir = satir.strip()
    if satir and not satir.startswith('#') and '=' in satir:
        k, v = satir.split('=', 1)
        os.environ.setdefault(k, v.strip().strip('"'))

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVIS = os.environ['SUPABASE_SERVICE_ROLE_KEY']
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


def giris(eposta, parola='test1234'):
    c = create_client(URL, ANON)
    c.auth.sign_in_with_password({'email': eposta, 'password': parola})
    return c, c.auth.get_user().user.id


def imzalanir(istemci, yol):
    try:
        r = istemci.storage.from_(KOVA).create_signed_url(yol, 60)
        return bool(r.get('signedURL') or r.get('signedUrl'))
    except Exception:
        return False


servis = create_client(URL, SERVIS)
a, a_id = giris('test0@slooin.test')
b, b_id = giris('test1@slooin.test')

hid = None
yol = None
bag_kurdum = False
gecici_id = None
gecici_yol = None
try:
    if not a.table('takipler').select('durum').eq('takip_eden_id', b_id).eq('takip_edilen_id', a_id).eq('durum', 'kabul').execute().data:
        b.rpc('takip_istegi_gonder', {'p_kullanici_id': a_id}).execute()
        bag_kurdum = True

    yol = f'{a_id}/arsiv-canli-{int(time.time() * 1000)}.jpg'
    a.storage.from_(KOVA).upload(yol, JPEG, {'content-type': 'image/jpeg'})
    hid = a.rpc('hikaye_ekle', {'p_fotograf': yol}).execute().data['id']

    # 1. aktif
    kontrol('aktif: B kisinin anliklarinda gorur',
            any(h['id'] == hid for h in b.rpc('hikaye_akisi', {'p_kullanici': a_id}).execute().data))
    kontrol('aktif: A arsivinde gorur',
            any(h['id'] == hid for h in a.rpc('anlik_arsivim').execute().data))
    b.rpc('hikaye_goruntulendi', {'p_hikaye_id': hid}).execute()

    # 2. suresini doldur
    servis.table('hikayeler').update({'bitis': '2020-01-01T00:00:00Z'}).eq('id', hid).execute()
    kontrol('suresi dolmus: A arsivinde DURUYOR',
            any(h['id'] == hid for h in a.rpc('anlik_arsivim').execute().data))
    kontrol('suresi dolmus: A kendi seridinde YOK',
            not any(h['id'] == hid for h in a.rpc('hikaye_akisi').execute().data))
    kontrol('suresi dolmus: B akista YOK',
            not any(h['id'] == hid for h in b.rpc('hikaye_akisi').execute().data))
    kontrol('suresi dolmus: B kisinin anliklarinda YOK',
            not any(h['id'] == hid for h in b.rpc('hikaye_akisi', {'p_kullanici': a_id}).execute().data))
    kontrol('suresi dolmus: B tabloyu dogrudan okuyamaz',
            not b.table('hikayeler').select('id').eq('id', hid).execute().data)
    kontrol('suresi dolmus: B fotografi imzalayamaz', not imzalanir(b, yol))
    kontrol('suresi dolmus: A fotografi imzalar', imzalanir(a, yol))

    # 3. B yazamaz
    try:
        b.rpc('hikaye_ifadesi_gonder', {'p_hikaye_id': hid, 'p_ifade': 'kahve-keyfi'}).execute()
        kontrol('suresi dolmus anliga ifade atilamaz', False, 'kabul edildi!')
    except Exception as e:
        kontrol('suresi dolmus anliga ifade atilamaz', 'Hikaye bulunamadi' in str(e))

    # 4. anon
    try:
        create_client(URL, ANON).rpc('anlik_arsivim').execute()
        kontrol('anon arsiv okuyamaz', False, 'kabul edildi!')
    except Exception as e:
        kontrol('anon arsiv okuyamaz', 'permission denied' in str(e), str(e)[:60])

    # 5. hesap silme kovayi temizler
    eposta = f'arsiv-sil-{int(time.time())}@slooin.test'
    gecici_parola = f'Gecici-{int(time.time())}-arsiv!'
    gecici_id = servis.auth.admin.create_user({'email': eposta, 'password': gecici_parola, 'email_confirm': True}).user.id
    gecici_yol = f'{gecici_id}/hesap-sil-{int(time.time())}.jpg'
    servis.storage.from_(KOVA).upload(gecici_yol, JPEG, {'content-type': 'image/jpeg'})
    servis.table('hikayeler').insert({'kullanici_id': gecici_id, 'fotograf': gecici_yol}).execute()
    g, _ = giris(eposta, gecici_parola)
    jeton = g.auth.get_session().access_token
    r = requests.post(f'{URL}/functions/v1/hesap-sil',
                      headers={'Authorization': f'Bearer {jeton}', 'apikey': ANON, 'Content-Type': 'application/json'},
                      json={}, timeout=60)
    kontrol('hesap-sil 200 silindi', r.status_code == 200 and r.json().get('silindi'), f'{r.status_code} {r.text[:80]}')
    kalan = servis.storage.from_(KOVA).list(gecici_id)
    kontrol('hesap silinince ANLIK fotografi kovadan silindi', not [x for x in kalan if x.get('name')], str(kalan)[:80])
    if r.status_code == 200:
        gecici_id = None
        gecici_yol = None
finally:
    if hid:
        try:
            a.rpc('hikaye_sil', {'p_hikaye_id': hid}).execute()
        except Exception as e:
            print('temizlik:', e)
    if yol:
        try:
            a.storage.from_(KOVA).remove([yol])
        except Exception as e:
            print('temizlik (kova):', e)
    if gecici_yol:
        try:
            servis.storage.from_(KOVA).remove([gecici_yol])
        except Exception as e:
            print('temizlik (gecici kova):', e)
    if gecici_id:
        try:
            servis.auth.admin.delete_user(gecici_id)
        except Exception as e:
            print('temizlik (gecici hesap):', e)
    if bag_kurdum:
        try:
            b.rpc('takibi_birak', {'p_kullanici_id': a_id}).execute()
        except Exception as e:
            print('temizlik (bag):', e)

print(f'\n{sum(sonuclar)}/{len(sonuclar)} gecti')
raise SystemExit(0 if all(sonuclar) else 1)
