import { View, StyleSheet } from 'react-native'
import { yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { IgneIkonu } from './mekan-ikonlari'

/**
 * MEKAN KARTININ KARE KUCUK HARITASI - WEB surumu.
 *
 * Kullanicinin istegi (2026-09-17): "kucuk map goruntusunde de gercek
 * haritadaki yeri gorunsun". Gercek harita `MekanKapakHarita.native`
 * icinde; Metro platforma gore dogru dosyayi seciyor, ekran farki
 * bilmiyor - `CanliHarita` ile ayni desen.
 *
 * WEB'DE NEDEN GERCEK HARITA YOK: `react-native-maps` web'i
 * desteklemiyor (2026-08-30 karari: iOS Apple, Android Google
 * Haritalar; web'de sematik cizim kaliyor). Bir tile servisi eklemek
 * yeni bir bagimlilik, anahtar ve KVKK aktarim kalemi demek; urun
 * telefonda yasiyor, web yalnizca deneme yuzeyi. Bu yuzden web'de
 * kartin karesi igneli sessiz kutu olarak kaliyor.
 */

export type MekanKapakHaritaProps = {
  /** Mekanin gercek koordinati. Yoksa igneli kutu cizilir. */
  konum: { lat: number; lng: number } | null
  /** Karenin kenari (px). */
  olcu: number
  /**
   * false ise harita HIC kurulmaz, yerine ayni olcude kutu cizilir.
   * Liste uzun oldugu icin ekran disindaki kartlarin haritasi
   * bilerek kurulmuyor (bkz. kesfet ekrani).
   */
  cizilsin?: boolean
  testID?: string
}

export function MekanKapakHarita({ olcu, testID }: MekanKapakHaritaProps) {
  const renk = useRenk()
  const stiller = useStiller(stilleriUret)
  return (
    <View style={[stiller.kutu, { width: olcu, height: olcu }]} testID={testID}>
      <IgneIkonu boyut={Math.round(olcu * 0.27)} renk={renk.turuncu} />
    </View>
  )
}

const stilleriUret = (renk: Renk) =>
  StyleSheet.create({
    kutu: {
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.turuncuZemin,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
  })
