// Bicim veritabaninda da ayni sekilde kisitli
// (profiller_kullanici_adi_bicim). Buradaki kopya yalnizca kullaniciya
// sunucuya gitmeden hizli geri bildirim vermek icin var; asil zorlayici
// olan veritabani kisitidir.
const DESEN = /^[a-z0-9._]{3,20}$/

export const KULLANICI_ADI_KURALI =
  'Kullanici adi 3-20 karakter olmali; sadece kucuk harf, rakam, nokta ve alt cizgi kullanilabilir.'

export function kullaniciAdiniNormallestir(ham: string): string {
  return ham.trim().toLowerCase()
}

export function kullaniciAdiGecerliMi(ad: string): boolean {
  return DESEN.test(ad)
}
