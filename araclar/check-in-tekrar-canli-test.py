"""CHECK-IN SURESI VE TEKRAR KURALI - CANLI dogrulama.

Kullanicinin karari (2026-09-07):
  - Check-in 1 SAAT "su an burada" kalir.
  - Ayni kisi ayni yerde 24 saati dolmadan yine check-in yaparsa
    check-in GUNCELLENIR (yeni satir acilmaz).
  - 24 saatlik pencere ILK KAYITTAN sayilir; dolduktan sonraki
    check-in YENI satir acar. (Liderlik tablosu satir saydigi icin
    bu sart - yoksa her gun gelen birinin sayaci 1'de takilirdi.)
  - Son check-inler listesi 24 saatlik ve kisi basina tek satir.
  - Liderlik her zaman 3 kisi.

Jest Supabase'i mock'luyor, yani bu davranisi GOREMEZ. Ayni sinif hata
bu projede yasandi: 66 test yesilken ekran canlida hic calismiyordu.

Betik IDEMPOTENT: bastan ve sondan kendi actigi satirlari siliyor,
gercek veriye dokunmuyor. Guvenle yeniden kosulur.

Kullanim (mobil/.env yuklu kabukta):
    python araclar/check-in-tekrar-canli-test.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']

EPOSTA, SIFRE = 'test0@slooin.test', 'test1234'

gecti, kaldi = 0, 0


def kontrol(ad: str, sonuc: bool, ayrinti: str = '') -> None:
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print(f'  OK   {ad}')
    else:
        kaldi += 1
        print(f'  HATA {ad}  {ayrinti}')


yonetici = create_client(URL, SERVICE)
istemci = create_client(URL, ANON)

oturum = istemci.auth.sign_in_with_password({'email': EPOSTA, 'password': SIFRE})
ben = oturum.user.id
print(f'Giris: {EPOSTA}  ({ben})')

# TEST MEKANI: Hozee (Nilufer, Bursa).
#
# Kimlik DOGRUDAN yaziliyor, adla aranmiyor: `mekanlar` 5,9 milyon
# satir ve `ad` uzerinde tam esitlik indeksi yok (yalnizca
# `tr_kucuk(ad)` uzerinde trigram GIN var). `eq('ad', 'Hozee')`
# PostgREST'in 8 saniyelik sinirinda zaman asimina duesuyor - denendi.
MEKAN_ID = '399c7236-2eed-4145-b2bd-2e15bfdfa523'
print(f'Mekan: Hozee  ({MEKAN_ID})')

def kendi_satirlarim():
    return (
        yonetici.table('check_inler')
        .select('id, olusturma_zamani, ilk_check_in, bitis_zamani, konum, not_metni')
        .eq('kullanici_id', ben)
        .eq('mekan_id', MEKAN_ID)
        .order('ilk_check_in', desc=True)
        .execute()
        .data
    )


def temizle():
    for satir in kendi_satirlarim():
        yonetici.table('check_inler').delete().eq('id', satir['id']).execute()


print('\nBaslangic temizligi...')
temizle()
kontrol('baslangicta bu mekanda kaydim yok', len(kendi_satirlarim()) == 0)

# MEKANIN KENDI KOORDINATI. check_in_yap 1 km kontrolu yapiyor.
# Nilufer merkezi (40.2261, 28.8656) KULLANILAMAZ - Hozee oraya 5.157 m
# uzakta, yani check-in reddedilirdi. Degerler canli semadan olculdu
# (ST_Y/ST_X); mekan tasinirsa betik ilk check-in'de yuksek sesle
# patlar, sessizce yanlis sonuc vermez.
LAT, LNG = 40.210416, 28.92262

print('\n1) ILK check-in')
ilk = istemci.rpc(
    'check_in_yap',
    {
        'p_mekan_id': MEKAN_ID,
        'p_lat': LAT,
        'p_lng': LNG,
        'p_not_metni': 'ilk not',
        'p_bulunurluk': 'herkese_acik',
    },
).execute().data

satirlar = kendi_satirlarim()
kontrol('tek satir olustu', len(satirlar) == 1, f'{len(satirlar)} satir')
kontrol('not yazildi', satirlar and satirlar[0]['not_metni'] == 'ilk not')

bitis = datetime.fromisoformat(satirlar[0]['bitis_zamani'].replace('Z', '+00:00'))
olusma = datetime.fromisoformat(satirlar[0]['olusturma_zamani'].replace('Z', '+00:00'))
sure = bitis - olusma
kontrol(
    'canlilik suresi 1 SAAT',
    timedelta(minutes=59) < sure < timedelta(minutes=61),
    f'olculen {sure}',
)
ilk_capa = satirlar[0]['ilk_check_in']
ilk_id = satirlar[0]['id']

print('\n2) 24 saat ICINDE ikinci check-in -> GUNCELLEME beklenir')
istemci.rpc(
    'check_in_yap',
    {
        'p_mekan_id': MEKAN_ID,
        'p_lat': LAT,
        'p_lng': LNG,
        'p_not_metni': None,
        'p_bulunurluk': 'herkese_acik',
    },
).execute()

satirlar = kendi_satirlarim()
kontrol('YENI SATIR ACILMADI', len(satirlar) == 1, f'{len(satirlar)} satir')
kontrol('ayni satir guncellendi', satirlar and satirlar[0]['id'] == ilk_id)
kontrol('ilk_check_in capasi DEGISMEDI', satirlar and satirlar[0]['ilk_check_in'] == ilk_capa)
kontrol(
    'not KORUNDU (yeni not verilmedi)',
    satirlar and satirlar[0]['not_metni'] == 'ilk not',
    f'okunan {satirlar[0]["not_metni"] if satirlar else "-"}',
)
yeni_olusma = datetime.fromisoformat(
    satirlar[0]['olusturma_zamani'].replace('Z', '+00:00')
)
kontrol('olusturma_zamani ILERI alindi', yeni_olusma >= olusma)

print('\n3) Capa 24 saatten ESKI yapilinca -> YENI SATIR beklenir')
eski = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
yonetici.table('check_inler').update({'ilk_check_in': eski}).eq('id', ilk_id).execute()

istemci.rpc(
    'check_in_yap',
    {
        'p_mekan_id': MEKAN_ID,
        'p_lat': LAT,
        'p_lng': LNG,
        'p_not_metni': 'ikinci gun',
        'p_bulunurluk': 'herkese_acik',
    },
).execute()

satirlar = kendi_satirlarim()
kontrol('IKINCI SATIR acildi', len(satirlar) == 2, f'{len(satirlar)} satir')

print('\n4) mekan_son_check_inler: 24 saat + kisi basina TEK satir')
son = istemci.rpc(
    'mekan_son_check_inler', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}
).execute().data
benimkiler = [s for s in son if s['kullanici_id'] == ben]
kontrol(
    'listede bir kez gorunuyorum (iki satirim olsa da)',
    len(benimkiler) == 1,
    f'{len(benimkiler)} kez',
)
kontrol(
    'listedeki kayit EN YENISI',
    benimkiler and benimkiler[0]['not_metni'] == 'ikinci gun',
    f'okunan {benimkiler[0]["not_metni"] if benimkiler else "-"}',
)

print('\n5) mekan_liderlik: HER ZAMAN en fazla 3 kisi')
lider = istemci.rpc('mekan_liderlik', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}).execute().data
kontrol('limit 20 istense de 3 donuyor', len(lider) <= 3, f'{len(lider)} satir')
benim = [s for s in lider if s['kullanici_id'] == ben]
kontrol(
    'sayacim 2 (iki ayri satir)',
    benim and benim[0]['check_in_sayisi'] == 2,
    f'okunan {benim[0]["check_in_sayisi"] if benim else "-"}',
)

print('\n6) Eski kayit 24 saati doldurunca listeden DUSER')
yonetici.table('check_inler').update(
    {'olusturma_zamani': (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()}
).eq('id', ilk_id).execute()
son = istemci.rpc(
    'mekan_son_check_inler', {'p_mekan_id': MEKAN_ID, 'p_limit': 20}
).execute().data
kontrol(
    'listede hala TEK kaydim var (eskisi dustu)',
    len([s for s in son if s['kullanici_id'] == ben]) == 1,
)
kontrol(
    'satir SILINMEDI, yalnizca listeden dustu',
    len(kendi_satirlarim()) == 2,
    'anilar korunmali',
)

print('\nTemizlik...')
temizle()
kontrol('acilan satirlarin hepsi silindi', len(kendi_satirlarim()) == 0)

print(f'\n{gecti} gecti, {kaldi} kaldi')
sys.exit(1 if kaldi else 0)
