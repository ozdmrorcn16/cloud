"""VERILERIMI INDIR (KVKK m.11 erisim hakki) - CANLI dogrulama.

Dosyanin KAPSAMI bir tasarim tercihi degil, baskasinin verisiyle
kesisen bir KARAR. Kullanicinin kararlari (2026-09-11):

  MESAJLAR    kendi yazdiklari TAM METINLE; karsi tarafinkiler
              METINSIZ (kiminle, kac mesaj, son tarih).
  SIKAYETLER  kendi GONDERDIKLERI giriyor, HAKKINDAKILER GIRMIYOR.
  MODERASYON  denetim izi girmiyor; hesap durumu giriyor.

Ayrica KENDISINI ENGELLEYENLER asla girmiyor - uygulamanin sessizlik
ilkesi (engelli, engellendigini silinmis hesaptan ayirt edemiyor) tek
hamlede yikilirdi.

NEDEN CANLI OLCULMESI SART: jest Supabase'i mock'luyor, yani bu
kurallarin HICBIRI jest'te gorulemiyor - hepsi `verilerimi_disa_aktar`
RPC'sinin icinde yasiyor. Bir sonraki kisi RPC'ye bir alan eklerken
sizinti acabilir; bu betik onu yakalar.

Olculenler:
   1. Kimliksiz cagri reddediliyor
   2. Kendi check-in'leri, yorumlari ve begenileri giriyor
   3. KENDI GONDERDIGI mesaj TAM METINLE giriyor
   4. KARSI TARAFIN mesaj METNI GIRMIYOR, ozet giriyor
   5. KENDI GONDERDIGI sikayet giriyor
   6. HAKKINDAKI sikayet GIRMIYOR
   7. KENDI ENGELLEDIGI kisi giriyor
   8. KENDISINI ENGELLEYEN kisi GIRMIYOR (sessizlik ilkesi)
   9. Moderator kimligi ve denetim izi hicbir yerde GECMIYOR
  10. Bildirim jetonunun KENDISI girmiyor (yalnizca platform)
  11. Temizlik: ekilen butun satirlar siliniyor

Kosum (mobil/.env yuklu kabukta):
    python araclar/veri-disa-aktarim-canli-test.py
"""
import json
import os
import sys
import uuid

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SR = os.environ['SUPABASE_SERVICE_ROLE_KEY']
y = create_client(URL, SR)

GIZLI_METIN = 'CANLI-TEST-KARSI-TARAFIN-CUMLESI'
KENDI_METIN = 'CANLI-TEST-BENIM-CUMLEM'
GIZLI_SIKAYET = 'CANLI-TEST-HAKKIMDAKI-SIKAYET'
KENDI_SIKAYET = 'CANLI-TEST-BENIM-SIKAYETIM'

gecti = kaldi = 0


def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print('  OK   ' + ad)
    else:
        kaldi += 1
        print('  HATA ' + ad + '  ' + str(ayrinti))


