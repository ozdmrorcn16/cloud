import { supabase } from './supabase'
import { noktayiCoz } from './konum'
import { hataMetni } from './hata-metni'

export type Mekan = {
  id: string
  ad: string
  tur: string
  /** ILCE. Mekanin koordinati hangi ilce poligonunun icindeyse o. */
  semt: string | null
  /**
   * Il. Mahallesi olmayan kayitlarda ekran "ilce, il" gosteriyor
   * (kullanicinin karari 2026-08-31: "adresi olmayana ilçe il
   * yazılacak"). Il de tahmin degil: OSM il poligonuna nokta-icinde
   * testiyle atandi.
   */
  il: string | null
  /**
   * 'kullanici' ya da 'overture'. Tur YALNIZCA 'kullanici' kayitlarinda
   * gosterilir (karar 2026-08-24): dis kaynagin tur verisi guvenilmez,
   * yanlis tur gostermektense hic gostermemek tercih edildi. Bkz.
   * turuGosterilir().
   */
  kaynak: string
  adres: string | null
  osmId: number | null
  konum: { lat: number; lng: number }
  /**
   * MAHALLE (2026-09-09'da GERI GELDI, yalnizca ONAYLI duzeltmeyle).
   *
   * 2026-08-31'de sutun dusuruIdue cunku TURETILMIS veriydi ve uc
   * denemede de yanlis cikti. Buradaki mahalle orada bulunan kisinin
   * beyani ve moderatorden gecmis - eski itiraz kapaniyor.
   */
  mahalle?: string | null
  /**
   * ONAYLANMIS kapak fotografinin storage yolu (2026-09-09).
   *
   * Yalnizca moderatorden gecmis bir duzenleme talebiyle doluyor.
   * 2026-08-24'teki "mekanlarin fotografi yok" kurali DIS KAYNAKTAN
   * gorsel cekmeyi reddediyordu (telif, kapsam, API bagimliligi);
   * buradaki gorsel kullanicinin kendi cektigi ve onaydan gecmis.
   */
  kapakFotograf?: string | null
}

type MekanSatiri = {
  id: string
  ad: string
  tur: string
  semt: string | null
  il?: string | null
  kaynak?: string | null
  adres: string | null
  osm_id: number | null
  konum: string
  kapak_fotograf?: string | null
  mahalle?: string | null
}

function satiriMekanaCevir(satir: MekanSatiri): Mekan {
  return {
    id: satir.id,
    ad: satir.ad,
    tur: satir.tur,
    semt: satir.semt ?? null,
    il: satir.il ?? null,
    // Eski RPC'ler kaynak dondurmuyorsa dis kaynak varsayilir: tur
    // gosterilmez. Guvenli taraf bu.
    kaynak: satir.kaynak ?? 'overture',
    adres: satir.adres,
    osmId: satir.osm_id,
    konum: noktayiCoz(satir.konum),
    kapakFotograf: satir.kapak_fotograf ?? null,
    mahalle: satir.mahalle ?? null,
  }
}

export async function yakinMekanlariGetir(
  lat: number,
  lng: number,
  arama?: string
): Promise<Mekan[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar', {
    p_lat: lat,
    p_lng: lng,
    p_arama: arama ?? null,
  })
  if (error) throw new Error(hataMetni(error))
  return (data as MekanSatiri[]).map(satiriMekanaCevir)
}

export async function mekanEkle(
  ad: string,
  tur: string,
  konum: { lat: number; lng: number },
  cihazKonumu: { lat: number; lng: number },
  adres?: string
): Promise<Mekan> {
  const { data, error } = await supabase.rpc('mekan_ekle', {
    p_ad: ad,
    p_tur: tur,
    p_lat: konum.lat,
    p_lng: konum.lng,
    p_cihaz_lat: cihazKonumu.lat,
    p_cihaz_lng: cihazKonumu.lng,
    p_adres: adres ?? null,
  })
  if (error) throw new Error(hataMetni(error))
  return satiriMekanaCevir(data as MekanSatiri)
}

export type MekanYogunlukIle = Mekan & {
  /** SU AN orada olan kisi sayisi (canli check-in). */
  kisiSayisi: number
  /** Mekanin BUTUN gecmisindeki check-in sayisi - "Populer" olcusu. */
  toplamCheckIn: number
}

type MekanYogunlukSatiri = MekanSatiri & {
  kisi_sayisi: number
  toplam_check_in: number
}

