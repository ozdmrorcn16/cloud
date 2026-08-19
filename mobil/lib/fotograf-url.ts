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

/** Birden fazla yolu tek seferde imzalar; basarisiz olanlar atlanir. */
export async function profilFotograflariUrl(yollar: string[]): Promise<string[]> {
  const sonuclar = await Promise.all(yollar.map((yol) => profilFotografiUrl(yol)))
  return sonuclar.filter((url): url is string => url !== null)
}
