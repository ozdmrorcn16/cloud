import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useHareket } from './hareket'

/**
 * HAREKETLI DUGME (kullanicinin istegi 2026-09-24/26: "butonlar
 * animasyonlu olsun"): ekran acilirken sirayla YAYLI BELIRIR (olcek
 * 0.6 -> 1 + solma, `sira` basina 70 ms), basinca yayli kuculur ve
 * birakinca hafif sekerek geri gelir. Yalnizca transform/opacity,
 * native driver. "Hareketi azalt" aciksa hareket yok, dugme hazir.
 * Anlik ekle ve anlik izleyicideki dugmeler bunu kullanir.
 */
export function HareketliDugme({
  etiket,
  testID,
  onPress,
  children,
  sira = 0,
  secili,
  disabled,
  style,
  kucukme = 0.92,
}: {
  etiket: string
  testID: string
  onPress: () => void
  children: ReactNode
  sira?: number
  /** Flas gibi acik/kapali dugmelerde erisilebilirlik durumu. */
  secili?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  /** Basinca olcek (yuvarlak dugmede 0.86, genis dugmede 0.94). */
  kucukme?: number
}) {
  const hareket = useHareket()
  const giris = useRef(new Animated.Value(0)).current
  const basma = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!hareket) {
      giris.setValue(1)
      return
    }
    const zamanlayici = setTimeout(() => {
      Animated.spring(giris, { toValue: 1, speed: 14, bounciness: 9, useNativeDriver: true }).start()
    }, 80 + sira * 70)
    return () => clearTimeout(zamanlayici)
  }, [hareket, giris, sira])

  const bas = (hedef: number) => {
    if (!hareket) return
    Animated.spring(basma, {
      toValue: hedef,
      speed: hedef < 1 ? 40 : 18,
      bounciness: hedef < 1 ? 0 : 12,
      useNativeDriver: true,
    }).start()
  }

  const olcek = Animated.multiply(basma, giris.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }))
  // Genis dugmeler satirda esit paylassin: dis kap flex alir.
  // Ic Pressable'a flex VERILMEZ: sutun yonlu kapta flex:1 = flexBasis 0,
  // yukseklik 0 olur (2026-09-26 telefonda zemin ve yazi kayboldu).
  const duz = StyleSheet.flatten(style) ?? {}
  const disEsnek = duz.flex !== undefined
  const { flex: _flex, ...icStil } = duz
  return (
    <Animated.View style={[disEsnek && { flex: 1 }, { opacity: giris, transform: [{ scale: olcek }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => bas(kucukme)}
        onPressOut={() => bas(1)}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={etiket}
        accessibilityState={
          disabled !== undefined ? { disabled } : secili === undefined ? undefined : { selected: secili }
        }
        testID={testID}
        style={icStil}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

