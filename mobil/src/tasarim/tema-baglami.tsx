import { useMemo } from 'react'
import { useColorScheme, type StyleSheet } from 'react-native'
import { acikRenk, koyuRenk, type Renk } from './tema'

/**
 * KOYU MOD (kullanicinin istegi 2026-09-03): "telefonların koyu moduna
 * ya da açık moduna göre uyarlı olsun".
 *
 * Uygulamada 606 yerde renk jetonu kullaniliyor ve hepsi `StyleSheet`
 * blogunun ICINDE, yani MODUL YUKLENIRKEN bir kez hesaplaniyordu.
 * Renk calisma aninda degisecekse o bloklar da calisma aninda
 * uretilmek zorunda: bu yuzden her ekran `const stiller =
 * useStiller(stilleriYap)` diyor ve `stilleriYap` paleti parametre
 * aliyor.
 *
 * `useMemo` SART: StyleSheet.create her render'da yeniden cagrilirsa
 * her satir yeni bir stil nesnesi alir ve liste satirlari bosuna
 * yeniden cizilir. Palet degismedikce ayni nesne donuyor.
 *
 * Cihaz ayarini okumak icin `app.json`da `userInterfaceStyle:
 * "automatic"` olmasi sart - zaten oyleydi, yani bu degisiklik NATIVE
 * DERLEME GEREKTIRMIYOR, OTA ile gidiyor.
 */
export function useRenk(): Renk {
  const sema = useColorScheme()
  return sema === 'dark' ? koyuRenk : acikRenk
}

/**
 * Paletin degistigi her seferde stilleri yeniden uretir, arada aynisini
 * dondurur.
 *
 * Tip `any` degil jenerik: `stilleriYap`in dondurdugu sekil aynen
 * disari cikiyor, yani `stiller.kart` gibi erisimler tip guvenli
 * kaliyor.
 */
export function useStiller<T extends StyleSheet.NamedStyles<T>>(
  stilleriYap: (renk: Renk) => T
): T {
  const renk = useRenk()
  return useMemo(() => stilleriYap(renk), [renk, stilleriYap])
}
