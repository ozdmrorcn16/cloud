import { supabase } from './supabase'

export type BagDurumu = 'yok' | 'beklemede' | 'kabul'

export type BagKisi = {
  id: string
  kullaniciAdi: string
  ad: string
}

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadi')
  return id
}

async function rpcCagir(ad: string, parametreler: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(ad, parametreler)
  if (error) throw new Error(error.message)
}

export async function takipIstegiGonder(kullaniciId: string): Promise<void> {
  await rpcCagir('takip_istegi_gonder', { p_kullanici_id: kullaniciId })
}

export async function takipIsteginiYanitla(kullaniciId: string, kabul: boolean): Promise<void> {
  await rpcCagir('takip_istegini_yanitla', { p_kullanici_id: kullaniciId, p_kabul: kabul })
}

export async function takibiBirak(kullaniciId: string): Promise<void> {
  await rpcCagir('takibi_birak', { p_kullanici_id: kullaniciId })
}

export async function takipciyiCikar(kullaniciId: string): Promise<void> {
  await rpcCagir('takipciyi_cikar', { p_kullanici_id: kullaniciId })
}

export async function sohbetIstegiGonder(kullaniciId: string): Promise<void> {
  await rpcCagir('sohbet_istegi_gonder', { p_kullanici_id: kullaniciId })
}

export async function sohbetIsteginiYanitla(kullaniciId: string, kabul: boolean): Promise<void> {
  await rpcCagir('sohbet_istegini_yanitla', { p_kullanici_id: kullaniciId, p_kabul: kabul })
}

/**
 * Baskasinin profilinde hangi butonun gosterilecegini belirler.
 * Iki tabloya ayri ayri bakiyor; tablolarin RLS'i zaten yalnizca
 * kendi taraf oldugumuz satirlari gosteriyor.
 */
export async function bagDurumunuGetir(
  kullaniciId: string
): Promise<{ takip: BagDurumu; sohbet: BagDurumu }> {
  const benimId = await kendiKullaniciId()

  const { data: takipSatiri, error: takipHatasi } = await supabase
    .from('takipler')
    .select('durum')
    .eq('takip_eden_id', benimId)
    .eq('takip_edilen_id', kullaniciId)
    .maybeSingle()
  if (takipHatasi) throw new Error(takipHatasi.message)

  const { data: sohbetSatiri, error: sohbetHatasi } = await supabase
    .from('sohbet_istekleri')
    .select('durum')
    .eq('gonderen_id', benimId)
    .eq('alan_id', kullaniciId)
    .maybeSingle()
  if (sohbetHatasi) throw new Error(sohbetHatasi.message)

  return {
    takip: ((takipSatiri as { durum: BagDurumu } | null)?.durum ?? 'yok') as BagDurumu,
    sohbet: ((sohbetSatiri as { durum: BagDurumu } | null)?.durum ?? 'yok') as BagDurumu,
  }
}
