import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { yazi, olcek, bosluk, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { useHareket } from './hareket'

/**
 * Detay ekranlarinin ust cubugu: geri oku + baslik.
 *
 * Uygulamada `Stack` yok, `Slot` var (bkz. src/app/_layout.tsx). Yani
 * hicbir ekranin kendiliginden gelen basligi ya da geri dugmesi yok;
 * detay ekranlarindan cikmanin tek yolu cihazin kendi hareketiydi.
 * Bu bilesen o boslugu dolduruyor.
 *
 * Baslik ORTALI degil sola yasli: Instagram ayarlarinda ortali duruyor
 * ama "Engellenenler" gibi uzun bir baslikta iki yana esit bosluk
 * birakmak geri okunu sikistiriyor.
 */
export function UstCubuk({
  baslik,
  geriEtiketi,
  sag,
}: {
  baslik: string
  geriEtiketi: string
  /** Cubugun sag ucuna konan istege bagli dugme (ornegin uc nokta). */
  sag?: ReactNode
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()

  // BASLIKSIZ CUBUK KOMPAKT. Baslik yoksa cubuk yalnizca iki ikon
  // tasiyor ve 44 px'lik ust paya ihtiyaci kalmiyor; o pay basligin
  // durum cubugundan ayrilmasi icindi.
  const basliksiz = baslik.trim().length === 0

  return (
    <View style={[stiller.cubuk, basliksiz && stiller.cubukKompakt]}>
      <GeriDugmesi etiket={geriEtiketi} renk={renk.metin} onPress={() => router.back()} />
      {!basliksiz && (
        <Text style={stiller.baslik} accessibilityRole="header" numberOfLines={1}>
          {baslik}
        </Text>
      )}
      {sag && <View style={stiller.sag}>{sag}</View>}
    </View>
  )
}

/**
 * HAREKETLI GERI OKU (kullanicinin istegi 2026-09-26: "geri tusunu
 * animasyonlu yap"). UstCubuk'u kullanan BUTUN ekranlarda ayni:
 * ekran acilirken ok sagdan kayip yayla oturur; basinca ok sola itilip
 * kuculur, birakinca yayla geri gelir - "geri" yonunu hareketle soyler.
 * Yalnizca transform/opacity, native driver; "Hareketi azalt"ta yok.
 */
function GeriDugmesi({ etiket, renk, onPress }: { etiket: string; renk: string; onPress: () => void }) {
  const hareket = useHareket()
  const giris = useRef(new Animated.Value(hareket ? 0 : 1)).current
  const basma = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareket) {
      giris.setValue(1)
      return
    }
    Animated.spring(giris, { toValue: 1, speed: 12, bounciness: 10, useNativeDriver: true }).start()
  }, [hareket, giris])

  const bas = (hedef: number) => {
    if (!hareket) return
    Animated.spring(basma, {
      toValue: hedef,
      speed: hedef > 0 ? 40 : 16,
      bounciness: hedef > 0 ? 0 : 12,
      useNativeDriver: true,
    }).start()
  }

  const x = Animated.add(
    giris.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    basma.interpolate({ inputRange: [0, 1], outputRange: [0, -5] })
  )
  const olcek = basma.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] })

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => bas(1)}
      onPressOut={() => bas(0)}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      hitSlop={12}
      testID="ust-cubuk-geri"
    >
      <Animated.View style={{ opacity: giris, transform: [{ translateX: x }, { scale: olcek }] }}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </Animated.View>
    </Pressable>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  cubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },
  cubukKompakt: { paddingTop: bosluk.m, paddingBottom: bosluk.s },
  // Sag bilesen varken baslik ile arasinda bosluk kalsin diye baslik
  // esneyerek buyuyor; sag uc sabit genislikte.
  sag: { marginLeft: 'auto' },
  baslik: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
})
