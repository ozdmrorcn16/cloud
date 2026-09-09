"""MEKAN DUZENLEME TALEBI: ONAY YOLU - CANLI dogrulama.

Kardes betik `mekan-duzenleme-canli-test.py` TALEP GONDERMEYI olcuyor;
bu betik onun olcemedigi kismi kapatiyor: MODERATORUN ONAYI ve onayin
mekan kaydina gercekten islenmesi.

Neden ayri bir betik: moderator RPC'leri AAL2 (ikinci faktor) zorluyor,
yani gecici bir moderator hesabi acip TOTP kaydetmek gerekiyor. Ayni
desen `moderasyon-yorum-canli-test.py` icinde de var.

NEDEN CANLI OLCULMESI SART: jest Supabase'i mock'luyor. Onay yolu
yalnizca sunucuda yasiyor ve icinde sessizce patlayabilecek bir adim
var - denetim izi. `moderasyon.kaydet` yeni `hedef_tur = 'mekan'`
degerini kabul etmezse kisit ihlali ISLEMIN TAMAMINI geri alir ve
onay HIC olmaz (2026-09-02'de yorum tarafinda tam olarak bu yasandi).

Olculenler:
   1. Gecici moderator AAL2 aliyor
   2. Talep gonderiliyor (ad + mahalle + il + ilce + tur)
   3. OLMAYAN IL reddediliyor
   4. Moderator talebi listede goruyor
   5. Detay MEVCUT ve ONERILEN degerleri birlikte veriyor
   6. ALAN ALAN ONAY: yalnizca secilen alanlar uygulaniyor
   7. Onaylanan alanlar mekan kaydina islendi, digerleri DEGISMEDI
   8. `elle_duzenlendi` isaretlendi (toplu yukleme ezmesin)
   9. Denetim izine 'mekan' turunde satir yazildi
  10. Karara baglanmis talep IKINCI KEZ karara baglanamiyor
  11. Temizlik: mekan ESKI HALINE donduruIdue, talep ve moderator silindi

Kosum (mobil/.env yuklu kabukta):
    python araclar/mekan-duzenleme-onay-canli-test.py
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


# Onceki bir kosum yarim kaldiysa artiklari topla: gecici hesap YONETICI
# rolunde, canlida kalmasi gercek bir risk.
for _u in y.auth.admin.list_users():
    if (_u.email or '').startswith('gecici-mod-'):
        y.table('moderatorler').delete().eq('kullanici_id', _u.id).execute()
        print('  onceki kosumdan kalan moderator yetkisi kaldirildi: ' + str(_u.email))

eposta = 'gecici-mod-' + str(int(time.time())) + '@slooin.test'
# Parola rastgele: betik depoda ve hesap yonetici rolunde.
parola = 'gecici-' + base64.b32encode(os.urandom(15)).decode().lower()
mod = y.auth.admin.create_user(
    {'email': eposta, 'password': parola, 'email_confirm': True}
).user
y.table('moderatorler').insert({'kullanici_id': mod.id, 'rol': 'yonetici'}).execute()

talep_id = None
mekan_id = None
onceki = None
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

    # MEKANIN BASLANGIC HALI SAKLANIYOR: betik gercek bir kaydi
    # degistiriyor ve sonunda geri almak zorunda.
    onceki = (
        y.table('mekanlar')
        .select('id, ad, tur, adres, mahalle, il, semt, elle_duzenlendi, kapak_fotograf')
        .eq('kaynak', 'foursquare')
        .limit(1)
        .execute()
        .data[0]
    )
    mekan_id = onceki['id']
    print('  test mekani: ' + str(onceki['ad'])[:40] + ' (' + mekan_id + ')')

    print('\n2-3  Talep')
    var, mesaj = hata_verdi(
        lambda: kisi.rpc(
            'mekan_duzenleme_talebi_gonder',
            {'p_mekan_id': mekan_id, 'p_il': 'Vestaros'},
        ).execute()
    )
    kontrol('3  olmayan il reddediliyor', var and 'listemizde yok' in mesaj, mesaj)

    talep_id = kisi.rpc(
        'mekan_duzenleme_talebi_gonder',
        {
            'p_mekan_id': mekan_id,
            'p_ad': 'ONAY-TESTI-ADI',
            'p_mahalle': 'Alaaddinbey',
            'p_il': 'Bursa',
            'p_ilce': 'Nilüfer',
            'p_tur': 'Kafe',
        },
    ).execute().data
    kontrol('2  talep olusturuldu', bool(talep_id), str(talep_id))

    print('\n4-5  Moderator gorunumu')
    liste = m.rpc('moderasyon_duzenleme_talepleri', {'p_durum': 'beklemede'}).execute().data
    kontrol('4  talep moderator listesinde', any(s['id'] == talep_id for s in liste))

    detay = m.rpc('moderasyon_duzenleme_talebi_detayi', {'p_id': talep_id}).execute().data[0]
    kontrol(
        '5  detay mevcut ve onerilen degerleri veriyor',
        detay['mevcut_ad'] == onceki['ad']
        and detay['onerilen_ad'] == 'ONAY-TESTI-ADI'
        and detay['onerilen_mahalle'] == 'Alaaddinbey'
        and detay['onerilen_ilce'] == 'Nilüfer',
        str(detay)[:200],
    )

    print('\n6-9  Onay')
    # ALAN ALAN: yalnizca mahalle ve ilce onaylaniyor. Ad ve tur
    # ONERILDIGI HALDE uygulanmamali - talebin bir kismini kabul edip
    # kalanini reddetmek moderatorun elinde.
    m.rpc(
        'moderasyon_duzenleme_talebini_karara_bagla',
        {
            'p_id': talep_id,
            'p_karar': 'onaylandi',
            'p_alanlar': ['mahalle', 'ilce'],
            'p_not': 'canli test',
        },
    ).execute()

    sonra = (
        y.table('mekanlar')
        .select('ad, tur, mahalle, il, semt, elle_duzenlendi')
        .eq('id', mekan_id)
        .single()
        .execute()
        .data
    )
    kontrol('6  onaylanan MAHALLE islendi', sonra['mahalle'] == 'Alaaddinbey', str(sonra))
    kontrol('6  onaylanan ILCE islendi', sonra['semt'] == 'Nilüfer', str(sonra))
    kontrol('7  onaylanmayan AD degismedi', sonra['ad'] == onceki['ad'], str(sonra))
    kontrol('7  onaylanmayan TUR degismedi', sonra['tur'] == onceki['tur'], str(sonra))
    kontrol('7  onaylanmayan IL degismedi', sonra['il'] == onceki['il'], str(sonra))
    kontrol('8  elle_duzenlendi isaretlendi', sonra['elle_duzenlendi'] is True, str(sonra))

    iz = (
        y.table('moderasyon_kayitlari')
        .select('eylem, hedef_tur, hedef_id')
        .eq('hedef_tur', 'mekan')
        .eq('hedef_id', mekan_id)
        .order('olusturuldu', desc=True)
        .limit(1)
        .execute()
        .data
    )
    kontrol(
        '9  denetim izine mekan satiri yazildi',
        len(iz) == 1 and iz[0]['eylem'] == 'mekan_duzenleme_talebi_karara_baglandi',
        str(iz),
    )

    print('\n10   Ikinci karar')
    var, mesaj = hata_verdi(
        lambda: m.rpc(
            'moderasyon_duzenleme_talebini_karara_bagla',
            {'p_id': talep_id, 'p_karar': 'reddedildi'},
        ).execute()
    )
    kontrol('10  karara baglanmis talep tekrar karara baglanmiyor', var and 'zaten' in mesaj, mesaj)

finally:
    print('\n11   Temizlik')
    if onceki and mekan_id:
        y.table('mekanlar').update(
            {
                'ad': onceki['ad'],
                'tur': onceki['tur'],
                'adres': onceki['adres'],
                'mahalle': onceki['mahalle'],
                'il': onceki['il'],
                'semt': onceki['semt'],
                'elle_duzenlendi': onceki['elle_duzenlendi'],
                'kapak_fotograf': onceki['kapak_fotograf'],
            }
        ).eq('id', mekan_id).execute()
        geri = (
            y.table('mekanlar')
            .select('ad, mahalle, semt, elle_duzenlendi')
            .eq('id', mekan_id)
            .single()
            .execute()
            .data
        )
        kontrol(
            '11  mekan eski haline donduruIdue',
            geri['mahalle'] == onceki['mahalle'] and geri['semt'] == onceki['semt'],
            str(geri),
        )
    if talep_id:
        y.table('mekan_duzenleme_talepleri').delete().eq('id', talep_id).execute()
    # Denetim izi EKLEME-ONLY, silinmiyor - tasarim geregi. Test satiri
    # izde kaliyor ve bu dogru: iz silinebilseydi izin kendisi anlamsiz
    # olurdu.
    y.table('moderatorler').delete().eq('kullanici_id', mod.id).execute()
    try:
        y.auth.admin.delete_user(mod.id)
    except Exception as e:  # noqa: BLE001
        print('  UYARI: hesap silinemedi (yetkisi kaldirildi): ' + eposta)
        print('  ' + repr(e)[:120])

print('\nSONUC: ' + str(gecti) + ' gecti, ' + str(kaldi) + ' kaldi')
sys.exit(1 if kaldi else 0)
