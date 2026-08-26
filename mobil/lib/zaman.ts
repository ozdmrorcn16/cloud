const DAKIKA = 60 * 1000
const SAAT = 60 * DAKIKA
const GUN = 24 * SAAT

/**
 * "Ne kadar once" bicimi.
 *
 * Check-in kartlarinda tam saat kimseye lazim degil; onemli olan
 * yakinlik. Bir haftayi gecen kayit TARIHE donuyor, cunku "23 gün"
 * artik yakinlik bilgisi tasimiyor.
 *
 * `lib`e tasindi (2026-08-26): ayni kart hem ana sayfada hem profildeki
 * anilarda kullaniliyor, dolayisiyla bicimlendirme de ortak olmali.
 */
export function gorecelZaman(
  iso: string,
  t: (anahtar: string, secenekler?: Record<string, unknown>) => string
): string {
  const gecen = Date.now() - new Date(iso).getTime()
  if (gecen < DAKIKA) return t('anaSayfa.azOnce')
  if (gecen < SAAT) return t('anaSayfa.dakika', { sayi: Math.floor(gecen / DAKIKA) })
  if (gecen < GUN) return t('anaSayfa.saat', { sayi: Math.floor(gecen / SAAT) })
  if (gecen < 7 * GUN) return t('anaSayfa.gun', { sayi: Math.floor(gecen / GUN) })

  const tarih = new Date(iso)
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}
