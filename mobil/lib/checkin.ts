import { supabase } from './supabase'
import { noktayiCoz } from './konum'

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

export async function checkIndenAyril(checkInId: string): Promise<void> {
  const { error } = await supabase.rpc('check_inden_ayril', { p_check_in_id: checkInId })
  if (error) throw new Error(error.message)
}

export type CheckInGorunumu = CheckIn & { kullaniciId: string; kullaniciAdi: string }

type CheckInSatiriProfilli = CheckInSatiri & { kullanici_id: string; profiller: { ad: string } }

function satiriGorunumeCevir(satir: CheckInSatiriProfilli): CheckInGorunumu {
  return {
    ...satiriCheckInACevir(satir),
    kullaniciId: satir.kullanici_id,
    kullaniciAdi: satir.profiller.ad,
  }
}

export async function suAnBurdakileriGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, profiller(ad)')
    .not('konum', 'is', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}

export async function mekanAnilariniGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, profiller(ad)')
    .is('konum', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}

export type AniGorunumu = CheckIn & { mekanAdi: string; mekanKonumu: { lat: number; lng: number } }

type CheckInSatiriMekanli = CheckInSatiri & { mekanlar: { ad: string; konum: string } }

export async function kendiAnilariniGetir(kullaniciId: string): Promise<AniGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, mekanlar(ad, konum)')
    .eq('kullanici_id', kullaniciId)
    .is('konum', null)
    .order('olusturma_zamani', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriMekanli[]).map((satir) => ({
    ...satiriCheckInACevir(satir),
    mekanAdi: satir.mekanlar.ad,
    mekanKonumu: noktayiCoz(satir.mekanlar.konum),
  }))
}

export async function aniyiSil(checkInId: string): Promise<void> {
  const { error } = await supabase.from('check_inler').delete().eq('id', checkInId)
  if (error) throw new Error(error.message)
}
