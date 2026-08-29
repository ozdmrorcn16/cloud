import { dosyayiOku } from './dosya-oku'
import { supabase } from './supabase'

export async function checkinFotografYukle(kullaniciId: string, yerelUri: string): Promise<string> {
  const baytlar = await dosyayiOku(yerelUri)

  const dosyaYolu = `${kullaniciId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('check-in-fotograflari')
    .upload(dosyaYolu, baytlar, { contentType: 'image/jpeg' })

  if (error) throw error
  return data.path
}
