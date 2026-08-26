import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

export type SikayetHedefTuru = 'kullanici' | 'check_in' | 'mesaj'

export const SIKAYET_SEBEPLERI = [
  { anahtar: 'taciz', etiket: 'Taciz veya rahatsiz etme' },
  { anahtar: 'uygunsuz_icerik', etiket: 'Uygunsuz icerik' },
  { anahtar: 'sahte_hesap', etiket: 'Sahte hesap' },
  { anahtar: 'spam', etiket: 'Spam veya reklam' },
  { anahtar: 'diger', etiket: 'Diger' },
] as const

export async function sikayetGonder(
  hedefTur: SikayetHedefTuru,
  hedefId: string,
  sebep: string,
  aciklama?: string
): Promise<void> {
  const { error } = await supabase.rpc('sikayet_gonder', {
    p_hedef_tur: hedefTur,
    p_hedef_id: hedefId,
    p_sebep: sebep,
    p_aciklama: aciklama ?? null,
  })
  if (error) throw new Error(hataMetni(error))
}
