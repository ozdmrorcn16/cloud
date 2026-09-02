"""MODERASYON PANELI: yorum sikayetinin karara baglanmasi - CANLI dogrulama.

En kritik davranis: sikayet edilen yorum ANINDA gizleniyor. Moderator
karar vermezse yorum SONSUZA KADAR gizli kalirdi - yani tek bir sikayet,
kimse bakmasa bile kalici sansur olurdu. Bu betik kararin o gecici
gizliligi gercekten cozdugunu olcuyor.

Moderator RPC'leri AAL2 (ikinci faktor) zorluyor, bu yuzden betik gecici
bir moderator hesabi acip TOTP kaydediyor ve sonunda siliyor.
"""
import os, sys, json, time, hmac, hashlib, base64, struct
import urllib.request, urllib.error
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
        print('  HATA ' + ad + '  ' + ayrinti)


def cagir(yol, govde=None, tok=None, yontem=None):
    h = {'apikey': ANON, 'Content-Type': 'application/json'}
    if tok:
        h['Authorization'] = 'Bearer ' + tok
    r = urllib.request.Request(
        URL + yol,
        data=json.dumps(govde).encode() if govde is not None else None,
        headers=h, method=yontem or ('POST' if govde is not None else 'GET'))
    try:
        ham = urllib.request.urlopen(r).read()
        return json.loads(ham) if ham else {}
    except urllib.error.HTTPError as e:
        raise SystemExit('AUTH HATASI ' + yol + ': ' + e.read().decode()[:300])


