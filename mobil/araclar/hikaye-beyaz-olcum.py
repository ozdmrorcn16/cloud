"""BEYAZ HIKAYEDE OKUNURLUK OLCUMU (2026-09-22).

Kullanicinin bildirimi: "hikayelerdeki dolma ibaresi beyaz bir
fotografta hic gorunmuyor." Ilerleme cubugu, kimlik satiri ve alttaki
eylemler beyaz; acik renkli bir fotografta (ornegin bir ekran
goruntusu) kayboluyordu.

Bu betik test hesabina GECICI, tamamen BEYAZ bir hikaye koyar ki
izleyici ekrani o kosulda cizdirilip olculebilsin; sonunda hikayeyi ve
dosyayi siler. Ekran goruntusunu `araclar/ekran-goruntusu.mjs` aliyor.

Kosum:
  python araclar/hikaye-beyaz-olcum.py ekle   -> hikayeyi kurar, kimligi yazar
  python araclar/hikaye-beyaz-olcum.py sil    -> temizler
"""
import os
import struct
import sys
import zlib

from supabase import create_client

BURASI = os.path.dirname(os.path.abspath(__file__))
for satir in open(os.path.join(BURASI, '..', '.env'), encoding='utf-8'):
    satir = satir.strip()
    if satir and not satir.startswith('#') and '=' in satir:
        k, v = satir.split('=', 1)
        os.environ.setdefault(k, v.strip().strip('"'))

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
KOVA = 'hikaye-medyalari'
ISARET = 'beyaz-olcum'


def beyaz_png(en=720, boy=1280):
    """Duz beyaz, telefon oranina yakin PNG (bagimlilik yok)."""
    def parca(tur, veri):
        return (struct.pack('>I', len(veri)) + tur + veri
                + struct.pack('>I', zlib.crc32(tur + veri) & 0xFFFFFFFF))
    ham = b''.join(b'\x00' + b'\xff' * (en * 3) for _ in range(boy))
    return (b'\x89PNG\r\n\x1a\n'
            + parca(b'IHDR', struct.pack('>IIBBBBB', en, boy, 8, 2, 0, 0, 0))
            + parca(b'IDAT', zlib.compress(ham, 9))
            + parca(b'IEND', b''))


istemci = create_client(URL, ANON)
istemci.auth.sign_in_with_password({'email': 'test0@slooin.test', 'password': 'test1234'})
kimlik = istemci.auth.get_user().user.id

komut = sys.argv[1] if len(sys.argv) > 1 else 'ekle'

if komut == 'ekle':
    yol = f'{kimlik}/{ISARET}.png'
    try:
        istemci.storage.from_(KOVA).remove([yol])
    except Exception:
        pass
    istemci.storage.from_(KOVA).upload(yol, beyaz_png(), {'content-type': 'image/png'})
    hikaye = istemci.rpc('hikaye_ekle', {'p_fotograf': yol, 'p_yazi': None}).execute().data
    print('hikaye:', hikaye['id'])
    print('kullanici:', kimlik)
elif komut == 'sil':
    silinen = 0
    for h in istemci.rpc('hikaye_akisi').execute().data:
        if h['kullanici_id'] == kimlik and ISARET in (h['fotograf'] or ''):
            istemci.rpc('hikaye_sil', {'p_hikaye_id': h['id']}).execute()
            silinen += 1
    try:
        istemci.storage.from_(KOVA).remove([f'{kimlik}/{ISARET}.png'])
    except Exception:
        pass
    print('silinen hikaye:', silinen)
