import { LinearGradient } from 'expo-linear-gradient'
import { View, StyleSheet, type ViewStyle } from 'react-native'

/**
 * Mekan gorseli.
 *
 * Overture verisinde mekan fotografi YOK. Kimlik ise tam kanama
 * fotograf kapaklari uzerine kurulu (karar 73), yani bos gri bir kutu
 * tasarimi comertirdi. Cozum: her mekan kendi renk esini id'sinden
 * TURETIR - ayni mekan her acilista ayni rengi alir, liste alacali
 * gorunmez ve gercek fotograflar geldiginde bu bilesen degistirilir,
 * cagiran ekranlar degismez.
 */

// Sicak, birbirine yakin tonlar. Turuncu YOK: o renk yalnizca eylem ve
// canlilik icin ayrildi, dekoratif zeminlerde kullanilmaz.
const ESLER: [string, string, string][] = [
  ['#E9D7C3', '#C09A6F', '#6F5136'],
  ['#DCE0D2', '#A9B49A', '#5A6350'],
  ['#E3DCD2', '#B7A896', '#6A5D4E'],
  ['#D8D3CE', '#A79E96', '#5C544D'],
  ['#EAD9C2', '#C89F72', '#7A5A38'],
  ['#D5DAD8', '#9FAAA6', '#525B58'],
]

/** Ayni id her zaman ayni esi verir; siralama degisse de renk oynamaz. */
function esSec(id: string): [string, string, string] {
  let toplam = 0
  for (let i = 0; i < id.length; i++) toplam = (toplam + id.charCodeAt(i)) % 997
  return ESLER[toplam % ESLER.length]
}

export function MekanGorseli({
  mekanId,
  style,
  children,
}: {
  mekanId: string
  style?: ViewStyle | ViewStyle[]
  children?: React.ReactNode
}) {
  const es = esSec(mekanId)
  return (
    <View style={[stiller.kapsayici, style]}>
      <LinearGradient
        colors={es}
        locations={[0, 0.45, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Ust kosede yumusak bir isik: duz gradyan yassi duruyor. */}
      <LinearGradient
        colors={['rgba(255,247,235,0.45)', 'rgba(255,247,235,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.75, y: 0.65 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { overflow: 'hidden', position: 'relative' },
})
