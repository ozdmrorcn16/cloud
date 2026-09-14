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
 * ZAMAN ETIKETI (kullanicinin karari 2026-09-07).
 *
 * Kullanicinin ifadesi: "Check-in yapan biri yaptigi an 'su an burada'
 * kisminda gorunuyor... 1 saati dolunca '1 saat once', kac saat
 * gecmisse o sekilde devam eden bir gosterme."
 *
 *   0 - 60 dk    "şu an burada"
 *   60 dk sonra  gorece zaman: "1 saat önce", "5 saat önce", "1 gün önce"
 *
 * Bu, 2026-08-29'un uc kademeli 30 dakikalik kuralinin YERINI ALIYOR.
 * Ayrica 2026-09-04'te "sure kullanici tarafindan secilecek" diye acik
 * birakilan karar da kapandi: sure SABIT ve 1 saat.
 *
 * Ikinci kademe icin yeni bir sey yazilmadi - `gorecelZaman` zaten
 * dakika -> saat -> gun -> tarih basamaklarini uretiyor.
 *
 * Sunucu ayni pencerede: check-in bir saat sonra aniya donusuyor
 * (migrasyon 20260907120000) ve her 10 dakikada bir kosan cron
 * koordinati siliyor.
 */
/**
 * "Su an burada" etiketinin suresi: 1 SAAT (kullanicinin karari
 * 2026-09-07).
 *
 * Sunucu tarafi da ayni: `check_in_yap` bitis zamanini
 * `now() + interval '1 hour'` yaziyor (migrasyon 20260907120000).
 * Iki sayi AYRI YERLERDE durdugu icin birlikte degismeli - yoksa
 * kayit sunucuda hala canliyken ekran ona tarih basar.
 */
const CANLI_ETIKET_SURESI = SAAT

/** Gorece zamanin ("35 dk önce") gosterildigi ust sinir. */
const GORECE_SINIRI = SAAT

/** Etiket "şu an burada" mi olmali? */
export function suAnBuradaMi(iso: string, canliMi: boolean): boolean {
  if (!canliMi) return false
  return Date.now() - new Date(iso).getTime() < CANLI_ETIKET_SURESI
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

/** Iki an ayni takvim gununde mi (cihaz saat dilimine gore)? */
export function ayniGunMu(isoA: string, isoB: string): boolean {
  const a = new Date(isoA)
  const b = new Date(isoB)
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Sohbetteki gun ayraci: "Bugün" / "Dün" / "12 Eylül" / "12 Eylül 2025".
 *
 * Yil yalnizca bu yildan degilse yazilir - "12 Eylül 2026" bugunun
 * yilinda gereksiz uzun. Ay adi cihaz diline gore (`toLocaleDateString`);
 * "Bugün"/"Dün" sozlukten geliyor ki yedi dilde tutarli olsun.
 */
export function gunEtiketi(
  iso: string,
  dil: string,
  metin: { bugun: string; dun: string },
  simdi: number = Date.now()
): string {
  const bugun = new Date(simdi).toISOString()
  if (ayniGunMu(iso, bugun)) return metin.bugun
  if (ayniGunMu(iso, new Date(simdi - GUN).toISOString())) return metin.dun
  const t = new Date(iso)
  const ayniYil = t.getFullYear() === new Date(simdi).getFullYear()
  return t.toLocaleDateString(dil, { day: 'numeric', month: 'long', ...(ayniYil ? {} : { year: 'numeric' }) })
}
