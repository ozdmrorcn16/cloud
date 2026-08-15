import { supabase } from './supabase'

export type CheckIn = {
  id: string
  mekanId: string
  notMetni: string | null
  fotograf: string | null
  olusturmaZamani: string
  bitisZamani: string
  canliMi: boolean
}

type CheckInSatiri = {
  id: string
  mekan_id: string
  not_metni: string | null
  fotograf: string | null
  olusturma_zamani: string
  bitis_zamani: string
  konum: string | null
}

function satiriCheckInACevir(satir: CheckInSatiri): CheckIn {
  return {
    id: satir.id,
    mekanId: satir.mekan_id,
    notMetni: satir.not_metni,
    fotograf: satir.fotograf,
    olusturmaZamani: satir.olusturma_zamani,
    bitisZamani: satir.bitis_zamani,
    canliMi: satir.konum !== null,
  }
}

export async function checkInYap(
  mekanId: string,
  konum: { lat: number; lng: number },
  notMetni?: string,
  fotograf?: string
): Promise<CheckIn> {
  const { data, error } = await supabase.rpc('check_in_yap', {
    p_mekan_id: mekanId,
    p_lat: konum.lat,
    p_lng: konum.lng,
    p_not_metni: notMetni ?? null,
    p_fotograf: fotograf ?? null,
  })
  if (error) throw new Error(error.message)
  return satiriCheckInACevir(data as CheckInSatiri)
}
