import { supabase } from './supabase'

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadi')
  return id
}

export async function varsayilanGizliyiGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('varsayilan_gizli')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.varsayilan_gizli ?? false
}

export async function varsayilanGizliyiAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ varsayilan_gizli: deger })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function aramadaGorunsunGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('aramada_gorunsun')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.aramada_gorunsun ?? true
}

export async function aramadaGorunsunAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ aramada_gorunsun: deger })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

const OTUZ_GUN_MS = 30 * 24 * 60 * 60 * 1000

export async function kullaniciAdiDurumunuGetir(): Promise<{
  kullaniciAdi: string
  sonrakiDegisimTarihi: Date | null
}> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('kullanici_adi, kullanici_adi_degistirildi')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)

  const satir = data as
    | { kullanici_adi: string; kullanici_adi_degistirildi: string | null }
    | null

  const sonrakiDegisimTarihi = satir?.kullanici_adi_degistirildi
    ? new Date(new Date(satir.kullanici_adi_degistirildi).getTime() + OTUZ_GUN_MS)
    : null

  return { kullaniciAdi: satir?.kullanici_adi ?? '', sonrakiDegisimTarihi }
}

export async function aniGorunurlugunuAyarla(
  deger: 'herkese_acik' | 'kimse'
): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('check_inler')
    .update({ gorunurluk: deger })
    .eq('kullanici_id', id)
  if (error) throw new Error(error.message)
}
