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

/**
 * Birden fazla yerel fotografi sirayla yukler (coklu fotograf, 2026-09-21).
 * Sira korunur: donen yollar `yerelUriler` ile ayni siradadir. Biri
 * kirilirsa hata firlar; cagiran yuklenenleri geri silmek isterse
 * donmus olanlari bilmez - bu yuzden yukleme SIRALI (Promise.all degil),
 * boylece basarisizlik anina kadar yuklenenler `kismi` ile bildirilir.
 */
export async function checkinFotograflariniYukle(
  kullaniciId: string,
  yerelUriler: string[],
  kismi?: string[]
): Promise<string[]> {
  const yollar: string[] = []
  for (const uri of yerelUriler) {
    // Ayni milisaniyede iki dosya ayni ada dusmesin diye sira eki.
    const baytlar = await dosyayiOku(uri)
    const dosyaYolu = `${kullaniciId}/${Date.now()}-${yollar.length}.jpg`
    const { data, error } = await supabase.storage
      .from('check-in-fotograflari')
      .upload(dosyaYolu, baytlar, { contentType: 'image/jpeg' })
    if (error) throw error
    yollar.push(data.path)
    kismi?.push(data.path)
  }
  return yollar
}
