import { supabase } from './supabase'

export type BaskaProfil = {
  id: string
  kullaniciAdi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

type SunucuProfili = {
  id: string
  kullanici_adi: string
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

  const satirlar = data as SunucuProfili[]
  if (satirlar.length === 0) return null

  const satir = satirlar[0]
  return {
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    biyografi: satir.biyografi,
    fotograflar: satir.fotograflar,
  }
}