/**
 * MEKANIN DURUMU (kullanicinin istegi 2026-09-06, referans gorselle):
 * listedeki her mekan tek bir rozetle etiketleniyor.
 *
 *   populer -> gecmiste cok gidilmis (toplam check-in esigi)
 *   yogun   -> SU AN kalabalik
 *   sakin   -> geri kalan
 *
 * ONCELIK populer > yogun > sakin: "burasi genelde canli bir yer"
 * bilgisi, o anki kalabaligi da kapsayan daha guclu bir ifade.
 *
 * ESIKLER kucuk sayilari disarida birakiyor ve bu bir GIZLILIK
 * korumasi: az ziyaret edilen kucuk bir mekanda (ornegin bir konut
 * sitesinde) "populer" etiketi, orada kimin bulundugunu tahmin
 * edilebilir kilardi. 10 ve 3 secildi cunku ikisi de tek bir kisinin
 * uretemeyecegi sayilar.
 */
/**
 * TUR SECICIDEKI TEMEL TURLER (kullanicinin karari 2026-09-06).
 *
 * Once "cevredeki turler" gosteriliyordu ve liste 60'ta kesiliyordu -
 * kullanicinin cevresinde 138 tur vardi, yani liste eksikti. Sonra
 * "butun turler" denendi: veritabaninda 300 tur var ve kullanici
 * "300 cok fazla olur" dedi.
 *
 * EN YAYGIN N TUR DE ISE YARAMADI, olculdu: ilk 45'in icinde "Yapi"
 * (123.499), "Mekan" (66.417), "Isletme" (54.925), "Depo", "Ciftlik",
 * "Dag" gibi bir insanin ARAMAYACAGI genel etiketler var. Yaygin olmak
 * "temel" olmak degil.
 *
 * Bu yuzden liste ELLE secildi ve her turun veritabaninda gercekten
 * bulundugu SQL ile dogrulandi (`mekan_turleri` gorunumunden). Cok
 * seyrek olanlar bilerek disarida: "Berber" 477, "Piknik alani" 12 -
 * secilse neredeyse hep bos liste verirlerdi.
 *
 * GRUPLU, cunku duz bir 50 satirlik liste taranamiyor; basliklar goze
 * tutamak veriyor.
 */
export const TEMEL_TUR_GRUPLARI: { baslik: string; turler: string[] }[] = [
  {
    baslik: 'Yeme içme',
    turler: [
      // "Hizli ve tatli" grubu bunun ICINE tasindi (kullanicinin
      // istegi 2026-09-09): ikisi de yeme icme ve ayri baslik listeyi
      // uzatmaktan baska bir sey yapmiyordu.
      'Kafe', 'Kahveci', 'Çay evi', 'Restoran', 'Lokanta', 'Türk mutfağı',
      'Kebapçı', 'Balık restoranı', 'Ocakbaşı', 'Kahvaltı salonu', 'Fırın',
      'Fast food', 'Burgerci', 'Pizzacı', 'Tatlıcı', 'Dondurmacı',
    ],
  },
  {
    baslik: 'Gece',
    turler: ['Bar', 'Pub', 'Gece kulübü', 'Meyhane', 'Nargile kafe', 'Kokteyl barı'],
  },
  {
    baslik: 'Açık alan',
    turler: ['Park', 'Halk bahçesi', 'Doğal alan', 'Plaj', 'Meydan', 'Kamp alanı', 'Göl'],
  },
  {
    baslik: 'Kültür',
    turler: [
      'Müze', 'Sinema', 'Tiyatro', 'Sanat galerisi', 'Kütüphane',
      'Tarihi yer', 'Konser salonu', 'Kültür merkezi',
    ],
  },
  {
    baslik: 'Spor',
    turler: ['Spor salonu', 'Stadyum', 'Yüzme havuzu', 'Halı saha'],
  },
  {
    baslik: 'Alışveriş',
    turler: ['AVM', 'Market', 'Bakkal', 'Giyim mağazası', 'Kitapçı', 'Kuyumcu'],
  },
  {
    baslik: 'Diğer',
    turler: ['Otel', 'Eczane', 'Hastane', 'Banka', 'Kuaför', 'Güzellik salonu', 'Üniversite'],
  },
]

/** Duz liste - adet eslestirmesi ve dogrulama icin. */
export const TEMEL_TURLER: string[] = TEMEL_TUR_GRUPLARI.flatMap((g) => g.turler)

