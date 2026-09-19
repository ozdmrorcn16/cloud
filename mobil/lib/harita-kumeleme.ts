/**
 * HARITA KUMELEME (kullanicinin referans tasarimi 2026-09-19: "gruplanmis
 * mekanlar: 8 ve 12 mekan sayisini gosterir; dokununca harita yakinlasir").
 *
 * Saf, platformdan bagimsiz: harita bileseni o anki gorunur bolgenin
 * genisligini ve piksel enini verir, buradan hucre boyu cikar ve ayni
 * hucreye dusen mekanlar tek kumeye toplanir. Izgara kumeleme (k-means
 * degil): tek gecis, her yakinlastirmada yeniden hesaplanabilecek kadar
 * ucuz ve deterministik - test edilebilir.
 *
 * SECILI MEKAN HIC KUMELENMEZ: kullanici bir igneye dokunduysa o igne
 * yerinde durmali; komsulariyla bir sayinin icinde kaybolmamali.
 */

export type KumeNoktasi = {
  id: string
  lat: number
  lng: number
}

export type Kume = {
  /** Kumenin anahtari (hucre) - React key icin. */
  id: string
  lat: number
  lng: number
  /** Kumedeki mekanlar; tek elemanliysa bu bir "tekil" ignedir. */
  uyeler: KumeNoktasi[]
}

/** Bir hucreye dusmesi icin en az bu kadar piksel yakin sayiliyor. */
export const KUME_HUCRE_PX = 56

/**
 * @param noktalar   Gorunur mekanlar.
 * @param lngDelta   Gorunur bolgenin boylam genisligi (derece).
 * @param enPx       Haritanin piksel eni.
 * @param seciliId   Kumelenmeyecek mekan.
 */
export function kumele(
  noktalar: KumeNoktasi[],
  lngDelta: number,
  enPx: number,
  seciliId: string | null = null
): Kume[] {
  if (noktalar.length === 0) return []
  // Hucre boyu derece cinsinden: ekranda KUME_HUCRE_PX piksel.
  // enPx ya da lngDelta yoksa (ilk cizim) kumeleme yapilmaz - her
  // igne tekil.
  const hucre = enPx > 0 && lngDelta > 0 ? (lngDelta / enPx) * KUME_HUCRE_PX : 0
  if (hucre <= 0) {
    return noktalar.map((n) => ({ id: n.id, lat: n.lat, lng: n.lng, uyeler: [n] }))
  }

  const hucreler = new Map<string, KumeNoktasi[]>()
  const sonuc: Kume[] = []
  for (const n of noktalar) {
    if (n.id === seciliId) {
      sonuc.push({ id: n.id, lat: n.lat, lng: n.lng, uyeler: [n] })
      continue
    }
    // Enlem hucresi de ayni derece boyunda: Mercator'da enlem/boylam
    // piksel orani cos(lat) ile degisir ama bu olcekte (bir sehir)
    // fark gozle gorulmez; sadelik kazaniyor.
    const anahtar = `${Math.floor(n.lat / hucre)}:${Math.floor(n.lng / hucre)}`
    const liste = hucreler.get(anahtar)
    if (liste) liste.push(n)
    else hucreler.set(anahtar, [n])
  }

  for (const [anahtar, uyeler] of hucreler) {
    if (uyeler.length === 1) {
      const n = uyeler[0]
      sonuc.push({ id: n.id, lat: n.lat, lng: n.lng, uyeler })
      continue
    }
    const lat = uyeler.reduce((t, u) => t + u.lat, 0) / uyeler.length
    const lng = uyeler.reduce((t, u) => t + u.lng, 0) / uyeler.length
    sonuc.push({ id: `kume:${anahtar}`, lat, lng, uyeler })
  }
  return sonuc
}

/** Kume uyelerini kapsayan sinir kutusu (yakinlasma icin). */
export function kumeSiniri(uyeler: { lat: number; lng: number }[]): {
  kuzey: number
  guney: number
  dogu: number
  bati: number
} {
  let kuzey = -90
  let guney = 90
  let dogu = -180
  let bati = 180
  for (const u of uyeler) {
    if (u.lat > kuzey) kuzey = u.lat
    if (u.lat < guney) guney = u.lat
    if (u.lng > dogu) dogu = u.lng
    if (u.lng < bati) bati = u.lng
  }
  return { kuzey, guney, dogu, bati }
}
