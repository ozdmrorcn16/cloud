import { StyleSheet } from 'react-native'
import { yazi, olcek, bosluk, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/** Ayar alt sayfalarinda ortak hata satiri stili. */
const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginBottom: bosluk.m },
  })

export function useHataStili() {
  return useStiller(stilleriYap).hata
}
