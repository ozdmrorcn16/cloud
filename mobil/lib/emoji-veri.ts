import type { Dil } from './dil'

/**
 * TAM EMOJI LISTESI + ARAMA (2026-09-26, anlik emoji sayfasi). Veri
 * `araclar/emoji-veri-uret.mjs` ile uretilir (emojibase sirasi, Unicode
 * 15.0'a kadar; arama kelimeleri CLDR, 7 dil). Kelime dosyasi yalnizca
 * ilk aramada ve yalnizca o dil icin okunur.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LISTE: string[] = require('./emoji-veri/liste.json')

const KELIMELER: Record<Dil, () => string[]> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  tr: () => require('./emoji-veri/tr.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  en: () => require('./emoji-veri/en.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  de: () => require('./emoji-veri/de.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  es: () => require('./emoji-veri/es.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  fr: () => require('./emoji-veri/fr.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ru: () => require('./emoji-veri/ru.json'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ar: () => require('./emoji-veri/ar.json'),
}

export function tumEmojiler(): string[] {
  return LISTE
}

/**
 * Sorguya uyan emojiler (liste sirasiyla). Uygulama dilinde ara; hic
 * sonuc yoksa Ingilizce kelimelerde de ara (karisik dil yazanlar icin).
 */
export function emojiAra(sorgu: string, dil: Dil): string[] {
  const s = sorgu.trim().toLocaleLowerCase(dil)
  if (!s) return LISTE
  const ara = (kelimeler: string[]) => LISTE.filter((_, i) => (kelimeler[i] ?? '').includes(s))
  const sonuc = ara(KELIMELER[dil]())
  return sonuc.length > 0 || dil === 'en' ? sonuc : ara(KELIMELER.en())
}
