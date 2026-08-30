import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { renk } from './tema'

/**
 * Nabiz gibi atan CHECK-IN ISARETI.
 *
 * Karsilama ekraninda "Hesap oluştur" dugmesinin hemen ustunde duruyor
 * (kullanicinin karari 2026-08-30). Anlatmak istedigi sey urunun tek
 * vaadi: bir yere check-in yapiliyor ve o an orada canli bir hareket
 * var. Turuncu burada dekorasyon degil "canlilik" tasiyor; kimlik
 * kuralina uygun kullanim budur.
 *
 * Ayni desen kesfet ekranindaki haritada da var (`CanliHarita`); orada
 * her mekan igesinin altinda atiyor. Bu dosya onun tek ve daha buyuk
 * hali - iki ekran ayni sureyi (2600 ms) ve ayni easing'i paylasiyor
 * ki uygulama boyunca tek bir "nabiz" hissi olsun.
 *
 * "Hareketi azalt" aciksa halkalar HIC atmiyor; yerine tek bir duragan
 * halka ciziliyor, yani isaret yine bir yer isareti gibi duruyor ama
 * kimseyi rahatsiz etmiyor.
 */

/** Bir halkanin disari acilip sonme suresi. CanliHarita ile ayni. */
const NABIZ_SURESI = 2600

/** Ayni anda kac halka acilir; her biri surenin ucte biri kadar geride. */
const HALKA_SAYISI = 3

/** Isaretin kapladigi kare. Halkalar bu karenin tamamina aciliyor. */
const ALAN = 86

/** Ignenin boyu; halkalarin ortasinda kaliyor. */
const IGNE = 30

/** Disari dogru acilip sonen tek bir halka. */
function Halka({ gecikme, hareketVar }: { gecikme: number; hareketVar: boolean }) {
  const ilerleme = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareketVar) return
    const dongu = Animated.loop(
      Animated.timing(ilerleme, {
        toValue: 1,
        duration: NABIZ_SURESI,
        delay: gecikme,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    )
    dongu.start()
    return () => dongu.stop()
  }, [hareketVar, gecikme, ilerleme])

  if (!hareketVar) return null

  return (
    <Animated.View
      style={[
        stiller.halka,
        {
          opacity: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0] }),
          transform: [
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] }) },
          ],
        },
      ]}
    />
  )
}

export function NabizIsareti() {
  const [hareketVar, setHareketVar] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => setHareketVar(!azalt))
  }, [])

  return (
    <View
      style={stiller.alan}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {hareketVar ? (
        Array.from({ length: HALKA_SAYISI }, (_, i) => (
          <Halka key={i} gecikme={(NABIZ_SURESI / HALKA_SAYISI) * i} hareketVar />
        ))
      ) : (
        // Duragan hal: tek bir soluk halka. Isaret yine bir yer
        // isareti gibi duruyor, yalnizca atmiyor.
        <View style={[stiller.halka, { opacity: 0.22, transform: [{ scale: 0.58 }] }]} />
      )}

      <Svg width={IGNE} height={IGNE} viewBox="0 0 24 24">
        {/* Ozellik listesindeki 'konum' ikonuyla ayni cizim: ekranda
            iki farkli konum ignesi olmasin. */}
        <Path
          d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8A7.2 7.2 0 0 0 12 2.5z"
          fill={renk.turuncu}
        />
        <Circle cx={12} cy={9.6} r={2.7} fill={renk.karsilamaZemini} />
      </Svg>
    </View>
  )
}

const stiller = StyleSheet.create({
  alan: {
    width: ALAN,
    height: ALAN,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halka: {
    position: 'absolute',
    width: ALAN,
    height: ALAN,
    borderRadius: ALAN / 2,
    borderWidth: 2,
    borderColor: renk.turuncu,
  },
})
