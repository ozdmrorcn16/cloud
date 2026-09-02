"""BEGENI ve YORUM - canli dogrulama."""
import os, sys
from supabase import create_client
URL, ANON = os.environ['EXPO_PUBLIC_SUPABASE_URL'], os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
y = create_client(URL, os.environ['SUPABASE_SERVICE_ROLE_KEY'])

gecti = kaldi = 0
def kontrol(ad, sonuc, ayrinti=''):
    global gecti, kaldi
    if sonuc: 
        globals()['gecti'] = gecti + 1; print(f'  OK   {ad}')
    else:
        globals()['kaldi'] = kaldi + 1; print(f'  HATA {ad}  {ayrinti}')

def giris(e):
    sb = create_client(URL, ANON)
    sb.auth.sign_in_with_password({'email': e, 'password': 'test1234'})
    return sb, sb.auth.get_user().user.id

a, a_id = giris('test0@slooin.test')   # paylasim sahibi
b, b_id = giris('test1@slooin.test')   # baskasi

mekan = y.table('mekanlar').select('id').limit(1).execute().data[0]['id']
y.table('check_inler').delete().eq('kullanici_id', a_id).eq('not_metni', 'etkilesim testi').execute()
ci = y.table('check_inler').insert({
    'kullanici_id': a_id, 'mekan_id': mekan, 'not_metni': 'etkilesim testi',
    'gorunurluk': 'herkese_acik', 'bulunurluk': 'herkese_acik',
    'kullanici_adi': 'byorcun', 'bitis_zamani': '2020-01-01T00:00:00Z', 'konum': None,
}).execute().data[0]['id']

# --- BEGENI ---
b.table('begeniler').insert({'check_in_id': ci, 'kullanici_id': b_id}).execute()
ozet = b.rpc('etkilesim_ozetleri', {'p_check_in_ids': [ci]}).execute().data[0]
kontrol('begeni sayisi 1', ozet['begeni'] == 1, str(ozet))
kontrol('begendim = true', ozet['begendim'] is True)
ozet_a = a.rpc('etkilesim_ozetleri', {'p_check_in_ids': [ci]}).execute().data[0]
kontrol('sahibi icin begendim = false', ozet_a['begendim'] is False)

b.table('begeniler').delete().eq('check_in_id', ci).eq('kullanici_id', b_id).execute()
kontrol('begeni kaldirilinca sayi 0',
        b.rpc('etkilesim_ozetleri', {'p_check_in_ids': [ci]}).execute().data[0]['begeni'] == 0)

# --- YORUM ---
b.table('yorumlar').insert({'check_in_id': ci, 'kullanici_id': b_id, 'metin': 'guzel yer'}).execute()
yorumlar = a.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data
kontrol('yorum listeleniyor, yazar adiyla',
        len(yorumlar) == 1 and yorumlar[0]['metin'] == 'guzel yer' and yorumlar[0]['kullanici_adi'],
        str(yorumlar))
kontrol('PAYLASIM SAHIBI baskasinin yorumunu silebiliyor', yorumlar[0]['silebilir_mi'] is True)

# Bos yorum reddedilmeli
try:
    b.table('yorumlar').insert({'check_in_id': ci, 'kullanici_id': b_id, 'metin': '   '}).execute()
    kontrol('bos yorum reddedilir', False, 'gecti!')
except Exception:
    kontrol('bos yorum reddedilir', True)

# --- SIKAYET: ANINDA GIZLE ---
yorum_id = yorumlar[0]['id']
a.rpc('yorumu_sikayet_et', {'p_yorum_id': yorum_id, 'p_sebep': 'taciz'}).execute()
kontrol('sikayet sonrasi yorum HERKESTEN gizli',
        len(a.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data) == 0)
kontrol('yazani da goremiyor',
        len(b.rpc('yorumlari_getir', {'p_check_in_id': ci}).execute().data) == 0)
kontrol('sikayet kaydi olustu',
        len(y.table('sikayetler').select('id').eq('hedef_id', yorum_id).eq('hedef_tur', 'yorum').execute().data) == 1)

# Ikinci sikayet yeni kayit ACMAMALI
a.rpc('yorumu_sikayet_et', {'p_yorum_id': yorum_id, 'p_sebep': 'taciz'}).execute()
kontrol('ayni kisi ayni yorumu ikinci kez sikayet edince YENI KAYIT olmuyor',
        len(y.table('sikayetler').select('id').eq('hedef_id', yorum_id).eq('hedef_tur', 'yorum').execute().data) == 1)

# --- PAYLASIM SAHIBI SILME ---
y.table('yorumlar').update({'sikayet_gizli': False}).eq('id', yorum_id).execute()
a.table('yorumlar').delete().eq('id', yorum_id).execute()
kontrol('paylasim sahibi baskasinin yorumunu SILDI',
        len(y.table('yorumlar').select('id').eq('id', yorum_id).execute().data) == 0)

# Temizlik
y.table('sikayetler').delete().eq('hedef_id', yorum_id).execute()
y.table('check_inler').delete().eq('id', ci).execute()
print(f'\nSONUC: {gecti} gecti, {kaldi} kaldi')
sys.exit(1 if kaldi else 0)
