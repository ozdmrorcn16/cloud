import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { dosyayiOku } from './dosya-oku'

export type SikayetHedefTuru = 'kullanici' | 'check_in' | 'mesaj' | 'hikaye'

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
  aciklama?: string,
  fotograf?: string | null
): Promise<void> {
  const { error } = await supabase.rpc('sikayet_gonder', {
    p_hedef_tur: hedefTur,
    p_hedef_id: hedefId,
    p_sebep: sebep,
    p_aciklama: aciklama ?? null,
    p_fotograf: fotograf ?? null,
  })
  if (error) throw new Error(hataMetni(error))
}

/**
 * Sikayete eklenen fotograf (kullanicinin istegi 2026-09-19). Ozel
 * `sikayet-fotograflari` kovasi, `<kullaniciId>/<zaman>.jpg` - diger
 * kovalarla ayni yol duzeni; sunucu (`sikayet_gonder`) yolun sahibini
 * dogruluyor. Yalnizca yukleyen ve moderator okuyabilir.
 */
export async function sikayetFotografYukle(kullaniciId: string, yerelUri: string): Promise<string> {
  const baytlar = await dosyayiOku(yerelUri)
  const dosyaYolu = `${kullaniciId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('sikayet-fotograflari')
    .upload(dosyaYolu, baytlar, { contentType: 'image/jpeg' })
  if (error) throw new Error(hataMetni(error))
  return data.path
}

/**
 * Bu kullaniciyi daha once sikayet ettim mi? `sikayetler` RLS'i yalnizca
 * kendi satirlarimi gosteriyor; sunucu ayni hedefe ikinci sikayeti zaten
 * yeni kayit acmadan yutuyor. Profil menusu "Sikayet edildi" durumunu
 * buradan okuyor (kullanicinin istegi 2026-09-19: "o kullaniciyi
 * sikayet ettigi belli olsun"). Okunamazsa false: belirsizlikte dugme
 * acik kalir, kullanici en kotu ihtimalle ikinci kez basar.
 */
export async function kullaniciyiSikayetEttimMi(kullaniciId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('sikayetler')
    .select('id')
    .eq('hedef_tur', 'kullanici')
    .eq('hedef_id', kullaniciId)
    .limit(1)
  if (error) return false
  return (data ?? []).length > 0
}
