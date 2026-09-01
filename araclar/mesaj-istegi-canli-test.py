"""MESAJ ISTEKLERI - CANLI dogrulama (gercek veritabani, iki gercek hesap).

Jest testleri Supabase'i mock'luyor; bu betik sunucudaki kapinin
gercekten calistigini olcuyor. Ayni sinif hata daha once yasandi:
66 test yesilken ekran canlida hic calismiyordu.

Senaryo:
  1. A ve B arasindaki bag/istek temizlenir (baslangic durumu bilinsin)
  2. A -> B mesaj yazar            => TEK mesaj gecer, istek olusur
  3. A ikinci mesaji dener         => REDDEDILMELI
  4. B'nin mesaj_isteklerim        => A gorunmeli
  5. B'nin konusmalarim            => A GORUNMEMELI (istek ayrilmis)
  6. B cevap yazar                 => istek KABUL olur
  7. B'nin konusmalarim            => A artik GORUNMELI
  8. Temizlik: olusturulan istek/konusma/mesajlar silinir
"""
import os
import sys

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']

A_TEL, B_TEL, SIFRE = '+905550000000', '+905550000001', 'test1234'

gecti, kaldi = 0, 0


def kontrol(ad: str, sonuc: bool, ayrinti: str = '') -> None:
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print(f'  OK   {ad}')
    else:
        kaldi += 1
        print(f'  HATA {ad}  {ayrinti}')


def giris(tel: str):
    sb = create_client(URL, ANON)
    sb.auth.sign_in_with_password({'phone': tel, 'password': SIFRE})
    return sb


def main() -> int:
    yonetici = create_client(URL, SERVICE)
    a, b = giris(A_TEL), giris(B_TEL)
    a_id = a.auth.get_user().user.id
    b_id = b.auth.get_user().user.id
    print(f'A={a_id[:8]}  B={b_id[:8]}\n')

    # 1) Temiz baslangic: aralarindaki bag ve istekler kaldiriliyor.
    for x, y in ((a_id, b_id), (b_id, a_id)):
        yonetici.table('takipler').delete().eq('takip_eden_id', x).eq('takip_edilen_id', y).execute()
        yonetici.table('sohbet_istekleri').delete().eq('gonderen_id', x).eq('alan_id', y).execute()
    anahtar = f'{min(a_id, b_id)}:{max(a_id, b_id)}'
    eski = yonetici.table('konusmalar').select('id').eq('birebir_anahtar', anahtar).execute().data
    for k in eski:
        yonetici.table('konusmalar').delete().eq('id', k['id']).execute()
    print('baslangic temizlendi\n')

    # 2) A -> B ilk mesaj: gecmeli ve istek olusmali.
    try:
        a.rpc('mesaj_gonder', {'p_kullanici_id': b_id, 'p_metin': 'canli test: ilk mesaj'}).execute()
        kontrol('A yabanciya TEK mesaj yazabildi', True)
    except Exception as e:
        kontrol('A yabanciya TEK mesaj yazabildi', False, str(e)[:90])

    istek = yonetici.table('sohbet_istekleri').select('durum') \
        .eq('gonderen_id', a_id).eq('alan_id', b_id).execute().data
    kontrol('istek olustu ve durumu beklemede',
            len(istek) == 1 and istek[0]['durum'] == 'beklemede', str(istek))

    # 3) A ikinci mesaj: REDDEDILMELI.
    try:
        a.rpc('mesaj_gonder', {'p_kullanici_id': b_id, 'p_metin': 'canli test: ikinci mesaj'}).execute()
        kontrol('A ikinci mesaji GONDEREMEDI', False, 'ikinci mesaj gecti!')
    except Exception:
        kontrol('A ikinci mesaji GONDEREMEDI', True)

    # 4) B'nin istek kutusunda A var mi
    istekler = b.rpc('mesaj_isteklerim', {}).execute().data
    kontrol('B istegi istek kutusunda goruyor',
            any(i['gonderen_id'] == a_id for i in istekler), f'{len(istekler)} istek')

    # 5) B'nin Mesajlar listesinde A YOK
    konusmalar = b.rpc('konusmalarim', {}).execute().data
    kontrol('istek Mesajlar listesinde GORUNMUYOR',
            not any(k['kisi_id'] == a_id for k in konusmalar))

    # 6) B cevap yaziyor => kabul
    try:
        b.rpc('mesaj_gonder', {'p_kullanici_id': a_id, 'p_metin': 'canli test: cevap'}).execute()
        kontrol('B cevap yazabildi', True)
    except Exception as e:
        kontrol('B cevap yazabildi', False, str(e)[:90])

    istek = yonetici.table('sohbet_istekleri').select('durum') \
        .eq('gonderen_id', a_id).eq('alan_id', b_id).execute().data
    kontrol('cevap istegi KABUL etti',
            len(istek) == 1 and istek[0]['durum'] == 'kabul', str(istek))

    # 7) Artik Mesajlar listesinde
    konusmalar = b.rpc('konusmalarim', {}).execute().data
    kontrol('kabulden sonra Mesajlar listesinde GORUNUYOR',
            any(k['kisi_id'] == a_id for k in konusmalar))

    istekler = b.rpc('mesaj_isteklerim', {}).execute().data
    kontrol('kabulden sonra istek kutusundan CIKTI',
            not any(i['gonderen_id'] == a_id for i in istekler))

    # 8) Temizlik
    for x, y in ((a_id, b_id), (b_id, a_id)):
        yonetici.table('sohbet_istekleri').delete().eq('gonderen_id', x).eq('alan_id', y).execute()
    for k in yonetici.table('konusmalar').select('id').eq('birebir_anahtar', anahtar).execute().data:
        yonetici.table('konusmalar').delete().eq('id', k['id']).execute()
    yonetici.table('istek_gunlugu').delete().eq('gonderen_id', a_id).execute()
    print('\ntemizlik yapildi')

    print(f'\nSONUC: {gecti} gecti, {kaldi} kaldi')
    return 1 if kaldi else 0


if __name__ == '__main__':
    sys.exit(main())
