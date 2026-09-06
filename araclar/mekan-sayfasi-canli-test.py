# -*- coding: utf-8 -*-
"""Mekan sayfasinin uc RPC'sini CANLI veritabaninda dogrular.

Neden ayri bir betik: jest Supabase'i mock'luyor, yani bir RPC'nin
gercekten var olup olmadigini, yetkilerin dogru verilip verilmedigini ve
RLS'in `security invoker` fonksiyonlarda gercekten calisip calismadigini
goremiyor. Ayni sinif hata bu projede daha once yasandi (66 test yesilken
ekran canlida hic calismiyordu).

Kosum:  python araclar/mekan-sayfasi-canli-test.py     # mobil/.env yuklu

Betik SALT OKUR - hicbir sey yazmiyor, silmiyor.
"""
import os
import sys

try:
    import httpx
except ImportError:
    print('httpx gerekli:  pip install httpx')
    sys.exit(1)

URL = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
ANON = os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')
SIFRE = os.environ.get('TEST_HESAP_SIFRESI', 'test1234')

if not URL or not ANON:
    # .env dosyasindan oku (kabukta yuklu degilse)
    yol = os.path.join(os.path.dirname(__file__), '..', 'mobil', '.env')
    if os.path.exists(yol):
        for satir in open(yol, encoding='utf-8'):
            if '=' in satir and not satir.strip().startswith('#'):
                k, _, v = satir.strip().partition('=')
                os.environ.setdefault(k, v)
        URL = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
        ANON = os.environ.get('EXPO_PUBLIC_SUPABASE_ANON_KEY')

if not URL or not ANON:
    print('EXPO_PUBLIC_SUPABASE_URL / ANON_KEY bulunamadi')
    sys.exit(1)

gecti = 0
kaldi = 0


def dogrula(baslik, kosul, ayrinti=''):
    global gecti, kaldi
    if kosul:
        gecti += 1
        print(f'  [OK]   {baslik}' + (f'  {ayrinti}' if ayrinti else ''))
    else:
        kaldi += 1
        print(f'  [HATA] {baslik}' + (f'  {ayrinti}' if ayrinti else ''))


def giris(eposta):
    y = httpx.post(
        f'{URL}/auth/v1/token?grant_type=password',
        headers={'apikey': ANON, 'Content-Type': 'application/json'},
        json={'email': eposta, 'password': SIFRE},
        timeout=30,
    )
    y.raise_for_status()
    return y.json()['access_token']


def rpc(jeton, ad, govde):
    basliklar = {'apikey': ANON, 'Content-Type': 'application/json'}
    if jeton:
        basliklar['Authorization'] = f'Bearer {jeton}'
    return httpx.post(f'{URL}/rest/v1/rpc/{ad}', headers=basliklar, json=govde, timeout=30)


print('MEKAN SAYFASI - CANLI DOGRULAMA')
print()

jeton = giris('test0@slooin.test')

# Check-in'i olan bir mekan bul: RPC'ler bos bir mekanda da calisir ama
# sayilarin gercekten hesaplandigini gostermez.
y = httpx.get(
    f'{URL}/rest/v1/check_inler?select=mekan_id&limit=1',
    headers={'apikey': ANON, 'Authorization': f'Bearer {jeton}'},
    timeout=30,
)
satirlar = y.json()
if not satirlar:
    print('Gorunur check-in yok; bos mekanla devam ediliyor.')
    y2 = httpx.get(
        f'{URL}/rest/v1/mekanlar?select=id&limit=1',
        headers={'apikey': ANON, 'Authorization': f'Bearer {jeton}'},
        timeout=30,
    )
    mekan_id = y2.json()[0]['id']
else:
    mekan_id = satirlar[0]['mekan_id']

print(f'Mekan: {mekan_id}')
print()

