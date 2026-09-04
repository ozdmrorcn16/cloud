"""Profil olusturma ekranini gorebilmek icin PROFILSIZ bir test hesabi acar.

O ekran yalnizca "oturumu var ama profili yok" durumunda gorunuyor;
mevcut test hesaplarinin hepsinin profili oldugu icin onlarla ekrana
ulasilamiyor.

Hesap idempotent: varsa yeniden olusturulmuyor, yalnizca profil satiri
olmadigi dogrulaniyor. E-posta uzantisi `.test` - IANA tarafindan
rezerve, yani gercek kimseye posta gitmez.

    python araclar/profilsiz-test-hesabi.py     # mobil/.env yuklu kabuk
"""

import os
import sys

try:
    from supabase import create_client
except ImportError:
    sys.exit('supabase paketi yok: pip install supabase')

EPOSTA = 'profilsiz@slooin.test'

url = os.environ.get('EXPO_PUBLIC_SUPABASE_URL')
anahtar = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
sifre = os.environ.get('TEST_HESAP_SIFRESI')
if not (url and anahtar and sifre):
    sys.exit('EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ve '
             'TEST_HESAP_SIFRESI tanimli olmali (mobil/.env).')

istemci = create_client(url, anahtar)

# Var mi?
mevcut = None
sayfa = 1
while True:
    liste = istemci.auth.admin.list_users(page=sayfa, per_page=200)
    if not liste:
        break
    for k in liste:
        if (k.email or '').lower() == EPOSTA:
            mevcut = k
            break
    if mevcut or len(liste) < 200:
        break
    sayfa += 1

if mevcut:
    print(f'hesap zaten var: {EPOSTA} ({mevcut.id})')
    kullanici_id = mevcut.id
else:
    olusan = istemci.auth.admin.create_user({
        'email': EPOSTA,
        'password': sifre,
        'email_confirm': True,
    })
    kullanici_id = olusan.user.id
    print(f'hesap acildi: {EPOSTA} ({kullanici_id})')

# Profil satiri OLMAMALI - ekranin gorunme sarti bu.
profil = istemci.table('profiller').select('id').eq('id', kullanici_id).execute()
if profil.data:
    istemci.table('profiller').delete().eq('id', kullanici_id).execute()
    print('profil satiri silindi (ekran ancak profilsizken gorunuyor)')
else:
    print('profil satiri yok - dogru durum')

print(f'\ngiris: {EPOSTA} / <TEST_HESAP_SIFRESI>')
