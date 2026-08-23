"""Ucuncu dalga: 'Tarihi yer' turunun temizligi.

Kullanici uygulamada gordu ve bildirdi: "Yakininda" listesindeki bes
kaydin besi de "Tarihi yer" gorunuyordu - "Hasanaga Mahallesi" (mahalle),
"Gold Life Butik Evleri", "The Tower", "Garden Life", "Naturel Park"
(konut projeleri). Hicbiri tarihi yer degil.

KOK NEDEN: Overture'in `landmark_and_historical_building` kategorisi bir
COP KUTUSU. 14.551 kaydin dagilimi olculdu:
    adinda tarihi sinyal var   2.172  (%15)
    toponim (mahalle/koy/cadde) 1.532
    konut/ticari sinyali        1.778
    hicbir sinyal yok           9.069  (%62)
30 kayitlik rastgele orneklemde belirsiz grubun yalnizca 3'u gercekten
tarihi/gezilebilir cikti (Zindan Magarasi, Av Kosku, Vespasian Fountain);
geri kalani koy adi, "Mah." kisaltmasi ve konut projesiydi
("Leo Genesis", "Akasya 15", "Gama Konut Vilalari").

YAKLASIM DEGISIYOR: kara liste degil BEYAZ LISTE. Bu kategoride bir
kaydin 'Tarihi yer' kalmasi icin adinda gercek bir tarihi/dogal isaret
BULUNMASI gerekir. Gerekce: kategori guvenilmez oldugu icin "aksi
ispatlanana kadar tarihi" varsayimi yanlis yonde calisiyor - kullaniciya
yanlis tur gostermek, hic gostermemekten kotu (kullanicinin citasi:
"yanlis bir tur uygulamamizi cok kotu gosterir").

Sinyal tasimayanlar SILINMIYOR, 'yer-degil' yapiliyor; karar geri
alinabilir kalsin diye.
"""

import os
import sys
import time

from supabase import create_client

# Adinda bunlardan biri gecen kayit gercekten gezilebilir bir yerdir.
# Dogal olusumlar da listede: magara, selale, kaya - orneklemde bu
# sinifta gercek kayitlar cikti ve beyaz liste onlari korumali.
TARIHI_SINYAL = (
    r'(camii?|camisi|mescid|turbe|kale|kalesi|hani([[:space:]]|$)|'
    r'kervansaray|hamam|kopru|muze|anit|oren|hoyuk|saray|kasri|kilise|'
    r'manastir|sur(lari)?([[:space:]]|$)|cesme|medrese|tarihi|antik|'
    r'tumulus|sehitlik|bedesten|arasta|hisar|tabya|yali|konagi|kulesi|'
    r'kule([[:space:]]|$)|harabe|sarnic|imaret|kumbet|zaviye|dergah|'
    r'namazgah|magara|magarasi|selale|kayaliklari|kosk|kosku|fener|'
    r'feneri|adasi|kanyon|vadisi|krater|obruk|ada([[:space:]]|$)|'
    r'fountain|castle|mosque|church|ruins|ancient)'
)

TOPONIM = (r'(^|[[:space:]])(mahallesi|mahalle|mah\.|mh\.|koyu|koy|'
           r'caddesi|cad\.|sokagi|sokak|sk\.|bulvari|mevkii|kasabasi)'
           r'([[:space:]]|$)')

KONUT = (r'(evleri|sitesi|konutlari|konut|rezidans|residence|tower|'
         r'villalari|villa|bloklari|apartmani|yapi|insaat|emlak|'
         r'gayrimenkul|toki|santiyesi|life|garden|city|plaza)')

LANDMARK = ['landmark_and_historical_building']
EMLAK = ['home_developer', 'construction_services', 'real_estate_agent',
         'real_estate_service', 'contractor']

KURALLAR = [
    # --- Once kategorisi zaten emlak olanlar: ad'a bakmaya gerek yok
    ('Tarihi yer, kategorisi emlak/insaat olanlar',
     ['Tarihi yer'], EMLAK, None, TARIHI_SINYAL, 'Site'),

    # --- landmark cop kutusu: SIRA ONEMLI, ozelden genele
    # 1) Toponim (mahalle/koy/cadde adi) - mekan degil
    ('Tarihi yer, toponim adi',
     ['Tarihi yer'], LANDMARK, TOPONIM, TARIHI_SINYAL, 'yer-degil'),

    # 2) Konut/ticari proje adi
    ('Tarihi yer, konut/ticari proje adi',
     ['Tarihi yer'], LANDMARK, KONUT, TARIHI_SINYAL, 'Site'),

    # 3) Geriye kalan ve hicbir tarihi sinyal tasimayanlar.
    #    Orneklemde bu grubun ~%90'i mekan bile degildi.
    ('Tarihi yer, hicbir tarihi sinyal yok',
     ['Tarihi yer'], LANDMARK, None, TARIHI_SINYAL, 'yer-degil'),

    # --- Diger kategoriler kendi dogru turlerine
    ('Tarihi yer, aslinda kilise/katedral',
     ['Tarihi yer'], ['church_cathedral'], None, None, 'İbadet yeri'),
    ('Tarihi yer, aslinda kopru',
     ['Tarihi yer'], ['bridge'], None, TARIHI_SINYAL, 'Ulaşım noktası'),
    ('Tarihi yer, aslinda organizasyon firmasi',
     ['Tarihi yer'], ['party_and_event_planning'], None, None, 'Düğün salonu'),
    ('Tarihi yer, aslinda seyahat acentesi',
     ['Tarihi yer'], ['travel_services'], None, None, 'Seyahat acentesi'),
    ('Tarihi yer, aslinda ciftlik',
     ['Tarihi yer'], ['farm'], None, TARIHI_SINYAL, 'yer-degil'),
]

PARCA = 400


def main():
    supabase = create_client(
        os.environ['EXPO_PUBLIC_SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    )

    genel = 0
    for aciklama, turler, kategoriler, desen, haric, hedef in KURALLAR:
        toplam = 0
        parca = PARCA
        while True:
            try:
                sonuc = supabase.rpc('mekan_turunu_duzelt', {
                    'p_kaynak_turler': turler,
                    'p_kategoriler': kategoriler,
                    'p_desen': desen,
                    'p_haric': haric,
                    'p_hedef': hedef,
                    'p_limit': parca,
                    'p_kural': aciklama,
                }).execute()
            except Exception as hata:
                if '57014' in str(hata) or 'timeout' in str(hata).lower():
                    if parca > 25:
                        parca = max(25, parca // 4)
                        time.sleep(1)
                        continue
                print(f'  ATLANDI  {aciklama}: {hata}', flush=True)
                break
            adet = sonuc.data or 0
            toplam += adet
            if adet < parca:
                break
            time.sleep(0.05)
        genel += toplam
        print(f'{toplam:>7}  {aciklama} -> {hedef}', flush=True)

    print(f'\nTOPLAM: {genel} kayit')


if __name__ == '__main__':
    sys.exit(main())
