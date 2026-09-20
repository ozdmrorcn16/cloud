import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { EGRI, useHareket } from './hareket'

/**
 * BASARI DUGMESI - birincil hap buton; is bitince "basari ani" oynatir.
 *
 * Check-in icin (2026-09-20, kullanicinin onayladigi ornek): urunun en
 * duygusal ani bugune kadar duz bir `router.replace` idi. Simdi:
 *   1. hap 54 px'lik turuncu daireye "toplanir" (hap solar, daire
 *      %90'dan buyur; 320 ms cekmece egrisi - hepsi opacity/transform),
 *   2. tik belirir (%80'den, 220 ms guclu ease-out, 120 ms gecikme),
 *   3. altinda durum satiri ("Şu an buradasın") 6 px yukari suzulup
 *      belirir (300 ms, 450 ms gecikme),
 *   4. `basariSuresi` dolunca `onBasariBitti` cagrilir (yonlendirme).
 *
 * Nadir tier (gunde 1-3 kez) - "keyif" butcesi burada. "Hareketi
 * azalt" aciksa hareket yok: tik ve durum satiri dogrudan gorunur,
 * bekleme kisalir (500 ms) ki kullanici sonucu yine gorsun.
 */
export function BasariDugmesi({
  etiket,
  mesgulEtiketi,
  basariEtiketi,
  mesgul,
  basarili,
  disabled,
  onPress,
  onBasariBitti,
  basariSuresi = 1150,
  testID,
}: {
  etiket: string
  mesgulEtiketi: string
  basariEtiketi: string
  mesgul: boolean
  basarili: boolean
  disabled?: boolean
  onPress: () => void
  onBasariBitti: () => void
  basariSuresi?: number
  testID?: string
}) {
  const stiller = useStiller(stilleriYap)
  const hareket = useHareket()
  const ilerleme = useRef(new Animated.Value(0)).current // 0 hap, 1 daire
  const tik = useRef(new Animated.Value(0)).current
  const durum = useRef(new Animated.Value(0)).current
  const basili = useRef(new Animated.Value(1)).current
  const [durumGoster, setDurumGoster] = useState(false)

  useEffect(() => {
    if (!basarili) {
      ilerleme.setValue(0)
      tik.setValue(0)
      durum.setValue(0)
      setDurumGoster(false)
      return
    }
    setDurumGoster(true)
    if (!hareket) {
      ilerleme.setValue(1)
      tik.setValue(1)
      durum.setValue(1)
      const z = setTimeout(onBasariBitti, 500)
      return () => clearTimeout(z)
    }
    const a = Animated.parallel([
      Animated.timing(ilerleme, { toValue: 1, duration: 320, easing: EGRI.cekmece, useNativeDriver: true }),
      Animated.timing(tik, { toValue: 1, duration: 220, delay: 120, easing: EGRI.girisCikis, useNativeDriver: true }),
      Animated.timing(durum, { toValue: 1, duration: 300, delay: 450, easing: EGRI.girisCikis, useNativeDriver: true }),
    ])
    a.start()
    const z = setTimeout(onBasariBitti, basariSuresi)
    return () => {
      a.stop()
      clearTimeout(z)
    }
    // onBasariBitti her render'da yeni fonksiyon olabilir; zamanlayici
    // yalnizca basarili degisince kurulmali.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basarili, hareket])

  function basiliHal(basiliMi: boolean) {
    if (!hareket) return
    Animated.timing(basili, {
      toValue: basiliMi ? 0.97 : 1,
      duration: 120,
      easing: EGRI.girisCikis,
      useNativeDriver: true,
    }).start()
  }

  const hapOpakligi = ilerleme.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0, 0] })
  const daireOpakligi = ilerleme.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] })
  const daireOlcegi = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
  const yaziOlcegi = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] })
  const tikOlcegi = tik.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] })
  const durumY = durum.interpolate({ inputRange: [0, 1], outputRange: [6, 0] })

  return (
    <View style={stiller.kap}>
      <Pressable
        onPress={onPress}
        onPressIn={() => basiliHal(true)}
        onPressOut={() => basiliHal(false)}
        disabled={disabled || mesgul || basarili}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || mesgul, busy: mesgul }}
        accessibilityLabel={basarili ? basariEtiketi : mesgul ? mesgulEtiketi : etiket}
        testID={testID}
        style={stiller.dokunma}
      >
        <Animated.View style={[stiller.govde, { transform: [{ scale: basili }] }]}>
          {/* Hap: dolgu ve yazi birlikte solar. */}
          <Animated.View style={[stiller.hap, { opacity: hapOpakligi }]} />
          <Animated.Text style={[stiller.yazi, { opacity: hapOpakligi, transform: [{ scale: yaziOlcegi }] }]}>
            {mesgul ? mesgulEtiketi : etiket}
          </Animated.Text>
          {/* Daire + tik: hap solarken ortada belirir. */}
          <Animated.View
            style={[stiller.daire, { opacity: daireOpakligi, transform: [{ scale: daireOlcegi }] }]}
            testID={testID ? `${testID}-basari` : undefined}
          >
            <Animated.View style={{ opacity: tik, transform: [{ scale: tikOlcegi }] }}>
              <Svg width={26} height={26} viewBox="0 0 24 24">
                <Path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFFFF" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
      {durumGoster && (
        <Animated.View style={[stiller.durum, { opacity: durum, transform: [{ translateY: durumY }] }]}>
          <View style={stiller.nokta} />
          <Text style={stiller.durumYazi}>{basariEtiketi}</Text>
        </Animated.View>
      )}
    </View>
  )
}

const YUKSEKLIK = 52

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kap: { alignItems: 'center', gap: bosluk.m },
    dokunma: { alignSelf: 'stretch' },
    govde: { height: YUKSEKLIK, alignItems: 'center', justifyContent: 'center' },
    hap: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: renk.turuncu,
      borderRadius: yuvarlak.hap,
    },
    yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
    daire: {
      position: 'absolute',
      width: YUKSEKLIK,
      height: YUKSEKLIK,
      borderRadius: YUKSEKLIK / 2,
      backgroundColor: renk.turuncu,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durum: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    nokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: renk.turuncu },
    durumYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi },
  })
