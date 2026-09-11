/**
 * INSTAGRAM KULLANICI ADI - bicim kurallari ve baglanti.
 *
 * Kullanicinin istegi (2026-09-11): "profiline kullanicilar
 * instagramini baglayabilir mi ya da instagram adresini
 * ekleyebilsinler."
 *
 * BU BIR "BAGLAMA" DEGIL, BEYAN - ve bu ayrim kullaniciya acikca
 * soylendi. Meta, Instagram Basic Display API'yi 4 Aralik 2024'te
 * kapatti ve kisisel hesap destegini kaldirdi; yerine gelen API'ler
 * yalnizca isletme/icerik uretici hesaplariyla calisiyor. Yani
 * siradan bir kullanicinin hesabini DOGRULAMANIN yolu yok.
 *
 * Sonucu kabul edilmis bir odun: kisi teorik olarak baskasinin
 * kullanici adini da yazabilir. Karsiligi mevcut sikayet akisi.
 * Instagram'in kendi "baglantilar" alani da ayni sekilde calisiyor.
 */

/** Instagram'in kendi siniri. Sunucudaki kisitla AYNI olmali. */
export const INSTAGRAM_EN_FAZLA = 30

/**
 * Kullanicinin yazdigini SAF KULLANICI ADINA indirger.
 *
 * Insanlar bu alana kullanici adini uc ayri bicimde yaziyor ve ucu de
 * makul: `orcun`, `@orcun`, `instagram.com/orcun`. Hepsini kabul edip
 * ayni degere indirmek, "yanlis yazdin" demekten iyi - alanin tek isi
 * bir profile gitmek.
 *
 * KUCUK HARFE CEVIRILIYOR: Instagram kullanici adlari buyuk/kucuk
 * harf duyarsiz ve her yerde kucuk gosteriliyor. `toLowerCase`
 * yerelden BAGIMSIZ, yani Turkce'deki I/i tuzagina duesmuyor
 * (`toLocaleLowerCase('tr')` 'I' harfini 'ı' yapardi ve bu ASCII
 * olmayan bir karakter olarak kisiti ihlal ederdi).
 */
export function instagramNormallestir(girdi: string): string {
  let d = girdi.trim()
  // Adres olarak yapistirilmis olabilir; sorgu parametresi ve sondaki
  // egik cizgi dahil her seyi at.
  d = d.replace(/^https?:\/\//i, '')
  d = d.replace(/^(www\.)?instagram\.com\//i, '')
  d = d.split('?')[0]
  d = d.split('/')[0]
  d = d.replace(/^@+/, '')
  return d.toLowerCase()
}

/**
 * Instagram'in kendi bicim kurallari.
 *
 * Sunucudaki kisit yalnizca KARAKTER KUMESINI ve UZUNLUGU bakiyor -
 * onun isi copu (tam URL, bosluklu metin, olta baglantisi) engellemek.
 * Buradaki ince kurallar kullaniciya SEBEBINI soyleyebilmek icin:
 * ekranda "nokta ile baslayamaz" yazmak, sunucudan gelen ham kisit
 * ihlalinden iyi.
 */
export function instagramGecerliMi(kullaniciAdi: string): boolean {
  if (kullaniciAdi.length === 0 || kullaniciAdi.length > INSTAGRAM_EN_FAZLA) return false
  if (!/^[a-z0-9._]+$/.test(kullaniciAdi)) return false
  // Instagram nokta ile baslayan/biten ve ust uste iki nokta iceren
  // adlari kabul etmiyor; boyle bir adi kaydetmek hicbir yere
  // gitmeyen bir baglanti uretirdi.
  if (kullaniciAdi.startsWith('.') || kullaniciAdi.endsWith('.')) return false
  if (kullaniciAdi.includes('..')) return false
  return true
}

/** Profildeki baglantinin adresi. */
export function instagramAdresi(kullaniciAdi: string): string {
  return `https://instagram.com/${kullaniciAdi}`
}
