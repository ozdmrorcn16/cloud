"""Eski telefon test hesaplarina E-POSTA ekler.

Kayit/giris 2026-09-01'de e-postaya tasindi; telefonla acilmis test
hesaplarinin e-postasi olmadigi icin GIRIS EKRANINDAN ULASILAMAZ
haldeydiler. Buradaki adresler `.test` uzantili: o uzanti IANA
tarafindan rezerve, yani hicbir zaman gercek birine ait olamaz ve
yanlislikla birine posta gitmez.
"""
import os
from supabase import create_client

URL = os.environ['EXPO_PUBLIC_SUPABASE_URL']
y = create_client(URL, os.environ['SUPABASE_SERVICE_ROLE_KEY'])
anon = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']

ESLEME = {
    '905550000000': 'test0@slooin.test',
    '905550000001': 'test1@slooin.test',
    '905550000002': 'test2@slooin.test',
}

kullanicilar = y.auth.admin.list_users()
for k in kullanicilar:
    tel = (k.phone or '').lstrip('+')
    if tel in ESLEME and not k.email:
        y.auth.admin.update_user_by_id(k.id, {
            'email': ESLEME[tel],
            'email_confirm': True,
        })
        print(f'{tel} -> {ESLEME[tel]}')

print('\n--- GERCEK GIRIS DENEMESI ---')
for adres in ESLEME.values():
    sb = create_client(URL, anon)
    try:
        sb.auth.sign_in_with_password({'email': adres, 'password': 'test1234'})
        print(f'  OK   {adres} + test1234 ile giris yapildi')
    except Exception as e:
        print(f'  HATA {adres}: {str(e)[:70]}')
