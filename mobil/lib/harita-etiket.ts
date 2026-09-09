/**
 * HARITADA HANGI IGNENIN ADI YAZILIR.
 *
 * Kural iki kez kirildi ve iki kez de kullanici bildirdi - cunku
 * hicbir sey onu olcmuyordu. Artik saf bir fonksiyon ve testi var.
 *
 *   2026-09-09 (once): sayi siniri ve aralik kurali IGNEYI de
 *   eliyordu; listede gorunen mekan haritada yoktu.
 *
 *   2026-09-09 (sonra): eleme METRE cinsindendi ve esik
 *   `max(50 m, cerceve * %22)` idi; birbirine yakin bir kumede on iki
 *   mekandan yalnizca IKISININ adi yaziliyordu ("isimleri yazmiyor").
 *
 * DOGRU OLCU METRE DEGIL PIKSEL: cakisan sey etiket KUTUSU. Iki etiket
 * yatayda kutu genisligi ya da dikeyde kutu yuksekligi kadar ayriysa
 * ust uste binmez (ayrik eksen testi). Boylece dikeyde siralanan
 * mekanlarin HEPSININ adi yazilabiliyor - metre esigi onlari da
 * eliyordu.
 */

export type EtiketAdayi = {
  id: string
  konum: { lat: number; lng: number } | null
  /** Oncelik: kalabalik olan once etiketlenir. */
  kisiSayisi: number
  /** Ikinci oncelik olcutu; cagiran taraf belirliyor. */
  populer?: boolean
}

export type EtiketCercevesi = {
  /** Haritanin merkez koordinati. */
  merkez: { lat: number; lng: number }
  /** Gorunen alanin derece cinsinden yuksekligi ve genisligi. */
  latitudeDelta: number
  longitudeDelta: number
  /** Haritanin piksel olcusu. */
  en: number
  boy: number
}

/** Etiket kutusu (px): ad en fazla 108 px + igne, iki satir ~26 px. */
export const ETIKET_GENISLIK = 130
export const ETIKET_YUKSEKLIK = 26

/**
 * Ust sinir: geometri zaten eliyor ama cok yakinlastirilmis bir
 * haritada yuzlerce etiket cizmek gereksiz. 14, 390x210'luk bir
 * haritaya rahat sigan sayinin biraz ustunde.
 */
export const EN_FAZLA_ETIKET = 14

export function etiketlenecekler<T extends EtiketAdayi>(
  adaylar: T[],
  cerceve: EtiketCercevesi | null
): Set<string> {
  if (!cerceve || cerceve.en === 0 || cerceve.boy === 0) return new Set()
  if (!cerceve.latitudeDelta || !cerceve.longitudeDelta) return new Set()

  const pxEnlem = cerceve.boy / cerceve.latitudeDelta
  const pxBoylam = cerceve.en / cerceve.longitudeDelta

  // ONCELIK: once kalabalik, sonra populer. Haritanin cevapladigi soru
  // "su an nerede hareket var" - adi yazilacak ilk yer orasi.
  const sirali = adaylar
    .filter((a) => a.konum)
    .slice()
    .sort((a, b) => {
      const oncelik = (m: T) => (m.kisiSayisi > 0 ? 2 : m.populer ? 1 : 0)
      return oncelik(b) - oncelik(a)
    })

  const secilen = new Set<string>()
  const konmus: { x: number; y: number }[] = []
  for (const aday of sirali) {
    if (secilen.size >= EN_FAZLA_ETIKET) break
    const x = (aday.konum!.lng - cerceve.merkez.lng) * pxBoylam
    const y = (cerceve.merkez.lat - aday.konum!.lat) * pxEnlem
    const cakisiyor = konmus.some(
      (k) => Math.abs(k.x - x) < ETIKET_GENISLIK && Math.abs(k.y - y) < ETIKET_YUKSEKLIK
    )
    if (cakisiyor) continue
    secilen.add(aday.id)
    konmus.push({ x, y })
  }
  return secilen
}
