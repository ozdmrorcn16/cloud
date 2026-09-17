/**
 * PROFIL PAYLASIM BAGLANTISI (2026-09-18).
 *
 * `https://slooin.com/<kullanici_adi>` - kendi alan adimiz, kullanici
 * adiyla, kisa. Sayfayi site sunucuda ciziyor ve Open Graph
 * etiketleriyle WhatsApp/iMessage'da avatar + ad + "Slooin" kartini
 * cikariyor (bkz. site/functions/[ad].js). Onceki baglanti
 * `slooin.expo.app/kullanici/<uuid>` idi: ham UUID, onizleme yok,
 * ustelik Expo adresi (sitede o adres kullanilmiyor - 2026-09-14).
 *
 * Kullanici adi bicimi sunucuda kisitli (`^[a-z0-9._]{3,20}$`); URL'de
 * kacis gerektiren karakter yok.
 */
export const SITE_KOKU = 'https://slooin.com'

export function profilBaglantisi(kullaniciAdi: string): string {
  return `${SITE_KOKU}/${kullaniciAdi}`
}
