"""Overture kategorisi -> Slooin turu (kullaniciya gorunen Turkce ad).

TASARIM KURALI: zorlama gruplama YOK. Bir yer neyse o gorunur - plaj
"Plaj", okul "Okul", apart "Apart otel". Eski esleme her seyi dort ture
(kafe/bar/restoran/park) sikistirdigi icin plajlar ve apartmanlar "park"
diye gorunuyordu; kullanicinin bildirdigi kusur buydu.

IKINCI KURAL: sozlukte KARSILIGI OLAN kategori alinir, olmayan
ALINMAZ. Boylece ekranda hicbir zaman Ingilizce ham kategori adi
belirmez ve kapsam sozluk buyudukce kontrollu genisler.

Ham kategori ayrica `mekanlar.kategori` sutununda saklanir; esleme
sonradan degisirse veriyi yeniden indirmeye gerek kalmaz.
"""

# Overture kategorisi -> Turkce tur adi.
ESLEME: dict[str, str] = {
    # --- Yeme ve icme ---
    'cafe': 'Kafe',
    'coffee_shop': 'Kahveci',
    'internet_cafe': 'İnternet kafe',
    'tea_room': 'Çay evi',
    'restaurant': 'Restoran',
    'turkish_restaurant': 'Türk mutfağı',
    'kebab_restaurant': 'Kebapçı',
    'pizza_restaurant': 'Pizzacı',
    'seafood_restaurant': 'Balık restoranı',
    'steakhouse': 'Steakhouse',
    'sushi_restaurant': 'Suşi restoranı',
    'italian_restaurant': 'İtalyan restoranı',
    'chinese_restaurant': 'Çin restoranı',
    'burger_restaurant': 'Burgerci',
    'barbecue_restaurant': 'Ocakbaşı',
    'breakfast_and_brunch_restaurant': 'Kahvaltı salonu',
    'fast_food_restaurant': 'Fast food',
    'food_court': 'Yemek katı',
    'diner': 'Lokanta',
    'bakery': 'Fırın',
    'desserts': 'Tatlıcı',
    'ice_cream_shop': 'Dondurmacı',
    'juice_and_smoothie_bar': 'Meyve suyu barı',
    'food_and_beverage_service': 'Yeme içme',

    # --- Gece ---
    'bar': 'Bar',
    'pub': 'Pub',
    'wine_bar': 'Şarap evi',
    'cocktail_bar': 'Kokteyl barı',
    'beer_bar': 'Bira evi',
    'beer_garden': 'Bira bahçesi',
    'sports_bar': 'Spor barı',
    'night_club': 'Gece kulübü',
    'karaoke': 'Karaoke',
    'hookah_lounge': 'Nargile kafe',
    'brewery': 'Bira fabrikası',
    'winery': 'Şaraphane',
    'meyhane': 'Meyhane',

    # --- Acik alan ve doga ---
    'park': 'Park',
    'national_park': 'Milli park',
    'state_park': 'Tabiat parkı',
    'public_garden': 'Halk bahçesi',
    'botanical_garden': 'Botanik bahçe',
    'picnic_area': 'Piknik alanı',
    'beach': 'Plaj',
    'public_plaza': 'Meydan',
    'campground': 'Kamp alanı',
    'mountain': 'Dağ',
    'lake': 'Göl',
    'river': 'Nehir',
    'forest': 'Orman',
    'waterfall': 'Şelale',
    'hot_spring': 'Kaplıca',
    'scenic_lookout': 'Seyir terası',
    'harbor_marina': 'Marina',
    'structure_and_geography': 'Doğal alan',

    # --- Kultur ve tarih ---
    'museum': 'Müze',
    'art_gallery': 'Sanat galerisi',
    'landmark_and_historical_building': 'Tarihi yer',
    'monument': 'Anıt',
    'castle': 'Kale',
    'archaeological_site': 'Ören yeri',
    'library': 'Kütüphane',
    'cultural_center': 'Kültür merkezi',
    'theater': 'Tiyatro',
    'performing_arts_venue': 'Sahne sanatları',
    'opera_house': 'Opera binası',
    'movie_theater': 'Sinema',
    'music_venue': 'Canlı müzik',
    'concert_hall': 'Konser salonu',
    'arts_and_entertainment': 'Sanat ve eğlence',
    'aquarium': 'Akvaryum',
    'zoo': 'Hayvanat bahçesi',
    'amusement_park': 'Lunapark',
    'water_park': 'Aquapark',

    # --- Spor ---
    'gym': 'Spor salonu',
    'fitness_center': 'Fitness merkezi',
    'yoga_studio': 'Yoga stüdyosu',
    'pilates_studio': 'Pilates stüdyosu',
    'martial_arts_school': 'Dövüş sporları salonu',
    'swimming_pool': 'Yüzme havuzu',
    'stadium_arena': 'Stadyum',
    'sports_club': 'Spor kulübü',
    'golf_course': 'Golf sahası',
    'tennis_court': 'Tenis kortu',
    'bowling_alley': 'Bowling salonu',
    'billiards': 'Bilardo salonu',
    'ski_resort': 'Kayak merkezi',
    'skate_park': 'Kaykay parkı',
    'sports_and_recreation': 'Spor ve rekreasyon',

    # --- Egitim ---
    'preschool': 'Anaokulu',
    'elementary_school': 'İlkokul',
    'middle_school': 'Ortaokul',
    'high_school': 'Lise',
    'school': 'Okul',
    'college_university': 'Üniversite',
    'campus_building': 'Kampüs binası',
    'education': 'Eğitim kurumu',
    'language_school': 'Dil okulu',
    'driving_school': 'Sürücü kursu',
    'music_school': 'Müzik okulu',
    'art_school': 'Sanat okulu',

    # --- Konaklama ---
    'hotel': 'Otel',
    'motel': 'Motel',
    'hostel': 'Hostel',
    'bed_and_breakfast': 'Pansiyon',
    'resort': 'Tatil köyü',
    'accommodation': 'Konaklama',
    'vacation_rental': 'Kiralık daire',
    'apartment_building': 'Apartman',
    'residential_building': 'Site',
    'housing_development': 'Site',
    'villa': 'Villa',
    'mansion': 'Konak',

    # --- Alisveris ---
    'shopping_center': 'AVM',
    'shopping': 'Alışveriş',
    'grocery_store': 'Market',
    'supermarket': 'Süpermarket',
    'convenience_store': 'Bakkal',
    'bookstore': 'Kitapçı',
    'clothing_store': 'Giyim mağazası',
    'shoe_store': 'Ayakkabı mağazası',
    'jewelry_store': 'Kuyumcu',
    'electronics': 'Elektronik mağazası',
    'mobile_phone_store': 'Telefoncu',
    'furniture_store': 'Mobilyacı',
    'home_goods_store': 'Ev eşyası mağazası',
    'flowers_and_gifts_shop': 'Çiçekçi',
    'pet_store': 'Petshop',
    'toy_store': 'Oyuncakçı',
    'sporting_goods': 'Spor mağazası',
    'farmers_market': 'Semt pazarı',
    'butcher': 'Kasap',
    'greengrocer': 'Manav',

    # --- Kisisel bakim ---
    'beauty_salon': 'Güzellik salonu',
    'hair_salon': 'Kuaför',
    'barber': 'Berber',
    'spas': 'Spa',
    'nail_salon': 'Tırnak bakımı',
    'tattoo_and_piercing': 'Dövme stüdyosu',
    'turkish_bath': 'Hamam',

    # --- Ulasim ---
    'airport': 'Havalimanı',
    'train_station': 'Tren istasyonu',
    'bus_station': 'Otogar',
    'subway_station': 'Metro istasyonu',
    'ferry_terminal': 'İskele',
    'transportation': 'Ulaşım noktası',
    'parking': 'Otopark',
    'gas_station': 'Benzin istasyonu',
    'rest_area': 'Dinlenme tesisi',

    # --- Ibadet ---
    'mosque': 'Cami',
    'church': 'Kilise',
    'synagogue': 'Sinagog',
    'religious_organization': 'İbadet yeri',
    'cemetery': 'Mezarlık',

    # --- Saglik ---
    'hospital': 'Hastane',
    'pharmacy': 'Eczane',
    'dentist': 'Diş kliniği',
    'veterinarian': 'Veteriner',
    'medical_center': 'Sağlık merkezi',

    # --- Kamu ve hizmet ---
    'central_government_office': 'Kamu kurumu',
    'public_service_and_government': 'Kamu hizmeti',
    'post_office': 'Postane',
    'police_department': 'Karakol',
    'fire_department': 'İtfaiye',
    'courthouse': 'Adliye',
    'embassy': 'Konsolosluk',
    'community_center': 'Toplum merkezi',
    'bank_credit_union': 'Banka',
    'banks': 'Banka',
    'atms': 'ATM',

    # --- Denetimde acilan turler (2026-08-23) ---
    # Alti denetim ajani, mevcut turlerin altinda YANLIS duran buyuk
    # kumeler buldu. Kullanicinin karari kapsami daraltmak degil
    # genisletmekti: "Butun turleri almaliyiz cok kapsamli olmali".
    'student_housing': 'Öğrenci yurdu',
    'travel_agency': 'Seyahat acentesi',
    'travel_services': 'Seyahat acentesi',
    'medical_supply': 'Medikal malzeme',
    'cosmetics_and_beauty_supply': 'Kozmetik mağazası',
    'optometrist': 'Optik',
    'eyewear_and_opticians': 'Optik',
    'hardware_store': 'Yapı marketi',
    'building_materials': 'Yapı marketi',
    'stationery': 'Kırtasiye',
    'gift_shop': 'Hediyelik eşya',
    'delicatessen': 'Şarküteri',
    'butcher_shop': 'Kasap',
    'fishmonger': 'Balıkçı',
    'party_and_event_planning': 'Düğün salonu',
    'wedding_hall': 'Düğün salonu',
    'dam': 'Baraj',
    'arcade': 'Oyun salonu',
    'pool_billiards': 'Bilardo salonu',
    'dance_club': 'Gece kulübü',
    'hookah_bar': 'Nargile kafe',
    'doner_kebab': 'Kebapçı',
    'spas': 'Spa',
}


