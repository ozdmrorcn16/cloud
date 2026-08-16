import { supabase } from './supabase'

export async function engelle(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engelle', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(error.message)
}

export async function engeliKaldir(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engeli_kaldir', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(error.message)
}

export async function engellediklerimiGetir(): Promise<string[]> {
  const { data, error } = await supabase.from('engellemeler').select('engellenen_id')
  if (error) throw new Error(error.message)
  return (data as { engellenen_id: string }[]).map((satir) => satir.engellenen_id)
}
