import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

export type KisiSonucu = {
  id: string
  kullaniciAdi: string
  ad: string
  fotograf: string | null
}

type SunucuSatiri = {
  id: string
  kullanici_adi: string
  ad: string
  fotograf: string | null
}

// Sunucu da en az iki karakter istiyor; buradaki kontrol yalnizca
// bosuna istek atmamak icin.
const EN_AZ_KARAKTER = 2

export async function kisiAra(metin: string): Promise<KisiSonucu[]> {
  const temiz = metin.trim()
  if (temiz.length < EN_AZ_KARAKTER) return []

  const { data, error } = await supabase.rpc('kisi_ara', { p_metin: temiz })
  if (error) throw new Error(hataMetni(error))

  return (data as SunucuSatiri[]).map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    fotograf: satir.fotograf,
  }))
}
