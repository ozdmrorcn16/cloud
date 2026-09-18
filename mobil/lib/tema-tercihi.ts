import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/**
 * TEMA TERCIHI (kullanicinin referans ekrani 2026-09-19, Ayarlar >
 * Uygulama > Gorunum): "Sistemle ayni" / "Acik" / "Koyu".
 *
 * CIHAZDA saklanir (AsyncStorage), sunucuda DEGIL: bu bir hesap
 * tercihi degil, o telefonda nasil gorunsun sorusu - tur suzgeciyle
 * ayni gerekce (2026-09-09). Web'de localStorage'a duser.
 *
 * Modul duzeyinde tek deger + `useSyncExternalStore`: `useRenk` 600'den
 * fazla yerde cagriliyor, her birine context gecirmek yerine hepsi
 * buradaki kucuk depoya abone oluyor. Uygulama acilirken
 * `temaTercihiniYukle` bir kez okur; okunana kadar "sistem" gecerli,
 * yani ilk kare cihazin temasiyla cizilir.
 */
export type TemaTercihi = 'sistem' | 'acik' | 'koyu'

export const TEMA_TERCIHLERI: readonly TemaTercihi[] = ['sistem', 'acik', 'koyu']

const ANAHTAR = 'tema-tercihi'

let mevcut: TemaTercihi = 'sistem'
const dinleyiciler = new Set<() => void>()

function bildir() {
  for (const d of dinleyiciler) d()
}

function gecerliMi(deger: unknown): deger is TemaTercihi {
  return typeof deger === 'string' && (TEMA_TERCIHLERI as readonly string[]).includes(deger)
}

/** Depodan okur; bozuk ya da bos deger "sistem" sayilir. */
export async function temaTercihiniYukle(): Promise<TemaTercihi> {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR)
    mevcut = gecerliMi(ham) ? ham : 'sistem'
  } catch {
    mevcut = 'sistem'
  }
  bildir()
  return mevcut
}

/** Aninda uygular (ekran hemen doner), sonra depoya yazar. */
export async function temaTercihiniAyarla(tercih: TemaTercihi): Promise<void> {
  mevcut = tercih
  bildir()
  try {
    await AsyncStorage.setItem(ANAHTAR, tercih)
  } catch {
    // Depo yazilamadiysa tercih bu oturum icin yine gecerli.
  }
}

export function temaTercihi(): TemaTercihi {
  return mevcut
}

function abone(d: () => void) {
  dinleyiciler.add(d)
  return () => {
    dinleyiciler.delete(d)
  }
}

export function useTemaTercihi(): TemaTercihi {
  return useSyncExternalStore(abone, temaTercihi, temaTercihi)
}

/** Testler icin: depoya dokunmadan modul degerini sifirlar. */
export function temaTercihiniSifirla() {
  mevcut = 'sistem'
  bildir()
}
