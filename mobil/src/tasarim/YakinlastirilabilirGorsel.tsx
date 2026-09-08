import { Component, useRef, type ReactNode } from 'react'
import { Animated, Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native'
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler'

/**
 * BUYUK GORUNUMDEKI FOTOGRAF - iki parmakla yakinlastirilabilir.
 *
 * Kullanicinin istegi (2026-09-08): "fotografa yakinlasma yapilabilsin
 * iki parmagimla zoomlamak istedigimde" ve ardindan iOS'la sinirli
 * kalmamasi icin "simdi yap".
 *
 * YONTEM: `react-native-gesture-handler` + RN'IN KENDI `Animated`i.
 *
 * REANIMATED KULLANILMADI ve sebebi olculdu:
 *   - Projede `babel.config.js` HIC YOK, yani reanimated'in zorunlu
 *     babel eklentisi hicbir zaman yapilandirilmamis. Worklet'ler o
 *     eklenti olmadan calismaz.
 *   - Jest'te de kurulu degil: import edilir edilmez butun test paketi
 *     "Cannot read properties of undefined (reading 'loadUnpackers')"
 *     ile cokuyordu.
 * Gesture-handler'in klasik API'si (`PinchGestureHandler` +
 * `PanGestureHandler`) RN'in `Animated`iyla calisiyor, babel eklentisi
 * istemiyor ve IKI PLATFORMDA da ayni davraniyor.
 *
 * ONCEKI HAL `ScrollView`in kendi yakinlastirmasiydi; o yalnizca
 * iOS'ta calisiyordu (Android'de `maximumZoomScale` yok sayiliyor).
 *
 * OLCEK 1 ile 4 ARASINDA KENETLI: 1'in altina inmek fotografi
 * cerceveden kucultur, 4'un ustu bu cozunurlukte bulanik.
 *
 * PARMAK KALKINCA KENETLENIYOR ama zoom SIFIRLANMIYOR - kullanici
 * inceledigi yerde kalabilmeli. Cikis yolu kapatma dugmesi.
 */

const EN_AZ = 1
const EN_COK = 4

/**
 * GUVENLIK AGI.
 *
 * `react-native-gesture-handler` NATIVE bir modul. Paket 2026-09-08'e
 * kadar uygulamada hic KULLANILMIYORDU; bagimliliklarda oldugu icin
 * autolinking ile derlemeye girmis olmasi gerekir, ama bunu mevcut
 * TestFlight derlemesinde dogrulamanin yolu yok - yeni bir derleme
 * alinana kadar kanit yalnizca dolayli.
 *
 * Bu guncelleme OTA ile gidiyor, yani modul o derlemede yoksa fotografa
 * basan herkes COKME yasardi. Sinir, hatayi yakalayip duz bir
 * `Image`e duesuyor: yakinlastirma calismaz ama fotograf acilir.
 *
 * Yeni bir native derleme alindiktan ve zoom telefonda dogrulandiktan
 * sonra bu sinif kaldirilabilir.
 */
class HareketSiniri extends Component<
  { yedek: ReactNode; children: ReactNode },
  { hata: boolean }
> {
  state = { hata: false }

  static getDerivedStateFromError() {
    return { hata: true }
  }

  componentDidCatch(hata: unknown) {
    // Sessizce yutmuyoruz: sorun gercekten varsa gunlukte gorunsun.
    console.warn('Yakinlastirma baslatilamadi, duz goruntuye duesuldue:', hata)
  }

  render() {
    return this.state.hata ? this.props.yedek : this.props.children
  }
}

export function YakinlastirilabilirGorsel({
  uri,
  stil,
}: {
  uri: string
  stil?: StyleProp<ImageStyle>
}) {
  // Parmaklar ekrandayken ANLIK deger, kalkinca birikmis degere
  // katlaniyor. Iki degeri ayirmak sart: tek bir degerle her yeni
  // hareket bastan basliyor ve goruntu ziplyordu.
  const anlikOlcek = useRef(new Animated.Value(1)).current
  const birikmisOlcek = useRef(new Animated.Value(1)).current
  const olcek = Animated.multiply(birikmisOlcek, anlikOlcek)
  const sonOlcek = useRef(1)

  const anlikX = useRef(new Animated.Value(0)).current
  const anlikY = useRef(new Animated.Value(0)).current
  const birikmisX = useRef(new Animated.Value(0)).current
  const birikmisY = useRef(new Animated.Value(0)).current
  const sonKonum = useRef({ x: 0, y: 0 })

  const yakinlastirmaOlayi = Animated.event([{ nativeEvent: { scale: anlikOlcek } }], {
    useNativeDriver: true,
  })
  const kaydirmaOlayi = Animated.event(
    [{ nativeEvent: { translationX: anlikX, translationY: anlikY } }],
    { useNativeDriver: true }
  )

  function yakinlastirmaBitti(olay: PinchGestureHandlerStateChangeEvent) {
    if (olay.nativeEvent.oldState !== State.ACTIVE) return
    const ham = sonOlcek.current * olay.nativeEvent.scale
    const kenetli = Math.min(Math.max(ham, EN_AZ), EN_COK)
    sonOlcek.current = kenetli
    birikmisOlcek.setValue(kenetli)
    anlikOlcek.setValue(1)

    // Tam uzaklasinca konum da sifirlaniyor: yoksa fotograf 1x'e
    // dondugunde cerceveden kaymis halde kaliyor ve kullanici onu
    // geri getiremiyor.
    if (kenetli === EN_AZ) {
      sonKonum.current = { x: 0, y: 0 }
      birikmisX.setValue(0)
      birikmisY.setValue(0)
    }
  }

  function kaydirmaBitti(olay: PanGestureHandlerStateChangeEvent) {
    if (olay.nativeEvent.oldState !== State.ACTIVE) return
    // Yakinlastirilmamis fotografi kaydirmak anlamsiz.
    if (sonOlcek.current <= EN_AZ) {
      anlikX.setValue(0)
      anlikY.setValue(0)
      return
    }
    sonKonum.current = {
      x: sonKonum.current.x + olay.nativeEvent.translationX,
      y: sonKonum.current.y + olay.nativeEvent.translationY,
    }
    birikmisX.setValue(sonKonum.current.x)
    birikmisY.setValue(sonKonum.current.y)
    anlikX.setValue(0)
    anlikY.setValue(0)
  }

  const yedek = (
    <Image testID="buyuk-fotograf" source={{ uri }} style={stil} resizeMode="contain" />
  )

  return (
    <HareketSiniri yedek={yedek}>
      {/* `GestureHandlerRootView` BURADA, kok duzende degil: bilesen bir
          `Modal` icinde yasiyor ve gesture-handler'in kokue modalin
          disinda kaliyor. Kok duzeni sarmak butun uygulamanin dokunma
          yolunu degistirirdi. */}
      <GestureHandlerRootView style={stiller.kok} testID="yakinlastirilabilir">
      <PanGestureHandler
        onGestureEvent={kaydirmaOlayi}
        onHandlerStateChange={kaydirmaBitti}
        minPointers={1}
        maxPointers={2}
      >
        <Animated.View style={stiller.kok}>
          <PinchGestureHandler
            onGestureEvent={yakinlastirmaOlayi}
            onHandlerStateChange={yakinlastirmaBitti}
          >
            <Animated.View style={stiller.kok}>
              <Animated.Image
                testID="buyuk-fotograf"
                source={{ uri }}
                style={[
                  stil,
                  {
                    transform: [
                      { translateX: Animated.add(birikmisX, anlikX) },
                      { translateY: Animated.add(birikmisY, anlikY) },
                      { scale: olcek },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
      </GestureHandlerRootView>
    </HareketSiniri>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
