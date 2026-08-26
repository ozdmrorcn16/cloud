import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * SMS DOGRULAMA KODU GONDERIM SAYACI.
 *
 * Sorun (2026-08-26 guvenlik incelemesi): dogrulama ekranindaki 60
 * saniyelik geri sayim yalnizca EKRAN DURUMUNDA tutuluyordu. Sayfa
 * yenilenince ya da `/dogrula?telefon=...` adresi yeniden acilinca
 * sayac sifirlaniyor ve "Tekrar gonder" hemen basilabilir hale
 * geliyordu. Adres cubugundaki numara serbest oldugu icin bu, bir
 * baskasinin numarasina ust uste SMS attirmanin kolay yoluydu.
 *
 * Sayac artik CIHAZDA saklaniyor: bekleme suresi sayfa yenilense de
 * devam ediyor ve bir numaraya bir saat icinde gonderilebilecek kod
 * sayisi sinirli.
 *
 * SINIRIN NEREDE OLDUGU KONUSUNDA DURUST OLMAK GEREKIR: burasi
 * ISTEMCI tarafi. Depolamayi temizleyen ya da dogrudan API'ye giden
 * biri bu sayaci atlatir. Asil sinir Supabase'in kendi auth hiz
 * sinirlaridir; buradaki sayac normal kullanicinin kazara ya da
 * sabirsizlikla ust uste kod istemesini keser ve en kolay istismar
 * yolunu kapatir. Sunucu tarafi sinirin gozden gecirilmesi ayri bir
 * is olarak duruyor (Supabase panelinden yapiliyor).
 */

/** Iki kod istegi arasindaki en az sure. */
export const BEKLEME_SANIYE = 60

/** Bir numaraya PENCERE suresi icinde gonderilebilecek kod sayisi. */
export const EN_FAZLA_GONDERIM = 4

/** Sayacin sifirlandigi pencere. */
const PENCERE_MS = 60 * 60 * 1000

const ONEK = 'slooin.kod.'

type Kayit = {
  /** Penceredeki ilk gonderimin zamani. */
  ilk: number
  /** Penceredeki gonderim sayisi. */
  adet: number
  /** Son gonderimin zamani. */
  son: number
}

function anahtar(telefon: string): string {
  return ONEK + telefon
}

async function oku(telefon: string, simdi: number): Promise<Kayit | null> {
  try {
    const ham = await AsyncStorage.getItem(anahtar(telefon))
    if (!ham) return null
    const kayit = JSON.parse(ham) as Kayit
    if (typeof kayit.ilk !== 'number' || typeof kayit.adet !== 'number') return null
    // Pencere doldu: sayac sifirlanmis sayilir.
    if (simdi - kayit.ilk > PENCERE_MS) return null
    return kayit
  } catch {
    // Depolama okunamazsa akisi kilitlemiyoruz: sayac yokmus gibi
    // davraniyoruz, sunucu sinirlari yerinde duruyor.
    return null
  }
}

/** Bir kod gonderildiginde cagrilir. */
export async function gonderimKaydet(telefon: string, simdi = Date.now()): Promise<void> {
  const mevcut = await oku(telefon, simdi)
  const yeni: Kayit = mevcut
    ? { ilk: mevcut.ilk, adet: mevcut.adet + 1, son: simdi }
    : { ilk: simdi, adet: 1, son: simdi }
  try {
    await AsyncStorage.setItem(anahtar(telefon), JSON.stringify(yeni))
  } catch {
    // Yazamazsak sayac tutmaz; yine de akisi durdurmuyoruz.
  }
}

export type GonderimDurumu = {
  /** Tekrar gondermek icin beklenecek saniye (0 ise serbest). */
  kalanSaniye: number
  /** Bu pencerede kalan gonderim hakki. */
  kalanHak: number
}

/**
 * KAYIT YOKSA TAM BEKLEME UYGULANIR.
 *
 * Sifir dondurmek, `/dogrula?telefon=...` adresini elle acan birine
 * "Tekrar gonder"i aninda acardi - kapatmaya calistigimiz seyin ta
 * kendisi. Kayit adimindan gelen kullanicinin zaten kaydi var ve
 * gercek kalan sure hesaplaniyor.
 */

/** Ekranin acilista soracagi durum. */
export async function gonderimDurumu(
  telefon: string,
  simdi = Date.now()
): Promise<GonderimDurumu> {
  const kayit = await oku(telefon, simdi)
  if (!kayit) return { kalanSaniye: BEKLEME_SANIYE, kalanHak: EN_FAZLA_GONDERIM }

  const gecen = Math.floor((simdi - kayit.son) / 1000)
  return {
    kalanSaniye: Math.max(0, BEKLEME_SANIYE - gecen),
    kalanHak: Math.max(0, EN_FAZLA_GONDERIM - kayit.adet),
  }
}
