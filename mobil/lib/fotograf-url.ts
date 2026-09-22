import { supabase } from './supabase'
import { oturumDegisinceSifirla } from './oturum-olayi'

const GECERLILIK_SANIYE = 60 * 60

/**
 * IMZA ONBELLEGI (2026-09-22, performans olcumu).
 *
 * Kullanicinin bildirimi: "her sayfa her seferinde yuklenmeye
 * calisiyor". `araclar/gezinme-olcum.mjs` ana sayfaya her donuste AYNI
 * avatar dosyasinin BES KEZ imzalandigini gosterdi (akis karti, serit,
 * etiketler, hikaye seridi hepsi ayri ayri istiyor).
 *
 * Imza zaten bir saat gecerli, yani ayni yolu saniyeler icinde yeniden
 * imzalamanin hicbir karsiligi yok - yalnizca gidis-donus. Burada yol
 * basina imzali adres tutuluyor ve omrunun dolmasina yaklasirken
 * (ONBELLEK_PAYI) yeniden imzalaniyor.
 *
 * Neden `Map` ve modul duzeyi: onbellek EKRANLARI asmali - asil sikayet
 * ekran degistirip geri gelince her seyin sifirdan yuklenmesi. Ekran
 * unmount olsa da modul hayatta kaliyor. Oturum kapaninca dusuruluyor
 * (imzalar oturuma bagli).
 */
const ONBELLEK_PAYI_MS = 10 * 60 * 1000
type ImzaKaydi = { url: string; sonKullanma: number }
const imzalar = new Map<string, ImzaKaydi>()

/** Kova + yol -> onbellek anahtari. */
function anahtar(kova: string, yol: string) {
  return `${kova}::${yol}`
}

function onbellektenAl(kova: string, yol: string): string | null {
  const kayit = imzalar.get(anahtar(kova, yol))
  if (!kayit) return null
  if (kayit.sonKullanma - ONBELLEK_PAYI_MS < Date.now()) {
    imzalar.delete(anahtar(kova, yol))
    return null
  }
  return kayit.url
}

function onbellegeKoy(kova: string, yol: string, url: string) {
  imzalar.set(anahtar(kova, yol), {
    url,
    sonKullanma: Date.now() + GECERLILIK_SANIYE * 1000,
  })
}

/** Cikista cagriliyor: imzalar oturuma bagli, baska hesapta gecersiz. */
export function imzaOnbelleginiSifirla() {
  imzalar.clear()
}

oturumDegisinceSifirla(imzaOnbelleginiSifirla)

/**
 * Bir kovadaki yollari TOPLU imzalar; onbellekte olanlar istege hic
 * girmez. Imzalanamayan yol haritada yer almaz (cagiran fotografsiz
 * cizer - eski davranis).
 */
async function toplulukImzala(kova: string, yollar: string[]): Promise<Record<string, string>> {
  const harita: Record<string, string> = {}
  const eksik: string[] = []
  for (const yol of [...new Set(yollar.filter((y) => y))]) {
    const hazir = onbellektenAl(kova, yol)
    if (hazir) harita[yol] = hazir
    else eksik.push(yol)
  }
  if (eksik.length === 0) return harita
  const { data, error } = await supabase.storage.from(kova).createSignedUrls(eksik, GECERLILIK_SANIYE)
  if (error || !data) return harita
  data.forEach((satir, i) => {
    const yol = satir.path ?? eksik[i]
    if (!satir.error && satir.signedUrl) {
      harita[yol] = satir.signedUrl
      onbellegeKoy(kova, yol, satir.signedUrl)
    }
  })
  return harita
}

/**
 * Profil fotograflari private bir bucket'ta duruyor; genel URL uretmek
 * ise yaramaz (Faz 2c'de bulundu: getPublicUrl private bucket icin
 * gecersiz adres uretiyordu ve ekranda kirik resim cikiyordu).
 * Erisim yalnizca imzali URL ile olur, imzayi da storage politikasi
 * kimin alabilecegine karar vererek sinirlar.
 */
