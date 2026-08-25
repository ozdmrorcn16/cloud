import { supabase } from './supabase'
import { noktayiCoz } from './konum'

export type Mekan = {
  id: string
  ad: string
  tur: string
  /** Semt / mahalle. Kaynakta %97 dolu; yine de null olabilir. */
  semt: string | null
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
  if (error) throw new Error(error.message)
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
  if (error) throw new Error(error.message)
  return satiriMekanaCevir(data as MekanSatiri)
}

export type MekanYogunlukIle = Mekan & { kisiSayisi: number }

type MekanYogunlukSatiri = MekanSatiri & { kisi_sayisi: number }

export async function yakinMekanlariYogunlukIleGetir(
  lat: number,
  lng: number,
  yaricapMetre: number,
  arama?: string
): Promise<MekanYogunlukIle[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar_yogunluk', {
    p_lat: lat,
    p_lng: lng,
    p_yaricap_metre: yaricapMetre,
    p_arama: arama ?? null,
  })
  if (error) throw new Error(error.message)
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

/** Kesfet akisi icin: arama bosken sosyal turlere daralt. */
export function kesfetIcinSuz<T extends { tur: string }>(
  mekanlar: T[],
  aramaVarMi: boolean
): T[] {
  if (aramaVarMi) return mekanlar
  const sosyal = mekanlar.filter((m) => SOSYAL_TURLER.has(m.tur))
  // Cevrede hic sosyal mekan yoksa bos ekran gostermek yerine eldekini
  // gosteriyoruz: kucuk yerlesimlerde liste tamamen bosalabilir.
  return sosyal.length > 0 ? sosyal : mekanlar
}

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
    .select('id, ad, tur, semt, kaynak, adres, osm_id, konum')
    .eq('id', mekanId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  return satiriMekanaCevir(data as unknown as MekanSatiri)
}
