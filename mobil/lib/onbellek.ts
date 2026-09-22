import { oturumDegisinceSifirla } from './oturum-olayi'

/**
 * EKRAN VERISI ONBELLEGI (2026-09-22).
 *
 * Kullanicinin bildirimi: "uygulama icerisinde yavaslik var, her sayfa
 * her seferinde yuklenmeye calisiyor."
 *
 * KOK NEDEN: kok duzen `Slot` kullaniyor (Stack yok, kullanicinin
 * gezinme tasarimi boyle). Baska bir sekmeye gecince ekran AGACTAN
 * KALDIRILIYOR; geri donuste sifirdan kuruluyor, `useState` varsayilana
 * donuyor ve `useFocusEffect` butun veriyi yeniden cekiyor. Olcum
 * (`araclar/gezinme-olcum.mjs`): ana sayfaya her donuste 37 istek /
 * ~1250 ms, ve IKINCI donuste de ayni - hicbir sey hatirlanmiyor.
 *
 * COZUM "once eldekini goster, arkada tazele" (stale-while-revalidate):
 * ekran mount olurken son veriyi buradan ANINDA aliyor, bos liste ve
 * yukleme yazisi hic gorunmuyor; tazeleme arkada kosuyor ve bitince
 * liste yerinde guncelleniyor.
 *
 * NEDEN AsyncStorage DEGIL bellek: burada tutulan sey baskasinin
 * paylasimlari, imzali adresler ve konum gibi KISA OMURLU veri.
 * Diske yazmak (a) uygulama kapatilip acildiginda eski/gecersiz imzali
 * adresleri geri getirir, (b) cihazda kisisel veriyi bir yere daha
 * yazmak demek olur - gizlilik kurali geregi kacinildi. Uygulama
 * kapanınca onbellek de gidiyor; amac sekme gecislerini hizlandirmak.
 *
 * CIKISTA SIFIRLANIR: baska bir hesaba girildiginde onceki hesabin
 * verisi bir an gorunemez.
 */

const kutu = new Map<string, unknown>()

export function onbellekOku<T>(anahtar: string): T | undefined {
  return kutu.get(anahtar) as T | undefined
}

export function onbellekYaz<T>(anahtar: string, veri: T): void {
  kutu.set(anahtar, veri)
}

/** Tek bir anahtari dusurur (ornegin kullanici o veriyi sildi). */
export function onbellekSil(anahtar: string): void {
  kutu.delete(anahtar)
}

export function onbellegiSifirla(): void {
  kutu.clear()
}

oturumDegisinceSifirla(onbellegiSifirla)

/** Ekran anahtarlari tek yerde - yazim hatasi sessiz bos onbellek demek. */
export const ANAHTAR = {
  akis: 'akis',
  akisOzetleri: 'akis.ozetleri',
  hikayeSeridi: 'hikaye.serit',
  profil: 'profil',
  profilAnilari: 'profil.anilar',
  profilSayaclari: 'profil.sayaclar',
  mesajlar: 'mesajlar',
  mekanlar: 'mekanlar',
  cihazKonumu: 'mekanlar.konum',
  bildirimler: 'bildirimler',
  gezinmeRozetleri: 'gezinme.rozetler',
} as const
