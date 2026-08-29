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
 * ZAMAN ETIKETININ UC KADEMESI (kullanicinin karari 2026-08-29).
 *
 * Onceki kural "4 saat canli, ilk bir saat 'şu an burada'" idi. 4 saat
 * kaldirildi; yerine su geldi:
 *
 *   0 - 30 dk   "şu an burada"
 *   30 - 60 dk  gorece zaman: "35 dk önce", "1 saat önce"
 *   60 dk sonra ibare YOK; yalnizca tarih ve saat kaliyor
 *
 * Sunucu tarafi da ayni pencereye cekildi: check-in 30 dakika sonra
 * aniya donusuyor (migrasyon 20260829100000). Yani "canli" olmanin
 * suresi ile etiketin suresi artik AYNI - onceden etiket bir saatte
 * susuyor ama kayit dort saat canli kaliyordu.
 */
const CANLI_ETIKET_SURESI = 30 * DAKIKA

/** Gorece zamanin ("35 dk önce") gosterildigi ust sinir. */
const GORECE_SINIRI = SAAT

/** Etiket "şu an burada" mi olmali? */
export function suAnBuradaMi(iso: string, canliMi: boolean): boolean {
  if (!canliMi) return false
  return Date.now() - new Date(iso).getTime() < CANLI_ETIKET_SURESI
}

/** Gorece zaman ("35 dk önce") hala anlamli mi? */
export function goreceZamanGosterilir(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() <= GORECE_SINIRI
}

/** Yalnizca saat: "09:52". Bir saatten eski kayitlarda kullaniliyor. */
export function saatYazisi(iso: string): string {
  const t = new Date(iso)
  const iki = (n: number) => String(n).padStart(2, '0')
  return `${iki(t.getHours())}:${iki(t.getMinutes())}`
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
