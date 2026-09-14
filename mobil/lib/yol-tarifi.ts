import { Linking, Platform } from 'react-native'

/**
 * YOL TARIFI YARDIMCILARI.
 *
 * Mekan sayfasindan cikarildi (2026-09-14): yakin mekanlar listesindeki
 * one cikan kartta da "Yol tarifi" var ve iki ekran AYNI kurallari
 * (kurulu harita suzgeci, adres bicimleri) kullanmali.
 */

export type HaritaSecimi = 'apple' | 'google'

/** Secim penceresi: iOS'ta Apple Haritalar da var, diger yerlerde yok. */
export function haritaSecenekleri(): HaritaSecimi[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

/**
 * Uygulamanin KURULU olup olmadigini sormak icin kullanilan semalar.
 *
 * iOS'ta `canOpenURL` yalnizca Info.plist'teki
 * LSApplicationQueriesSchemes listesinde BEYAN EDILEN semalari
 * sorabiliyor (app.json > ios.infoPlist). Beyan edilmezse cagri hata
 * vermeden HER ZAMAN false doner - yani beyan olmadan butun secenekler
 * gizlenirdi. Bu beyan NATIVE bir ayar: OTA ile gitmez, yeni derleme
 * ister.
 */
const SEMA: Record<HaritaSecimi, string> = {
  apple: 'maps://',
  google: 'comgooglemaps://',
}

/**
 * Yalnizca CIHAZDA KURULU olan haritalari dondurur (kullanicinin istegi
 * 2026-09-01: kurulu olmayan harita listede gorunmesin).
 *
 * `canOpenURL` bir nedenle patlarsa (web, izin, beklenmeyen durum) o
 * secenek ELENMIYOR, listede kaliyor: yol tarifi bulunmaz bir uygulama
 * icin gosterilse bile en fazla tarayicida acilir, ama yanlislikla
 * hepsini eleyip kullaniciyi yolsuz birakmak daha kotu olurdu.
 */
export async function kuruluHaritalar(): Promise<HaritaSecimi[]> {
  const adaylar = haritaSecenekleri()
  const sonuclar = await Promise.all(
    adaylar.map((secim) => Linking.canOpenURL(SEMA[secim]).catch(() => true))
  )
  const kurulular = adaylar.filter((_, i) => sonuclar[i])

  // HICBIRI cikmadiysa suzgeci UYGULAMIYORUZ, hepsini donduruyoruz.
  //
  // Sebep somut: Info.plist beyani NATIVE bir ayar ve OTA ile gitmiyor.
  // Bu kod beyansiz bir derlemeye OTA ile inerse canOpenURL her sema
  // icin false doner; suzgeci korumasiz uygulasaydik butun harita
  // secenekleri kaybolur ve yol tarifi hep tarayicida acilirdi - yani
  // calisan bir ozelligi bozmus olurduk.
  return kurulular.length > 0 ? kurulular : adaylar
}

/**
 * Harita adresleri. IKI KIP var ve ikisi gercekten farkli:
 *   'tarif'  -> yol tarifi acilir (hedef verilir)
 *   'goster' -> yalnizca konum haritada isaretlenir, rota cizilmez
 * Haritanin uzerindeki iki yuvarlak dugme bu ikisine karsilik geliyor.
 */
export function haritaAdresi(
  secim: HaritaSecimi,
  mekan: { ad: string; konum: { lat: number; lng: number } },
  kip: 'tarif' | 'goster'
) {
  const { lat, lng } = mekan.konum
  const ad = encodeURIComponent(mekan.ad)
  if (kip === 'goster') {
    return secim === 'apple'
      ? `https://maps.apple.com/?ll=${lat},${lng}&q=${ad}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  if (secim === 'apple') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${ad}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
