import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { PanGestureHandler, State, type PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { sonFotograflariGetir, galeriKullanilabilirMi } from '../../lib/galeri'
import { SURE, useHareket, useModalHareketi } from './hareket'
import { yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * GALERI SAYFASI (2026-09-23, kullanicinin tarifi: "siyah ekranin sol
 * altinda kucuk kare icinde galerideki son fotograf gorunecek, basinca
 * boyle alttan ekran gelicek; kameraya basinca canli kamerayla cekim,
 * basmayinca galerideki fotograflar listelenecek").
 *
 * Alttan gelen koyu sayfa: ILK KARE KAMERA (dokununca canli cekim),
 * arkasindan telefonun son fotograflari 3 sutunlu izgarada. Parmakla
 * asagi cekilerek kapaniyor - uygulamadaki diger sayfalarla ayni
 * mekanizma (`useModalHareketi` + PanGestureHandler).
 *
 * Izgara `expo-media-library` istiyor; modul yoksa (OTA ile guncellenen
 * eski derleme) yalnizca kamera karesi ve "Galeriden sec" satiri
 * kaliyor, sistem secicisi aciliyor - ekran bos kalmiyor.
 */

const KAPANMA_HIZI = 800

export function GaleriSayfasi({
  acikMi,
  onKapat,
  onFotograf,
  onKamera,
  onSistemSecicisi,
}: {
  acikMi: boolean
  onKapat: () => void
  /** Izgaradan secilen fotografin yerel adresi. */
  onFotograf: (uri: string) => void
  /** Kamera karesi. */
  onKamera: () => void
  /** Izgara yokken kullanilan sistem secicisi. */
  onSistemSecicisi: () => void
}) {
  const { t } = useDil()
  const hareket = useHareket()
  const guvenliAlan = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)

  const [fotograflar, setFotograflar] = useState<{ id: string; uri: string }[]>([])
  const [izgaraVar, setIzgaraVar] = useState(false)

  useEffect(() => {
    if (!acikMi) return
    let gecerli = true
    if (!galeriKullanilabilirMi()) {
      setIzgaraVar(false)
      return
    }
    sonFotograflariGetir(60)
      .then((liste) => {
        if (!gecerli) return
        setFotograflar(liste)
        setIzgaraVar(liste.length > 0)
      })
      .catch(() => gecerli && setIzgaraVar(false))
    return () => {
      gecerli = false
    }
  }, [acikMi])

  const sayfaBoyu = Math.round(height * 0.72)
  const surukleme = useRef(new Animated.Value(0)).current
  const suruklemeOlayi = useRef(
    Animated.event([{ nativeEvent: { translationY: surukleme } }], { useNativeDriver: true })
  ).current

  if (!gorunur) return null

  const ARA = 2
  const kare = Math.floor((width - ARA * 2) / 3)

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [sayfaBoyu, 0] })
  const suruklemeY = surukleme.interpolate({
    inputRange: [-200, 0, sayfaBoyu],
    outputRange: [-28, 0, sayfaBoyu],
    extrapolate: 'clamp',
  })
  const toplamY = Animated.add(girisY, suruklemeY)

  function suruklemeBitti(e: PanGestureHandlerStateChangeEvent) {
    if (e.nativeEvent.oldState !== State.ACTIVE) return
    const { translationY, velocityY } = e.nativeEvent
    if (velocityY > KAPANMA_HIZI || translationY > sayfaBoyu / 3) {
      onKapat()
      return
    }
    if (!hareket) {
      surukleme.setValue(0)
      return
    }
    Animated.spring(surukleme, { toValue: 0, velocity: velocityY / 1000, speed: 22, bounciness: 4, useNativeDriver: true }).start()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="galeri-zemini" onPress={onKapat}>
        <PanGestureHandler onGestureEvent={suruklemeOlayi} onHandlerStateChange={suruklemeBitti} activeOffsetY={6}>
          <Animated.View style={[stiller.sayfa, { height: sayfaBoyu, transform: [{ translateY: toplamY }] }]}>
            <Pressable style={stiller.ic} onPress={() => {}} accessibilityViewIsModal testID="galeri-sayfasi">
              <View style={stiller.tutamac} />
              <Text style={stiller.baslik}>{t('hikaye.sonFotograflar')}</Text>

              <FlatList
                data={fotograflar}
                keyExtractor={(f) => f.id}
                numColumns={3}
                columnWrapperStyle={{ gap: ARA }}
                contentContainerStyle={{ gap: ARA, paddingBottom: guvenliAlan.bottom + bosluk.m }}
                ListHeaderComponent={
                  /* Izgara yoksa kamera karesi tek basina anlamli
                     kalmiyor; sistem secicisi satiri da geliyor. */
                  !izgaraVar ? (
                    <Pressable
                      onPress={onSistemSecicisi}
                      accessibilityRole="button"
                      testID="galeri-sistem"
                      style={({ pressed }) => [stiller.sistemSatiri, pressed && stiller.basili]}
                    >
                      <Text style={stiller.sistemYazi}>{t('hikaye.galeri')}</Text>
                      <Text style={stiller.sistemOk}>›</Text>
                    </Pressable>
                  ) : null
                }
                ListEmptyComponent={
                  <Pressable
                    onPress={onKamera}
                    accessibilityRole="button"
                    accessibilityLabel={t('hikaye.kamera')}
                    testID="galeri-kamera"
                    style={[stiller.kameraKaresi, { width: kare, height: kare }]}
                  >
                    <KameraCizimi />
                  </Pressable>
                }
                renderItem={({ item, index }) =>
                  index === 0 ? (
                    /* ILK SIRA KAMERA + ilk fotograf yan yana dursun
                       diye kamera karesi ilk hucrenin yerine geciyor ve
                       fotograf bir sonraki hucreye kayiyor. */
                    <View style={stiller.ilkSira}>
                      <Pressable
                        onPress={onKamera}
                        accessibilityRole="button"
                        accessibilityLabel={t('hikaye.kamera')}
                        testID="galeri-kamera"
                        style={[stiller.kameraKaresi, { width: kare, height: kare }]}
                      >
                        <KameraCizimi />
                      </Pressable>
                      <Pressable
                        onPress={() => onFotograf(item.uri)}
                        accessibilityRole="button"
                        testID={`galeri-${item.id}`}
                        style={{ width: kare, height: kare, marginLeft: ARA }}
                      >
                        <Image source={{ uri: item.uri }} style={stiller.resim} contentFit="cover" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => onFotograf(item.uri)}
                      accessibilityRole="button"
                      testID={`galeri-${item.id}`}
                      style={{ width: kare, height: kare }}
                    >
                      <Image source={{ uri: item.uri }} style={stiller.resim} contentFit="cover" />
                    </Pressable>
                  )
                }
              />
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </Pressable>
    </Modal>
  )
}

function KameraCizimi() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24">
      <Path d="M4 8h3l1.4-2h7.2L17 8h3v11H4V8z" stroke="#FFFFFF" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.6} stroke="#FFFFFF" strokeWidth={1.7} fill="none" />
    </Svg>
  )
}

const stiller = StyleSheet.create({
  zeminRenk: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  zemin: { flex: 1, justifyContent: 'flex-end' },
  sayfa: { backgroundColor: '#17130F', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  ic: { flex: 1 },
  tutamac: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: yuvarlak.hap,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: bosluk.s,
  },
  baslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
    paddingHorizontal: bosluk.sayfa,
    paddingVertical: bosluk.s,
  },
  ilkSira: { flexDirection: 'row' },
  kameraKaresi: { backgroundColor: '#3A342F', alignItems: 'center', justifyContent: 'center' },
  resim: { width: '100%', height: '100%' },
  sistemSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.sayfa,
    paddingVertical: bosluk.m,
  },
  sistemYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: '#FFFFFF' },
  sistemOk: { fontFamily: yazi.govde, fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  basili: { opacity: 0.85 },
})
