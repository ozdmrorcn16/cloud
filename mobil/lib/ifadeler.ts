/**
 * CHECK-IN IFADE SETI (2026-09-21).
 *
 * Kullanicinin verdigi 108 ifadelik set (12 kategori x 9) - `araclar/
 * ifade-seti-kes.py` ile tek tek PNG'ye kesildi, arka plan seffaflastirildi.
 * Bu dosya URETILIR (ayni betik, elle duzenleme yapilmaz); RN paketleyicisi
 * statik `require` istedigi icin liste burada acik yazilir.
 *
 * Etiketler duzgun Turkce (ekran metni). Kaynak JPEG'ten kesildigi icin
 * ifade basina 68-125 px - ~40 pt @3x icin yeter; daha buyuk gosterim
 * icin ozgun PNG disa aktarimi gerekir.
 */
export type IfadeKategorisi = 'icecekler' | 'yemekler' | 'tatlilar-ve-atistirmaliklar' | 'ruh-hali' | 'arkadaslik-ve-iliskiler' | 'yolculuk-ve-ulasim' | 'gunluk-yasam' | 'spor-ve-hareket' | 'gezi-ve-eglence' | 'hava-ve-gunun-saati' | 'kutlamalar-ve-ozel-anlar' | 'mekan-ve-check-in'
export type Ifade = {
  /** Dosya adi kokenli benzersiz kimlik, ornegin 'cay-molasi'. */
  slug: string
  kategori: IfadeKategorisi
  /** Ekranda gorunen Turkce etiket. */
  etiket: string
  kaynak: number
}
export const IFADE_KATEGORILERI: { slug: IfadeKategorisi; ad: string }[] = [
  { slug: 'icecekler', ad: 'İçecekler' },
  { slug: 'yemekler', ad: 'Yemekler' },
  { slug: 'tatlilar-ve-atistirmaliklar', ad: 'Tatlılar ve atıştırmalıklar' },
  { slug: 'ruh-hali', ad: 'Ruh hâli' },
  { slug: 'arkadaslik-ve-iliskiler', ad: 'Arkadaşlık ve ilişkiler' },
  { slug: 'yolculuk-ve-ulasim', ad: 'Yolculuk ve ulaşım' },
  { slug: 'gunluk-yasam', ad: 'Günlük yaşam' },
  { slug: 'spor-ve-hareket', ad: 'Spor ve hareket' },
  { slug: 'gezi-ve-eglence', ad: 'Gezi ve eğlence' },
  { slug: 'hava-ve-gunun-saati', ad: 'Hava ve günün saati' },
  { slug: 'kutlamalar-ve-ozel-anlar', ad: 'Kutlamalar ve özel anlar' },
  { slug: 'mekan-ve-check-in', ad: 'Mekân ve check-in' },
]
export const IFADELER: Ifade[] = [
  { slug: 'cay-molasi', kategori: 'icecekler', etiket: 'Çay molası', kaynak: require('../assets/ifadeler/icecekler/cay-molasi.png') },
  { slug: 'kahve-keyfi', kategori: 'icecekler', etiket: 'Kahve keyfi', kaynak: require('../assets/ifadeler/icecekler/kahve-keyfi.png') },
  { slug: 'turk-kahvesi', kategori: 'icecekler', etiket: 'Türk kahvesi', kaynak: require('../assets/ifadeler/icecekler/turk-kahvesi.png') },
  { slug: 'buzlu-kahve', kategori: 'icecekler', etiket: 'Buzlu kahve', kaynak: require('../assets/ifadeler/icecekler/buzlu-kahve.png') },
  { slug: 'matcha-zamani', kategori: 'icecekler', etiket: 'Matcha zamanı', kaynak: require('../assets/ifadeler/icecekler/matcha-zamani.png') },
  { slug: 'limonata-ferahligi', kategori: 'icecekler', etiket: 'Limonata ferahlığı', kaynak: require('../assets/ifadeler/icecekler/limonata-ferahligi.png') },
  { slug: 'smoothie-molasi', kategori: 'icecekler', etiket: 'Smoothie molası', kaynak: require('../assets/ifadeler/icecekler/smoothie-molasi.png') },
  { slug: 'bubble-tea', kategori: 'icecekler', etiket: 'Bubble tea', kaynak: require('../assets/ifadeler/icecekler/bubble-tea.png') },
  { slug: 'su-molasi', kategori: 'icecekler', etiket: 'Su molası', kaynak: require('../assets/ifadeler/icecekler/su-molasi.png') },
  { slug: 'kahvalti-keyfi', kategori: 'yemekler', etiket: 'Kahvaltı keyfi', kaynak: require('../assets/ifadeler/yemekler/kahvalti-keyfi.png') },
  { slug: 'simit-molasi', kategori: 'yemekler', etiket: 'Simit molası', kaynak: require('../assets/ifadeler/yemekler/simit-molasi.png') },
  { slug: 'pizza-zamani', kategori: 'yemekler', etiket: 'Pizza zamanı', kaynak: require('../assets/ifadeler/yemekler/pizza-zamani.png') },
  { slug: 'burger-keyfi', kategori: 'yemekler', etiket: 'Burger keyfi', kaynak: require('../assets/ifadeler/yemekler/burger-keyfi.png') },
  { slug: 'kebap-molasi', kategori: 'yemekler', etiket: 'Kebap molası', kaynak: require('../assets/ifadeler/yemekler/kebap-molasi.png') },
  { slug: 'sushi-zamani', kategori: 'yemekler', etiket: 'Sushi zamanı', kaynak: require('../assets/ifadeler/yemekler/sushi-zamani.png') },
  { slug: 'hafif-bir-ogun', kategori: 'yemekler', etiket: 'Hafif bir öğün', kaynak: require('../assets/ifadeler/yemekler/hafif-bir-ogun.png') },
  { slug: 'makarna-keyfi', kategori: 'yemekler', etiket: 'Makarna keyfi', kaynak: require('../assets/ifadeler/yemekler/makarna-keyfi.png') },
  { slug: 'patates-molasi', kategori: 'yemekler', etiket: 'Patates molası', kaynak: require('../assets/ifadeler/yemekler/patates-molasi.png') },
  { slug: 'dondurma-keyfi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Dondurma keyfi', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/dondurma-keyfi.png') },
  { slug: 'tatli-kacamagi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Tatlı kaçamağı', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/tatli-kacamagi.png') },
  { slug: 'waffle-zamani', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Waffle zamanı', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/waffle-zamani.png') },
  { slug: 'baklava-keyfi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Baklava keyfi', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/baklava-keyfi.png') },
  { slug: 'donut-molasi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Donut molası', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/donut-molasi.png') },
  { slug: 'kruvasan-keyfi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Kruvasan keyfi', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/kruvasan-keyfi.png') },
  { slug: 'cikolata-mutlulugu', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Çikolata mutluluğu', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/cikolata-mutlulugu.png') },
  { slug: 'film-atistirmasi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Film atıştırması', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/film-atistirmasi.png') },
  { slug: 'meyve-molasi', kategori: 'tatlilar-ve-atistirmaliklar', etiket: 'Meyve molası', kaynak: require('../assets/ifadeler/tatlilar-ve-atistirmaliklar/meyve-molasi.png') },
  { slug: 'cok-mutluyum', kategori: 'ruh-hali', etiket: 'Çok mutluyum', kaynak: require('../assets/ifadeler/ruh-hali/cok-mutluyum.png') },
  { slug: 'kahkahadayim', kategori: 'ruh-hali', etiket: 'Kahkahadayım', kaynak: require('../assets/ifadeler/ruh-hali/kahkahadayim.png') },
  { slug: 'kalbim-burada', kategori: 'ruh-hali', etiket: 'Kalbim burada', kaynak: require('../assets/ifadeler/ruh-hali/kalbim-burada.png') },
  { slug: 'huzurluyum', kategori: 'ruh-hali', etiket: 'Huzurluyum', kaynak: require('../assets/ifadeler/ruh-hali/huzurluyum.png') },
  { slug: 'dusunceliyim', kategori: 'ruh-hali', etiket: 'Düşünceliyim', kaynak: require('../assets/ifadeler/ruh-hali/dusunceliyim.png') },
  { slug: 'biraz-uzgunum', kategori: 'ruh-hali', etiket: 'Biraz üzgünüm', kaynak: require('../assets/ifadeler/ruh-hali/biraz-uzgunum.png') },
  { slug: 'pilim-bitti', kategori: 'ruh-hali', etiket: 'Pilim bitti', kaynak: require('../assets/ifadeler/ruh-hali/pilim-bitti.png') },
  { slug: 'biraz-sinirliyim', kategori: 'ruh-hali', etiket: 'Biraz sinirliyim', kaynak: require('../assets/ifadeler/ruh-hali/biraz-sinirliyim.png') },
  { slug: 'cok-sasirdim', kategori: 'ruh-hali', etiket: 'Çok şaşırdım', kaynak: require('../assets/ifadeler/ruh-hali/cok-sasirdim.png') },
  { slug: 'cak-bir-beslik', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Çak bir beşlik', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/cak-bir-beslik.png') },
  { slug: 'ekiple-birlikte', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Ekiple birlikte', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/ekiple-birlikte.png') },
  { slug: 'aile-zamani', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Aile zamanı', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/aile-zamani.png') },
  { slug: 'randevu-zamani', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Randevu zamanı', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/randevu-zamani.png') },
  { slug: 'seni-bekliyorum', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Seni bekliyorum', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/seni-bekliyorum.png') },
  { slug: 'kendi-basima', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Kendi başıma', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/kendi-basima.png') },
  { slug: 'iyi-ki-varsin', kategori: 'arkadaslik-ve-iliskiler', etiket: 'İyi ki varsın', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/iyi-ki-varsin.png') },
  { slug: 'sen-de-gel', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Sen de gel', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/sen-de-gel.png') },
  { slug: 'ozledim', kategori: 'arkadaslik-ve-iliskiler', etiket: 'Özledim', kaynak: require('../assets/ifadeler/arkadaslik-ve-iliskiler/ozledim.png') },
  { slug: 'yoldayim', kategori: 'yolculuk-ve-ulasim', etiket: 'Yoldayım', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/yoldayim.png') },
  { slug: 'trafikteyim', kategori: 'yolculuk-ve-ulasim', etiket: 'Trafikteyim', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/trafikteyim.png') },
  { slug: 'yuruyerek', kategori: 'yolculuk-ve-ulasim', etiket: 'Yürüyerek', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/yuruyerek.png') },
  { slug: 'bisikletle', kategori: 'yolculuk-ve-ulasim', etiket: 'Bisikletle', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/bisikletle.png') },
  { slug: 'scooter-ile', kategori: 'yolculuk-ve-ulasim', etiket: 'Scooter ile', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/scooter-ile.png') },
  { slug: 'tren-yolculugu', kategori: 'yolculuk-ve-ulasim', etiket: 'Tren yolculuğu', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/tren-yolculugu.png') },
  { slug: 'otobusteyim', kategori: 'yolculuk-ve-ulasim', etiket: 'Otobüsteyim', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/otobusteyim.png') },
  { slug: 'ucus-zamani', kategori: 'yolculuk-ve-ulasim', etiket: 'Uçuş zamanı', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/ucus-zamani.png') },
  { slug: 'tatil-basladi', kategori: 'yolculuk-ve-ulasim', etiket: 'Tatil başladı', kaynak: require('../assets/ifadeler/yolculuk-ve-ulasim/tatil-basladi.png') },
  { slug: 'calisiyorum', kategori: 'gunluk-yasam', etiket: 'Çalışıyorum', kaynak: require('../assets/ifadeler/gunluk-yasam/calisiyorum.png') },
  { slug: 'ders-zamani', kategori: 'gunluk-yasam', etiket: 'Ders zamanı', kaynak: require('../assets/ifadeler/gunluk-yasam/ders-zamani.png') },
  { slug: 'alisveristeyim', kategori: 'gunluk-yasam', etiket: 'Alışverişteyim', kaynak: require('../assets/ifadeler/gunluk-yasam/alisveristeyim.png') },
  { slug: 'ev-keyfi', kategori: 'gunluk-yasam', etiket: 'Ev keyfi', kaynak: require('../assets/ifadeler/gunluk-yasam/ev-keyfi.png') },
  { slug: 'market-turu', kategori: 'gunluk-yasam', etiket: 'Market turu', kaynak: require('../assets/ifadeler/gunluk-yasam/market-turu.png') },
  { slug: 'bakim-zamani', kategori: 'gunluk-yasam', etiket: 'Bakım zamanı', kaynak: require('../assets/ifadeler/gunluk-yasam/bakim-zamani.png') },
  { slug: 'saglik-molasi', kategori: 'gunluk-yasam', etiket: 'Sağlık molası', kaynak: require('../assets/ifadeler/gunluk-yasam/saglik-molasi.png') },
  { slug: 'patili-dostumla', kategori: 'gunluk-yasam', etiket: 'Patili dostumla', kaynak: require('../assets/ifadeler/gunluk-yasam/patili-dostumla.png') },
  { slug: 'toplantidayim', kategori: 'gunluk-yasam', etiket: 'Toplantıdayım', kaynak: require('../assets/ifadeler/gunluk-yasam/toplantidayim.png') },
  { slug: 'antrenmandayim', kategori: 'spor-ve-hareket', etiket: 'Antrenmandayım', kaynak: require('../assets/ifadeler/spor-ve-hareket/antrenmandayim.png') },
  { slug: 'kosu-zamani', kategori: 'spor-ve-hareket', etiket: 'Koşu zamanı', kaynak: require('../assets/ifadeler/spor-ve-hareket/kosu-zamani.png') },
  { slug: 'mac-keyfi', kategori: 'spor-ve-hareket', etiket: 'Maç keyfi', kaynak: require('../assets/ifadeler/spor-ve-hareket/mac-keyfi.png') },
  { slug: 'basket-zamani', kategori: 'spor-ve-hareket', etiket: 'Basket zamanı', kaynak: require('../assets/ifadeler/spor-ve-hareket/basket-zamani.png') },
  { slug: 'tenis-zamani', kategori: 'spor-ve-hareket', etiket: 'Tenis zamanı', kaynak: require('../assets/ifadeler/spor-ve-hareket/tenis-zamani.png') },
  { slug: 'yuzuyorum', kategori: 'spor-ve-hareket', etiket: 'Yüzüyorum', kaynak: require('../assets/ifadeler/spor-ve-hareket/yuzuyorum.png') },
  { slug: 'yoga-molasi', kategori: 'spor-ve-hareket', etiket: 'Yoga molası', kaynak: require('../assets/ifadeler/spor-ve-hareket/yoga-molasi.png') },
  { slug: 'doga-yuruyusu', kategori: 'spor-ve-hareket', etiket: 'Doğa yürüyüşü', kaynak: require('../assets/ifadeler/spor-ve-hareket/doga-yuruyusu.png') },
  { slug: 'bowling-zamani', kategori: 'spor-ve-hareket', etiket: 'Bowling zamanı', kaynak: require('../assets/ifadeler/spor-ve-hareket/bowling-zamani.png') },
  { slug: 'sahil-keyfi', kategori: 'gezi-ve-eglence', etiket: 'Sahil keyfi', kaynak: require('../assets/ifadeler/gezi-ve-eglence/sahil-keyfi.png') },
  { slug: 'kamptayim', kategori: 'gezi-ve-eglence', etiket: 'Kamptayım', kaynak: require('../assets/ifadeler/gezi-ve-eglence/kamptayim.png') },
  { slug: 'piknik-zamani', kategori: 'gezi-ve-eglence', etiket: 'Piknik zamanı', kaynak: require('../assets/ifadeler/gezi-ve-eglence/piknik-zamani.png') },
  { slug: 'sinemadayim', kategori: 'gezi-ve-eglence', etiket: 'Sinemadayım', kaynak: require('../assets/ifadeler/gezi-ve-eglence/sinemadayim.png') },
  { slug: 'konserdeyim', kategori: 'gezi-ve-eglence', etiket: 'Konserdeyim', kaynak: require('../assets/ifadeler/gezi-ve-eglence/konserdeyim.png') },
  { slug: 'dans-zamani', kategori: 'gezi-ve-eglence', etiket: 'Dans zamanı', kaynak: require('../assets/ifadeler/gezi-ve-eglence/dans-zamani.png') },
  { slug: 'oyun-molasi', kategori: 'gezi-ve-eglence', etiket: 'Oyun molası', kaynak: require('../assets/ifadeler/gezi-ve-eglence/oyun-molasi.png') },
  { slug: 'kesif-turu', kategori: 'gezi-ve-eglence', etiket: 'Keşif turu', kaynak: require('../assets/ifadeler/gezi-ve-eglence/kesif-turu.png') },
  { slug: 'balik-tutuyorum', kategori: 'gezi-ve-eglence', etiket: 'Balık tutuyorum', kaynak: require('../assets/ifadeler/gezi-ve-eglence/balik-tutuyorum.png') },
  { slug: 'gunesli-gun', kategori: 'hava-ve-gunun-saati', etiket: 'Güneşli gün', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/gunesli-gun.png') },
  { slug: 'yagmur-keyfi', kategori: 'hava-ve-gunun-saati', etiket: 'Yağmur keyfi', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/yagmur-keyfi.png') },
  { slug: 'kar-zamani', kategori: 'hava-ve-gunun-saati', etiket: 'Kar zamanı', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/kar-zamani.png') },
  { slug: 'ruzgarli', kategori: 'hava-ve-gunun-saati', etiket: 'Rüzgârlı', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/ruzgarli.png') },
  { slug: 'cok-sicak', kategori: 'hava-ve-gunun-saati', etiket: 'Çok sıcak', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/cok-sicak.png') },
  { slug: 'usudum', kategori: 'hava-ve-gunun-saati', etiket: 'Üşüdüm', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/usudum.png') },
  { slug: 'gun-batimi', kategori: 'hava-ve-gunun-saati', etiket: 'Gün batımı', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/gun-batimi.png') },
  { slug: 'gece-modu', kategori: 'hava-ve-gunun-saati', etiket: 'Gece modu', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/gece-modu.png') },
  { slug: 'bulutlu-gun', kategori: 'hava-ve-gunun-saati', etiket: 'Bulutlu gün', kaynak: require('../assets/ifadeler/hava-ve-gunun-saati/bulutlu-gun.png') },
  { slug: 'iyi-ki-dogdun', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'İyi ki doğdun', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/iyi-ki-dogdun.png') },
  { slug: 'mezun-oldum', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Mezun oldum', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/mezun-oldum.png') },
  { slug: 'basardim', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Başardım', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/basardim.png') },
  { slug: 'kucuk-bir-surpriz', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Küçük bir sürpriz', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/kucuk-bir-surpriz.png') },
  { slug: 'yil-donumumuz', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Yıl dönümümüz', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/yil-donumumuz.png') },
  { slug: 'dugun-zamani', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Düğün zamanı', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/dugun-zamani.png') },
  { slug: 'yeni-baslangic', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Yeni başlangıç', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/yeni-baslangic.png') },
  { slug: 'sans-benimle', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Şans benimle', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/sans-benimle.png') },
  { slug: 'kutlama-zamani', kategori: 'kutlamalar-ve-ozel-anlar', etiket: 'Kutlama zamanı', kaynak: require('../assets/ifadeler/kutlamalar-ve-ozel-anlar/kutlama-zamani.png') },
  { slug: 'buradayim', kategori: 'mekan-ve-check-in', etiket: 'Buradayım', kaynak: require('../assets/ifadeler/mekan-ve-check-in/buradayim.png') },
  { slug: 'ilk-kez-buradayim', kategori: 'mekan-ve-check-in', etiket: 'İlk kez buradayım', kaynak: require('../assets/ifadeler/mekan-ve-check-in/ilk-kez-buradayim.png') },
  { slug: 'yine-buradayim', kategori: 'mekan-ve-check-in', etiket: 'Yine buradayım', kaynak: require('../assets/ifadeler/mekan-ve-check-in/yine-buradayim.png') },
  { slug: 'burasi-kalabalik', kategori: 'mekan-ve-check-in', etiket: 'Burası kalabalık', kaynak: require('../assets/ifadeler/mekan-ve-check-in/burasi-kalabalik.png') },
  { slug: 'tam-kafa-dinlemelik', kategori: 'mekan-ve-check-in', etiket: 'Tam kafa dinlemelik', kaynak: require('../assets/ifadeler/mekan-ve-check-in/tam-kafa-dinlemelik.png') },
  { slug: 'manzara-sahane', kategori: 'mekan-ve-check-in', etiket: 'Manzara şahane', kaynak: require('../assets/ifadeler/mekan-ve-check-in/manzara-sahane.png') },
  { slug: 'cok-lezzetli', kategori: 'mekan-ve-check-in', etiket: 'Çok lezzetli', kaynak: require('../assets/ifadeler/mekan-ve-check-in/cok-lezzetli.png') },
  { slug: 'bekledigim-gibi-degil', kategori: 'mekan-ve-check-in', etiket: 'Beklediğim gibi değil', kaynak: require('../assets/ifadeler/mekan-ve-check-in/bekledigim-gibi-degil.png') },
  { slug: 'gizli-bir-guzellik', kategori: 'mekan-ve-check-in', etiket: 'Gizli bir güzellik', kaynak: require('../assets/ifadeler/mekan-ve-check-in/gizli-bir-guzellik.png') },
]

export function ifadeBul(slug: string): Ifade | undefined {
  return IFADELER.find((i) => i.slug === slug)
}
