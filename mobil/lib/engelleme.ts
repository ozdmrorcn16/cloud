import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

export async function engelle(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engelle', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(hataMetni(error))
}

export async function engeliKaldir(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engeli_kaldir', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(hataMetni(error))
}

export async function engellediklerimiGetir(): Promise<string[]> {
  const { data, error } = await supabase.from('engellemeler').select('engellenen_id')
  if (error) throw new Error(hataMetni(error))
  return (data as { engellenen_id: string }[]).map((satir) => satir.engellenen_id)
}

export type EngelliKisi = {
  id: string
  kullaniciAdi: string
  ad: string
  engellendi: string
}

/**
 * Engellenenler listesi - kimlik degil, ADIYLA.
 *
 * `engellediklerimiGetir` yalnizca kimlik donuyor ve isimleri cozmenin
 * istemci tarafinda yolu yok: profiller'in RLS'i baskasinin satirini
 * gostermiyor, kimlikleri ada ceviren `bag_kisileri` ise engellenmis
 * kisileri bilerek eliyor. Bu yuzden ayri bir RPC var.
 */
export async function engellediklerimiListele(): Promise<EngelliKisi[]> {
  const { data, error } = await supabase.rpc('engellediklerim')
  if (error) throw new Error(hataMetni(error))

  const satirlar = data as {
    id: string
    kullanici_adi: string
    ad: string
    engellendi: string
  }[]

  return satirlar.map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    engellendi: satir.engellendi,
  }))
}
