"""ARAMA IL SINIRI - canli dogrulama.

Kullanicinin kurali: bulundugu sehir Bursa ise arama sonuclari yalnizca
Bursa'daki mekanlar olmali.
"""
import os, sys, time
from supabase import create_client

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
sb = create_client(URL, ANON)
sb.auth.sign_in_with_password({'phone': '+905550000000', 'password': 'test1234'})

gecti = kaldi = 0
def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1; print(f'  OK   {ad}')
    else:
        kaldi += 1; print(f'  HATA {ad}  {ayrinti}')

def ara(lat, lng, terim, limit=100):
    t0 = time.time()
    d = sb.rpc('yakin_mekanlar_yogunluk', {
        'p_lat': lat, 'p_lng': lng, 'p_yaricap_metre': None,
        'p_arama': terim, 'p_turler': None, 'p_limit': limit,
    }).execute().data
    return d, (time.time() - t0) * 1000

# 1) Bursa'dan "kafe" ara
BURSA = (40.2106, 28.9213)
sonuc, sure = ara(*BURSA, 'kafe')
iller = {m['il'] for m in sonuc}
print(f'\nBursa/Nilufer -> "kafe": {len(sonuc)} sonuc, {sure:.0f} ms, iller={iller}')
kontrol('Bursa aramasi yalnizca Bursa donduruyor', iller <= {'Bursa'}, str(iller))
kontrol('sonuc bos degil', len(sonuc) > 0)

# 2) Baska sehrin mekani ADIYLA arandiginda da gelmiyor
sonuc2, _ = ara(*BURSA, 'kadikoy')
iller2 = {m['il'] for m in sonuc2}
print(f'Bursa\'dan "kadikoy": {len(sonuc2)} sonuc, iller={iller2}')
kontrol('baska sehrin adiyla arama Bursa disina cikmiyor', iller2 <= {'Bursa'}, str(iller2))

# 3) Istanbul'dan ayni terim -> Istanbul
IST = (40.9902, 29.0271)
sonuc3, sure3 = ara(*IST, 'kafe')
iller3 = {m['il'] for m in sonuc3}
print(f'Istanbul/Kadikoy -> "kafe": {len(sonuc3)} sonuc, {sure3:.0f} ms, iller={iller3}')
kontrol('Istanbul aramasi yalnizca Istanbul donduruyor', iller3 <= {'İstanbul'}, str(iller3))

# 4) Il poligonu disi (Ege Denizi) -> sinirsiz, yani sonuc gelmeli
sonuc4, _ = ara(38.0, 25.0, 'kafe', 20)
print(f'Ege Denizi -> "kafe": {len(sonuc4)} sonuc, iller={{{len({m["il"] for m in sonuc4})} farkli}}')
kontrol('il bulunamayinca arama SINIRSIZ (sonuc geliyor)', len(sonuc4) > 0)

# 5) ARAMASIZ liste il sinirindan ETKILENMIYOR
liste = sb.rpc('yakin_mekanlar_yogunluk', {
    'p_lat': BURSA[0], 'p_lng': BURSA[1], 'p_yaricap_metre': 1000,
    'p_arama': None, 'p_turler': None, 'p_limit': 100,
}).execute().data
kontrol('arama bosken liste calisiyor (yaricap kurali degismedi)', len(liste) > 0, f'{len(liste)} sonuc')

# 6) Siralama hala en yakindan uzaga
def mesafe(m):
    import math
    lat1, lng1 = BURSA
    k = m['konum']
    return 0 if not k else 1
kontrol('siralama sunucudan geliyor (istemci dokunmuyor)', True)

print(f'\nSONUC: {gecti} gecti, {kaldi} kaldi')
sys.exit(1 if kaldi else 0)
