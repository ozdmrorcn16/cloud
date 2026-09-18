"""E-posta degistirme akisinin SUNUCU tarafini canli olcer (2026-09-19).

Ekran (`profil/eposta-degistir`): once MEVCUT adrese kod
(`signInWithOtp`) -> `verifyOtp(type=email)`, sonra `updateUser({email})`
-> YENI adrese kod -> `verifyOtp(type=email_change, email=yeni)`.
Panelde iki sart var ve ikisi de bu betikle dolayli olculuyor:

1. "Change Email Address" sablonu `{{ .Token }}` tasimali - kod
   `generate_link(type=email_change_new)`in `email_otp`u ile aliniyor
   (postadaki kodun kendisi; `.test` adreslerine posta gitmiyor).
2. "Secure email change" KAPALI olmali - acik olsaydi yalnizca yeni
   adresin kodu degisikligi TAMAMLAMAZDI; betik degisikligin gercekten
   `auth.users.email`e yansidigini olcuyor.

Betik ATILABILIR bir hesap acar ve sonunda siler; gercek veriye dokunmaz.

Kullanim (mobil/.env yuklu kabuk):
    python araclar/eposta-degistir-canli-test.py
"""

import os
import sys
import time

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']

sonuc = []


def kontrol(ad, ok, detay=''):
    sonuc.append(ok)
    print(('  OK  ' if ok else '  HATA') + ' ' + ad + (f'  [{detay}]' if detay else ''))


def main():
    anon = create_client(URL, ANON)
    admin = create_client(URL, SERVICE)
    damga = int(time.time())
    eski = f'eposta-eski-{damga}@slooin.test'
    yeni = f'eposta-yeni-{damga}@slooin.test'
    sifre = 'gecici-sifre-12'

    olusan = admin.auth.admin.create_user({'email': eski, 'password': sifre, 'email_confirm': True})
    uid = olusan.user.id
    try:
        # 1) Mevcut adres dogrulamasi: magic link kodu (kayit akisiyla ayni sablon).
        link = admin.auth.admin.generate_link({'type': 'magiclink', 'email': eski})
        kod = getattr(link.properties, 'email_otp', None)
        kontrol('mevcut adrese kod uretildi', bool(kod) and len(kod) == 6)
        oturum = anon.auth.verify_otp({'email': eski, 'token': kod, 'type': 'email'})
        kontrol('mevcut adres dogrulandi (oturum acildi)', bool(oturum.session))

        # 2) updateUser({email}) - yeni adrese kod gider; adres HENUZ degismez.
        anon.auth.update_user({'email': yeni})
        u = admin.auth.admin.get_user_by_id(uid).user
        kontrol('updateUser sonrasi giris adresi HENUZ degismedi', u.email == eski, u.email)
        kontrol('yeni adres bekleyen olarak kaydedildi', (u.new_email or '') == yeni, u.new_email or 'yok')

        # 3) Yeni adresin kodu (Change Email Address sablonundaki {{ .Token }}).
        link2 = admin.auth.admin.generate_link({'type': 'email_change_new', 'email': eski, 'new_email': yeni})
        kod2 = getattr(link2.properties, 'email_otp', None)
        kontrol('yeni adrese 6 haneli kod uretildi', bool(kod2) and len(kod2) == 6)
        anon.auth.verify_otp({'email': yeni, 'token': kod2, 'type': 'email_change'})
        u = admin.auth.admin.get_user_by_id(uid).user
        kontrol('YALNIZCA yeni adresin koduyla adres degisti (secure email change kapali)', u.email == yeni, u.email)

        # 4) Yeni adresle sifre girisi calisiyor, eskisiyle calismiyor.
        anon2 = create_client(URL, ANON)
        g = anon2.auth.sign_in_with_password({'email': yeni, 'password': sifre})
        kontrol('yeni adresle giris', bool(g.session))
        eski_giris = None
        try:
            create_client(URL, ANON).auth.sign_in_with_password({'email': eski, 'password': sifre})
        except Exception as e:  # noqa: BLE001
            eski_giris = str(e)
        kontrol('eski adresle giris REDDEDILIYOR', bool(eski_giris))
    finally:
        admin.auth.admin.delete_user(uid)
        kalan = any(x.id == uid for x in admin.auth.admin.list_users())
        kontrol('gecici hesap silindi', not kalan)

    print(f'\n{sum(sonuc)}/{len(sonuc)} dogrulama gecti')
    sys.exit(0 if all(sonuc) else 1)


if __name__ == '__main__':
    main()
