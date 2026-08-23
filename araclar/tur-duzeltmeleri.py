"""Mekan turlerinin toplu denetim duzeltmesi.

KAYNAK: alti bagimsiz denetim ajaninin 2026-08-23'te canli veritabanina
karsi olctugu bulgular. Her kural SQL ile sayilmis ve ornek uzerinde
yanlis-pozitif testinden gecmistir.

UC KOK NEDEN vardi:
 1. lower('İ') PostgreSQL'de 'i' + U+0307 uretiyor; `~*` ve `ilike`
    Turkce buyuk İ tasiyan adlari GORMUYOR. Butun ad kurallari bu yuzden
    yarim calisiyordu. Cozum: tr_kucuk() (bkz. 20260823140000).
 2. kategori-eslemesi.py icindeki duzelt(), ana kategori acik alansa ve
    alternatiflerde konaklama sinyali varsa ISME HIC BAKMADAN oteli
    seciyordu; "Fatih Mahallesi" bu yuzden Otel oldu.
 3. ESLEME sozlugunde olu anahtarlar vardi (police_station yerine
    Overture police_department yolluyor); Karakol ve Itfaiye 0 kayitti.

DESENLER ASCII YAZILIR. tr_kucuk() Turkce harfleri ASCII'ye cevirdigi
icin desende 's' yazmak 'ş'yi de yakalar. [iİıI] gibi varyantlara
gerek YOKTUR - bu, kurallari hem kisaltiyor hem hatasizlastiriyor.

'yer-degil' TURU: check-in yapilamayacak kayitlar (yol, koy adi, kargo
firmasi, parke bayii) SILINMEZ, bu ture tasinir. Okuma yollari onu
'test' gibi filtreler. Silme geri alinamaz, bu geri alinabilir.
"""

import os
import sys
import time

from supabase import create_client

# Ortak dislama parcalari. Bir kalip eslesmesi tek basina kanit degildir;
# kullanicinin uyarisi: "Sadece sonundaki kelime bazen yaniltici olabilir".
KONAKLAMA = r'otel|hotel|pansiyon|motel|hostel|tatil|resort|apart|suit|butik|inn|lodge|guest|konaklama'
KONUT = r'sitesi|konutlari|bloklari|apartman|apt\.|rezidans|residence|evleri|konaklari|villalari|toki'
YEMEK = r'kafe|cafe|restoran|restaurant|lokanta|kebap|pide|lahmacun|ocakbas|izgara|mangal|kofte|sofra|grill|bufe|pastane|firin|salon'