def turu_bul(ana_kategori, alternatifler):
    """Kategoriden Turkce turu bulur; bulamazsa None doner (kayit alinmaz).

    Ana kategori sozlukte yoksa alternatiflere bakilir: Overture bazen
    dogru kategoriyi ikinci sirada tasiyor.
    """
    if ana_kategori and ana_kategori in ESLEME:
        return ESLEME[ana_kategori]
    for alt in alternatifler or []:
        if alt in ESLEME:
            return ESLEME[alt]
    return None


# Ana kategorisi ACIK ALAN olan ama alternatiflerinde KONAKLAMA/KONUT
# sinyali tasiyan kayitlar, Overture'in bilinen yanlis etiketlemeleridir.
# Ornekler (canlida dogrulandi):
#   "Park Apt"                     -> ana: park,  alt: hotel, landmark
#   "Lüleburgaz Ögretmenler Sitesi"-> ana: beach, alt: accommodation
# Bunlar acik alan olarak DEGIL, alternatifin isaret ettigi tur olarak
# alinir; boylece bir apartman "Park" diye gorunmez.
ACIK_ALAN = {
    'park', 'national_park', 'state_park', 'public_garden',
    'botanical_garden', 'picnic_area', 'beach', 'public_plaza',
    'campground', 'mountain', 'lake', 'forest',
}

