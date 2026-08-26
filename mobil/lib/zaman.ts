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

/**
 * "Şu an burada" ne kadar sure yazar?
 *
 * Check-in 4 saat boyunca CANLI kaliyor ama kullanicinin karari
 * (2026-08-27) etiketin yalnizca ILK BIR SAAT "şu an burada" demesi.
 * Sonrasinda check-in hala canli olsa bile "2 saat önce" yaziyor -
 * "su an" iddiasi bir saatten sonra dogru hissettirmiyor.
 */
const CANLI_ETIKET_SURESI = SAAT

/** Etiket "şu an burada" mi olmali? */
export function suAnBuradaMi(iso: string, canliMi: boolean): boolean {
  if (!canliMi) return false
  return Date.now() - new Date(iso).getTime() < CANLI_ETIKET_SURESI
}

/**
 * Check-in'in yapildigi an: "27.08.2026 00:23".
 *
 * Gorece zaman "ne kadar once" sorusunu cevapliyor; bu da "tam olarak
 * ne zaman" sorusunu. Ikisi birlikte duruyor.
 */
export function tamZaman(iso: string): string {
  const t = new Date(iso)
  const iki = (n: number) => String(n).padStart(2, '0')
  return `${iki(t.getDate())}.${iki(t.getMonth() + 1)}.${t.getFullYear()} ${iki(t.getHours())}:${iki(t.getMinutes())}`
}
