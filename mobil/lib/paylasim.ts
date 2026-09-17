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
import { Share, type ShareContent } from 'react-native'

export const SITE_KOKU = 'https://slooin.com'

/**
 * SISTEM PAYLASIM SAYFASI + KAPANIS SONRASI KORUMA.
 *
 * iOS'ta paylasim sayfasini DISINA dokunarak kapatinca o dokunus altta
 * kalan uygulamaya da dusuyor (kullanicinin bildirimi 2026-09-18:
 * "arkadaki fotografa basinca hemen buyuk ekran aciliyor"). Beğen'e
 * denk gelse begeniyi degistirirdi. `Share.share` sayfa kapaninca
 * cozuldugu icin kapanis ani burada kaydediliyor; kart, kapanistan
 * sonraki kisa pencerede gelen dokunusu yutuyor
 * (`paylasimSonrasiBaskiMi`). Kok duzendeki `PaylasimKalkani` kapanisi
 * dinleyip o pencerede BUTUN ekranin ustune gorunmez bir katman
 * koyuyor - kullanicinin genellemesi: "bir sey acikken arkada baska bir
 * seye basilinca direkt acilmamali". Butun paylasimlar bu
 * sarmalayicidan gecmeli - dogrudan `Share.share` cagrisi korumayi atlar.
 */
export const PAYLASIM_KORUMA_MS = 700
let sonKapanis = 0
const dinleyiciler = new Set<() => void>()

export async function sistemPaylasimi(icerik: ShareContent): Promise<void> {
  try {
    await Share.share(icerik)
  } finally {
    sonKapanis = Date.now()
    dinleyiciler.forEach((d) => d())
  }
}

export function paylasimSonrasiBaskiMi(simdi: number = Date.now()): boolean {
  return simdi - sonKapanis < PAYLASIM_KORUMA_MS
}

/** Kapanis olayina abone ol; geri donen islev aboneligi kaldirir. */
export function paylasimDinle(dinleyici: () => void): () => void {
  dinleyiciler.add(dinleyici)
  return () => {
    dinleyiciler.delete(dinleyici)
  }
}

/** Testler icin: modul duzeyindeki kapanis ani dosyalar arasi tasinmasin. */
export function paylasimKorumasiniSifirla(): void {
  sonKapanis = 0
}

export function profilBaglantisi(kullaniciAdi: string): string {
  return `${SITE_KOKU}/${kullaniciAdi}`
}
