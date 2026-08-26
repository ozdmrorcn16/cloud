import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

export type BagDurumu = 'yok' | 'beklemede' | 'kabul'

export type BagKisi = {
  id: string
  kullaniciAdi: string
  ad: string
}

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadı')
  return id
}

async function rpcCagir(ad: string, parametreler: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(ad, parametreler)
  if (error) throw new Error(hataMetni(error))
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

export async function sohbetIstegiGonder(kullaniciId: string): Promise<void> {
  await rpcCagir('sohbet_istegi_gonder', { p_kullanici_id: kullaniciId })
}

export async function sohbetIsteginiYanitla(kullaniciId: string, kabul: boolean): Promise<void> {
  await rpcCagir('sohbet_istegini_yanitla', { p_kullanici_id: kullaniciId, p_kabul: kabul })
}

export async function sohbetIsteginiGeriCek(kullaniciId: string): Promise<void> {
  await rpcCagir('sohbet_istegini_geri_cek', { p_kullanici_id: kullaniciId })
}

function durumOku(satir: { durum: BagDurumu } | null): BagDurumu {
  return (satir?.durum ?? 'yok') as BagDurumu
}

/**
 * Baskasinin profilinde hangi butonun gosterilecegini belirler.
 * Dort tabloya ayri ayri bakiyor: benim ona (giden) ve onun bana (gelen)
 * yonlerini hem takip hem sohbet icin. Tablolarin RLS'i zaten yalnizca
 * kendi taraf oldugumuz satirlari gosteriyor.
 */
export async function bagDurumunuGetir(kullaniciId: string): Promise<{
  takip: BagDurumu
  sohbet: BagDurumu
  gelenTakip: BagDurumu
  gelenSohbet: BagDurumu
}> {
  const benimId = await kendiKullaniciId()

  const [takipSonuc, sohbetSonuc, gelenTakipSonuc, gelenSohbetSonuc] = await Promise.all([
    supabase
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', benimId)
      .eq('takip_edilen_id', kullaniciId)
      .maybeSingle(),
    supabase
      .from('sohbet_istekleri')
      .select('durum')
      .eq('gonderen_id', benimId)
      .eq('alan_id', kullaniciId)
      .maybeSingle(),
    supabase
      .from('takipler')
      .select('durum')
      .eq('takip_eden_id', kullaniciId)
      .eq('takip_edilen_id', benimId)
      .maybeSingle(),
    supabase
      .from('sohbet_istekleri')
      .select('durum')
      .eq('gonderen_id', kullaniciId)
      .eq('alan_id', benimId)
      .maybeSingle(),
  ])

  if (takipSonuc.error) throw new Error(takipSonuc.error.message)
  if (sohbetSonuc.error) throw new Error(sohbetSonuc.error.message)
  if (gelenTakipSonuc.error) throw new Error(gelenTakipSonuc.error.message)
  if (gelenSohbetSonuc.error) throw new Error(gelenSohbetSonuc.error.message)

  return {
    takip: durumOku(takipSonuc.data as { durum: BagDurumu } | null),
    sohbet: durumOku(sohbetSonuc.data as { durum: BagDurumu } | null),
    gelenTakip: durumOku(gelenTakipSonuc.data as { durum: BagDurumu } | null),
    gelenSohbet: durumOku(gelenSohbetSonuc.data as { durum: BagDurumu } | null),
  }
}