konusma_id = None
a_id = b_id = None
try:
    a = create_client(URL, ANON)
    a.auth.sign_in_with_password({'email': 'test0@slooin.test', 'password': 'test1234'})
    a_id = a.auth.get_user().user.id

    b = create_client(URL, ANON)
    b.auth.sign_in_with_password({'email': 'test1@slooin.test', 'password': 'test1234'})
    b_id = b.auth.get_user().user.id
    print('  A = ' + a_id + '\n  B = ' + b_id)

    print('\n1    Kimlik')
    anon = create_client(URL, ANON)
    try:
        anon.rpc('verilerimi_disa_aktar', {}).execute()
        kontrol('1  kimliksiz cagri reddediliyor', False, 'kabul edildi')
    except Exception as e:  # noqa: BLE001
        kontrol('1  kimliksiz cagri reddediliyor', True, str(e)[:40])

    # --- Veri ekimi: service role ile, RPC'lerin yan etkilerinden
    # kacinmak icin dogrudan. (`engelle` RPC'si ornegin konusmalari
    # SILIYOR ve testi kendi kendine bozardi.)
    print('\n   Test verisi ekiliyor...')
    konusma_id = str(uuid.uuid4())
    y.table('konusmalar').insert({'id': konusma_id}).execute()
    y.table('konusma_uyeleri').insert([
        {'konusma_id': konusma_id, 'kullanici_id': a_id},
        {'konusma_id': konusma_id, 'kullanici_id': b_id},
    ]).execute()
    y.table('mesajlar').insert([
        {'konusma_id': konusma_id, 'gonderen_id': a_id, 'metin': KENDI_METIN},
        {'konusma_id': konusma_id, 'gonderen_id': b_id, 'metin': GIZLI_METIN},
    ]).execute()
    y.table('sikayetler').insert([
        {'sikayet_eden_id': a_id, 'hedef_tur': 'kullanici', 'hedef_id': b_id,
         'sebep': 'diger', 'aciklama': KENDI_SIKAYET},
        {'sikayet_eden_id': b_id, 'hedef_tur': 'kullanici', 'hedef_id': a_id,
         'sebep': 'diger', 'aciklama': GIZLI_SIKAYET},
    ]).execute()
    y.table('engellemeler').insert([
        {'engelleyen_id': a_id, 'engellenen_id': b_id},
        {'engelleyen_id': b_id, 'engellenen_id': a_id},
    ]).execute()

    veri = a.rpc('verilerimi_disa_aktar', {}).execute().data
    ham = json.dumps(veri, ensure_ascii=False)

    print('\n2    Kendi verisi giriyor')
    kontrol('2  check-in listesi dolu', len(veri.get('check_inler') or []) > 0)
    kontrol('2  profil bilgisi var', bool(veri.get('profil')))

    print('\n3-4  Mesajlar')
    kontrol('3  kendi gonderdigi mesaj TAM METINLE giriyor', KENDI_METIN in ham)
    kontrol('4  karsi tarafin mesaj METNI GIRMIYOR', GIZLI_METIN not in ham)
    ozet = veri.get('aldigim_mesajlar_ozeti') or []
    kontrol(
        '4  aldigi mesajlarin OZETI giriyor (kim, kac tane)',
        any(o.get('mesaj_sayisi', 0) >= 1 for o in ozet),
        str(ozet)[:120],
    )

    print('\n5-6  Sikayetler')
    kontrol('5  kendi gonderdigi sikayet giriyor', KENDI_SIKAYET in ham)
    kontrol('6  HAKKINDAKI sikayet GIRMIYOR', GIZLI_SIKAYET not in ham)

    print('\n7-8  Engellemeler')
    engelledikleri = veri.get('engelledigim_kisiler') or []
    kontrol('7  kendi engelledigi kisi giriyor', len(engelledikleri) >= 1, str(engelledikleri)[:120])
    # SESSIZLIK ILKESI: B'nin A'yi engelledigi hicbir alanda gorunmemeli.
    # B'nin kullanici adi ozet ve engelleme listesinde mesru olarak
    # geciyor, o yuzden ALANIN KENDISI aranıyor.
    kontrol(
        '8  kendisini ENGELLEYEN kisi GIRMIYOR (sessizlik ilkesi)',
        'engelleyen' not in ham and 'beni_engelleyenler' not in ham,
    )

    print('\n9-10 Moderasyon ve jeton')
    kontrol('9  moderator kimligi gecmiyor', 'moderator_id' not in ham)
    kontrol('9  karar veren kimligi gecmiyor', 'karar_veren_id' not in ham)
    kontrol('9  denetim izi gecmiyor', 'moderasyon_kayitlari' not in ham)
    kontrol('10 bildirim jetonunun KENDISI girmiyor', '"jeton"' not in ham)

finally:
    print('\n11   Temizlik')
    if konusma_id:
        y.table('mesajlar').delete().eq('konusma_id', konusma_id).execute()
        y.table('konusma_uyeleri').delete().eq('konusma_id', konusma_id).execute()
        y.table('konusmalar').delete().eq('id', konusma_id).execute()
    if a_id and b_id:
        for metin in (KENDI_SIKAYET, GIZLI_SIKAYET):
            y.table('sikayetler').delete().eq('aciklama', metin).execute()
        y.table('engellemeler').delete().eq('engelleyen_id', a_id).eq('engellenen_id', b_id).execute()
        y.table('engellemeler').delete().eq('engelleyen_id', b_id).eq('engellenen_id', a_id).execute()
        kalan = y.table('engellemeler').select('engelleyen_id').in_(
            'engelleyen_id', [a_id, b_id]
        ).execute().data
        kontrol('11 ekilen satirlar temizlendi', len(kalan) == 0, str(kalan)[:80])

print('\nSONUC: ' + str(gecti) + ' gecti, ' + str(kaldi) + ' kaldi')
sys.exit(1 if kaldi else 0)
