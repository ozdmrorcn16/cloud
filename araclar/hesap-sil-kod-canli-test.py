"""Hesap silmenin ONAY KODU kapisini canli olcer (2026-09-13).

Kullanicinin karari: "hesap silme adimina e-postaya onaylama kodu
getirilsin; e-postaya gelen onay kodunu giren biri hesabini silebilecek".
Sunucu (`hesap-sil` Edge Function, surum 7) parola gelmediginde son
girisin 10 dakikadan TAZE olmasini istiyor. Jest bunu goremez.

Olculenler:
  1. Taze giris + parolasiz cagri         -> silindi (kapinin acik yonu)
  2. Gecersiz jeton                       -> 401
  3. Onay kodu dogrulandiktan sonra       -> silindi
  4. Eski parola yolu HALA calisiyor      -> yanlis parola 400, dogru parola silindi

KAPALI YON (eski giris + parola yok -> 403) bu betikte OLCULMUYOR:
`last_sign_in_at`i eskitmek SQL ister ve auth semasi PostgREST'e
acik degil. O yon 2026-09-13'te MCP ile elle olculdu (CLAUDE.md).

Kod NASIL ELDE EDILIYOR: gercek akista posta gidiyor; `.test`
adreslerine Supabase posta gondermiyor. Bu yuzden kod admin API'nin
`generate_link(type=magiclink)` cagrisindan (`email_otp`) aliniyor -
kullanicinin postasinda gorecegi 6 haneli kodun ta kendisi; `verifyOtp`
zinciri ayni.

Betik ATILABILIR hesaplar acar ve hepsini siler; gercek veriye dokunmaz.

Kullanim (mobil/.env yuklu kabuk):
    python araclar/hesap-sil-kod-canli-test.py
"""

import os
import time

import requests
from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']
SIFRE = 'gecici-sil-1234'

sonuc = []


def kontrol(ad, ok, detay=''):
    sonuc.append(ok)
    print(('  OK  ' if ok else '  HATA') + ' ' + ad + (f'  [{detay}]' if detay else ''))


def fonksiyonu_cagir(jeton, govde):
    r = requests.post(
        f'{URL}/functions/v1/hesap-sil',
        headers={'Authorization': f'Bearer {jeton}', 'apikey': ANON, 'Content-Type': 'application/json'},
        json=govde,
        timeout=60,
    )
    try:
        return r.status_code, r.json()
    except ValueError:
        return r.status_code, {'ham': r.text[:120]}


def hesap_ac(admin, eposta):
    u = admin.auth.admin.create_user({'email': eposta, 'password': SIFRE, 'email_confirm': True})
    return u.user.id


def main():
    admin = create_client(URL, SERVICE)
    anon = create_client(URL, ANON)
    damga = int(time.time())

    # ---------- 1) Parolasiz + taze olmayan giris -> 403 ----------
    e1 = f'silme-kod-{damga}-a@slooin.test'
    id1 = hesap_ac(admin, e1)
    try:
        oturum = anon.auth.sign_in_with_password({'email': e1, 'password': SIFRE})
        jeton = oturum.session.access_token
        # Az once giris yapildi -> TAZE. Sinir 10 dk; bekleyemeyiz. Bu
        # yuzden "taze" durumda parolasiz cagrinin GECTIGINI olcuyoruz
        # (kapinin acik yonu), sonra 3. adimda kapali yonu eskitilmis
        # bir kayitla olcuyoruz.
        durum, govde = fonksiyonu_cagir(jeton, {})
        kontrol('taze giris + parolasiz cagri -> silindi (kapinin acik yonu)', durum == 200 and govde.get('silindi') is True, f'{durum} {govde}')
    finally:
        try:
            admin.auth.admin.delete_user(id1)
        except Exception:  # noqa: BLE001
            pass

    # ---------- 2) Kapali yon: eski giris, parola yok -> 403 ----------
    e2 = f'silme-kod-{damga}-b@slooin.test'
    id2 = hesap_ac(admin, e2)
    try:
        oturum = anon.auth.sign_in_with_password({'email': e2, 'password': SIFRE})
        jeton = oturum.session.access_token
        # last_sign_in_at'i eskitmek icin SQL gerekiyor; PostgREST auth
        # semasina acik degil. `admin.auth.admin.update_user_by_id` bu
        # alani yazmiyor. Cozum: bekleme yerine `_eskit` RPC'si YOK -
        # bu adim MCP ile elle olculdu (bkz. CLAUDE.md, 2026-09-13).
        # Burada yalnizca jetonun kendisinin YETMEDIGI gozlemleniyor:
        # kimliksiz cagri 401 dondurmeli.
        durum, govde = fonksiyonu_cagir('gecersiz', {})
        kontrol('gecersiz jeton -> 401', durum == 401, f'{durum} {govde}')
    finally:
        pass

    # ---------- 3) Onay kodu yolu ----------
    # Ayni hesap (e2) hala duruyor. Admin generate_link magiclink ->
    # email_otp = kullanicinin postasinda gorecegi kod.
    link = admin.auth.admin.generate_link({'type': 'magiclink', 'email': e2})
    kod = getattr(link.properties, 'email_otp', None)
    kontrol('admin generate_link 6 haneli kod uretti', bool(kod) and len(kod) == 6, kod or 'yok')
    dogrulama = anon.auth.verify_otp({'email': e2, 'token': kod, 'type': 'email'})
    taze_jeton = dogrulama.session.access_token
    kontrol('verifyOtp oturum acti', bool(taze_jeton))
    durum, govde = fonksiyonu_cagir(taze_jeton, {})
    kontrol('kod dogrulandiktan sonra parolasiz silme -> silindi', durum == 200 and govde.get('silindi') is True, f'{durum} {govde}')
    var = any(u.id == id2 for u in admin.auth.admin.list_users())
    kontrol('hesap gercekten silindi', not var)

    # ---------- 4) Eski parola yolu hala calisiyor ----------
    e3 = f'silme-kod-{damga}-c@slooin.test'
    id3 = hesap_ac(admin, e3)
    try:
        oturum = anon.auth.sign_in_with_password({'email': e3, 'password': SIFRE})
        jeton = oturum.session.access_token
        durum, govde = fonksiyonu_cagir(jeton, {'parola': 'yanlis-parola'})
        kontrol('yanlis parola -> 400 Parola yanlis', durum == 400 and govde.get('hata') == 'Parola yanlis', f'{durum} {govde}')
        durum, govde = fonksiyonu_cagir(jeton, {'parola': SIFRE})
        kontrol('dogru parola -> silindi (eski yol duruyor)', durum == 200 and govde.get('silindi') is True, f'{durum} {govde}')
    finally:
        try:
            admin.auth.admin.delete_user(id3)
        except Exception:  # noqa: BLE001
            pass

    print(f'\n{sum(sonuc)}/{len(sonuc)} dogrulama gecti')
    raise SystemExit(0 if all(sonuc) else 1)


if __name__ == '__main__':
    main()
