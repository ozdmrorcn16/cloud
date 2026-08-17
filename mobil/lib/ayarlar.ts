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
