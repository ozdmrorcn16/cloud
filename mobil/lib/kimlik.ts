import { supabase } from './supabase'
import { oturumDegisinceSifirla } from './oturum-olayi'

/**
 * OTURUM KIMLIGI YERELDEN (2026-09-22, performans olcumu).
 *
 * Kullanicinin bildirimi: "her sayfa her seferinde yuklenmeye
 * calisiyor". Olcum (`araclar/gezinme-olcum.mjs`) ana sayfaya her
 * donuste 37 istek gosterdi; bunlarin DORDU `auth/v1/user` idi.
 *
 * Sebep: `supabase.auth.getUser()` her cagrida SUNUCUYA gidip jetonu
 * dogruluyor (supabase-js v2'de bilerek boyle). Oysa cagiran yerlerin
 * neredeyse hepsi yalnizca "benim kimligim ne" diye soruyor ve o bilgi
 * zaten yerel oturumda (JWT) duruyor. `getSession()` yerel depodan
 * okuyor; jetonun suresi dolmussa kendisi yeniliyor, yani guvenlik
 * kaybi yok - kimligi ZATEN sunucu imzalamis.
 *
 * SUNUCUYA DOGRULATMAK GEREKEN YERLER BUNU KULLANMAZ: hesap silme ve
 * hesap guvenligi akislari `getUser()` ile devam ediyor; orada amac
 * kimligi okumak degil, jetonun HALA gecerli oldugunu sunucuya
 * onaylatmak.
 *
 * Ayrica ayni ekran cizimi icinde onlarca cagri geldigi icin sonuc
 * kisa sure bellekte tutuluyor: arka arkaya gelen sorular tek bir
 * `getSession()` ile cevaplaniyor. Oturum degisince (giris/cikis)
 * onbellek kendiliginden dusuyor.
 */

/** Bellek onbelleginin omru; tek bir ekran cizimini kapsayacak kadar kisa. */
const ONBELLEK_MS = 3000

let sonKimlik: string | null = null
let sonOkuma = 0
let bekleyen: Promise<string | null> | null = null

/** Giris/cikista onbellegi dusurur. */
export function kimlikOnbelleginiSifirla() {
  sonKimlik = null
  sonOkuma = 0
  bekleyen = null
}

oturumDegisinceSifirla(kimlikOnbelleginiSifirla)

/**
 * Su anki kullanicinin kimligi; oturum yoksa null.
 *
 * Aga GITMEZ (jeton suresi dolmadikca). Kimlik gerektiren ama oturumsuz
 * cagrilmasi hata sayilan yerler `kimligiZorunluOku` kullanir.
 */
export async function kullaniciKimligi(): Promise<string | null> {
  const simdi = Date.now()
  if (sonKimlik !== null && simdi - sonOkuma < ONBELLEK_MS) return sonKimlik
  // Ayni anda gelen cagrilar tek istege biniyor.
  if (bekleyen) return bekleyen
  bekleyen = supabase.auth
    .getSession()
    .then(({ data }) => {
      sonKimlik = data.session?.user?.id ?? null
      sonOkuma = Date.now()
      return sonKimlik
    })
    .finally(() => {
      bekleyen = null
    })
  return bekleyen
}

/** Kimlik yoksa hata firlatir - cagiran yerin metni korunuyor. */
export async function kimligiZorunluOku(hataMesaji = 'Oturum bulunamadı'): Promise<string> {
  const kimlik = await kullaniciKimligi()
  if (!kimlik) throw new Error(hataMesaji)
  return kimlik
}
