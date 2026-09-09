"""MEKAN DUZENLEME TALEPLERI - CANLI dogrulama (gercek veritabani).

Jest Supabase'i mock'luyor; bu betik SUNUCUDAKI kurallarin gercekten
calistigini olcuyor. Ayni sinif hata daha once yasandi: 66 test
yesilken ekran canlida hic calismiyordu.

Olculenler:
  1. Kimliksiz cagri REDDEDILIYOR
  2. Bos talep (hicbir alan yok) REDDEDILIYOR
  3. Olmayan bir tur REDDEDILIYOR   <- onay verildiginde deger dogrudan
     mekan kaydina yaziliyor, uydurma tur butun suzgecleri kirletirdi
  4. Baskasinin klasorundeki fotograf REDDEDILIYOR
  5. Gecerli talep KABUL EDILIYOR ve satir olusuyor
  6. Ayni mekana IKINCI bekleyen talep REDDEDILIYOR
  7. Talep MEKANI DEGISTIRMIYOR (onay olmadan)
  8. Siradan kullanici moderator RPC'lerini CAGIRAMIYOR (uc RPC de)
  9. Kisi KENDI talebini goruyor
 10. Temizlik: acilan talep siliniyor, mekan kaydi geri aliniyor

Kosum (mobil/.env yuklu kabukta):
    python araclar/mekan-duzenleme-canli-test.py
"""
import os
import sys

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


def hata_verdi(cagri) -> tuple[bool, str]:
    """RPC hata verdi mi? (verdiyse mesajiyla birlikte)"""
    try:
        cagri()
        return False, ''
    except Exception as e:  # noqa: BLE001 - hangi hata oldugu mesajda
        return True, str(e)


def main() -> int:
    yonetici = create_client(URL, SERVICE)
    kisi = create_client(URL, ANON)
    kisi.auth.sign_in_with_password({'email': EPOSTA, 'password': SIFRE})
    kimlik = kisi.auth.get_user().user.id

    # Test mekani: gercek bir kayit sec ve BASLANGIC halini sakla.
    mekan = (
        yonetici.table('mekanlar')
        .select('id, ad, tur, adres')
        .eq('kaynak', 'foursquare')
        .limit(1)
        .execute()
        .data[0]
    )
    mekan_id = mekan['id']
    print(f"Test mekani: {mekan['ad']} ({mekan_id})")

    # Onceki kosumlardan kalan talepleri temizle - betik idempotent olmali.
    yonetici.table('mekan_duzenleme_talepleri').delete().eq('kullanici_id', kimlik).execute()

    print('\n1-4  Reddedilmesi gerekenler')

    kimliksiz = create_client(URL, ANON)
    var, mesaj = hata_verdi(
        lambda: kimliksiz.rpc('mekan_duzenleme_talebi_gonder', {'p_mekan_id': mekan_id, 'p_ad': 'X'}).execute()
    )
    kontrol('kimliksiz cagri reddediliyor', var, mesaj)

    var, mesaj = hata_verdi(
        lambda: kisi.rpc('mekan_duzenleme_talebi_gonder', {'p_mekan_id': mekan_id}).execute()
    )
    kontrol('bos talep reddediliyor', var and 'En az bir alan' in mesaj, mesaj)

    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'mekan_duzenleme_talebi_gonder',
            {'p_mekan_id': mekan_id, 'p_tur': 'Uzay Ussu'},
        ).execute()
    )
    kontrol('olmayan tur reddediliyor', var and 'listemizde yok' in mesaj, mesaj)

    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'mekan_duzenleme_talebi_gonder',
            {'p_mekan_id': mekan_id, 'p_fotograf': 'baskasi/1.jpg'},
        ).execute()
    )
    kontrol('baskasinin fotografi reddediliyor', var and 'sana ait degil' in mesaj, mesaj)

    print('\n5-7  Gecerli talep')

    talep_id = kisi.rpc(
        'mekan_duzenleme_talebi_gonder',
        {'p_mekan_id': mekan_id, 'p_ad': 'CANLI-TEST-ADI', 'p_tur': 'Kafe'},
    ).execute().data
    kontrol('gecerli talep kabul ediliyor', bool(talep_id), str(talep_id))

    satir = (
        yonetici.table('mekan_duzenleme_talepleri')
        .select('*')
        .eq('id', talep_id)
        .single()
        .execute()
        .data
    )
    kontrol('satir beklemede durumunda', satir['durum'] == 'beklemede', satir['durum'])
    kontrol('onerilen ad kaydedildi', satir['onerilen_ad'] == 'CANLI-TEST-ADI')

    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'mekan_duzenleme_talebi_gonder',
            {'p_mekan_id': mekan_id, 'p_ad': 'IKINCI DENEME'},
        ).execute()
    )
    kontrol('ayni mekana ikinci bekleyen talep reddediliyor', var and 'bekleyen bir talebin' in mesaj, mesaj)

    guncel = (
        yonetici.table('mekanlar').select('ad, elle_duzenlendi').eq('id', mekan_id).single().execute().data
    )
    kontrol(
        'ONAY OLMADAN mekan degismiyor',
        guncel['ad'] == mekan['ad'] and guncel['elle_duzenlendi'] is False,
        str(guncel),
    )

    print('\n8    Moderator kapisi')

    for rpc, arg in [
        ('moderasyon_duzenleme_talepleri', {'p_durum': 'beklemede'}),
        ('moderasyon_duzenleme_talebi_detayi', {'p_id': talep_id}),
        (
            'moderasyon_duzenleme_talebini_karara_bagla',
            {'p_id': talep_id, 'p_karar': 'onaylandi'},
        ),
    ]:
        var, mesaj = hata_verdi(lambda r=rpc, a=arg: kisi.rpc(r, a).execute())
        kontrol(f'{rpc} siradan kullaniciyi reddediyor', var, mesaj)

    print('\n9    Gorunurluk')

    kendi = (
        kisi.table('mekan_duzenleme_talepleri').select('id').eq('id', talep_id).execute().data
    )
    kontrol('kisi kendi talebini goruyor', len(kendi) == 1)

    print('\n10   Temizlik')
    yonetici.table('mekan_duzenleme_talepleri').delete().eq('id', talep_id).execute()
    kalan = (
        yonetici.table('mekan_duzenleme_talepleri')
        .select('id')
        .eq('kullanici_id', kimlik)
        .execute()
        .data
    )
    kontrol('test talebi silindi', len(kalan) == 0, str(kalan))

    print(f'\nGecen {gecti}, kalan {kaldi}')
    return 0 if kaldi == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
