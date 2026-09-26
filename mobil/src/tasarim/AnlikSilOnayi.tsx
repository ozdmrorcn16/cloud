import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { SURE, useHareket, useModalHareketi } from './hareket'
import { yazi, olcek } from './tema'

/**
 * ANLIK SILME ONAYI - SECENEK A, BEYAZ KART (kullanicinin secimi
 * 2026-09-26: "A'yi yapalim ama beyaz kartli").
 *
 * Ortada beyaz kart: silinecek anligin EGIK kucuk onizlemesi + sag
 * altinda kirmizi cop rozeti, baslik, aciklama, yan yana Vazgec (acik
 * gri) ve dolu kirmizi Sil.
 *
 * HAREKET: kart %90'dan yayli buyur; onizleme -14 -> -6 derece donerek
 * oturur; rozet gecikmeli "pop" yapar. SIL'E BASINCA onizleme kuculup
 * rozete dogru suzulerek kaybolur (320 ms), SONRA `onOnay` kosar ve kart
 * kapanir. "Hareketi azalt"ta hareket yok, Sil aninda kosar.
 */
export function AnlikSilOnayi({
  acikMi,
  fotografUrl,
  baslik,
  aciklama,
  eylemEtiketi,
  onOnay,
  onVazgec,
}: {
  acikMi: boolean
  fotografUrl: string | null
  baslik: string
  aciklama: string
  eylemEtiketi: string
  onOnay: () => void
  onVazgec: () => void
}) {
  const { t } = useDil()
  const hareket = useHareket()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)
  const olcekDeger = useRef(new Animated.Value(1)).current
  const donme = useRef(new Animated.Value(1)).current
  const rozet = useRef(new Animated.Value(1)).current
  const yutulma = useRef(new Animated.Value(0)).current
  const [siliniyor, setSiliniyor] = useState(false)

  useEffect(() => {
    if (!acikMi) return
    setSiliniyor(false)
    yutulma.setValue(0)
    if (!hareket) {
      olcekDeger.setValue(1)
      donme.setValue(1)
      rozet.setValue(1)
      return
    }
    olcekDeger.setValue(0.9)
    donme.setValue(0)
    rozet.setValue(0)
    Animated.parallel([
      Animated.spring(olcekDeger, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: true }),
      Animated.spring(donme, { toValue: 1, speed: 10, bounciness: 10, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(140),
        Animated.spring(rozet, { toValue: 1, speed: 16, bounciness: 14, useNativeDriver: true }),
      ]),
    ]).start()
  }, [acikMi, hareket, olcekDeger, donme, rozet, yutulma])

  function sil() {
    if (siliniyor) return
    setSiliniyor(true)
    if (!hareket) {
      onOnay()
      return
    }
    Animated.timing(yutulma, { toValue: 1, duration: 320, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onOnay())
  }

  if (!gorunur) return null

  const donmeDerece = donme.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '-6deg'] })
  const onizlemeOlcek = yutulma.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] })
  const onizlemeX = yutulma.interpolate({ inputRange: [0, 1], outputRange: [0, 30] })
  const onizlemeY = yutulma.interpolate({ inputRange: [0, 1], outputRange: [0, 38] })
  const onizlemeOpak = yutulma.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 0.8, 0] })
  const rozetOlcek = Animated.add(
    rozet,
    yutulma.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0.25, 0] })
  )

  return (
    <Modal visible transparent animationType="none" onRequestClose={onVazgec}>
      <Animated.View style={[stiller.perde, { opacity: ilerleme }]} />
      {/* Zemine dokunmak vazgecer (OnayPenceresi ile ayni). */}
      <Pressable style={StyleSheet.absoluteFill} testID="onay-zemini" onPress={siliniyor ? undefined : onVazgec} />
      <View style={stiller.orta} pointerEvents="box-none">
        <Animated.View
          style={[stiller.kart, { opacity: ilerleme, transform: [{ scale: olcekDeger }] }]}
          testID="onay-penceresi"
          accessibilityViewIsModal
        >
          <View style={stiller.yigin}>
            <Animated.View
              style={[
                stiller.onizlemeKap,
                {
                  opacity: onizlemeOpak,
                  transform: [{ translateX: onizlemeX }, { translateY: onizlemeY }, { rotate: donmeDerece }, { scale: onizlemeOlcek }],
                },
              ]}
            >
              {fotografUrl ? (
                <Image source={{ uri: fotografUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : null}
            </Animated.View>
            <Animated.View style={[stiller.rozet, { transform: [{ scale: rozetOlcek }] }]}>
              <CopCizimi />
            </Animated.View>
          </View>
          <Text style={stiller.baslik}>{baslik}</Text>
          <Text style={stiller.aciklama}>{aciklama}</Text>
          <View style={stiller.dugmeler}>
            <Pressable
              onPress={onVazgec}
              disabled={siliniyor}
              accessibilityRole="button"
              testID="onay-vazgec"
              style={({ pressed }) => [stiller.dugme, stiller.vazgec, pressed && stiller.basili]}
            >
              <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
            </Pressable>
            <Pressable
              onPress={sil}
              disabled={siliniyor}
              accessibilityRole="button"
              testID="onay-eylemi"
              style={({ pressed }) => [stiller.dugme, stiller.sil, pressed && stiller.basili]}
            >
              <Text style={stiller.silYazi}>{eylemEtiketi}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

/** Kirmizi: beyaz kartta dolu dugme; tema jetonu (#C0392B) burada koyu kaliyordu. */
const KIRMIZI = '#E0453A'

function CopCizimi() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}

const stiller = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  kart: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 26,
    paddingHorizontal: 18,
    paddingBottom: 18,
    alignItems: 'center',
  },
  yigin: { width: 78, height: 102, marginBottom: 18 },
  onizlemeKap: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#3A3632',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  rozet: {
    position: 'absolute',
    right: -14,
    bottom: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KIRMIZI,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik, color: '#17130F', textAlign: 'center' },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: '#6E6660',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  dugmeler: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  dugme: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18 },
  vazgec: { backgroundColor: '#F1EEEA' },
  sil: { backgroundColor: KIRMIZI },
  vazgecYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: '#17130F' },
  silYazi: { fontFamily: yazi.ekranBasligi, fontSize: olcek.govde + 1, color: '#FFFFFF' },
  basili: { transform: [{ scale: 0.96 }] },
})
