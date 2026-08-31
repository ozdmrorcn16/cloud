import { supabase } from './supabase'
import { noktayiCoz } from './konum'
import { hataMetni } from './hata-metni'

export type Mekan = {
  id: string
  ad: string
  tur: string
  /** Semt / mahalle. Kaynakta %97 dolu; yine de null olabilir. */
  semt: string | null
  /**
   * Mahalle. `semt` ILCE tutar (Nilufer), mahalle onun altinda bir
   * kademedir (Ertugrul) ve ekranda varsa O gosterilir. Kaynak: OSM
   * yerlesim noktalari; Turkiye'de mahalle SINIRI bulunmadigi icin
   * "ayni ilcedeki en yakin mahalle merkezi" yontemiyle atandi.
   */
  mahalle: string | null
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
}

type MekanSatiri = {
  id: string
  ad: string
  tur: string
  semt: string | null
  mahalle?: string | null
  kaynak?: string | null
  adres: string | null
  osm_id: number | null
  konum: string
}

function satiriMekanaCevir(satir: MekanSatiri): Mekan {
  return {
    id: satir.id,
    ad: satir.ad,
    tur: satir.tur,
    semt: satir.semt ?? null,
    mahalle: satir.mahalle ?? null,
    // Eski RPC'ler kaynak dondurmuyorsa dis kaynak varsayilir: tur
    // gosterilmez. Guvenli taraf bu.
    kaynak: satir.kaynak ?? 'overture',
    adres: satir.adres,
    osmId: satir.osm_id,
    konum: noktayiCoz(satir.konum),
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

export type MekanYogunlukIle = Mekan & { kisiSayisi: number }

type MekanYogunlukSatiri = MekanSatiri & { kisi_sayisi: number }

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
  limit?: number | null
): Promise<MekanYogunlukIle[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar_yogunluk', {
    p_lat: lat,
    p_lng: lng,
    p_yaricap_metre: yaricapMetre ?? null,
    p_arama: arama ?? null,
    p_turler: turler ?? null,
    p_limit: limit ?? null,
  })
  if (error) throw new Error(hataMetni(error))
  return (data as MekanYogunlukSatiri[]).map((satir) => ({
    ...satiriMekanaCevir(satir),
    kisiSayisi: satir.kisi_sayisi,
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
 * 2026-08-31'de 500'den 200'e INDIRILDI (kullanicinin istegi: "200 mt en
 * yakinindaki yerler listelensin en yakindan uzaga"). Bedeli olculdu ve
 * biliniyor: kullanicinin kendi bolgesinde 200 m icinde 3 sosyal mekan
 * var, 500 m icinde 111. Yogun yerde fark kapaniyor (Kadikoy 1.456 /
 * 5.363). Cevrede hic mekan cikmazsa ekran sinirsiz ikinci bir istek
 * atiyor, yani liste bos kalmiyor.
 */
export const KESFET_YARICAP_METRE = 200

/**
 * Kesfet listesinde en fazla kac mekan. Siralama en yakindan oldugu
 * icin bu "en yakin 100" demek. Yogun yerlerde 500 m'ye binlerce sosyal
 * mekan sigiyor (olculdu: Kadikoy 5.363, Taksim 4.045); hepsini
 * gondermek agi ve listeyi bosuna sisirir.
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
    .select('id, ad, tur, semt, mahalle, kaynak, adres, osm_id, konum')
    .eq('id', mekanId)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  if (!data) return null
  return satiriMekanaCevir(data as unknown as MekanSatiri)
}
