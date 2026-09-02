"""PROFIL GIZLILIGI - canli dogrulama.

Kural (kullanicinin karari 2026-09-02): profil gizliyken ad/kullanici
adi/fotograf GORUNUR, paylasimlar (anilar ve check-in'ler) yalnizca
arkadaslara gorunur.
"""
import os, sys
from supabase import create_client

URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
y = create_client(URL, os.environ['SUPABASE_SERVICE_ROLE_KEY'])

gecti = kaldi = 0
def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc:
        gecti += 1; print(f'  OK   {ad}')
    else:
        kaldi += 1; print(f'  HATA {ad}  {ayrinti}')

def giris(tel):
    sb = create_client(URL, ANON)
    sb.auth.sign_in_with_password({'email': tel, 'password': 'test1234'})
    return sb, sb.auth.get_user().user.id

a, a_id = giris('test0@slooin.test')   # profili gizlenecek olan
b, b_id = giris('test1@slooin.test')   # yabanci

# Aralarinda bag OLMASIN
for x, z in ((a_id, b_id), (b_id, a_id)):
    y.table('takipler').delete().eq('takip_eden_id', x).eq('takip_edilen_id', z).execute()

# A'nin HERKESE ACIK bir anisi olsun
y.table('check_inler').delete().eq('kullanici_id', a_id).eq('not_metni', 'gizlilik testi').execute()
mekan = y.table('mekanlar').select('id').limit(1).execute().data[0]['id']
y.table('check_inler').insert({
    'kullanici_id': a_id, 'mekan_id': mekan, 'not_metni': 'gizlilik testi',
    'gorunurluk': 'herkese_acik', 'bulunurluk': 'herkese_acik',
    'kullanici_adi': 'byorcun',
    'bitis_zamani': '2020-01-01T00:00:00Z', 'konum': None,
}).execute()

def b_goruyor_mu():
    d = b.table('check_inler').select('id').eq('kullanici_id', a_id).eq('not_metni', 'gizlilik testi').execute().data
    return len(d) > 0

def profil():
    return b.rpc('baskasinin_profili', {'p_kullanici_id': a_id}).execute().data

# 1) Profil ACIKKEN
y.table('profiller').update({'profil_gizli': False}).eq('id', a_id).execute()
kontrol('profil acikken yabanci aniyi GORUYOR', b_goruyor_mu())
p = profil()
kontrol('profil acikken ad gorunuyor', bool(p) and p[0]['ad'] is not None)
kontrol('profil acikken profil_gizli = false', bool(p) and p[0]['profil_gizli'] is False)

# 2) Profil GIZLIYKEN
y.table('profiller').update({'profil_gizli': True}).eq('id', a_id).execute()
kontrol('profil gizliyken yabanci aniyi GOREMIYOR', not b_goruyor_mu())
p = profil()
kontrol('profil gizliyken AD YINE GORUNUYOR', bool(p) and p[0]['ad'] is not None)
kontrol('profil gizliyken kullanici adi gorunuyor', bool(p) and p[0]['kullanici_adi'] is not None)
kontrol('profil gizliyken profil_gizli = true', bool(p) and p[0]['profil_gizli'] is True)

# 3) ARKADAS olunca gizli profil yine gorunur
for x, z in ((a_id, b_id), (b_id, a_id)):
    y.table('takipler').insert({'takip_eden_id': x, 'takip_edilen_id': z, 'durum': 'kabul'}).execute()
kontrol('gizli profilin ARKADASI aniyi goruyor', b_goruyor_mu())

# 4) Kisi kendi paylasimini her zaman gorur
kendi = a.table('check_inler').select('id').eq('kullanici_id', a_id).eq('not_metni', 'gizlilik testi').execute().data
kontrol('kisi kendi paylasimini gizliyken de goruyor', len(kendi) > 0)

# Temizlik
y.table('profiller').update({'profil_gizli': False}).eq('id', a_id).execute()
y.table('check_inler').delete().eq('kullanici_id', a_id).eq('not_metni', 'gizlilik testi').execute()
for x, z in ((a_id, b_id), (b_id, a_id)):
    y.table('takipler').delete().eq('takip_eden_id', x).eq('takip_edilen_id', z).execute()

print(f'\nSONUC: {gecti} gecti, {kaldi} kaldi')
sys.exit(1 if kaldi else 0)
