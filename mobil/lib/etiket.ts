import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

/**
 * CHECK-IN'DE ARKADAS ETIKETLEME.
 *
 * Kurallar politikalarda, burada degil (bkz. migrasyonlar
 * 20260826200000 ve 20260829090000): yalnizca karsilikli bagli oldugun
 * kisi etiketlenebilir ve bir check-in'i goremeyen onun etiketlerini de
 * goremez.
 *
 * ETIKET ONAY ISTIYOR (kullanicinin karari 2026-08-29): yeni etiket
 * `bekliyor` durumunda giriyor ve ONAYLANANA KADAR baskalarina
 * gorunmuyor. Etiketlenen kisi bildirim ekranindan onaylar ya da
 * reddeder. Reddedilen satir SILINMIYOR - birincil anahtar oldugu icin
 * ayni etiketin tekrar gonderilmesini de engelliyor.
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

/** Bildirim ekranindaki bekleyen etiket istegi. */
export type BekleyenEtiket = {
  checkInId: string
  mekanAdi: string
  etiketleyenId: string
  etiketleyenAd: string
  etiketleyenKullaniciAdi: string
  olusturuldu: string
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

  // Yalnizca ONAYLANMIS etiketler cekiliyor. Politika bekleyen
  // etiketi iki tarafa gosteriyor; akista ve profilde gostermek
  // istedigimiz sey ise yalnizca onaylanmis olan.
  const { data, error } = await supabase
    .from('check_in_etiketleri')
    .select('check_in_id, kullanici_id, profiller(ad)')
    .in('check_in_id', checkInIdler)
    .eq('durum', 'onaylandi')
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

/** Bildirim ekrani: beni etiketlemek isteyen bekleyen istekler. */
export async function bekleyenEtiketleriGetir(): Promise<BekleyenEtiket[]> {
  const { data, error } = await supabase.rpc('bekleyen_etiketlerim')
  if (error) throw new Error(hataMetni(error))

  type Satir = {
    check_in_id: string
    mekan_adi: string
    etiketleyen_id: string
    etiketleyen_ad: string
    etiketleyen_kullanici_adi: string
    olusturuldu: string
  }
  return (data as Satir[]).map((s) => ({
    checkInId: s.check_in_id,
    mekanAdi: s.mekan_adi,
    etiketleyenId: s.etiketleyen_id,
    etiketleyenAd: s.etiketleyen_ad,
    etiketleyenKullaniciAdi: s.etiketleyen_kullanici_adi,
    olusturuldu: s.olusturuldu,
  }))
}

/**
 * Bekleyen bir etiketi onaylar ya da reddeder.
 *
 * Yalnizca ETIKETLENEN kisi cagirabilir ve yalnizca bekleyen bir
 * etikette calisir; ikisini de politika zorluyor. Reddedilen satir
 * duruyor, silinmiyor.
 */
export async function etiketiYanitla(checkInId: string, onay: boolean): Promise<void> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const benimId = kullaniciVerisi.user?.id
  if (!benimId) throw new Error('Oturum bulunamadı')

  const { error } = await supabase
    .from('check_in_etiketleri')
    .update({ durum: onay ? 'onaylandi' : 'reddedildi' })
    .eq('check_in_id', checkInId)
    .eq('kullanici_id', benimId)
  if (error) throw new Error(hataMetni(error))
}
