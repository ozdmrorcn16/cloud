import { supabase } from './supabase'

export type BaskaProfil = {
  id: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

export async function baskasininProfiliniGetir(
  kullaniciId: string
): Promise<BaskaProfil | null> {
  const { data, error } = await supabase.rpc('baskasinin_profili', {
    p_kullanici_id: kullaniciId,
  })
  if (error) throw new Error(error.message)

  const satirlar = data as BaskaProfil[]
  return satirlar.length > 0 ? satirlar[0] : null
}