export type YakinTur = { tur: string; adet: number }

/**
 * Tur secicideki ADETLER: kullanicinin ILINDEKI tur sayilari.
 *
 * Kullanicinin kurali (2026-09-06): "Filtrelemede km siniri yok,
 * filtreleme yapan biri bulundugu sehirdeki kayitlara gore sonuclar
 * bulur." Yani secicideki sayi da il bazli - "Kafe 23" yazip 500 sonuc
 * gelmesi kullaniciyi yanıltirdi.
 *
 * Turlerin KENDISI bu cagriya bagli DEGIL: liste `TEMEL_TUR_GRUPLARI`
 * ile istemcide sabit. Buradan yalnizca sayilar geliyor, yani cagri
 * basarisiz olsa bile secici acilabiliyor.
 */
export async function ildekiTurleriGetir(
  lat: number,
  lng: number
): Promise<YakinTur[]> {
  const { data, error } = await supabase.rpc('ildeki_turler', {
    p_lat: lat,
    p_lng: lng,
  })
  if (error) throw new Error(hataMetni(error))
  return ((data as { tur: string; adet: number }[]) ?? []).map((s) => ({
    tur: s.tur,
    adet: s.adet,
  }))
}

export const POPULER_ESIGI = 10
export const YOGUN_ESIGI = 3

export type MekanDurumu = 'populer' | 'yogun' | 'sakin'

export function mekanDurumu(m: {
  kisiSayisi: number
  toplamCheckIn: number
}): MekanDurumu {
  if (m.toplamCheckIn >= POPULER_ESIGI) return 'populer'
  if (m.kisiSayisi >= YOGUN_ESIGI) return 'yogun'
  return 'sakin'
}

/**
 * Yakindaki mekanlar, canli kisi sayilariyla.
 *
 * `yaricapMetre` VERILMEZSE mesafe siniri hic uygulanmiyor; sunucu en
 * yakindan baslayarak 50 kayit donduruyor (kullanicinin karari
 * 2026-08-28: "gorunus olarak bir km siniri olmucak ... ama en
 * ustlerde konumuna en yakin yerler gorunecek").
 *
 * Aramada da mesafe siniri yok; sunucu tarafinda maliyet KILOMETREYLE
 * degil taranan mekan SAYISIYLA sinirlaniyor. Ayrinti ve olcum
 * degerleri migrasyon 20260828090000 icinde.
 */
export async function yakinMekanlariYogunlukIleGetir(
  lat: number,
  lng: number,
  yaricapMetre?: number | null,
  arama?: string,
  /**
   * Sunucuda uygulanacak tur suzgeci. Bos birakilirsa suzme yok.
   *
   * NEDEN SUNUCUDA: daraltma bir zamanlar ISTEMCIDE yapiliyordu
   * (`kesfetIcinSuz`) ve sunucu en yakin 50 kaydi tur ayrimi yapmadan
   * donduruyordu. Kullanicinin bolgesinde olculdu: o 50 kaydin yalnizca
   * 3'u sosyal turdeydi, oysa 500 m icinde 111 sosyal mekan vardi.
   * Yani liste dolu bir cevrede bile neredeyse bos gorunuyordu.
   */
  turler?: string[] | null,
  limit?: number | null,
  /**
   * Kacinci kayittan baslanacak. Sayfalama icin.
   *
   * NEDEN OFSET, IMLEC DEGIL: siralama KNN mesafesine gore
   * (`konum <-> nokta`) ve mesafe istemciye hic donmuyor, yani bir
   * imlec degeri elimizde yok. Ayrica kullanicinin konumu sabit
   * kaldigi surece siralama da sabit - akistaki gibi araya yeni kayit
   * girmiyor, dolayisiyla ofsetin kaydirma riski yok.
   */
  ofset?: number | null
): Promise<MekanYogunlukIle[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar_yogunluk', {
    p_lat: lat,
    p_lng: lng,
    p_yaricap_metre: yaricapMetre ?? null,
    p_arama: arama ?? null,
    p_turler: turler ?? null,
    p_limit: limit ?? null,
    p_ofset: ofset ?? 0,
  })
  if (error) throw new Error(hataMetni(error))
  return (data as MekanYogunlukSatiri[]).map((satir) => ({
    ...satiriMekanaCevir(satir),
    kisiSayisi: satir.kisi_sayisi,
    // Eski bir sunucu surumu bu alani gondermiyorsa 0 - "Populer"
    // rozeti cikmaz ama liste yine calisir.
    toplamCheckIn: satir.toplam_check_in ?? 0,
  }))
}

