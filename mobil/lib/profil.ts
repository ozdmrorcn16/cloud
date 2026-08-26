import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

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
  if (error) throw new Error(hataMetni(error))

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

export type KendiProfil = {
  id: string
  kullaniciAdi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

/**
 * Kendi profilini okur.
 *
 * `baskasinin_profili` RPC'si burada kullanilmaz: o RPC engelleme ve
 * gorunurluk kurallarindan geciyor ve kendini cagirmak icin yazilmadi.
 * Kendi satirini okumak zaten RLS ile serbest.
 *
 * Profil satiri henuz yoksa null doner - kayit bitmis ama profil
 * olusturulmamis olabilir.
 */
export async function kendiProfilimiGetir(): Promise<KendiProfil | null> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturum bulunamadı')

  const { data, error } = await supabase
    .from('profiller')
    .select('id, kullanici_adi, ad, biyografi, fotograflar')
    .eq('id', kullaniciId)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  if (!data) return null

  const satir = data as SunucuProfili
  return {
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    biyografi: satir.biyografi,
    fotograflar: satir.fotograflar,
  }
}
