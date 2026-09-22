import type { BekleyenEtiket } from './etiket'

/**
 * Bekleyen bir etiketin aciklama satiri.
 *
 * Check-in ve hikaye ayni listede duruyor (2026-09-22), metinleri ayri:
 * check-in her zaman bir mekana bagli, hikayede mekan ISTEGE BAGLI. Iki
 * ekran (Bildirimler ve Gizlilik > Bekleyen etiketler) ayni satiri
 * ciziyor, bu yuzden metin tek yerde uretiliyor.
 */
export function etiketMetni(
  t: (anahtar: string, degerler?: Record<string, string>) => string,
  etiket: Pick<BekleyenEtiket, 'tur' | 'mekanAdi'>
): string {
  if (etiket.tur === 'hikaye') {
    return etiket.mekanAdi
      ? t('bildirimler.hikayeEtiketMetniMekan', { mekan: etiket.mekanAdi })
      : t('bildirimler.hikayeEtiketMetni')
  }
  return t('bildirimler.etiketMetni', { mekan: etiket.mekanAdi ?? '' })
}
