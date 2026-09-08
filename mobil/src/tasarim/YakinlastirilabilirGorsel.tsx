import { Component, useRef, type ReactNode } from 'react'
import {
  Animated,
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type LayoutChangeEvent,
  type StyleProp,
} from 'react-native'
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
  type PinchGestureHandlerGestureEvent,
  type PinchGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler'

/**
 * YAKINLASTIRILABILIR FOTOGRAF.
 *
 * Kullanicinin istekleri (2026-09-08, sirayla):
 *   1. "fotografa yakinlasma yapilabilsin iki parmagimla"
 *   2. "tam ekran acilmadan da zoom yapma ekle"
 *   3. "istedigim yere zoom yapabiliyim gezdirebiliyim elimle, sadece
 *       fotografin ortasina yaptiriyor"
 *
 * ODAK NOKTALI ZOOM. Ucuncu istek yontemi degistirdi: onceki surum
 * yalnizca `scale` degerini buyutuyordu, dolayisiyla goruntu her zaman
 * MERKEZDEN aciliyordu. Artik parmaklarin ORTA NOKTASI sabit kaliyor -
 * nereye dokunursan orasi buyuyor.
 *
 * Formul: bir P noktasi olcek s'ten s2'ye giderken yerinde kalsin
 * isteniyorsa, oteleme
 *     t2 = P - (P - t) * (s2 / s)
 * olmali. Asagida `odakla()` tam olarak bunu yapiyor.
 *
 * NATIVE SURUCU KAPALI (`useNativeDriver: false`) ve bu BILINCLI: odak
 * hesabi her karede JavaScript'te yapiliyor, cunku iki degeri
 * (olcek ve oteleme) birbirine bagli olarak guncellemek gerekiyor.
 * Native surucuyle yalnizca merkezden zoom yapilabilirdi - yani
 * kullanicinin sikayet ettigi davranis.
 *
 * REANIMATED KULLANILMADI: projede `babel.config.js` HIC YOK, yani
 * reanimated'in zorunlu babel eklentisi hicbir zaman yapilandirilmamis;
 * worklet'ler o eklenti olmadan calismaz. Jest'te de kurulu degil -
 * import edilir edilmez butun paket cokuyordu.
 */

const EN_AZ = 1
const EN_COK = 4

