import type { Region } from 'react-native-maps'

/**
 * GERCEK HARITA icin ortak ayarlar - `CanliHarita.native` ve
 * `MekanKapakHarita.native` ayni degerleri kullaniyor.
 *
 * Ikisi ayri yerde tanimliyken kart kucuk haritasi ile buyuk harita
 * farkli gorunurdu; ayni kavram her ekranda ayni bicimde cizilir
 * (kimlik kurali). Dosya YALNIZCA native tarafindan okunuyor -
 * `Region` tip olarak iceri aliniyor, yani derlemede iz birakmiyor.
 */

/**
 * Google'in kendi ilgi noktasi etiketleri kapatiliyor: bizim mekan
 * ignelerimizle ayni yerde ikinci bir isim gorunuyordu. Yalnizca
 * Android'de gecerli (Google saglayici); iOS bunu prop ile yapiyor.
 */
export const GOOGLE_HARITA_STILI = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

/** Merkez ve gosterim yaricapindan (metre) harita bolgesi uretir. */
export function bolgeUret(merkez: { lat: number; lng: number }, gosterimMetre: number): Region {
  const enlemRadyan = (merkez.lat * Math.PI) / 180
  return {
    latitude: merkez.lat,
    longitude: merkez.lng,
    latitudeDelta: (gosterimMetre * 2) / 110540,
    longitudeDelta: (gosterimMetre * 2) / (111320 * Math.cos(enlemRadyan)),
  }
}
