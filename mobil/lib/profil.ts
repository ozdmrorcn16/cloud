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
 * KLASORDE TEK DOSYA KALIR. Kullanicinin kurali (2026-08-26): "tek
 * bir fotograf yukleniyor, eskisi siliniyor, eskisi hicbir yerde
 * kayitli kalmiyor". Bu yuzden yalnizca `fotograflar` alanindaki eski
 * yol degil, KLASORDEKI DIGER HER DOSYA siliniyor - onceki
 * kosumlardan kalmis artiklar da dahil.
 *
 * Sira onemli: once yeni dosya yuklenir, sonra profil guncellenir, EN
 * SON eskiler silinir. Tersi olsaydi silme basarili + guncelleme
 * basarisiz durumunda kullanici fotografsiz kalirdi.
 *
 * Silme basarisiz olursa hata FIRLATILMIYOR: fotograf zaten
 * degismistir ve kullanici acisindan is bitmistir. Kalan dosya
 * gorunmez de olur - okuma politikasi yalnizca GUNCEL fotografi
 * aciyor, SAHIBINE DE (migrasyon 20260826210000 ve ...220000).
 */
export async function profilFotografiniDegistir(yerelUri: string): Promise<string> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturumun düşmüş, tekrar giriş yap.')

  const yuklenenYol = await fotografYukle(kullaniciId, yerelUri)

  const { error } = await supabase
    .from('profiller')
    .update({ fotograflar: [yuklenenYol] })
    .eq('id', kullaniciId)
  if (error) throw new Error(hataMetni(error))

  await klasoruTemizle(kullaniciId, yuklenenYol)
  return yuklenenYol
}

/**
 * Profil fotografini KALDIRIR (kullanicinin istegi 2026-08-30: buyuk
 * gorunumde "Kaldir" dugmesi).
 *
 * Sira: once profil satiri bosaltilir, sonra klasordeki HER dosya
 * silinir. Satir bosalinca okuma politikasi zaten hicbir dosyayi
 * acmiyor; dosya silme basarisiz olsa da fotograf gorunmez olur.
 */
export async function profilFotografiniKaldir(): Promise<void> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturumun düşmüş, tekrar giriş yap.')

  const { error } = await supabase
    .from('profiller')
    .update({ fotograflar: [] })
    .eq('id', kullaniciId)
  if (error) throw new Error(hataMetni(error))

  await klasoruTemizle(kullaniciId, null)
}

/**
 * Kullanicinin klasorunde KORUNACAK DOSYA DISINDA ne varsa siler
 * (korunacak yol null ise hepsini).
 *
 * `fotograflar` alanindaki eski yolu silmek yetmiyor: onceki
 * kosumlardan, yarim kalmis yuklemelerden ya da eski cok fotografli
 * tasarimdan kalma dosyalar da olabiliyor. Klasoru listeleyip
 * temizlemek "tek fotograf" kuralini gercekten uyguluyor.
 *
 * En iyi caba: hata firlatilmiyor. Listeleme de silme de basarisiz
 * olsa dosyalar gorunmez kaliyor (okuma politikasi guncel olmayan
 * dosyayi sahibine bile acmiyor).
 */
async function klasoruTemizle(kullaniciId: string, korunacakYol: string | null): Promise<void> {
  try {
    const { data: dosyalar, error } = await supabase.storage
      .from('profil-fotograflari')
      .list(kullaniciId)
    if (error || !dosyalar) return

    const silinecekler = dosyalar
      .map((d) => `${kullaniciId}/${d.name}`)
      .filter((y) => y !== korunacakYol)

    if (silinecekler.length > 0) {
      await supabase.storage.from('profil-fotograflari').remove(silinecekler)
    }
  } catch {
    // Temizlik, fotograf degistirmeyi bloke etmemeli.
  }
}

/**
 * Ad ve biyografiyi gunceller.
 *
 * KULLANICI ADI BURADAN DEGISMEZ: onun 30 gunluk kurali sunucuda
 * `kullanici_adi_degistir` RPC'sinde zorlaniyor ve `kullanici_adi`
 * sutununa dogrudan yazma yetkisi zaten YOK (Faz 2c, sutun duzeyinde
 * kisit). Buradan denemek sessizce basarisiz olmaz, sunucu reddeder.
 */
export async function profiliGuncelle(alanlar: {
  ad: string
  biyografi: string | null
}): Promise<void> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturumun düşmüş, tekrar giriş yap.')

  const { error } = await supabase
    .from('profiller')
    .update({ ad: alanlar.ad, biyografi: alanlar.biyografi })
    .eq('id', kullaniciId)
  if (error) throw new Error(hataMetni(error))
}
