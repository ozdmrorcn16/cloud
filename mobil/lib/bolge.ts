import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { ULKELER, type Ulke } from './ulkeler-veri'

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

/** Turkiye: bu ulkede il/ilce listesi var, digerlerinde yalnizca ulke. */
export const TURKIYE = 'TR'

export type UlkeDili = keyof Omit<Ulke, 'kod'>

/**
 * ULKE LISTESI (2026-09-18, hesap olusturmadaki "yasadigin bolge"
 * adimi). `lib/ulkeler-veri.ts` ICU'dan uretildi: 242 ulke, 7 dilde ad.
 * Secilen dilde alfabetik; Turkiye listenin basinda (kullanicilarin
 * buyuk cogunlugu) - aramayla da bulunur.
 */
export function ulkeleriGetir(dil: UlkeDili): { kod: string; ad: string }[] {
  const liste = ULKELER.map((u) => ({ kod: u.kod, ad: u[dil] ?? u.en }))
    .sort((a, b) => a.ad.localeCompare(b.ad, dil))
  const tr = liste.find((u) => u.kod === TURKIYE)
  return tr ? [tr, ...liste.filter((u) => u.kod !== TURKIYE)] : liste
}

export function ulkeAdi(kod: string | null, dil: UlkeDili): string | null {
  if (!kod) return null
  const u = ULKELER.find((x) => x.kod === kod)
  return u ? (u[dil] ?? u.en) : kod
}

/**
 * Profilde gosterilen bicim: "Nilüfer, Bursa". Il/ilce yalnizca ikisi
 * birden doluysa yazilir (2026-09-11 kurali).
 *
 * ULKE HICBIR ZAMAN GOSTERILMEZ (kullanicinin karari 2026-09-18:
 * "sadece ulke hep gizli kalacak"): kayit icin toplaniyor, profilde
 * yazilmiyor - ne kendi profilinde ne baskasininkinde. Turkiye
 * disindaki bir kullanicinin profilinde bolge satiri bos kalir.
 */
export function bolgeMetni(il: string | null, ilce: string | null): string | null {
  if (!il || !ilce) return null
  return `${ilce}, ${il}`
}