def totp(sir):
    anahtar = base64.b32decode(sir + '=' * (-len(sir) % 8), casefold=True)
    d = hmac.new(anahtar, struct.pack('>Q', int(time.time()) // 30), hashlib.sha1).digest()
    o = d[-1] & 0x0F
    kod = (struct.unpack('>I', d[o:o + 4])[0] & 0x7FFFFFFF) % 1000000
    return str(kod).zfill(6)


def kim(e):
    sb = create_client(URL, ANON)
    sb.auth.sign_in_with_password({'email': e, 'password': 'test1234'})
    return sb, sb.auth.get_user().user.id


# Onceki bir kosum yarim kaldiysa artiklari topla. Gecici hesap YONETICI
# rolunde ve parolasi bu dosyada sabit; canlida kalmasi gercek bir risk.
for _u in y.auth.admin.list_users():
    if (_u.email or '').startswith('gecici-mod-'):
        y.table('moderatorler').delete().eq('kullanici_id', _u.id).execute()
        print('  onceki kosumdan kalan moderator yetkisi kaldirildi: ' + _u.email)

# --- Gecici moderator: yeni hesap + TOTP (ilk faktor AAL1'de kaydedilebilir) ---
eposta = 'gecici-mod-' + str(int(time.time())) + '@slooin.test'
parola = 'gecici-1234-test'
mod = y.auth.admin.create_user(
    {'email': eposta, 'password': parola, 'email_confirm': True}).user
y.table('moderatorler').insert({'kullanici_id': mod.id, 'rol': 'yonetici'}).execute()

sid = ci = None
try:
    o = cagir('/auth/v1/token?grant_type=password', {'email': eposta, 'password': parola})
    t = o['access_token']
    f = cagir('/auth/v1/factors', {'factor_type': 'totp', 'friendly_name': 'test'}, t)
    c = cagir('/auth/v1/factors/' + f['id'] + '/challenge', {}, t)
    v = cagir('/auth/v1/factors/' + f['id'] + '/verify',
              {'challenge_id': c['id'], 'code': totp(f['totp']['secret'])}, t)
    m = create_client(URL, ANON)
    m.auth.set_session(v['access_token'], v['refresh_token'])
    kontrol('gecici moderator AAL2 aldi',
            m.rpc('moderator_muyum', {}).execute().data is True)

    a, a_id = kim('test0@slooin.test')
    b, b_id = kim('test1@slooin.test')

    mekan = y.table('mekanlar').select('id').limit(1).execute().data[0]['id']
    y.table('check_inler').delete().eq('kullanici_id', a_id).eq('not_metni', 'moderasyon testi').execute()
    ci = y.table('check_inler').insert({
        'kullanici_id': a_id, 'mekan_id': mekan, 'not_metni': 'moderasyon testi',
        'gorunurluk': 'herkese_acik', 'bulunurluk': 'herkese_acik',
        'kullanici_adi': 'test0', 'bitis_zamani': '2020-01-01T00:00:00Z', 'konum': None,
    }).execute().data[0]['id']
    yid = y.table('yorumlar').insert(
        {'check_in_id': ci, 'kullanici_id': b_id, 'metin': 'moderasyon icin yorum'}
    ).execute().data[0]['id']

    a.rpc('yorumu_sikayet_et', {'p_yorum_id': yid, 'p_sebep': 'taciz'}).execute()
    sid = y.table('sikayetler').select('id').eq('hedef_id', yid).execute().data[0]['id']

    def bayrak():
        r = y.table('yorumlar').select('sikayet_gizli,moderasyon_gizli').eq('id', yid).execute().data[0]
        return r['sikayet_gizli'], r['moderasyon_gizli']

    kontrol('sikayet -> ANINDA gecici gizli', bayrak() == (True, False), str(bayrak()))
    kontrol('gecici gizlide yorum listelenmiyor',
            len(a.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data) == 0)

    liste = m.rpc('moderasyon_sikayetleri_listele',
                  {'p_durum': 'yeni', 'p_hedef_tur': 'yorum', 'p_limit': 50}).execute().data
    kontrol('panel listesinde yorum sikayeti var', any(s['id'] == sid for s in liste))

    d = m.rpc('moderasyon_sikayet_detayi', {'p_sikayet_id': sid}).execute().data
    h = d.get('hedef') or {}
    kontrol('detayda yorum metni var', h.get('metin') == 'moderasyon icin yorum', str(h)[:120])
    kontrol('detayda BAGLAM var (paylasim notu + mekan)',
            h.get('paylasim_notu') == 'moderasyon testi' and bool(h.get('mekan_adi')), str(h)[:160])

    # REDDEDILDI -> yorum GERI GELMELI
    m.rpc('moderasyon_sikayeti_karara_bagla',
          {'p_sikayet_id': sid, 'p_durum': 'reddedildi', 'p_not': 'test'}).execute()
    kontrol('REDDEDILDI -> gecici gizlilik cozuldu', bayrak() == (False, False), str(bayrak()))
    kontrol('reddedilince yorum yine listeleniyor',
            len(a.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data) == 1)

    # ISLEM YAPILDI -> KALICI gizli
    y.table('yorumlar').update({'sikayet_gizli': True}).eq('id', yid).execute()
    y.table('sikayetler').update({'durum': 'yeni'}).eq('id', sid).execute()
    m.rpc('moderasyon_sikayeti_karara_bagla',
          {'p_sikayet_id': sid, 'p_durum': 'islem_yapildi', 'p_not': 'test'}).execute()
    kontrol('ISLEM YAPILDI -> kalici gizli', bayrak() == (False, True), str(bayrak()))
    kontrol('kalici gizlide yorum listelenmiyor',
            len(a.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data) == 0)

    # Panelin "Yorumu gizle" dugmesi
    m.rpc('moderasyon_yorumu_gizle',
          {'p_yorum_id': yid, 'p_gerekce': 'test gizleme'}).execute()
    kontrol('moderasyon_yorumu_gizle calisti', bayrak() == (False, True), str(bayrak()))

    m.rpc('moderasyon_yorum_gizlemeyi_kaldir',
          {'p_yorum_id': yid, 'p_gerekce': 'test geri alma'}).execute()
    kontrol('gizlemeyi kaldir -> yorum geri geldi', bayrak() == (False, False), str(bayrak()))

    izler = m.rpc('moderasyon_kayitlarini_listele',
                  {'p_hedef_tur': 'yorum', 'p_limit': 50}).execute().data
    kontrol('denetim izine yazildi',
            any(i.get('hedef_id') in (yid, sid) for i in izler))
except Exception as hata:
    kaldi += 1
    print('  HATA beklenmeyen istisna: ' + repr(hata)[:400])
finally:
    if sid:
        try:
            y.table('sikayetler').delete().eq('id', sid).execute()
        except Exception:
            pass
    if ci:
        try:
            y.table('check_inler').delete().eq('id', ci).execute()
        except Exception:
            pass
    # KRITIK: yetkiyi kaldir. Hesap silinemese bile moderator olmaktan
    # cikar. auth admin silme bu projede sik sik zaman asimina dusuyor,
    # bu yuzden ikisi ayri ele aliniyor.
    y.table('moderatorler').delete().eq('kullanici_id', mod.id).execute()
    try:
        y.auth.admin.delete_user(mod.id)
    except Exception as e:
        print('  UYARI: hesap silinemedi (yetkisi kaldirildi): ' + eposta)
        print('  ' + repr(e)[:120])

print('\nSONUC: ' + str(gecti) + ' gecti, ' + str(kaldi) + ' kaldi')
sys.exit(1 if kaldi else 0)
