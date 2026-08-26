import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { fotografYukle } from './fotograf-yukle'

export type BaskaProfil = {
  id: string
  kullaniciAdi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

type SunucuProfili = {
  id: string
  kullanici_adi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

export async function baskasininProfiliniGetir(
  kullaniciId: string
): Promise<BaskaProfil | null> {
  const { data, error } = await supabase.rpc('baskasinin_profili', {
    p_kullanici_id: kullaniciId,
  })
  if (error) throw new Error(hataMetni(error))

  const satirlar = data as SunucuProfili[]
  if (satirlar.length === 0) return null

  const satir = satirlar[0]
  return {
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    biyografi: satir.biyografi,
    fotograflar: satir.fotograflar,
  }
}

export type KendiProfil = {
  id: string
  kullaniciAdi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

/**
 * Kendi profilini okur.
 *
 * `baskasinin_profili` RPC'si burada kullanilmaz: o RPC engelleme ve
 * gorunurluk kurallarindan geciyor ve kendini cagirmak icin yazilmadi.
 * Kendi satirini okumak zaten RLS ile serbest.
 *
 * Profil satiri henuz yoksa null doner - kayit bitmis ama profil
 * olusturulmamis olabilir.
 */
export async function kendiProfilimiGetir(): Promise<KendiProfil | null> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturum bulunamadı')

  const { data, error } = await supabase
    .from('profiller')
    .select('id, kullanici_adi, ad, biyografi, fotograflar')
    .eq('id', kullaniciId)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  if (!data) return null

  const satir = data as SunucuProfili
  return {
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    biyografi: satir.biyografi,
    fotograflar: satir.fotograflar,
  }
}

/**
 * Profil fotografini degistirir.
 *
 * TEK GIRIS NOKTASI BURASI (kullanicinin karari 2026-08-26): fotograf
 * artik hesap olusturma adiminda sorulmuyor, yalnizca profil
 * ekranindaki avatara basilarak ekleniyor ya da degistiriliyor.
 *
 * `fotograflar` bir dizi ama tek eleman tutuyor: eski cok fotografli
 * tasarim kaldirildi, dizinin ilk elemani profil fotografi. Yeni
 * fotograf eskisinin yerine YAZILIYOR.
 *
 * ESKI DOSYA SILINIYOR ama SON ADIMDA ve EN IYI CABAYLA. Sira onemli:
 * once yeni dosya yuklenir, sonra profil guncellenir, EN SON eskisi
 * silinir. Tersi olsaydi silme basarili + guncelleme basarisiz
 * durumunda kullanici fotografsiz kalirdi.
 *
 * Silme basarisiz olursa hata FIRLATILMIYOR: fotograf zaten
 * degismistir ve kullanici acisindan is bitmistir. Kalan dosya bir
 * sizinti da degil - okuma politikasi yalnizca GUNCEL fotografi
 * aciyor (migrasyon 20260826210000).
 */
export async function profilFotografiniDegistir(yerelUri: string): Promise<string> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturumun düşmüş, tekrar giriş yap.')

  const yuklenenYol = await fotografYukle(kullaniciId, yerelUri)

  // Degistirmeden ONCE eski yolu okuyoruz; guncelledikten sonra
  // ogrenmenin yolu kalmiyor.
  const { data: oncekiSatir } = await supabase
    .from('profiller')
    .select('fotograflar')
    .eq('id', kullaniciId)
    .maybeSingle()
  const eskiYollar: string[] = oncekiSatir?.fotograflar ?? []

  const { error } = await supabase
    .from('profiller')
    .update({ fotograflar: [yuklenenYol] })
    .eq('id', kullaniciId)
  if (error) throw new Error(hataMetni(error))

  const silinecekler = eskiYollar.filter((y) => y && y !== yuklenenYol)
  if (silinecekler.length > 0) {
    // En iyi caba: burada bir hata kullaniciya yansitilmiyor.
    await supabase.storage.from('profil-fotograflari').remove(silinecekler)
  }

  return yuklenenYol
}
