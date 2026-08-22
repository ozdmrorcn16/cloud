import { supabase } from './supabase'

// Bicim veritabaninda da ayni sekilde kisitli
// (profiller_kullanici_adi_bicim). Buradaki kopya yalnizca kullaniciya
// sunucuya gitmeden hizli geri bildirim vermek icin var; asil zorlayici
// olan veritabani kisitidir.
const DESEN = /^[a-z0-9._]{3,20}$/

export const KULLANICI_ADI_KURALI =
  'Kullanici adi 3-20 karakter olmali; sadece kucuk harf, rakam, nokta ve alt cizgi kullanilabilir.'

export function kullaniciAdiniNormallestir(ham: string): string {
  return ham.trim().toLowerCase()
}

export function kullaniciAdiGecerliMi(ad: string): boolean {
  return DESEN.test(ad)
}

export async function kullaniciAdiMusaitMi(ad: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('kullanici_adi_musait_mi', {
    p_ad: kullaniciAdiniNormallestir(ad),
  })
  if (error) throw new Error(error.message)
  return data as boolean
}

export async function kullaniciAdiniDegistir(yeniAd: string): Promise<void> {
  const { error } = await supabase.rpc('kullanici_adi_degistir', {
    p_yeni_ad: kullaniciAdiniNormallestir(yeniAd),
  })
  if (error) {
    // Sunucudaki on kontrol yarisi kaybederse ham Postgres kisit hatasi
    // (ornegin "duplicate key value violates unique constraint ...")
    // kullaniciya sizmasin diye kod'a gore anlasilir mesaja ceviriyoruz.
    if (error.code === '23505') {
      throw new Error('Bu kullanıcı adı alınmış, başka bir tane dene.')
    }
    if (error.code === '23514') {
      throw new Error(KULLANICI_ADI_KURALI)
    }
    throw new Error(error.message)
  }
}
