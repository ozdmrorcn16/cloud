import { StyleSheet, Text, View } from 'react-native'
import { yazi, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/**
 * PROFIL FOTOGRAFI OLMAYAN KISININ AVATARI - bas harfli daire.
 *
 * Kullanicinin bildirdigi kusur (2026-09-13, kendi profilinin ekran
 * goruntusuyle): "Profil resminin ici de beyaz oldugu icin bosken zor
 * gorunuyor, biraz daha gorunur bir hale getir." Daire BEYAZ zeminli
 * ve beyaz halkaliydi; profilin ust blogundaki harita dokusu da
 * neredeyse beyaz oldugu icin daire dokunun icinde kayboluyordu.
 *
 * COZUM: akis kartlarindaki avatar diliyle AYNI dolgu (acik turuncu
 * zemin + turuncu harf) ve ustune INCE TURUNCU KENARLIK. Dolu turuncu
 * daire denenmedi: ust blokta kocaman bir turuncu leke "turuncu
 * yalnizca eylem ve canlilik icindir" kuralini bozardi. Kenarlik ise
 * daireyi dokudan kesin olarak ayiriyor - acik dolgu tek basina beyaz
 * uzerinde silik kalabiliyordu.
 *
 * ORTAK BILESEN: kendi profil ekrani ve baskasinin profili ayni
 * daireyi cizyor (`ayni-sey-her-ekranda-ayni-gorunsun`). Onceden iki
 * ekranin ikisinde de ayri stil vardi ve birbirini tutmuyordu: kendi
 * profilde beyaz zemin, baskasininkinde acik turuncu.
 */
export function BasHarfAvatar({
  ad,
  cap = 88,
  testID,
}: {
  /** Bas harfi alinacak ad; bos ya da null ise "?" cizilir. */
  ad: string | null | undefined
  cap?: number
  testID?: string
}) {
  const stiller = useStiller(stilleriYap)
  const harf = (ad || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'

  return (
    <View
      style={[stiller.daire, { width: cap, height: cap, borderRadius: cap / 2 }]}
      testID={testID}
    >
      {/* Harf capin ucte biri: 88'de 30 (eski degerin aynisi), daha
          kucuk dairelerde orantili kuculuyor. */}
      <Text style={[stiller.harf, { fontSize: Math.round(cap * 0.34) }]}>{harf}</Text>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    daire: {
      backgroundColor: renk.turuncuZemin,
      borderWidth: 2,
      borderColor: renk.turuncu,
      alignItems: 'center',
      justifyContent: 'center',
    },
    harf: {
      fontFamily: yazi.ekranBasligi,
      color: renk.turuncuYazi,
    },
  })
