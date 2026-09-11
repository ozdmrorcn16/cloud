"""KAPALI MEKAN BILDIRIMI - CANLI dogrulama.

Kullanicinin sorusu (2026-09-10): "Konum verilerimizde kapali, gercekte
olmayan yerler var, bunlari tespit etmek mumkun mu?" Otomatik tespit
OLCULEREK elendi (Foursquare'in `date_closed` alani indirme sirasinda
zaten filtrelenmis; tek dolayli sinyal `date_refreshed` ve kayitlarin
%61'i 2020 oncesi - "guncellenmemis" ile "kapandi" ayni sey degil).
Kaynak orada bulunan insan oldu: bildiriyor, moderator onayliyor.

NEDEN CANLI OLCULMESI SART: jest Supabase'i mock'luyor, yani asagidaki
kurallarin HICBIRI jest'te gorulemiyor - hepsi sunucuda yasiyor.

Olculenler:
   1. Gecici moderator AAL2 aliyor
   2. Bildirim gonderiliyor (baska hicbir alan degismeden - tek basina
      gecerli bir talep olmali)
   3. VARSAYILAN ONAY KAPATMIYOR: `p_alanlar` acikca 'kapali' tasimadikca
      mekan acik kalmali. En pahali hata "hepsini onayla" refleksiyle bir
      mekanin kazara kapanmasi olurdu.
   4. Acikca onaylanınca mekan kapaniyor
   5. Kapali mekan YAKIN MEKANLAR listesinden duesuyor (asil vaat)
   6. Kapali mekana CHECK-IN reddediliyor - ve hata mesafeden ONCE
      geliyor, yani kural gercekten kapaliliga bagli
   7. Zaten kapali mekana ikinci bildirim reddediliyor
   8. Siradan kullanici mekani geri acamiyor (moderator kapisi)
   9. Moderator geri aciyor, mekan listeye GERI DONUYOR
  10. Denetim izine 'mekan_geri_acildi' satiri yazildi
  11. Temizlik: mekan eski haline donduruldu, talep ve moderator silindi

Kosum (mobil/.env yuklu kabukta):
    python araclar/kapali-mekan-canli-test.py
"""
import base64
import hashlib
import hmac
import json
import os
import struct
import sys
import time
import urllib.error
import urllib.request

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SR = os.environ['SUPABASE_SERVICE_ROLE_KEY']
y = create_client(URL, SR)

# Bursa/Nilufer - depodaki diger araclarin da kullandigi merkez.
LAT, LNG = 40.2261, 28.8656
YARICAP = 500

gecti = kaldi = 0


def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1
        print('  OK   ' + ad)
    else:
        kaldi += 1
        print('  HATA ' + ad + '  ' + str(ayrinti))


def cagir(yol, govde=None, tok=None):
    h = {'apikey': ANON, 'Content-Type': 'application/json'}
    if tok:
        h['Authorization'] = 'Bearer ' + tok
    r = urllib.request.Request(
        URL + yol,
        data=json.dumps(govde).encode() if govde is not None else None,
        headers=h,
        method='POST' if govde is not None else 'GET',
    )
    try:
        ham = urllib.request.urlopen(r).read()
        return json.loads(ham) if ham else {}
    except urllib.error.HTTPError as e:
        raise SystemExit('AUTH HATASI ' + yol + ': ' + e.read().decode()[:300])


