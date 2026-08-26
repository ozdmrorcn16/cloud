import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

/**
 * CHECK-IN'DE ARKADAS ETIKETLEME.
 *
 * Kurallar politikalarda, burada degil (bkz. migrasyon
 * 20260826200000): yalnizca karsilikli bagli oldugun kisi
 * etiketlenebilir, etiketlenen kisi kendi etiketini kaldirabilir ve
 * bir check-in'i goremeyen onun etiketlerini de goremez.
 *
 * Buradaki kod o kurallari TEKRARLAMIYOR - istemcide yapilan kontrol
 * yalnizca kullaniciya hizli geri bildirim icindir; baglayici olan
 * veritabanidir.
 */

export type Etiket = {
  kullaniciId: string
  /** Etiketlenen kisinin adi; profiller'den okunuyor. */
  ad: string | null
}

type EtiketSatiri = {
  check_in_id: string
  kullanici_id: string
  profiller: { ad: string } | { ad: string }[] | null
}

/**
 * Verilen check-in'lerin etiketlerini TEK SORGUDA getirir.
 *
 * Akista 30 satir var; her satir icin ayri sorgu atmak 30 gidis-donus
 * demekti. Sonuc check-in kimligine gore gruplanmis donuyor.
 */
export async function etiketleriGetir(
  checkInIdler: string[]
): Promise<Record<string, Etiket[]>> {
  if (checkInIdler.length === 0) return {}

  const { data, error } = await supabase
    .from('check_in_etiketleri')
    .select('check_in_id, kullanici_id, profiller(ad)')
    .in('check_in_id', checkInIdler)
  if (error) throw new Error(hataMetni(error))

  const gruplar: Record<string, Etiket[]> = {}
  for (const satir of (data ?? []) as unknown as EtiketSatiri[]) {
    const profil = Array.isArray(satir.profiller) ? satir.profiller[0] : satir.profiller
    const liste = gruplar[satir.check_in_id] ?? []
    liste.push({ kullaniciId: satir.kullanici_id, ad: profil?.ad ?? null })
    gruplar[satir.check_in_id] = liste
  }
  return gruplar
}

/**
 * Bir check-in'e etiketleri yazar.
 *
 * Check-in olusturulduktan HEMEN SONRA cagriliyor; bos liste geldiginde
 * hic istek atilmiyor. Kismi basari mumkun degil: tek insert, ya hepsi
 * yazilir ya hicbiri.
 */
export async function etiketleriKaydet(
  checkInId: string,
  kullaniciIdler: string[]
): Promise<void> {
  if (kullaniciIdler.length === 0) return

  const { error } = await supabase.from('check_in_etiketleri').insert(
    kullaniciIdler.map((kullaniciId) => ({
      check_in_id: checkInId,
      kullanici_id: kullaniciId,
    }))
  )
  if (error) throw new Error(hataMetni(error))
}

/**
 * Tek bir etiketi kaldirir.
 *
 * Hem check-in'in sahibi hem de ETIKETLENEN KISI cagirabilir; hangisi
 * oldugunu politika belirliyor.
 */
export async function etiketiKaldir(
  checkInId: string,
  kullaniciId: string
): Promise<void> {
  const { error } = await supabase
    .from('check_in_etiketleri')
    .delete()
    .eq('check_in_id', checkInId)
    .eq('kullanici_id', kullaniciId)
  if (error) throw new Error(hataMetni(error))
}
