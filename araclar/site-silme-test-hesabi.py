"""Site silme testi icin atilabilir hesap acar.

Idempotent DEGIL: her kosumda YENI bir hesap acar, cunku testin
kendisi hesabi siliyor. Cikti olarak e-posta ve parolayi yazar.

`.test` uzanti IANA tarafindan rezerve; hicbir zaman gercek birine
ait olamaz, yani yanlislikla kimseye posta gitmez.
"""

import os
import secrets
import sys

import httpx

URL = os.environ["EXPO_PUBLIC_SUPABASE_URL"]
SERVIS = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

eposta = "silme-testi-%s@slooin.test" % secrets.token_hex(4)
parola = secrets.token_urlsafe(16)

yanit = httpx.post(
    "%s/auth/v1/admin/users" % URL,
    headers={"apikey": SERVIS, "Authorization": "Bearer %s" % SERVIS},
    json={"email": eposta, "password": parola, "email_confirm": True},
    timeout=30,
)

if yanit.status_code >= 300:
    sys.exit("hesap acilamadi: %s %s" % (yanit.status_code, yanit.text))

print(eposta)
print(parola)
