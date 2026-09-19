import { useSyncExternalStore } from 'react'

/**
 * YERINDE DUZENLEME KILIDI (kullanicinin istegi 2026-09-19: "bir
 * duzenleme kapanmadan obur duzenleme acilmasin").
 *
 * Akistaki her check-in karti kendi duzenleme durumunu tasiyor; ayni
 * anda iki kartin acik olmasi mumkundu (ekran goruntusuyle bildirildi).
 * Kilit MODUL DUZEYINDE: hangi ekranda olursa olsun ayni anda tek kart
 * duzenlenir. Kart acarken kilidi ister, Vazgec/Kaydet/unmount'ta
 * birakir; kilit baskasindaysa menude "Duzenle" hic gorunmez.
 *
 * Neden ekran state'i degil: kart uc ekranda (akis, profil, baskasinin
 * profili) ortak; uc ekrana ayri ayri prop tasimak yerine tek kaynak.
 * `useSyncExternalStore` deseni `lib/tema-tercihi.ts` ile ayni.
 */

let aktifId: string | null = null
const dinleyiciler = new Set<() => void>()

function bildir() {
  for (const d of dinleyiciler) d()
}

/** Kilidi al. Baska bir kart tutuyorsa false; ayni kart tekrar isterse true. */
export function duzenlemeyiKilitle(id: string): boolean {
  if (aktifId !== null && aktifId !== id) return false
  if (aktifId !== id) {
    aktifId = id
    bildir()
  }
  return true
}

/** Yalnizca kilidi tutan kart birakabilir - baskasinin kilidini dusuremez. */
export function duzenlemeKilidiniBirak(id: string): void {
  if (aktifId !== id) return
  aktifId = null
  bildir()
}

export function duzenlenenKartId(): string | null {
  return aktifId
}

/** Testler arasi taşınmasın diye (jest.setup). */
export function duzenlemeKilidiniSifirla(): void {
  aktifId = null
  bildir()
}

function abone(d: () => void) {
  dinleyiciler.add(d)
  return () => {
    dinleyiciler.delete(d)
  }
}

/** Su an duzenlenen kartin kimligi; degisince bilesen yeniden cizilir. */
export function useDuzenlenenKartId(): string | null {
  return useSyncExternalStore(abone, duzenlenenKartId, duzenlenenKartId)
}
