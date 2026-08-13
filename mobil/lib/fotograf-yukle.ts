import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

export async function fotografYukle(kullaniciId: string, yerelUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(yerelUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const dosyaYolu = `${kullaniciId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('profil-fotograflari')
    .upload(dosyaYolu, decode(base64), { contentType: 'image/jpeg' })

  if (error) throw error
  return data.path
}
