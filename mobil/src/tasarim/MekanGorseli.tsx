import { LinearGradient } from 'expo-linear-gradient'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { MekanIkonu } from './MekanIkonu'

/**
 * Mekan kapagi: turetilmis renk zemini + tur ikonu.
 *
 * Karar (kullanici, 2026-08-23): mekanlarin FOTOGRAFI olmayacak. Dis
 * kaynaktan gorsel cekme (Wikimedia, Mapillary, Google) iptal edildi;
 * kullanicinin check-in fotografi da kapak olamaz cunku o kisi kendi
 * yuzunu yukleyebilir. Kapak, yerin NE OLDUGUNU anlatir: kafeyse
 * fincan, restoransa catal, binaysa bina.
 *
 * Gercek fotograflar yalnizca ANILARDA, yani kisilerin orada
 * cektikleri gorsellerde gorunur.
 *
 * Renk esi mekan id'sinden TURETILIYOR: ayni mekan her acilista ayni
 * rengi alir, liste alacali gorunmez, ve hicbir ag istegi gerekmez.
 */

// Sicak, birbirine yakin tonlar. Turuncu YOK: o renk yalnizca eylem ve
// canlilik icin ayrildi, dekoratif zeminlerde kullanilmaz.
const ESLER: [string, string][] = [
  ['#E9D7C3', '#8C6E4E'],
  ['#DCE0D2', '#5F6B54'],
  ['#E3DCD2', '#7A6A57'],
  ['#D8D3CE', '#615850'],
  ['#EAD9C2', '#8A6841'],
  ['#D5DAD8', '#5A6562'],
]

/** Ayni id her zaman ayni esi verir; siralama degisse de renk oynamaz. */
function esSec(id: string): [string, string] {
  let toplam = 0
  for (let i = 0; i < id.length; i++) toplam = (toplam + id.charCodeAt(i)) % 997
  return ESLER[toplam % ESLER.length]
}

export function MekanGorseli({
  mekanId,
  tur,
  ikonBoyut = 28,
  style,
  children,
}: {
  mekanId: string
  tur: string
  ikonBoyut?: number
  style?: ViewStyle | ViewStyle[]
  children?: React.ReactNode
}) {
  const es = esSec(mekanId)
  return (
    <View style={[stiller.kapsayici, style]}>
      <LinearGradient
        colors={es}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={stiller.ikonAlani} pointerEvents="none">
        <MekanIkonu tur={tur} boyut={ikonBoyut} renk="rgba(255,255,255,0.92)" />
      </View>
      {children}
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { overflow: 'hidden', position: 'relative' },
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