/**
 * Kesfet akisinda one cikan tur seti.
 *
 * Mekan veritabani 133 tur tasiyor (banka, kuyumcu, telefoncu, eczane
 * dahil). Hepsi ARAMADA bulunabilir olmali - kullanicinin istegi buydu:
 * "cok kapsamli olmali". Ama kesfet akisi farkli bir soruyu cevapliyor:
 * "su an nereye gidip birileriyle karsilasabilirim". Bir telefoncunun
 * o listede kafeyle yan yana durmasi akisi seyreltiyor.
 *
 * Bu yuzden ayrim SUZME degil BAGLAM: arama BOSKEN kesfet listesi bu
 * turlere daralir, kullanici bir sey aradigi anda butun turler geri
 * gelir. Kimse bir seyi kaybetmez, yalnizca varsayilan gorunum
 * uygulamanin amacina gore secilir.
 */
/**
 * Kesfet listesinin yaricapi. Kullanicinin karari (2026-08-31):
 * "bulundugum adrese gore en yakin 500 mt icerisindeki konumlar
 * yakindan uzaga siralanmali".
 *
 * ARAMADA UYGULANMAZ: arama butun veritabanini kapsamali, kullanici
 * baska sehirdeki bir mekani arayabilir.
 *
 * Gecmisi: 500 -> 200 (2026-08-31) -> 500 -> 1000 (2026-09-01) ->
 * **500** (2026-09-10). Son karar kullanicinin: "yakindaki mekanlar da
 * 500 m mesafedeki yerler gosterilsin, haritada da 500 m mesafe
 * gosterilsin."
 *
 * HARITA AYRI BIR SAYI TASIMIYOR: ayni gun harita icin 500 m'lik ayri
 * bir sinir denenmis ve GERI ALINMISTI ("sakin yerlerde cok bos
 * kaliyor") - o zaman liste 1 km'ydi ve iki yari birbirini tutmuyordu.
 * Simdi ikisi de 500 m, yani harita listenin aynisini ciziyor ve o
 * tutarsizlik bastan olusmuyor.
 *
 * OLCULDU (Bursa/Nilufer): 1 km'de 1.764 mekan, 500 m'de 466 (Kafe
 * 23 -> 6). Liste kisaliyor ama yakinlik vaadi guclesiyor.
 *
 * SINIR KESIN: yaricap icinde sonuc cikmazsa ekran ESKIDEN sinirsiz
 * ikinci bir istek atiyordu ve liste siniri asan mekanlar gosteriyordu
 * (kullanici ekran goruntusuyle yakaladi: 200 m sinirli listede 420-530
 * m kayitlar vardi). O kacis yolu KALDIRILDI; cevrede mekan yoksa liste
 * bos kalir.
 */
export const KESFET_YARICAP_METRE = 500

/**
 * Kesfet listesinin SAYFA BOYU - tavan degil.
 *
 * Kullanicinin istegi (2026-09-09): "1 km mesafe icerisindeki her tur
 * listelenecek, HEPSI asagi dogru kaydirilinca gorunecek." Yani liste
 * artik 100'de bitmiyor; dibe yaklasildikca sonraki sayfa iniyor.
 *
 * Sayfa boyu neden 100: 1 km icinde 1.764 mekan olculdu (Bursa/Nilufer).
 * Hepsini tek istekte cekmek hem agi hem ilk cizimi sisirirdi; sunucu
 * zaten tek istekte en fazla 200 satir donduruyor.
 */
export const KESFET_LIMIT = 100

