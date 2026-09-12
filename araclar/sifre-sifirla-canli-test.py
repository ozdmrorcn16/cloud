"""Sifre sifirlama akisinin SUNUCU tarafini canli olcer (2026-09-12).

Jest Supabase'i mock'ladigi icin su uc sey ancak burada gorulebilir:

1. Olmayan adrese `signInWithOtp(shouldCreateUser=False)` -> hesap
   ACILMIYOR ve `otp_disabled` donuyor (ekran bunu "hesap bulunamadi"
   diye gosteriyor).
2. Gercek hesaba ayni cagri -> "hesap var" kapisi geciliyor. Test
   hesaplari `.test` uzantili oldugu icin posta katmani reddediyor;
   postanin kendisi ve verifyOtp zinciri 2026-09-02'de gercek adresle
   olculmustu.
3. `updateUser({password})` bir oturumda CALISIYOR ("secure password
   change" ayari kapali). Test hesabinin sifresi AYNI degerle
   yeniden yaziliyor, yani degismiyor.

Kullanim (mobil/.env yuklu kabuk):
    python araclar/sifre-sifirla-canli-test.py
"""

import os
import sys
import time

from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
SERVICE = os.environ['SUPABASE_SERVICE_ROLE_KEY']
TEST_SIFRE = os.environ.get('TEST_HESAP_SIFRESI', 'test1234')

GERCEK = 'test1@slooin.test'
OLMAYAN = f'olmayan-{int(time.time())}@slooin.test'

sonuc = []


def kontrol(ad, ok, detay=''):
    sonuc.append(ok)
    print(('  OK  ' if ok else '  HATA') + ' ' + ad + (f'  [{detay}]' if detay else ''))


def main():
    anon = create_client(URL, ANON)
    admin = create_client(URL, SERVICE)

    # 1. Olmayan adres: hesap acilmamali, otp_disabled donmeli.
    hata = None
    try:
        anon.auth.sign_in_with_otp({'email': OLMAYAN, 'options': {'should_create_user': False}})
    except Exception as e:  # noqa: BLE001
        hata = e
    kod = getattr(hata, 'code', None) or ''
    mesaj = str(hata) if hata else ''
    kontrol('olmayan adres REDDEDILIYOR', hata is not None, mesaj[:80])
    kontrol('hata kodu otp_disabled', kod == 'otp_disabled' or 'not allowed' in mesaj.lower(), kod or mesaj[:60])

    var = admin.auth.admin.list_users()
    acilmis = any((u.email or '').lower() == OLMAYAN for u in var)
    kontrol('olmayan adrese HESAP ACILMADI', not acilmis)

    # 2. Gercek hesap: "hesap var" kapisi GECILMELI (otp_disabled
    # donmemeli). Test hesaplari `.test` uzantili ve Supabase'in posta
    # katmani o uzantiya gondermeyi REDDEDIYOR ("Email address ... is
    # invalid") - bu, kapinin gecildigini ve isin POSTA asamasina
    # ulastigini gosterir. Postanin kendisi gercek bir adresle
    # 2026-09-02'de olculmustu (auth_logs mail.send / magic_link);
    # gercek kullanicilara buradan posta atilmiyor.
    hata = None
    try:
        anon.auth.sign_in_with_otp({'email': GERCEK, 'options': {'should_create_user': False}})
    except Exception as e:  # noqa: BLE001
        hata = e
    kod = getattr(hata, 'code', None) or ''
    mesaj = str(hata) if hata else ''
    kontrol(
        'gercek hesapta "hesap var" kapisi GECILDI (otp_disabled degil)',
        kod != 'otp_disabled' and 'not allowed' not in mesaj.lower(),
        mesaj[:80] or 'posta kabul edildi',
    )

    # 3. updateUser bir oturumda calisiyor mu (ayni sifreyle - degismiyor).
    oturum = anon.auth.sign_in_with_password({'email': GERCEK, 'password': TEST_SIFRE})
    kontrol('parola oturumu acildi', oturum.session is not None)
    hata = None
    try:
        anon.auth.update_user({'password': TEST_SIFRE})
    except Exception as e:  # noqa: BLE001
        hata = e
    # "same password" reddi de ayarin ACIK olmadigini gosterir; asil
    # korkulan sey reauthentication istegi (secure password change).
    mesaj = str(hata).lower() if hata else ''
    kontrol(
        'updateUser reauthentication ISTEMIYOR',
        hata is None or 'different' in mesaj or 'same' in mesaj,
        mesaj[:80],
    )
    anon.auth.sign_out()

    print()
    print(f'{sum(sonuc)}/{len(sonuc)} dogrulama gecti')
    sys.exit(0 if all(sonuc) else 1)


if __name__ == '__main__':
    main()
