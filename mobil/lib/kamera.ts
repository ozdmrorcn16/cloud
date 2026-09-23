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

type KameraModulu = {
  CameraView: unknown
  getCameraPermissionsAsync: () => Promise<{ granted: boolean }>
  requestCameraPermissionsAsync: () => Promise<{ granted: boolean }>
}

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

/** Kamera izni: verilmediyse istenir. Modul yoksa false. */
export async function kameraIzniAl(): Promise<boolean> {
  const m = moduluAl()
  if (!m) return false
  try {
    let izin = await m.getCameraPermissionsAsync()
    if (!izin.granted) izin = await m.requestCameraPermissionsAsync()
    return izin.granted
  } catch {
    return false
  }
}
