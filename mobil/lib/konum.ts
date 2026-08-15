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

export function noktayiCoz(wkt: string): { lat: number; lng: number } {
  const eslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!eslesme) throw new Error(`Beklenmeyen konum formati: ${wkt}`)
  return { lng: parseFloat(eslesme[1]), lat: parseFloat(eslesme[2]) }
}
