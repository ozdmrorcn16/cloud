import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { profilOzetleriniGetir } from './akis'

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
  /** Kullanici adi (rumuz) - duzenleme cipleri bunu yazar (kullanicinin karari 2026-09-18). */
  kullaniciAdi: string | null
  /**
   * Profil fotografi (imzali adres) - akis kartindaki "Birlikte"
   * satiri yalnizca avatar gosteriyor (kullanicinin karari 2026-09-18:
   * "kullanici adlari yazmayacak, sadece profil resimleri"). Yoksa
   * bas harf cizilir.
   */
  avatarUrl: string | null
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
  //
  // PROFIL GOMULU SORGUYLA DEGIL, RPC ILE (2026-09-18 gece, kullanicinin
  // "etiket gorunmuyor" bildirimi): `kullanici_id` auth.users'a bagli,
  // profiller'e degil; PostgREST `profiller(ad)` gomusunu "relationship
  // not found" ile reddediyordu ve hata akista yutuldugu icin etiketler
  // HIC gorunmuyordu. Profiller `akis_profilleri` RPC'sinden (kim gorunur
  // kurali orada) geliyor.
  const { data, error } = await supabase
    .from('check_in_etiketleri')
    .select('check_in_id, kullanici_id')
    .in('check_in_id', checkInIdler)
    .eq('durum', 'onaylandi')
  if (error) throw new Error(hataMetni(error))

  const satirlar = (data ?? []) as EtiketSatiri[]
  const kimlikler = [...new Set(satirlar.map((s) => s.kullanici_id))]
  const profiller = await profilOzetleriniGetir(kimlikler).catch(() => ({}) as Awaited<ReturnType<typeof profilOzetleriniGetir>>)

  const gruplar: Record<string, Etiket[]> = {}
  for (const satir of satirlar) {
    const liste = gruplar[satir.check_in_id] ?? []
    const profil = profiller[satir.kullanici_id]
    liste.push({
      kullaniciId: satir.kullanici_id,
      ad: profil?.ad ?? null,
      kullaniciAdi: profil?.rumuz ?? null,
      avatarUrl: profil?.avatarUrl ?? null,
    })
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
