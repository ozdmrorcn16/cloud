import { supabase } from './supabase'
import type { Bulunurluk, AniGorunurlugu } from './checkin'
import { hataMetni } from './hata-metni'

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadı')
  return id
}

export async function varsayilanBulunurluguGetir(): Promise<Bulunurluk> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('varsayilan_bulunurluk')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return (data?.varsayilan_bulunurluk ?? 'herkese_acik') as Bulunurluk
}

export async function varsayilanBulunurluguAyarla(deger: Bulunurluk): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ varsayilan_bulunurluk: deger })
    .eq('id', id)
  if (error) throw new Error(hataMetni(error))
}

export async function aramadaGorunsunGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('aramada_gorunsun')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return data?.aramada_gorunsun ?? true
}

export async function aramadaGorunsunAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ aramada_gorunsun: deger })
    .eq('id', id)
  if (error) throw new Error(hataMetni(error))
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
  if (error) throw new Error(hataMetni(error))

  const satir = data as
    | { kullanici_adi: string; kullanici_adi_degistirildi: string | null }
    | null

  const sonrakiDegisimTarihi = satir?.kullanici_adi_degistirildi
    ? new Date(new Date(satir.kullanici_adi_degistirildi).getTime() + OTUZ_GUN_MS)
    : null

  return { kullaniciAdi: satir?.kullanici_adi ?? '', sonrakiDegisimTarihi }
}

export async function aniGorunurlugunuAyarla(
  deger: AniGorunurlugu
): Promise<void> {
  // check_inler'a dogrudan yazma yetkisi yok (Faz 3a final inceleme
  // Madde 1). Tek yol bu RPC; sunucuda her satiri kendi bulunurluk
  // degerine gore kelepceliyor, boylece bu eylem gizli check-in'lerden
  // donen anilari asla genisletemiyor.
  const { error } = await supabase.rpc('ani_gorunurlugunu_ayarla', { p_deger: deger })
  if (error) throw new Error(hataMetni(error))
}