export const SOSYAL_TURLER = new Set<string>([
  // Yeme icme
  'Kafe', 'Kahveci', 'Çay evi', 'İnternet kafe',
  'Restoran', 'Türk mutfağı', 'Kebapçı', 'Pizzacı', 'Balık restoranı',
  'Steakhouse', 'Suşi restoranı', 'İtalyan restoranı', 'Çin restoranı',
  'Burgerci', 'Ocakbaşı', 'Kahvaltı salonu', 'Fast food', 'Lokanta',
  'Yemek katı', 'Fırın', 'Tatlıcı', 'Dondurmacı', 'Meyve suyu barı',
  'Yeme içme',
  // Gece
  'Bar', 'Pub', 'Şarap evi', 'Kokteyl barı', 'Bira evi', 'Bira bahçesi',
  'Spor barı', 'Gece kulübü', 'Karaoke', 'Nargile kafe', 'Şaraphane',
  'Meyhane', 'Bira fabrikası',
  // Acik alan
  'Park', 'Milli park', 'Tabiat parkı', 'Halk bahçesi', 'Botanik bahçe',
  'Piknik alanı', 'Plaj', 'Meydan', 'Kamp alanı', 'Marina',
  'Seyir terası', 'Şelale', 'Göl', 'Kaplıca', 'Doğal alan',
  // Kultur
  'Müze', 'Sanat galerisi', 'Tarihi yer', 'Anıt', 'Kale', 'Ören yeri',
  'Kütüphane', 'Kültür merkezi', 'Tiyatro', 'Sahne sanatları',
  'Opera binası', 'Sinema', 'Canlı müzik', 'Konser salonu',
  'Sanat ve eğlence', 'Akvaryum', 'Hayvanat bahçesi', 'Lunapark',
  'Aquapark',
  // Spor
  'Spor salonu', 'Fitness merkezi', 'Yoga stüdyosu', 'Pilates stüdyosu',
  'Yüzme havuzu', 'Stadyum', 'Spor kulübü', 'Bowling salonu',
  'Bilardo salonu', 'Kayak merkezi', 'Kaykay parkı', 'Tenis kortu',
  'Spor ve rekreasyon',
  // Karsilasma ihtimali yuksek digerleri
  'AVM', 'Kitapçı', 'Semt pazarı', 'Üniversite', 'Kampüs binası',
  'Hamam',
  // Denetimde acilan turler (2026-08-23). Hepsi insanlarin bir arada
  // bulundugu yerler; 'yer-degil' bilerek YOK, o zaten okuma yolunda
  // filtreleniyor.
  'Halı saha', 'Düğün salonu', 'Çarşı', 'Oyun salonu', 'Öğrenci yurdu',
])

/**
 * Turun kullaniciya gosterilip gosterilmeyecegi.
 *
 * KARAR (kullanici, 2026-08-24): dis kaynaktan (Overture) gelen
 * mekanlarda tur GOSTERILMEZ - yalnizca ad ve semt gorunur. Alti
 * denetim ajani ve 87 bin kayitlik duzeltmeden sonra bile "Konak
 * Restaurant" ile "Hünkar Konakları" gibi ayrimlar isim kaliplariyla
 * cozulemiyor. Dogrulugu garanti edilemeyen bir alani gostermek yerine
 * hic gostermemek tercih edildi.
 *
 * Kullanicinin kendi ekledigi mekanda tur gosterilir: orayi ekleyen
 * kisi oradadir ve turu bilerek secmistir.
 */
export function turuGosterilir(mekan: { kaynak?: string }): boolean {
  return mekan.kaynak === 'kullanici'
}

// `kesfetIcinSuz` 2026-08-31'de KALDIRILDI. Kesfet daraltmasini istemci
// yapiyordu: sunucudan tur ayrimi olmadan gelen en yakin 50 kayit burada
// sosyal turlere suzuluyordu. Kullanicinin bolgesinde olculdu - o 50
// kaydin 3'u sosyaldi, oysa 500 m icinde 111 sosyal mekan vardi, yani
// liste dolu bir cevrede bosaliyordu. Suzgec artik `p_turler` ile
// SUNUCUDA uygulaniyor; cevrede hic sosyal mekan yoksa ekran sinirsiz
// ikinci bir istek atiyor (eski "eldekini goster" davranisinin karsiligi).

/**
 * Tek bir mekanin bilgisi - detay ekraninin basligi icin.
 *
 * Detay ekrani mekanin ADINI hic gostermiyordu; kullanici bir yere
 * girdiginde nerede oldugunu ekranda goremiyordu. Liste RPC'leri
 * yalnizca yakindakileri donduruyor, bu yuzden kimlikle dogrudan
 * okuma gerekiyor.
 */
export async function mekaniGetir(mekanId: string): Promise<Mekan | null> {
  const { data, error } = await supabase
    .from('mekanlar')
    .select('id, ad, tur, semt, il, kaynak, adres, osm_id, konum, kapak_fotograf, mahalle')
    .eq('id', mekanId)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  if (!data) return null
  return satiriMekanaCevir(data as unknown as MekanSatiri)
}
