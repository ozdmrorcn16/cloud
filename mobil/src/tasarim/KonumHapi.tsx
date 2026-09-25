import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useHareket } from './hareket'
import { yazi, olcek, yuvarlak } from './tema'

/**
 * KONUM HAPI - anlikta mekan (kullanicinin referansi 2026-09-24).
 * Koyu yari saydam, ince cerceveli hap; turuncu igne + beyaz ad.
 * "Anlık ekle"de fotografin ustunde (x ile kaldirilir, bos ise "Konum
 * ekle ⌄"), izleyicide fotografin ALTINDA ortada (x yok, basinca mekan
 * sayfasi) - IKI EKRAN AYNI BILESEN.
 *
 * HAREKET: ilk cizimde asagidan kayarak ve buyuyerek belirir; ad
 * degisince kucuk bir "pop"; basinca yayli kuculur. Yalnizca
 * transform/opacity, native driver; "Hareketi azalt"ta yok.
 */
export function KonumHapi({
  ad,
  bosEtiket,
  onPress,
  onKaldir,
  kaldirEtiketi,
  testID,
  metinTestID,
  kaldirTestID,
  erisimRolu = 'button',
}: {
  /** Mekan adi; null ise `bosEtiket` + asagi ok. */
  ad: string | null
  bosEtiket?: string
  onPress: () => void
  /** Verilirse adin yaninda x (yalnizca paylasan). */
  onKaldir?: () => void
  kaldirEtiketi?: string
  testID: string
  metinTestID?: string
  kaldirTestID?: string
  erisimRolu?: 'button' | 'link'
}) {
  const hareket = useHareket()
  const giris = useRef(new Animated.Value(0)).current
  const pop = useRef(new Animated.Value(1)).current
  const basma = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!hareket) {
      giris.setValue(1)
      return
    }
    Animated.spring(giris, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }).start()
  }, [hareket, giris])

  const ilkRef = useRef(true)
  useEffect(() => {
    if (ilkRef.current) {
      ilkRef.current = false
      return
    }
    if (!hareket) return
    pop.setValue(0.85)
    Animated.spring(pop, { toValue: 1, speed: 16, bounciness: 12, useNativeDriver: true }).start()
  }, [ad, hareket, pop])

  const bas = (hedef: number) => {
    if (!hareket) return
    Animated.spring(basma, {
      toValue: hedef,
      speed: hedef < 1 ? 40 : 18,
      bounciness: hedef < 1 ? 0 : 10,
      useNativeDriver: true,
    }).start()
  }

  const olcekDegeri = Animated.multiply(
    Animated.multiply(pop, basma),
    giris.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
  )
  const kayma = giris.interpolate({ inputRange: [0, 1], outputRange: [14, 0] })

  return (
    <Animated.View style={{ opacity: giris, transform: [{ translateY: kayma }, { scale: olcekDegeri }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => bas(0.94)}
        onPressOut={() => bas(1)}
        accessibilityRole={erisimRolu}
        accessibilityLabel={ad ?? bosEtiket}
        testID={testID}
        style={stiller.hap}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill={ad ? '#FE7813' : '#FFFFFF'} />
          <Circle cx={12} cy={9} r={2.4} fill={ad ? '#FFFFFF' : '#1A1714'} />
        </Svg>
        <Text style={stiller.yazi} numberOfLines={1} testID={metinTestID}>
          {ad ?? bosEtiket}
        </Text>
        {ad && onKaldir ? (
          <Pressable
            onPress={onKaldir}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={kaldirEtiketi}
            testID={kaldirTestID}
            style={stiller.kaldir}
          >
            <Svg width={12} height={12} viewBox="0 0 24 24">
              <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </Pressable>
        ) : !ad ? (
          <Text style={stiller.ok}>⌄</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  )
}

const stiller = StyleSheet.create({
  hap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 300,
    paddingVertical: 11,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: yuvarlak.hap,
    backgroundColor: 'rgba(20,18,16,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  yazi: { flexShrink: 1, fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.govde, color: '#FFFFFF' },
  ok: { fontFamily: yazi.govde, fontSize: olcek.govde, color: '#FFFFFF', marginTop: -4 },
  kaldir: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    marginRight: -4,
  },
})
