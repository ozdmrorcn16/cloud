import { View, StyleSheet, type ViewStyle } from 'react-native'
import { MekanIkonu } from './MekanIkonu'
import { type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * Mekan kapagi: beyaz zemin + turuncu tur ikonu.
 *
 * Karar (kullanici, 2026-08-23): mekanlarin FOTOGRAFI olmayacak. Dis
 * kaynaktan gorsel cekme iptal edildi; kullanicinin check-in fotografi
 * da kapak olamaz cunku o kisi kendi yuzunu yukleyebilir. Kapak, yerin
 * NE OLDUGUNU anlatir. Gercek fotograflar yalnizca ANILARDA.
 *
 * Renk karari da kullanicinin: zemin BEYAZ, ikon TURUNCU. Bu kimlik
 * kuraliyla da ortusuyor - turuncu vurgu rengi olarak kaliyor, zemini
 * boyamiyor.
 *
 * Zemin sayfa zemininden (sicak beyaz) yalnizca bir tik ayrildigi icin
 * ince bir kenarlik sart: onsuz kapak arka planda kayboluyor.
 */
export function MekanGorseli({
  tur,
  ikonBoyut = 38,
  style,
  children,
}: {
  /** Kullanilmiyor ama cagri yerlerinde anlam tasiyor: kapak mekana ait. */
  mekanId?: string
  tur: string
  ikonBoyut?: number
  style?: ViewStyle | ViewStyle[]
  children?: React.ReactNode
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  return (
    <View style={[stiller.kapsayici, style]}>
      <View style={stiller.ikonAlani} pointerEvents="none">
        <MekanIkonu tur={tur} boyut={ikonBoyut} renk={renk.turuncu} />
      </View>
      {children}
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  // Ikon ortada ve icerigin ALTINDA: kart uzerine gelen yazi ve
  // rozetler ikonu ezmemeli.
  ikonAlani: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