# (aciklama, kaynak_turler, kategoriler, desen, haric, hedef)
KURALLAR = [
    # ---------------------------------------------------------------
    # A. MEKAN DEGIL -> 'yer-degil' (silinmez, gizlenir)
    # ---------------------------------------------------------------
    ('Yol/otoyol/karayolu parcasi',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]/-])(yolu|yolunda|karayolu|karayolunda|otoyolu|otobani?|cevre[[:space:]]yolu)([[:space:]]|$|\.)',
     r'dinlenme[[:space:]]tesis|taksi|petrol|benzin|otogar|market|restoran|lokanta|seyahat|turizm|kargo|nakliyat',
     'yer-degil'),

    ('Kargo/nakliyat/lojistik firmasi',
     ['Ulaşım noktası'], None,
     r'kargo|nakliyat|nakliye|lojistik|tasimacilik',
     r'otogar|terminal|istasyon',
     'yer-degil'),

    ('Meydan turunde cadde/sokak/mahalle/koy adi',
     ['Meydan'], None,
     r'(^|[[:space:]])(caddesi|cad\.|cd\.|sokak|sokagi|sk\.|bulvari?|kavsagi|mahallesi|mah\.|mh\.|koyu|yaylasi)([[:space:]]|$)',
     r'meydan|square|plaza',
     'yer-degil'),

    ('Dag turunde koy adi',
     ['Dağ'], None,
     r'(^|[[:space:]])(koyu|koy)([[:space:]]|$)',
     r'dagi?([[:space:]]|$)|daglar|tepe|zirve|yayla|mount|vadi|kanyon|selale|gol',
     'yer-degil'),

    ('Dag turunde mahalle adi',
     ['Dağ'], None,
     r'(^|[[:space:]])(mahallesi|mah\.|mh\.)([[:space:]]|$)',
     r'dagi?([[:space:]]|$)|daglar|tepe|zirve|yayla',
     'yer-degil'),

    # "PARKE" zemin kaplama firmasi "Park" sanilmis - Turkce tuzagi.
    ('Park turunde parke (zemin) firmasi',
     ['Park'], None, r'parke', None, 'yer-degil'),

    ('Park turunde konut sitesi',
     ['Park'], None,
     r'(^|[[:space:]])(sitesi|konutlari|villalari?|rezidans|apartmani?|residence)([[:space:]]|$)',
     r'parki([[:space:]]|$)|bahcesi|mesire|yesil[[:space:]]alan|oyun[[:space:]]alan',
     'yer-degil'),

    ('Park turunde oto yikama/lastikci',
     ['Park'], None,
     r'oto[[:space:]]?yikama|detailing|lastikci|oto[[:space:]]servis',
     r'parki([[:space:]]|$)|bahcesi', 'yer-degil'),

    ('Park turunde emlak/insaat',
     ['Park'], None,
     r'emlak|gayrimenkul|insaat|muteahhit',
     r'parki([[:space:]]|$)|bahcesi', 'yer-degil'),

    ('Cami turunde mahalle/koy adi',
     ['Cami'], None,
     r'(^|[[:space:]])(mahallesi|mah\.|mh\.|koyu)([[:space:]]|$)',
     r'cami|mescit|mescidi|kursu|turbe', 'yer-degil'),

    # Ayni telefon numarasi onlarca ilcede tekrar ediyor: fiziksel mekan
    # degil, SEO ilani. Telefon sarti kritik - onsuz gercek spotcu
    # dukkanlari da silinir.
    ('Ikinci el esya spam ilani (adinda telefon)',
     ['Ev eşyası mağazası'], None,
     r'(ikinci el|2\.? ?el|spotcu|eski esya|spot esya).*0[0-9][0-9][0-9]',
     None, 'yer-degil'),

    ('Canli muzik turunde organizasyon/prodüksiyon/ses-isik',
     ['Canlı müzik'], None,
     r'organizasyon|produksiyon|menajerlik|ses[[:space:]]?ve[[:space:]]?isik|muzik[[:space:]]market|muzik[[:space:]]aletleri',
     r'sahne|konser|gazino|kulup', 'yer-degil'),

    ('Canli muzik turunde dernek/vakif/kooperatif',
     ['Canlı müzik'], None,
     r'dernegi|dernek|vakfi|kooperatif', None, 'yer-degil'),

    # EN BUYUK TEK KUSUR: duzelt() override'i yuzunden koy/mahalle
    # adlari Otel oldu. Kategorisi dogal alan olanlar asagida kendi
    # turune donuyor; burada kategorisi de yardim etmeyenler var.
    ('Otel/Konaklama turunde koy-mahalle-mevki adi',
     ['Otel', 'Konaklama', 'Tatil köyü', 'Hostel', 'Pansiyon', 'Motel'], None,
     r'(^|[[:space:]])(koyu|koy|mahallesi|mahalle|mah\.|mh\.|kasabasi|deresi|tepesi|vadisi|caddesi|cad\.|sokak|sokagi)([[:space:]]|$)',
     KONAKLAMA + '|' + KONUT, 'yer-degil'),

    # ---------------------------------------------------------------
    # B. KONAKLAMA / KONUT / KAMU
    # ---------------------------------------------------------------
    ('Ogrenci yurdu',
     ['Konaklama', 'Otel', 'Tarihi yer', 'Toplum merkezi', 'Hostel',
      'Site', 'Pansiyon', 'Kampüs binası'], None,
     r'(^|[[:space:]])(yurdu|yurtlari|dormitory|kyk)([[:space:]]|$)',
     None, 'Öğrenci yurdu'),

    ('Kurum lojmanlari konut sayilir',
     ['Tarihi yer', 'Konaklama', 'Otel', 'Toplum merkezi', 'Kampüs binası'], None,
     r'lojman', None, 'Site'),

    ('Karakol/jandarma/emniyet',
     ['Otel', 'Konaklama', 'Tarihi yer', 'Toplum merkezi', 'Kampüs binası',
      'Adliye', 'Site', 'Kamu kurumu', 'Kamu hizmeti'], None,
     r'(^|[[:space:]])(kislasi|jandarma|emniyet mudurlugu|emniyet amirligi|polis merkezi|polis karakolu|karakolu|karakol)([[:space:]]|$)',
     r'polis ?evi|polisevi|jandarma ?evi|lojman', 'Karakol'),

    ('Itfaiye birimleri',
     ['Toplum merkezi', 'Konaklama', 'Tarihi yer', 'Site', 'Kamu kurumu',
      'Kamu hizmeti'], None,
     r'(^|[[:space:]])itfaiye', None, 'İtfaiye'),

    ('Cami, toplum merkezi/konaklama altinda',
     ['Toplum merkezi', 'Konaklama', 'Otel', 'Kampüs binası', 'Site'], None,
     r'(^|[[:space:]])(camii|camisi|cami|mescidi|mescit)([[:space:]]|$)',
     r'sokak|sokagi|mahallesi|caddesi', 'Cami'),

    # 18/18 ornek konut cikti.
    ('"X Villalari" konut sitesi',
     ['Tarihi yer', 'Otel', 'Konaklama', 'Tatil köyü'], None,
     r'(^|[[:space:]])villalari([[:space:]]|$)',
     r'otel|hotel|tatil|resort|kiralik|pansiyon', 'Site'),

    # Bunlarin 147'si YALNIZCA tr_kucuk sayesinde yakalaniyor.
    ('Konut deseninin İ yuzunden kacirdiklari',
     ['Tarihi yer', 'Konaklama', 'Otel'], None,
     r'(^|[[:space:]])(sitesi|konutlari|bloklari|apartmani?|apt\.?|rezidans|residence|evleri)([[:space:]]|$)|toki[[:space:]]',
     KONAKLAMA, 'Site'),

    # Tekil/cogul ayrimi kategoriyle cozuluyor: kategori=hotel olan
    # "Konaklari" kayitlari gercek butik otel, dokunulmuyor.
    ('"X Konaklari" konut projesi (emlak kategorili)',
     ['Otel'],
     ['home_developer', 'real_estate_agent', 'real_estate_service',
      'construction_services'],
     r'(^|[[:space:]])konaklari([[:space:]]|$)', None, 'Site'),

    ('Otel turunde gercekten dogal alan olanlar - plaj',
     ['Otel', 'Konaklama'], ['beach'], None, KONAKLAMA + '|' + KONUT, 'Plaj'),
    ('Otel turunde gercekten dogal alan olanlar - dag',
     ['Otel', 'Konaklama'], ['mountain'], None, KONAKLAMA + '|' + KONUT, 'Dağ'),
    ('Otel turunde gercekten dogal alan olanlar - gol',
     ['Otel', 'Konaklama'], ['lake'], None, KONAKLAMA + '|' + KONUT, 'Göl'),
    ('Otel turunde gercekten dogal alan olanlar - orman',
     ['Otel', 'Konaklama'], ['forest'], None, KONAKLAMA + '|' + KONUT, 'Orman'),
    ('Otel turunde gercekten dogal alan olanlar - park',
     ['Otel', 'Konaklama'], ['park'], None, KONAKLAMA + '|' + KONUT, 'Park'),
    ('Otel turunde gercekten dogal alan olanlar - kamp',
     ['Otel', 'Konaklama'], ['campground'], None, KONAKLAMA + '|' + KONUT, 'Kamp alanı'),

    ('Gercek otel Site gorunuyor (ters yon)',
     ['Site'], None,
     r'(^|[[:space:]])(otel|oteli|hotel|pansiyon|motel|hostel)([[:space:]]|$)',
     None, 'Otel'),

    # ---------------------------------------------------------------
    # C. EGITIM
    # ---------------------------------------------------------------
    # Overture elementary_school'u Turkiye'de HER kademeye veriyor.
    ('Lise, ilkokul gorunuyor',
     ['İlkokul', 'Okul', 'Eğitim kurumu', 'Üniversite', 'Kampüs binası'], None,
     r'(^|[[:space:]])lise',
     r'anaokul|ana okulu|anasinif|(^|[[:space:]])kres|ilkokul|ilk okul|ilkogretim|ortaokul|orta okul|universite|fakulte|yuksekokul',
     'Lise'),

    ('Ortaokul, ilkokul/lise gorunuyor',
     ['İlkokul', 'Okul', 'Eğitim kurumu', 'Üniversite', 'Lise', 'Kampüs binası'], None,
     r'ortaokul|orta okul',
     r'anaokul|ana okulu|anasinif|(^|[[:space:]])kres|ilkokul|ilk okul|ilkogretim|(^|[[:space:]])lise|universite|fakulte|yuksekokul',
     'Ortaokul'),

    ('Anaokulu/kres, ilkokul gorunuyor',
     ['İlkokul', 'Okul', 'Eğitim kurumu', 'Üniversite', 'Kampüs binası'], None,
     r'anaokul|ana okulu|anasinif|(^|[[:space:]])kres',
     r'ilkokul|ilk okul|ilkogretim|ortaokul|orta okul|(^|[[:space:]])lise|universite|fakulte|yuksekokul',
     'Anaokulu'),

    ('Ilkokul, ortaokul/anaokulu/kampus gorunuyor',
     ['Ortaokul', 'Anaokulu', 'Okul', 'Eğitim kurumu', 'Kampüs binası'], None,
     r'ilkokul|ilk okul',
     r'ortaokul|orta okul|(^|[[:space:]])lise|anaokul|universite',
     'İlkokul'),

    ('Yuksekogretim, ilkokul gorunuyor',
     ['İlkokul', 'Okul', 'Eğitim kurumu'], None,
     r'universite|fakulte|yuksekokul',
     r'anaokul|ilkokul|ilk okul|ilkogretim|ortaokul|orta okul|(^|[[:space:]])lise|cocuk universite|universiteli',
     'Üniversite'),

    ('Surucu kursu',
     ['İlkokul', 'Okul', 'Eğitim kurumu', 'Üniversite', 'Lise'], None,
     r'surucu kursu|suruculuk kursu', None, 'Sürücü kursu'),

    ('Kuran kursu/hafizlik',
     ['İlkokul', 'Anaokulu', 'Ortaokul', 'Lise', 'Üniversite', 'Okul'], None,
     r'kur.?an kursu|hafizlik', None, 'İbadet yeri'),

    ('Ozel egitim ve rehabilitasyon merkezi',
     ['İlkokul', 'Anaokulu', 'Ortaokul', 'Lise'], None,
     r'rehabilitasyon|rehabilite', r'universite|fakulte', 'Eğitim kurumu'),

    ('Psikoteknik/SRC/is makineleri kursu',
     ['Sürücü kursu'], None,
     r'psikoteknik|(^|[[:space:]])src([[:space:]]|$)|is makineleri|operatorluk',
     r'surucu', 'Eğitim kurumu'),

    # ---------------------------------------------------------------
    # D. SAGLIK  (KVKK acisindan oncelikli: yanlis saglik etiketi,
    #    kullanicinin saglik ihtiyaci oldugu cikarimini yanlis yere baglar)
    # ---------------------------------------------------------------
    ('Aile sagligi merkezi / saglik ocagi, hastane gorunuyor',
     ['Hastane', 'Eczane'], None,
     r'aile sagligi|saglik ocagi|toplum sagligi|(^|[[:space:]])asm([[:space:]]|$)',
     r'hastane|hospital|ticaret|dent|(^|[[:space:]])ecza', 'Sağlık merkezi'),

    ('Devlet/ozel hastane, saglik merkezi gorunuyor',
     ['Sağlık merkezi'], None,
     r'hastane|hospital', r'aile sagligi|saglik ocagi|toplum sagligi', 'Hastane'),

    ('Agiz-dis sagligi, hastane/saglik merkezi gorunuyor',
     ['Hastane', 'Sağlık merkezi'], None,
     r'(^|[[:space:]])dis([[:space:]]|$)|dis sagli|dis hekim|dent|ortodont|agiz ve dis',
     r'hastane|hospital|aile sagligi', 'Diş kliniği'),

    ('Eczane, hastane gorunuyor',
     ['Hastane'], None, r'(^|[[:space:]])ecza', r'hastane|hospital', 'Eczane'),

    ('Veteriner klinigi, hastane gorunuyor',
     ['Hastane'], None, r'veteriner|hayvan saglik', r'hastane|hospital', 'Veteriner'),

    ('Medikal/ortez-protez/isitme cihazi, eczane gorunuyor',
     ['Eczane'], None,
     r'medikal|ortez|protez|isitme cihaz|tibbi malzeme',
     r'(^|[[:space:]])ecza', 'Medikal malzeme'),

    ('Kozmetik zinciri/optik, eczane gorunuyor',
     ['Eczane'], None,
     r'watsons|rossmann|gratis|(^|[[:space:]])optik|gozlukcu|kozmetik',
     r'(^|[[:space:]])ecza', 'Kozmetik mağazası'),

    ('Petshop/ciftlik/mezbaha, veteriner gorunuyor',
     ['Veteriner'], None,
     r'petshop|pet shop|ciftlik|mezbaha|kurban|akvaryum|tavukcu',
     r'veteriner|klinik', 'Petshop'),

    # ---------------------------------------------------------------
    # E. KISISEL BAKIM - 'Spa' turunun %92'si spa degil
    # ---------------------------------------------------------------
    ('Hamam/kaplica, spa gorunuyor',
     ['Spa'], None,
     r'(^|[[:space:]])(hamam|hamami|hammam|turkish bath|kaplica|kaplicasi)([[:space:]]|$)',
     None, 'Hamam'),

    ('Erkek kuaforu/berber, spa gorunuyor',
     ['Spa'], None,
     r'(^|[[:space:]])(berber|barber)([[:space:]]|$)|(^|[[:space:]])(erkek|bay|mens|centilmen) *(kuaf|coiff)',
     r'(^|[[:space:]])(spa|masaj|massage|hamam|termal|kaplica|wellness|sauna)([[:space:]]|$)|(^|[[:space:]])(pet|oto|kopek|kedi)([[:space:]]|$)',
     'Berber'),

    ('Kadin/karma kuafor, spa gorunuyor',
     ['Spa'], None,
     r'(^|[[:space:]])(kuafor|kuaforu|coiffure|coiffeur|hair ?(salon|studio|design|stylist|art))',
     r'(^|[[:space:]])(spa|masaj|massage|hamam|termal|kaplica|wellness|sauna)([[:space:]]|$)|(^|[[:space:]])(pet|oto|kopek|kedi)([[:space:]]|$)|berber|barber',
     'Kuaför'),

    ('Guzellik/estetik merkezi, spa gorunuyor',
     ['Spa'], None,
     r'(^|[[:space:]])(guzellik|beauty|estetik|epilasyon|agda|cilt bakim)',
     r'(^|[[:space:]])(spa|masaj|massage|hamam|termal|kaplica|wellness|sauna)([[:space:]]|$)|kuaf|coiff|berber|barber|(^|[[:space:]])(pet|oto)([[:space:]]|$)',
     'Güzellik salonu'),

    ('Tirnak/nail salonu, spa gorunuyor',
     ['Spa'], None,
     r'(^|[[:space:]])(nail|nails|tirnak|manikur|pedikur)([[:space:]]|$)',
     r'kuaf|berber|barber|hamam|masaj', 'Tırnak bakımı'),

    ('Erkek kuaforu, Kuafor turunde',
     ['Kuaför'], None,
     r'(^|[[:space:]])(erkek|bay|mens|centilmen|barber|berber)([[:space:]]|$)',
     r'(^|[[:space:]])(bayan|kadin|women|kiz)([[:space:]]|$)', 'Berber'),

    # ---------------------------------------------------------------
    # F. TICARET
    # ---------------------------------------------------------------
    ('ATM, banka subesi gorunuyor',
     ['Banka'], None,
     r'(^|[[:space:]])(atm|bankamatik|bankomat)([[:space:]]|$)', None, 'ATM'),

    ('Kasap, market/bakkal gorunuyor',
     ['Market', 'Bakkal', 'Semt pazarı', 'Süpermarket', 'AVM'], None,
     r'(^|[[:space:]])(kasap|kasabi)([[:space:]]|$)', None, 'Kasap'),

    ('Manav, market/bakkal gorunuyor',
     ['Market', 'Bakkal', 'Semt pazarı', 'Süpermarket', 'AVM'], None,
     r'(^|[[:space:]])(manav|manavi)([[:space:]]|$)', None, 'Manav'),

    ('Sarkuteri, supermarket gorunuyor',
     ['Süpermarket', 'Semt pazarı'], None,
     r'sarkuteri|gurme|kuruyemis', r'market', 'Şarküteri'),

    ('Zincir market, bakkal gorunuyor',
     ['Bakkal'], None,
     r'(^|[[:space:]])(a101|bim|sok|migros|carrefour|carrefoursa|hakmar|tarim kredi)([[:space:]]|$)',
     None, 'Market'),

    ('Yapi/insaat malzemecisi, mobilyaci gorunuyor',
     ['Mobilyacı'], None,
     r'(^|[[:space:]])(insaat|nalbur|nalburiye|hirdavat|beton|yapi market|celik kapi|dusakabin|pvc|kereste|seramik|fayans)([[:space:]]|$)',
     r'(^|[[:space:]])(mobilya|moble|furniture)', 'Yapı marketi'),

    ('Kirtasiye/fotokopi/matbaa, kitapci gorunuyor',
     ['Kitapçı'], None,
     r'(^|[[:space:]])(kirtasiye|stationery|fotokopi|matbaa)([[:space:]]|$)',
     r'(^|[[:space:]])(kitap|kitab|book|sahaf)', 'Kırtasiye'),

    ('Hediyelik esya/cehiz/tesbih, cicekci gorunuyor',
     ['Çiçekçi'], None,
     r'hediyelik|souvenir|gift|ceyiz|tesbih|nikah',
     r'cicek|flower|florist|orkide|botanik|sera|peyzaj|bahce|gul|fidan|bitki',
     'Hediyelik eşya'),

    ('Pasaj/carsi/is hani, AVM gorunuyor',
     ['AVM'], None,
     r'(^|[[:space:]])(pasaj|pasaji|carsi|carsisi|is ?hani|ishani|bedesten|arasta)([[:space:]]|$)',
     None, 'Çarşı'),

    # ---------------------------------------------------------------
    # G. YEME-ICME
    # ---------------------------------------------------------------
    ('Kasap dukkani, steakhouse/ocakbasi gorunuyor',
     ['Steakhouse', 'Ocakbaşı', 'Restoran'], ['butcher_shop'],
     None, YEMEK, 'Kasap'),

    ('Balikci dukkani, balik restorani gorunuyor',
     ['Balık restoranı'], ['fishmonger'], None, YEMEK + '|evi', 'Market'),

    ('Gece kulubu, bar gorunuyor',
     ['Bar'], ['dance_club'], None, None, 'Gece kulübü'),

    ('Nargile kafe, kafe/bar gorunuyor',
     ['Kafe', 'Bar'], ['hookah_bar'], None, None, 'Nargile kafe'),

    ('Kiraathane/kahvehane, oyun salonu gorunuyor',
     ['Kafe'], ['arcade'], r'raathane|kahvehane|kahve oca|kahvesi', None, 'Çay evi'),

    ('Internet kafe, oyun salonu gorunuyor',
     ['Kafe'], ['arcade'],
     r'playstation|ps ?[45]|internet|oyun|game|gaming|net ?cafe', None, 'İnternet kafe'),

    ('Simit/borek/dondurma, bar/steakhouse gorunuyor',
     ['Bar', 'Steakhouse'], None,
     r'simit|borek|dondurma|pastane|tatli', None, 'Fırın'),

    ('Dugun salonu, yemek/muzik turunde',
     ['Kafe', 'Bar', 'Fast food', 'Canlı müzik', 'Park'], None,
     r'dugun salonu|nisan salonu|kina salonu|davet|balo salonu', None, 'Düğün salonu'),

    ('Giyim magazasi, bar/pub/kafe gorunuyor',
     ['Bar', 'Pub', 'Kafe'],
     ['mens_clothing_store', 'womens_clothing_store', 'boutique',
      'department_store'], None, YEMEK, 'Giyim mağazası'),

    ('Oto servis/yikama/galeri, yemek turunde',
     ['Fast food', 'Kafe', 'Bar', 'Steakhouse'],
     ['automotive_repair', 'auto_detailing', 'car_dealer'], None, YEMEK, 'Alışveriş'),

    ('Emlak/konut/insaat kaydi, yemek turunde',
     ['Kafe', 'Bar', 'Fast food', 'Steakhouse'],
     ['home_developer', 'real_estate_agent', 'real_estate_service',
      'construction_services'], None, YEMEK, 'Site'),

    ('Kopru/patika kategorisi, yemek turunde',
     ['Fast food', 'Kafe', 'Bar'], ['bridge', 'hiking_trail'], None, YEMEK, 'Ulaşım noktası'),

    # ---------------------------------------------------------------
    # H. ACIK ALAN / KULTUR / ULASIM
    # ---------------------------------------------------------------
    ('Seyahat acentesi, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(seyahat|turizm|tourism|travel|turlar)([[:space:]]|$)',
     r'otogar|terminal|durak|duragi', 'Seyahat acentesi'),

    ('Otogar, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(otogar|terminali|terminal)([[:space:]]|$)',
     r'taksi|servis|transfer|kargo|petrol|akaryakit', 'Otogar'),

    ('Tren istasyonu, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(tren istasyonu|gari|tcdd)([[:space:]]|$)',
     r'taksi|servis|kargo', 'Tren istasyonu'),

    ('Metro istasyonu, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(metro istasyonu|metro|marmaray)([[:space:]]|$)',
     r'taksi|servis|kargo|market', 'Metro istasyonu'),

    ('Havalimani, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(havalimani|havaalani|airport)([[:space:]]|$)',
     r'taksi|servis|transfer|kargo|otel', 'Havalimanı'),

    ('Iskele/feribot, ulasim noktasi gorunuyor',
     ['Ulaşım noktası'], None,
     r'(^|[[:space:]])(iskelesi|iskele|feribot|deniz otobusu)([[:space:]]|$)',
     r'taksi|kargo|restoran|kafe', 'İskele'),

    ('Park, meydan gorunuyor',
     ['Meydan'], None,
     r'parki([[:space:]]|$)|[[:space:]]park$', r'meydan|parke|otopark', 'Park'),

    ('Turbe/kabir, cami gorunuyor',
     ['Cami'], None,
     r'(turbesi|turbe([[:space:]]|$)|kabri|yatir)',
     r'cami|camii|mescit|mescidi|mosque', 'İbadet yeri'),

    ('Kuran kursu/muftuluk, cami gorunuyor',
     ['Cami'], None,
     r'kur.?an kursu|muftulugu|muftuluk',
     r'cami|camii|mescidi', 'İbadet yeri'),

    ('Mezarlik, cami gorunuyor',
     ['Cami'], None, r'mezarligi|mezarlik', r'cami|camii|mescidi', 'Mezarlık'),

    # "cami" dislamasi KRITIK: "Kilise Camii" kiliseden cevrilmis,
    # bugun cami olan yapi. Dislamasiz 5 gercek cami yanlis tasinir.
    ('Kilise, cami gorunuyor',
     ['Cami'], None,
     r'kilise|church|katedral|manastir',
     r'cami|camii|mescit|mescidi|havran', 'İbadet yeri'),

    ('Adi acikca cami olanlar, genel ibadet yerinde',
     ['İbadet yeri'], None,
     r'(camii|camisi|cami|mescidi|mescit|mosque)',
     r'kilise|church|cemevi|sinagog|havra|kur.?an kursu|muftul', 'Cami'),

    ('Okul, kampus binasi gorunuyor - ilkokul',
     ['Kampüs binası'], None, r'ilkokul|ilkogretim okulu', None, 'İlkokul'),
    ('Okul, kampus binasi gorunuyor - ortaokul',
     ['Kampüs binası'], None, r'ortaokul', None, 'Ortaokul'),
    ('Okul, kampus binasi gorunuyor - lise',
     ['Kampüs binası'], None, r'lisesi', None, 'Lise'),
    ('Okul, kampus binasi gorunuyor - anaokulu',
     ['Kampüs binası'], None, r'anaokul', None, 'Anaokulu'),

    ('Hali saha',
     ['Spor salonu'], None,
     r'hali saha|halisaha|futbol sahasi', None, 'Halı saha'),

    ('Hayvanat bahcesi, park gorunuyor',
     ['Park'], None, r'hayvanat bahcesi', None, 'Hayvanat bahçesi'),

    ('Mezarlik, tarihi yer/park gorunuyor',
     ['Tarihi yer', 'Park', 'Doğal alan'], None,
     r'(^|[[:space:]])(mezarligi|mezarlik|sehitligi|kabristan)([[:space:]]|$)',
     None, 'Mezarlık'),

    ('Baraj, tarihi yer/dag/gol gorunuyor',
     ['Tarihi yer', 'Dağ', 'Doğal alan'], None,
     r'(^|[[:space:]])(baraji|barajı|baraj)([[:space:]]|$)', None, 'Baraj'),
]

PARCA = 500


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
                # Zaman asimi: parcayi kucult, kuraldan vazgecme. Buyuk
                # turlerde (Otel 41 bin, Spa 24 bin) regex taramasi tek
                # seferde sunucunun sinirini asabiliyor.
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

    print(f'\nTOPLAM: {genel} kayit duzeltildi')


if __name__ == '__main__':
    sys.exit(main())
