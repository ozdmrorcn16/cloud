import { supabase } from './supabase'

const GECERLILIK_SANIYE = 60 * 60

/**
 * Profil fotograflari private bir bucket'ta duruyor; genel URL uretmek
 * ise yaramaz (Faz 2c'de bulundu: getPublicUrl private bucket icin
 * gecersiz adres uretiyordu ve ekranda kirik resim cikiyordu).
 * Erisim yalnizca imzali URL ile olur, imzayi da storage politikasi
 * kimin alabilecegine karar vererek sinirlar.
 */
export async function profilFotografiUrl(yol: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('profil-fotograflari')
    .createSignedUrl(yol, GECERLILIK_SANIYE)
  if (error) return null
  return data?.signedUrl ?? null
}

/**
 * Check-in fotograflari da private bir bucket'ta duruyor; ayni sebeple
 * imzali URL gerekiyor.
 *
 * Imzalama basarisiz olursa null doner ve cagiran taraf fotografsiz
 * cizer. Bu bekleniyor: storage politikasi fotografi her zaman satirla
 * ayni anda acmiyor (ornegin baska bir mekanda canli olan bir bagin
 * fotografi). Kirik resim gostermektense hic gostermemek dogru.
 */
export async function checkInFotografiUrl(yol: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('check-in-fotograflari')
    .createSignedUrl(yol, GECERLILIK_SANIYE)
  if (error) return null
  return data?.signedUrl ?? null
}

/** Birden fazla yolu tek seferde imzalar; basarisiz olanlar atlanir. */
export async function profilFotograflariUrl(yollar: string[]): Promise<string[]> {
  const sonuclar = await Promise.all(yollar.map((yol) => profilFotografiUrl(yol)))
  return sonuclar.filter((url): url is string => url !== null)
}

/**
 * Check-in fotograflarini TOPLU imzalar (2026-09-21, coklu fotograf):
 * akis sayfasi 30 kart x 5 fotograf = 150 imza olabilir; tek tek istek
 * atmak akisi yavaslatirdi. Tek `createSignedUrls` cagrisi; yol ->
 * imzali adres haritasi doner, imzalanamayan yol haritada yer almaz
 * (cagiran fotografsiz cizer - eski davranisla ayni).
 */
export async function checkInFotografiUrlHaritasi(yollar: string[]): Promise<Record<string, string>> {
  const tekil = [...new Set(yollar.filter((y) => y))]
  if (tekil.length === 0) return {}
  const { data, error } = await supabase.storage
    .from('check-in-fotograflari')
    .createSignedUrls(tekil, GECERLILIK_SANIYE)
  if (error || !data) return {}
  const harita: Record<string, string> = {}
  data.forEach((satir, i) => {
    if (!satir.error && satir.signedUrl) harita[satir.path ?? tekil[i]] = satir.signedUrl
  })
  return harita
}

/** Bir check-in'in fotograflarini SIRASIYLA imzalar; imzalanamayan atlanir. */
export async function checkInFotografiUrlleri(yollar: string[]): Promise<string[]> {
  const harita = await checkInFotografiUrlHaritasi(yollar)
  return yollar.map((y) => harita[y]).filter((u): u is string => Boolean(u))
}