# --- 1) Istatistikler -------------------------------------------------
print('1) mekan_istatistikleri')
y = rpc(jeton, 'mekan_istatistikleri', {'p_mekan_id': mekan_id})
dogrula('cagri basarili', y.status_code == 200, f'HTTP {y.status_code} {y.text[:120]}')
if y.status_code == 200:
    d = y.json()
    dogrula('tek satir donuyor', isinstance(d, list) and len(d) == 1, f'{len(d)} satir')
    if d:
        s = d[0]
        beklenen = {
            'su_an_kisi', 'bugun_check_in', 'toplam_check_in',
            'ilce_sirasi', 'ilce_mekan_sayisi', 'ilce',
        }
        dogrula('butun alanlar var', beklenen <= set(s.keys()), str(sorted(s.keys())))
        dogrula('toplam sayi negatif degil', (s.get('toplam_check_in') or 0) >= 0,
                f"toplam={s.get('toplam_check_in')}")
        # Ilce biliniyorsa sira da uretilmis olmali (o mekanin kendi
        # check-in'i varsa). Ikisi birlikte null ya da birlikte dolu.
        print(f"       su an={s['su_an_kisi']}  bugun={s['bugun_check_in']}  "
              f"toplam={s['toplam_check_in']}  sira={s['ilce_sirasi']}/"
              f"{s['ilce_mekan_sayisi']}  ilce={s['ilce']}")

# --- 2) Liderlik ------------------------------------------------------
print()
print('2) mekan_liderlik')
y = rpc(jeton, 'mekan_liderlik', {'p_mekan_id': mekan_id, 'p_limit': 5})
dogrula('cagri basarili', y.status_code == 200, f'HTTP {y.status_code} {y.text[:120]}')
if y.status_code == 200:
    d = y.json()
    dogrula('en fazla 5 satir', len(d) <= 5, f'{len(d)} satir')
    if len(d) > 1:
        sayilar = [s['check_in_sayisi'] for s in d]
        dogrula('cok gidenden az gidene sirali', sayilar == sorted(sayilar, reverse=True),
                str(sayilar))
    for s in d:
        print(f"       {s['kullanici_adi']}: {s['check_in_sayisi']}")

# Ust sinir: p_limit 999 verilse bile 20'yi gecmiyor.
y = rpc(jeton, 'mekan_liderlik', {'p_mekan_id': mekan_id, 'p_limit': 999})
dogrula('limit 20 ile sinirli', y.status_code == 200 and len(y.json()) <= 20)

# --- 3) Son check-inler ----------------------------------------------
print()
print('3) mekan_son_check_inler')
y = rpc(jeton, 'mekan_son_check_inler', {'p_mekan_id': mekan_id, 'p_limit': 10})
dogrula('cagri basarili', y.status_code == 200, f'HTTP {y.status_code} {y.text[:120]}')
if y.status_code == 200:
    d = y.json()
    dogrula('en fazla 10 satir', len(d) <= 10, f'{len(d)} satir')
    if len(d) > 1:
        zamanlar = [s['olusturma_zamani'] for s in d]
        dogrula('en yeniden eskiye sirali', zamanlar == sorted(zamanlar, reverse=True))
    for s in d:
        print(f"       {s['kullanici_adi']}  canli={s['canli_mi']}  {s['olusturma_zamani'][:19]}")

# --- 4) Kimliksiz cagri ----------------------------------------------
print()
print('4) kimliksiz cagri')
y = rpc(None, 'mekan_istatistikleri', {'p_mekan_id': mekan_id})
dogrula('istatistikler kimliksiz REDDEDILIYOR', y.status_code >= 400,
        f'HTTP {y.status_code}')

# Kisi listeleri `security invoker`: kimliksiz cagrida RLS hicbir satir
# vermiyor, yani liste BOS gelmeli - hata degil, bos.
y = rpc(None, 'mekan_liderlik', {'p_mekan_id': mekan_id})
bos_mu = y.status_code >= 400 or y.json() == []
dogrula('liderlik kimliksiz cagriya veri VERMIYOR', bos_mu,
        f'HTTP {y.status_code} {str(y.text)[:80]}')

y = rpc(None, 'mekan_son_check_inler', {'p_mekan_id': mekan_id})
bos_mu = y.status_code >= 400 or y.json() == []
dogrula('son check-inler kimliksiz cagriya veri VERMIYOR', bos_mu,
        f'HTTP {y.status_code} {str(y.text)[:80]}')

print()
print(f'GECTI: {gecti}   KALDI: {kaldi}')
sys.exit(1 if kaldi else 0)