KONAKLAMA_SINYALI = {
    'hotel', 'accommodation', 'motel', 'hostel', 'resort',
    'vacation_rental', 'apartment_building', 'residential_building',
    'housing_development', 'bed_and_breakfast', 'real_estate_service',
    'real_estate_agent', 'home_developer',
}


# Ad TOPONIM ekiyle bitiyorsa, kategori ne derse desin orasi bir
# isletme degil bir yer adidir. Denetimde en buyuk tek kusur buydu:
# "Fatih Mahallesi", "Dogancik Koyu", "Ayralaksa Yaylasi" gibi 5.276
# kayit Otel gorunuyordu, cunku duzelt() ISME HIC BAKMIYORDU.
TOPONIM = (
    'koyu', 'koy', 'mahallesi', 'mahalle', 'mah.', 'mh.', 'kasabasi',
    'yaylasi', 'deresi', 'tepesi', 'vadisi', 'caddesi', 'cad.',
    'sokagi', 'sokak', 'bulvari', 'kavsagi', 'sahili', 'plaji',
    'baraji', 'goleti',
)


def _sadelestir(metin):
    """Turkce harfleri ASCII'ye indirger ve kucultur.

    Python'un lower()'i da PostgreSQL gibi buyuk İ'de sasiriyor; ayni
    normalizasyon burada da sart, yoksa "KOYU" yazimi kacar.
    """
    cevrim = str.maketrans(
        'İIŞĞÜÖÇÂÎÛışğüöçâîû',
        'IISGUOCAIUisguocaiu',
    )
    return (metin or '').translate(cevrim).lower()


def toponim_mi(ad):
    """Ad bir yer adi mi (isletme degil)."""
    sozcukler = _sadelestir(ad).replace(',', ' ').split()
    return any(s in TOPONIM for s in sozcukler)


def duzelt(ana_kategori, alternatifler, ad=''):
    """Yanlis etiketlenmis acik alan kayitlarini duzeltir.

    Donen deger nihai Turkce turdur; alinmayacak kayitlar icin None.

    ONEMLI: konaklama override'i yalnizca ad bir yer adi DEGILSE
    uygulanir. Onceki surumde bu kosul yoktu ve koy/mahalle adlari
    otele donusuyordu.
    """
    alt = list(alternatifler or [])

    if ana_kategori in ACIK_ALAN and not toponim_mi(ad):
        konaklama = next((a for a in alt if a in KONAKLAMA_SINYALI), None)
        if konaklama:
            # Acik alan degil: alternatifin soyledigi sey.
            return ESLEME.get(konaklama, 'Konaklama')

    return turu_bul(ana_kategori, alt)