/**
 * GUVENLIK AGI.
 *
 * `react-native-gesture-handler` NATIVE bir modul ve uygulamada
 * 2026-09-08'e kadar hic kullanilmiyordu. Zoom o gun telefonda
 * dogrulandi (tam ekran gorunumde calisiyor), yani modul mevcut
 * derlemede VAR. Sinir yine de duruyor: Android tarafi henuz
 * denenmedi ve bu bilesen artik akis kartinin ICINDE de calisiyor -
 * orada bir cokme butun akisi goturur.
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
    console.warn('Yakinlastirma baslatilamadi, duz goruntuye duesuldue:', hata)
  }

  render() {
    return this.state.hata ? this.props.yedek : this.props.children
  }
}

export function YakinlastirilabilirGorsel({
  uri,
  stil,
  birakincaSifirla = false,
}: {
  uri: string
  stil?: StyleProp<ImageStyle>
  /**
   * Parmak kalkinca 1x'e donsun mu?
   *
   * AKIS KARTINDA TRUE: kart sabit yukseklikte ve listenin icinde;
   * kalici zoom komsu kartlarin uzerine tasar ve kullanici o karti bir
   * daha duzeltemez. TAM EKRANDA FALSE: kullanici inceledigi yerde
   * kalabilmeli, cikis yolu kapatma dugmesi.
   */
  birakincaSifirla?: boolean
}) {
  const olcek = useRef(new Animated.Value(1)).current
  const x = useRef(new Animated.Value(0)).current
  const y = useRef(new Animated.Value(0)).current

  // Animated.Value'lari OKUYAMADIGIMIZ icin ayni degerler ayrica
  // ref'te tutuluyor; odak hesabi bir onceki duruma ihtiyac duyuyor.
  const durum = useRef({ olcek: 1, x: 0, y: 0 })
  const pinchBasi = useRef({ olcek: 1, x: 0, y: 0, odakX: 0, odakY: 0 })
  const panBasi = useRef({ x: 0, y: 0 })
  const olcu = useRef({ en: 0, boy: 0 })

  function yaz(o: number, tx: number, ty: number) {
    durum.current = { olcek: o, x: tx, y: ty }
    olcek.setValue(o)
    x.setValue(tx)
    y.setValue(ty)
  }

  /**
   * Odak noktasi SABIT kalacak sekilde yeni olcegi uygular.
   * `odak` degerleri gorselin MERKEZINE gore, yani ekran koordinati
   * degil - donusum merkezden uygulandigi icin hesap da oradan gidiyor.
   */
  function odakla(yeniOlcek: number, odakX: number, odakY: number, temel: typeof durum.current) {
    const oran = yeniOlcek / temel.olcek
    return {
      x: odakX - (odakX - temel.x) * oran,
      y: odakY - (odakY - temel.y) * oran,
    }
  }

  function yakinlastirmaBasladi(olay: PinchGestureHandlerStateChangeEvent) {
    if (olay.nativeEvent.state !== State.BEGAN) return
    pinchBasi.current = {
      ...durum.current,
      odakX: olay.nativeEvent.focalX - olcu.current.en / 2,
      odakY: olay.nativeEvent.focalY - olcu.current.boy / 2,
    }
  }

  function yakinlastiriliyor(olay: PinchGestureHandlerGestureEvent) {
    const temel = pinchBasi.current
    const yeni = Math.min(Math.max(temel.olcek * olay.nativeEvent.scale, EN_AZ), EN_COK)
    const { x: tx, y: ty } = odakla(yeni, temel.odakX, temel.odakY, temel)
    yaz(yeni, tx, ty)
  }

  function yakinlastirmaBitti(olay: PinchGestureHandlerStateChangeEvent) {
    if (olay.nativeEvent.oldState !== State.ACTIVE) return
    if (birakincaSifirla || durum.current.olcek <= EN_AZ) {
      // Yay YOK, duz gecis: kart icinde yaylanan bir goruntu listeyi
      // titriyormus gibi gosteriyor.
      Animated.parallel([
        Animated.timing(olcek, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(x, { toValue: 0, duration: 180, useNativeDriver: false }),
        Animated.timing(y, { toValue: 0, duration: 180, useNativeDriver: false }),
      ]).start(() => {
        durum.current = { olcek: 1, x: 0, y: 0 }
      })
    }
  }

  function kaydirmaBasladi(olay: PanGestureHandlerStateChangeEvent) {
    if (olay.nativeEvent.state !== State.BEGAN) return
    panBasi.current = { x: durum.current.x, y: durum.current.y }
  }

  function kaydiriliyor(olay: PanGestureHandlerGestureEvent) {
    // Yakinlastirilmamis fotografi gezdirmek anlamsiz; ustelik akis
    // kartinda listenin kaydirmasini calardi.
    if (durum.current.olcek <= EN_AZ) return
    yaz(
      durum.current.olcek,
      panBasi.current.x + olay.nativeEvent.translationX,
      panBasi.current.y + olay.nativeEvent.translationY
    )
  }

  function olcuAlindi(olay: LayoutChangeEvent) {
    olcu.current = {
      en: olay.nativeEvent.layout.width,
      boy: olay.nativeEvent.layout.height,
    }
  }

  const govde = (
    <PanGestureHandler
      onGestureEvent={kaydiriliyor}
      onHandlerStateChange={kaydirmaBasladi}
      // Iki parmak: tek parmakla kaydirma listeye ait kalsin.
      minPointers={2}
      maxPointers={2}
    >
      <Animated.View style={stiller.kat}>
        <PinchGestureHandler
          onGestureEvent={yakinlastiriliyor}
          onHandlerStateChange={(o) => {
            yakinlastirmaBasladi(o)
            yakinlastirmaBitti(o)
          }}
        >
          <Animated.View style={stiller.kat} onLayout={olcuAlindi}>
            <Animated.Image
              testID="buyuk-fotograf"
              source={{ uri }}
              style={[
                stil,
                { transform: [{ translateX: x }, { translateY: y }, { scale: olcek }] },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  )

  const yedek = <Image testID="buyuk-fotograf" source={{ uri }} style={stil} resizeMode="contain" />

  return (
    <HareketSiniri yedek={yedek}>
      {/* Kart icinde kullanilirken `overflow: hidden` SART: zoom'lu
          goruntu yoksa komsu kartlarin uzerine tasar. */}
      <View style={stiller.kok} testID="yakinlastirilabilir">
        {govde}
      </View>
    </HareketSiniri>
  )
}

/**
 * Tam ekran gorunum icin: bilesen bir `Modal` icinde yasiyor ve kok
 * duzendeki `GestureHandlerRootView` oraya ulasmiyor, o yuzden modal
 * kendi kokunu tasiyor.
 */
export function YakinlastirilabilirTamEkran(
  ozellikler: Parameters<typeof YakinlastirilabilirGorsel>[0]
) {
  return (
    <GestureHandlerRootView style={stiller.kok}>
      <YakinlastirilabilirGorsel {...ozellikler} />
    </GestureHandlerRootView>
  )
}

const stiller = StyleSheet.create({
  /**
   * `alignSelf: 'stretch'` SART, yoksa genislik SIFIR oluyor.
   *
   * Olculdu (kullanicinin bildirdigi kusur: "fotografa basinca tam
   * ekranda acilmiyor"): kapsayici modal `alignItems: 'center'`
   * kullaniyor, dolayisiyla cocugun genisligi ICERIGE gore
   * hesaplaniyor; icerik de `width: '100%'` istedigi icin sonuc
   * 0 x 844'luk bir kutu ve gorunmeyen bir fotograf oluyordu.
   * `flex: 1` yalnizca YUKSEKLIGI dolduruyor.
   */
  kok: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  kat: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
})
