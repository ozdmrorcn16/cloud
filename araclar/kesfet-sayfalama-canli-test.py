"""KESFET SAYFALAMA - CANLI dogrulama.

Jest Supabase'i mock'ladigi icin ofsetin gercekten calisip calismadigi
ancak canlida olculur: mock ne tekrar eden kayit ne de atlanan kayit
uretir.

Olculenler:
   1. Ilk sayfa (limit 100, ofset 0) tam sayfa donduruyor
   2. Ikinci sayfa FARKLI kayitlar donduruyor - cakisma yok
   3. Ofsetsiz cagri ilk sayfayla ayni (geriye donuk uyum; telefondaki
      eski surum p_ofset gondermiyor)
   4. Sayfalar birlestirildiginde 1 km icindeki TUM mekanlara ulasiliyor
      (olculdu: Bursa/Nilufer'de 1.764)
   5. Tur suzgeci sayfalamayla birlikte calisiyor

Salt okur, guvenle yeniden kosulur.

Kosum (mobil/.env yuklu kabukta):
    python araclar/kesfet-sayfalama-canli-test.py
"""
import os, sys
from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
k = create_client(URL, ANON)
k.auth.sign_in_with_password({'email': 'test0@slooin.test', 'password': 'test1234'})

LAT, LNG = 40.2261, 28.8656
gecti = kaldi = 0

def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1; print('  OK   ' + ad)
    else:
        kaldi += 1; print('  HATA ' + ad + '  ' + str(ayrinti))

def cagir(limit=100, ofset=None, turler=None):
    g = {'p_lat': LAT, 'p_lng': LNG, 'p_yaricap_metre': 1000, 'p_limit': limit}
    if ofset is not None:
        g['p_ofset'] = ofset
    if turler is not None:
        g['p_turler'] = turler
    return k.rpc('yakin_mekanlar_yogunluk', g).execute().data

s1 = cagir(100, 0)
kontrol('1  ilk sayfa 100 kayit', len(s1) == 100, len(s1))

s2 = cagir(100, 100)
kontrol('2  ikinci sayfa 100 kayit', len(s2) == 100, len(s2))
id1 = {r['id'] for r in s1}
id2 = {r['id'] for r in s2}
kontrol('2  sayfalar CAKISMIYOR', len(id1 & id2) == 0, len(id1 & id2))

s0 = cagir(100)
kontrol('3  ofsetsiz cagri ilk sayfayla AYNI', [r['id'] for r in s0] == [r['id'] for r in s1])

hepsi, ofset = set(), 0
while True:
    p = cagir(200, ofset)
    if not p:
        break
    hepsi |= {r['id'] for r in p}
    ofset += 200
    if ofset > 4000:
        break
kontrol('4  sayfalar 1 km icindeki TUM mekanlari veriyor', len(hepsi) > 1700, len(hepsi))

t1 = cagir(100, 0, ['Kafe'])
t2 = cagir(100, 100, ['Kafe'])
kontrol('5  tur suzgeci sayfalamayla calisiyor',
        all(r['tur'] == 'Kafe' for r in t1) and len(t2) == 0,
        str(len(t1)) + ' / ' + str(len(t2)))

print('\nSONUC: ' + str(gecti) + ' gecti, ' + str(kaldi) + ' kaldi')
sys.exit(1 if kaldi else 0)
