import { supabase } from './supabase'

export type Mekan = {
  id: string
  ad: string
  tur: string
  adres: string | null
  osmId: number | null
  konum: { lat: number; lng: number }
}

function noktayiCoz(wkt: string): { lat: number; lng: number } {
  // PostGIS geography, PostgREST uzerinden "POINT(lng lat)" WKT metni olarak doner.
  const eslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!eslesme) throw new Error(`Beklenmeyen konum formati: ${wkt}`)
  return { lng: parseFloat(eslesme[1]), lat: parseFloat(eslesme[2]) }
}

type MekanSatiri = {
  id: string
  ad: string
  tur: string
  adres: string | null
  osm_id: number | null
  konum: string
}

function satiriMekanaCevir(satir: MekanSatiri): Mekan {
  return {
    id: satir.id,
    ad: satir.ad,
    tur: satir.tur,
    adres: satir.adres,
    osmId: satir.osm_id,
    konum: noktayiCoz(satir.konum),
  }
}

export async function yakinMekanlariGetir(
  lat: number,
  lng: number,
  arama?: string
): Promise<Mekan[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar', {
    p_lat: lat,
    p_lng: lng,
    p_arama: arama ?? null,
  })
  if (error) throw new Error(error.message)
  return (data as MekanSatiri[]).map(satiriMekanaCevir)
}
