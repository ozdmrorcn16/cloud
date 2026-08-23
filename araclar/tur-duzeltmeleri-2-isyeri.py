"""Ikinci dalga: KONUT / IS YERI / FABRIKA ayrimi.

Kullanicinin istegi: "konutlari is yerleri fabrikalari bunlarin hepsi cok
iyi ayrilmali dogru turu gostermeli".

Denetimde ortaya cikan durum: `Fabrika`, `Sanayi sitesi` ve `İş merkezi`
diye bir tur HIC YOKTU. Sonuc olarak fabrika adli ~900 kayit 20 ayri
ture dagilmisti - 86'si Restoran, 82'si Kafe, 13'u Bar gorunuyordu.
Ayrica konut `Site` turunun icinde 183 TICARI site duruyordu
("Sanayi Sitesi", "Mobilyacilar Sitesi", "Toptancilar Sitesi") - bunlar
konut degil is yeri.

SIRA ONEMLI: once fabrika, sonra sanayi sitesi, sonra is merkezi.
"Organize Sanayi Bolgesi ... Fabrikasi" gibi adlar iki kalibi birden
tasiyor; en spesifik olan once calismali.

YANLIS POZITIFE KARSI (kullanicinin uyarisi: "sadece sonundaki kelime
bazen yaniltici olabilir"):
 - "Fabrika Satis Magazasi" / "fabrika outlet" bir fabrika DEGIL,
   magazadir. Dislandi.
 - "Bira fabrikasi" ve "Sarap fabrikasi" zaten kendi turlerinde ve
   gezilebilir yerler; dislandi.
 - "Plaza" bir is merkezi olabilir ama "Plaza Cafe" kafedir; yemek
   sinyali tasiyanlar dislandi.
 - Sanayi sitesi ICINDEKI dukkan ve kafeler kendi turlerinde kalmali;
   yalnizca sitenin KENDISI tasiniyor, bu yuzden kaynak tur listesi
   dar tutuldu.
"""

import os
import sys
import time

from supabase import create_client

YEMEK = (r'kafe|cafe|restoran|restaurant|lokanta|kebap|pide|lahmacun|'
         r'ocakbas|izgara|mangal|kofte|sofra|grill|bufe|pastane|'
         r'firin|borek|corba|doner|pizza|burger')

# Bu turlerde bir "fabrika"/"is merkezi" adi gorursek o kayit gercekten
# yanlis siniflandirilmis demektir. Yeme-icme turleri de listede, cunku
# denetim orada 200'den fazla fabrika buldu.
GENIS = ['Alışveriş', 'AVM', 'Site', 'Tarihi yer', 'Kamu kurumu',
         'Kamu hizmeti', 'Market', 'Süpermarket', 'Bakkal', 'Mobilyacı',
         'Yapı marketi', 'Toplum merkezi', 'Otel', 'Konaklama',
         'Kafe', 'Restoran', 'Bar', 'Fast food', 'Steakhouse',
         'Ulaşım noktası', 'Semt pazarı', 'Doğal alan', 'Park',
         'Meydan', 'Apartman', 'Rezidans', 'Kampüs binası',
         'Ev eşyası mağazası', 'Giyim mağazası', 'Çarşı']

KURALLAR = [
    # --- FABRIKA / URETIM ------------------------------------------
    ('Fabrika ve uretim tesisi',
     GENIS, None,
     r'(^|[[:space:]])(fabrikasi|fabrika|imalathane|imalathanesi|imalat|'
     r'uretim tesisi|tersane|tersanesi|dokumhane|rafineri|rafinerisi)([[:space:]]|$)',
     # Fabrika satis magazasi bir magazadir; bira/sarap fabrikasi zaten
     # gezilebilir bir yer ve kendi turunde duruyor.
     r'fabrika satis|fabrika outlet|fabrikasi satis|outlet|'
     r'bira fabrikasi|sarap fabrikasi|magazasi',
     'Fabrika'),

    ('Depo/antrepo/silo',
     GENIS, None,
     r'(^|[[:space:]])(deposu|antrepo|antreposu|silosu|soguk hava deposu)([[:space:]]|$)',
     r'magaza|satis|market', 'Depo'),

    # --- SANAYI / TICARI SITE --------------------------------------
    # Konut sitesinden ayrilmasi gereken grup. "Sitesi" kelimesi burada
    # konut anlamina GELMIYOR.
    ('Sanayi ve organize sanayi bolgesi',
     GENIS + ['Otopark', 'Benzin istasyonu'], None,
     r'(sanayi sitesi|sanayi bolgesi|organize sanayi|(^|[[:space:]])osb([[:space:]]|$)|'
     r'kucuk sanayi|sanayi carsisi|is yeri sitesi)',
     YEMEK, 'Sanayi sitesi'),

    ('Meslek grubu sitesi (toptanci, galerici, mobilyaci...)',
     ['Site', 'Apartman', 'Rezidans', 'Tarihi yer', 'Alışveriş'], None,
     r'(toptancilar sitesi|galericiler sitesi|mobilyacilar sitesi|'
     r'oto sanayi|otogaleri|sanayicileri sitesi|marangozlar sitesi|'
     r'demirciler sitesi|keresteciler sitesi|dokumaci sitesi)',
     YEMEK, 'Sanayi sitesi'),

    # --- IS MERKEZI / OFIS -----------------------------------------
    ('Is merkezi, plaza, is hani',
     GENIS, None,
     r'(^|[[:space:]])(is merkezi|ismerkezi|plaza|plazasi|is hani|ishani|'
     r'business center|ofis blogu|is blogu)([[:space:]]|$)',
     # "Plaza Cafe" kafedir, "Plaza Otel" oteldir.
     YEMEK + r'|otel|hotel|avm|alisveris merkezi|residence|rezidans',
     'İş merkezi'),
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
        # ONEMLI: kaynak turler TEK TEK isleniyor, dizi olarak degil.
        # 30 turluk bir dizi yuz binlerce satiri tarattirip zaman
        # asimina sokuyordu; tur basina cagri her seferinde indeksi
        # kullaniyor ve saniyenin altinda bitiyor.
        for tur in (turler or [None]):
            parca = PARCA
            while True:
                try:
                    sonuc = supabase.rpc('mekan_turunu_duzelt', {
                        'p_kaynak_turler': [tur] if tur else None,
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
                    print(f'  ATLANDI  {aciklama} / {tur}: {hata}', flush=True)
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
