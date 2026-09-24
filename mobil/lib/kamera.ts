/**
 * CANLI KAMERA (2026-09-23, kullanicinin istegi: "Instagram gibi hikaye
 * eklemeye basinca gelen ekranda canli kamera tam ekran acik olsun,
 * yuvarlak tusa basinca fotografi cekicek").
 *
 * `expo-camera` NATIVE bir modul: OTA ile GELMEZ. Bu yuzden modul
 * `lib/galeri.ts` ile AYNI desenle yukleniyor - once
 * `requireOptionalNativeModule` ile native kayit soruluyor (kurulumu
 * kendisi garantiliyor, yoksa null donuyor ve ATMIYOR), modul ancak
 * oradaysa `require` ediliyor. Modulu icermeyen bir derlemede canli
 * onizleme hic cizilmiyor, ekran bugunku siyah tuval olarak kaliyor.
 */

type Izin = { granted: boolean; canAskAgain?: boolean }
type KameraModulu = {
  CameraView: unknown
  getCameraPermissionsAsync: () => Promise<Izin>
  requestCameraPermissionsAsync: () => Promise<Izin>
}

/**
 * Canli kameranin durumu. Ekran gri karti SESSIZ birakmasin diye ayri
 * tutuluyor (kullanicinin bildirimi 2026-09-24: "karenin icinde kamera
 * gorunecek" - kart gri kaliyordu ve sebebi ekrandan okunamiyordu):
 *   'verildi'   - canli onizleme cizilir
 *   'sorulabilir' - reddedildi ama sistem yeniden sorabilir ("Izin ver")
 *   'ayarlardan'  - kalici red, yalnizca Ayarlar'dan acilir
 *   'modul-yok'   - bu derlemede expo-camera yok (OTA ile gelmez)
 */
export type KameraIzinDurumu = 'verildi' | 'sorulabilir' | 'ayarlardan' | 'modul-yok'

let modul: KameraModulu | null | undefined

function nativeKayitliMi(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (ad: string) => unknown
    }
    return requireOptionalNativeModule('ExpoCamera') != null
  } catch {
    return false
  }
}

function moduluAl(): KameraModulu | null {
  if (modul !== undefined) return modul
  if (!nativeKayitliMi()) {
    modul = null
    return modul
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const aday = require('expo-camera') as KameraModulu
    modul = aday?.CameraView ? aday : null
  } catch {
    modul = null
  }
  return modul
}

/** Bu derlemede canli onizleme cizilebilir mi. */
export function kameraKullanilabilirMi(): boolean {
  return moduluAl() !== null
}

/** Canli onizleme bileseni; modul yoksa null. */
export function kameraGorunumu(): unknown {
  return moduluAl()?.CameraView ?? null
}

function durumaCevir(izin: Izin): KameraIzinDurumu {
  if (izin.granted) return 'verildi'
  return izin.canAskAgain === false ? 'ayarlardan' : 'sorulabilir'
}

/**
 * Kamera izni. `sor` true ise verilmemisse sistem penceresi acilir;
 * false ise yalnizca okunur (Ayarlar'dan donuste). Hata red sayilir.
 */
export async function kameraIzinDurumu(sor = true): Promise<KameraIzinDurumu> {
  const m = moduluAl()
  if (!m) return 'modul-yok'
  try {
    let izin = await m.getCameraPermissionsAsync()
    if (!izin.granted && sor && izin.canAskAgain !== false) izin = await m.requestCameraPermissionsAsync()
    return durumaCevir(izin)
  } catch {
    return 'sorulabilir'
  }
}
