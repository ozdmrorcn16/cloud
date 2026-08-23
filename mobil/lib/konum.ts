import * as Location from 'expo-location'

const DUNYA_YARICAPI_METRE = 6371000

export function mesafeMetre(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radyana = (derece: number) => (derece * Math.PI) / 180
  const dLat = radyana(lat2 - lat1)
  const dLng = radyana(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radyana(lat1)) * Math.cos(radyana(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return DUNYA_YARICAPI_METRE * c
}

export async function cihazKonumunuAl(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Konum izni verilmedi')
  }
  const konum = await Location.getCurrentPositionAsync({})
  return { lat: konum.coords.latitude, lng: konum.coords.longitude }
}

/**
 * Sunucudan gelen bir noktayi enlem/boylama cevirir.
 *
 * PostgREST `geography` sutununu WKT olarak DEGIL, hex EWKB olarak
 * donduruyor (ornegin `0101000020E6100000...`). Ayristirici basta
 * yalnizca WKT bekliyordu ve "Mekanlari kesfet" ekrani canlida
 * "Beklenmeyen konum formati" ile patliyordu - jest testleri
 * Supabase'i mock'ladigi, gorunurluk testleri de bu alani hic
 * okumadigi icin kusur uzun sure gorulmedi.
 *
 * Iki bicim de kabul ediliyor: WKT hala calisiyor (ornegin
 * `ST_AsText` ile donen bir sorgu), hex EWKB ise gercekte gelen bicim.
 */
export function noktayiCoz(deger: string): { lat: number; lng: number } {
  const wktEslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(deger)
  if (wktEslesme) {
    return { lng: parseFloat(wktEslesme[1]), lat: parseFloat(wktEslesme[2]) }
  }

  if (/^[0-9a-fA-F]+$/.test(deger) && deger.length >= 42) {
    const nokta = ewkbCoz(deger)
    if (nokta) return nokta
  }

  throw new Error(`Beklenmeyen konum formati: ${deger}`)
}

/**
 * Hex EWKB cozumleyici - yalnizca POINT icin.
 *
 * Duzen: 1 bayt bayt-sirasi, 4 bayt geometri turu, (SRID bayragi
 * varsa) 4 bayt SRID, ardindan X ve Y icin sekizer baytlik cift
 * duyarlikli sayilar. SRID bayragi tur alanindaki 0x20000000 bitidir.
 */
function ewkbCoz(hex: string): { lat: number; lng: number } | null {
  const baytlar = new Uint8Array(hex.length / 2)
  for (let i = 0; i < baytlar.length; i++) {
    baytlar[i] = parseInt(hex.substr(i * 2, 2), 16)
  }

  const gorunum = new DataView(baytlar.buffer)
  const kucukSonlu = baytlar[0] === 1
  const tur = gorunum.getUint32(1, kucukSonlu)

  // Alt bayt geometri turunu verir; 1 = POINT. Baska turleri
  // cozmuyoruz, cunku uygulamada nokta disinda geometri yok.
  if ((tur & 0xff) !== 1) return null

  const sridVar = (tur & 0x20000000) !== 0
  const konumBasi = sridVar ? 9 : 5
  if (baytlar.length < konumBasi + 16) return null

  return {
    lng: gorunum.getFloat64(konumBasi, kucukSonlu),
    lat: gorunum.getFloat64(konumBasi + 8, kucukSonlu),
  }
}