def totp(sir):
    anahtar = base64.b32decode(sir + '=' * (-len(sir) % 8), casefold=True)
    d = hmac.new(anahtar, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    o = d[-1] & 0x0F
    return str((struct.unpack('>I', d[o:o + 4])[0] & 0x7FFFFFFF) % 1000000).zfill(6)


def hata_verdi(cagri):
    try:
        cagri()
        return False, ''
    except Exception as e:  # noqa: BLE001
        return True, str(e)


def liste(istemci):
    return istemci.rpc(
        'yakin_mekanlar_yogunluk',
        {'p_lat': LAT, 'p_lng': LNG, 'p_yaricap_metre': YARICAP, 'p_limit': 100},
    ).execute().data


# Onceki bir kosum yarim kaldiysa artiklari topla: gecici hesap YONETICI
# rolunde, canlida kalmasi gercek bir risk.
for _u in y.auth.admin.list_users():
    if (_u.email or '').startswith('gecici-mod-'):
        y.table('moderatorler').delete().eq('kullanici_id', _u.id).execute()
        print('  onceki kosumdan kalan moderator yetkisi kaldirildi: ' + str(_u.email))

eposta = 'gecici-mod-' + str(int(time.time())) + '@slooin.test'
parola = 'gecici-' + base64.b32encode(os.urandom(15)).decode().lower()
mod = y.auth.admin.create_user(
    {'email': eposta, 'password': parola, 'email_confirm': True}
).user
y.table('moderatorler').insert({'kullanici_id': mod.id, 'rol': 'yonetici'}).execute()

talep_id = None
mekan_id = None
onceki = None
kisi_id = None
try:
    o = cagir('/auth/v1/token?grant_type=password', {'email': eposta, 'password': parola})
    t = o['access_token']
    f = cagir('/auth/v1/factors', {'factor_type': 'totp', 'friendly_name': 'test'}, t)
    c = cagir('/auth/v1/factors/' + f['id'] + '/challenge', {}, t)
    v = cagir(
        '/auth/v1/factors/' + f['id'] + '/verify',
        {'challenge_id': c['id'], 'code': totp(f['totp']['secret'])},
        t,
    )
    m = create_client(URL, ANON)
    m.auth.set_session(v['access_token'], v['refresh_token'])
    kontrol('1  gecici moderator AAL2 aldi', m.rpc('moderator_muyum', {}).execute().data is True)

    kisi = create_client(URL, ANON)
    kisi.auth.sign_in_with_password({'email': 'test0@slooin.test', 'password': 'test1234'})
    kisi_id = kisi.auth.get_user().user.id
    y.table('mekan_duzenleme_talepleri').delete().eq('kullanici_id', kisi_id).execute()

    # MEKAN LISTENIN KENDISINDEN seciliyor: boylece "kapaninca listeden
    # duesuyor mu" sorusu, kullanicinin gercekten gordugu liste uzerinde
    # olculuyor - ayri bir sorgu kurup ona guvenmek yerine.
    ilk_liste = liste(kisi)
    if not ilk_liste:
        raise SystemExit('Test merkezinde mekan bulunamadi; LAT/LNG degerlerini kontrol et.')
    mekan_id = ilk_liste[0]['id']
    onceki = (
        y.table('mekanlar')
        .select('id, ad, kapali, elle_duzenlendi')
        .eq('id', mekan_id)
        .single()
        .execute()
        .data
    )
    print('  test mekani: ' + str(onceki['ad'])[:40] + ' (' + mekan_id + ')')

    print('\n2    Bildirim')
    talep_id = kisi.rpc(
        'mekan_duzenleme_talebi_gonder',
        {'p_mekan_id': mekan_id, 'p_kapali': True},
    ).execute().data
    kontrol('2  yalnizca kapandi bildirimi gecerli bir talep', bool(talep_id), str(talep_id))

    detay = m.rpc('moderasyon_duzenleme_talebi_detayi', {'p_id': talep_id}).execute().data[0]
    kontrol(
        '2  moderator bildirimi goruyor',
        detay['kapali_bildirimi'] is True and detay['mevcut_kapali'] is False,
        str(detay)[:200],
    )

    print('\n3    Varsayilan onay KAPATMIYOR')
    # `p_alanlar` HIC verilmiyor: sunucudaki varsayilan liste 'kapali'
    # tasimamali. Bu, kazara kapatmaya karsi tek gercek koruma.
    m.rpc(
        'moderasyon_duzenleme_talebini_karara_bagla',
        {'p_id': talep_id, 'p_karar': 'onaylandi', 'p_not': 'canli test - varsayilan'},
    ).execute()
    ara = y.table('mekanlar').select('kapali').eq('id', mekan_id).single().execute().data
    kontrol('3  varsayilan alan listesi mekani KAPATMADI', ara['kapali'] is False, str(ara))

    print('\n4-6  Acik onay ve sonuclari')
    # Talep karara baglandi; kapatmayi acikca uygulamak icin sunucudaki
    # ayni yolu kullanmak gerekiyor, o yuzden ikinci bir talep aciliyor.
    talep2 = kisi.rpc(
        'mekan_duzenleme_talebi_gonder',
        {'p_mekan_id': mekan_id, 'p_kapali': True},
    ).execute().data
    m.rpc(
        'moderasyon_duzenleme_talebini_karara_bagla',
        {
            'p_id': talep2,
            'p_karar': 'onaylandi',
            'p_alanlar': ['kapali'],
            'p_not': 'canli test - acik onay',
        },
    ).execute()
    sonra = (
        y.table('mekanlar').select('kapali, elle_duzenlendi').eq('id', mekan_id).single().execute().data
    )
    kontrol('4  acikca onaylaninca mekan kapandi', sonra['kapali'] is True, str(sonra))

    kapali_liste = liste(kisi)
    kontrol(
        '5  kapali mekan yakin mekanlar listesinden duestue',
        all(s['id'] != mekan_id for s in kapali_liste),
        'liste uzunlugu ' + str(len(kapali_liste)),
    )

    # KOORDINAT BILEREK YANLIS (0,0): kapali kontrolu mesafe
    # kontrolunden ONCE calisiyor olmali. Mesafe hatasi gelirse kural
    # kapaliliga degil konuma baglanmis demektir.
    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'check_in_yap', {'p_mekan_id': mekan_id, 'p_lat': 0, 'p_lng': 0}
        ).execute()
    )
    kontrol('6  kapali mekana check-in reddediliyor', var and 'kalici olarak kapandi' in mesaj, mesaj)

    print('\n7-8  Sinirlar')
    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'mekan_duzenleme_talebi_gonder',
            {'p_mekan_id': mekan_id, 'p_kapali': True},
        ).execute()
    )
    kontrol('7  zaten kapali mekana ikinci bildirim reddediliyor', var and 'zaten kapali' in mesaj, mesaj)

    var, mesaj = hata_verdi(
        lambda: kisi.rpc('moderasyon_mekani_geri_ac', {'p_mekan_id': mekan_id}).execute()
    )
    kontrol('8  siradan kullanici mekani geri acamiyor', var, mesaj)

    print('\n9-10 Geri acma')
    m.rpc('moderasyon_mekani_geri_ac', {'p_mekan_id': mekan_id}).execute()
    acik = y.table('mekanlar').select('kapali').eq('id', mekan_id).single().execute().data
    kontrol('9  moderator mekani geri acti', acik['kapali'] is False, str(acik))
    kontrol(
        '9  mekan listeye geri dondu',
        any(s['id'] == mekan_id for s in liste(kisi)),
    )

    iz = (
        y.table('moderasyon_kayitlari')
        .select('eylem, hedef_tur')
        .eq('hedef_tur', 'mekan')
        .eq('hedef_id', mekan_id)
        .order('olusturuldu', desc=True)
        .limit(1)
        .execute()
        .data
    )
    kontrol(
        '10  denetim izine geri acma satiri yazildi',
        len(iz) == 1 and iz[0]['eylem'] == 'mekan_geri_acildi',
        str(iz),
    )

finally:
    print('\n11   Temizlik')
    if onceki and mekan_id:
        y.table('mekanlar').update(
            {'kapali': onceki['kapali'], 'elle_duzenlendi': onceki['elle_duzenlendi']}
        ).eq('id', mekan_id).execute()
        geri = y.table('mekanlar').select('kapali').eq('id', mekan_id).single().execute().data
        kontrol('11  mekan eski haline donduruldu', geri['kapali'] == onceki['kapali'], str(geri))
    if kisi_id:
        y.table('mekan_duzenleme_talepleri').delete().eq('kullanici_id', kisi_id).execute()
    # Denetim izi EKLEME-ONLY, silinmiyor - tasarim geregi.
    y.table('moderatorler').delete().eq('kullanici_id', mod.id).execute()
    try:
        y.auth.admin.delete_user(mod.id)
    except Exception as e:  # noqa: BLE001
        print('  UYARI: hesap silinemedi (yetkisi kaldirildi): ' + eposta)
        print('  ' + repr(e)[:120])

print('\nSONUC: ' + str(gecti) + ' gecti, ' + str(kaldi) + ' kaldi')
sys.exit(1 if kaldi else 0)