export async function profilFotografiUrl(yol: string): Promise<string | null> {
  const hazir = onbellektenAl('profil-fotograflari', yol)
  if (hazir) return hazir
  const { data, error } = await supabase.storage
    .from('profil-fotograflari')
    .createSignedUrl(yol, GECERLILIK_SANIYE)
  if (error) return null
  const url = data?.signedUrl ?? null
  if (url) onbellegeKoy('profil-fotograflari', yol, url)
  return url
}

/**
 * Check-in fotograflari da private bir bucket'ta duruyor; ayni sebeple
 * imzali URL gerekiyor.
 *
 * Imzalama basarisiz olursa null doner ve cagiran taraf fotografsiz
 * cizer. Bu bekleniyor: storage politikasi fotografi her zaman satirla
 * ayni anda acmiyor (ornegin baska bir mekanda canli olan bir bagin
 * fotografi). Kirik resim gostermektense hic gostermemek dogru.
 */
export async function checkInFotografiUrl(yol: string): Promise<string | null> {
  const hazir = onbellektenAl('check-in-fotograflari', yol)
  if (hazir) return hazir
  const { data, error } = await supabase.storage
    .from('check-in-fotograflari')
    .createSignedUrl(yol, GECERLILIK_SANIYE)
  if (error) return null
  const url = data?.signedUrl ?? null
  if (url) onbellegeKoy('check-in-fotograflari', yol, url)
  return url
}

/** Birden fazla yolu TEK istekle imzalar; basarisiz olanlar atlanir. */
export async function profilFotograflariUrl(yollar: string[]): Promise<string[]> {
  const harita = await toplulukImzala('profil-fotograflari', yollar)
  return yollar.map((y) => harita[y]).filter((u): u is string => Boolean(u))
}

/**
 * Profil fotograflarinin yol -> imzali adres haritasi (2026-09-22).
 * `profilOzetleriniGetir` gibi cok kisilik listeler icin: onceden kisi
 * basina bir imza istegi atiliyordu, artik tek istek + onbellek.
 */
export async function profilFotografiUrlHaritasi(yollar: string[]): Promise<Record<string, string>> {
  return toplulukImzala('profil-fotograflari', yollar)
}

/**
 * Check-in fotograflarini TOPLU imzalar (2026-09-21, coklu fotograf):
 * akis sayfasi 30 kart x 5 fotograf = 150 imza olabilir; tek tek istek
 * atmak akisi yavaslatirdi. Tek `createSignedUrls` cagrisi; yol ->
 * imzali adres haritasi doner, imzalanamayan yol haritada yer almaz
 * (cagiran fotografsiz cizer - eski davranisla ayni).
 */
export async function checkInFotografiUrlHaritasi(yollar: string[]): Promise<Record<string, string>> {
  return toplulukImzala('check-in-fotograflari', yollar)
}

/**
 * HIKAYE MEDYALARI (2026-09-22). Hikaye kovasi once `lib/hikaye.ts`
 * icinde KENDI imzalama fonksiyonunu kullaniyordu ve onbellegi yoktu:
 * her akis cekilisinde AYNI dosya icin YENI imzali adres uretiliyordu.
 * Imzali adres degisince `expo-image`in onbellegi (anahtar = adres)
 * iskaliyor ve fotograf yeniden INIYOR - kullanicinin "hikayeler hala
 * gecikmeli geliyor" bildiriminin sebeplerinden biri buydu.
 */
export async function hikayeMedyasiUrlHaritasi(yollar: string[]): Promise<Record<string, string>> {
  return toplulukImzala('hikaye-medyalari', yollar)
}

/** Bir check-in'in fotograflarini SIRASIYLA imzalar; imzalanamayan atlanir. */
export async function checkInFotografiUrlleri(yollar: string[]): Promise<string[]> {
  const harita = await checkInFotografiUrlHaritasi(yollar)
  return yollar.map((y) => harita[y]).filter((u): u is string => Boolean(u))
}
