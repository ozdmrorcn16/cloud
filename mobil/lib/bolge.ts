import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

/**
 * IL VE ILCE LISTESI - profildeki "yasadigin bolge" secimi icin.
 *
 * Kullanicinin istegi (2026-09-11): "profili duzenlemeye yasadigin
 * bolge diye bir sey ekleyelim, il ilce secilsin, sadece opsiyonel."
 *
 * LISTE TURETILMIS DEGIL, GERCEK KAYIT. Kullanicinin kurali geregi
 * (`turetilmis-veri-degil-gercek-kayit`) ilce listesi `mekanlar.semt`
 * sutunundan CIKARILMADI: o sutun karma bir kaynak (poligon testi +
 * Foursquare `locality`) ve icinde "Avustralya", "Bilinmez", "Marmara
 * Bölgesi" gibi copler var - Bursa'da 17 gercek ilcenin yaninda 33 cop
 * kayit olculdu.
 *
 * `public.ilceler` tablosu OSM IDARI SINIR POLIGONLARIYLA yapilan
 * nokta-icinde-poligon testinden geliyor: 968 (il, ilce) cifti, 81 il,
 * Bursa'da tam 17 ilce ve sifir cop.
 */

/**
 * 81 il, alfabetik.
 *
 * Kaynak `ilceler` tablosu: `iller` tablosu da var ama o poligon
 * tasiyor ve yalnizca sunucu tarafi hesaplar icin. Ayni listeyi iki
 * yerden okumak, birinde olup otekinde olmayan bir il ihtimali
 * yaratirdi - burada okunan liste ilce seciminin de kaynagi.
 */
export async function illeriGetir(): Promise<string[]> {
  const { data, error } = await supabase
    .from('ilceler')
    .select('il')
    .order('il', { ascending: true })
  if (error) throw new Error(hataMetni(error))
  const hepsi = (data as { il: string }[]).map((s) => s.il)
  return Array.from(new Set(hepsi))
}

/** Bir ilin ilceleri, alfabetik. */
export async function ilceleriGetir(il: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('ilceler')
    .select('ilce')
    .eq('il', il)
    .order('ilce', { ascending: true })
  if (error) throw new Error(hataMetni(error))
  return (data as { ilce: string }[]).map((s) => s.ilce)
}

/** Profilde gosterilen bicim: "Nilüfer, Bursa". */
export function bolgeMetni(il: string | null, ilce: string | null): string | null {
  if (!il || !ilce) return null
  return `${ilce}, ${il}`
}
