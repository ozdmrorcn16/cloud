import { useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { EGRI, SURE, useHareket, useModalHareketi } from './hareket'
import { EYLEM_GECIKMESI_MS } from './SecimPenceresi'
import { yazi, olcek, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * ANLIK MENUSU - SECENEK A duzeni, BEYAZ KART (kullanicinin secimi
 * 2026-09-26; once koyu camdi, "bu karti da beyaz yap"). Renkler TEMA
 * JETONLARINDAN: acik modda beyaz, koyu modda `yuzey`. Anlik izleyicinin uc nokta menusu; uygulamanin genel
 * beyaz `SecimPenceresi` siyah izleyicide sert duruyordu.
 *
 * Kenarlardan boslukla YUZEN kart (acik modda beyaz); ustte anligin
 * kucuk onizlemesi + alt bilgi, altta eylem satirlari (yikici olan
 * kirmizi zeminli, ikon kutulu) ve ayri "Vazgec".
 *
 * HAREKET: kart alttan YAYLI kayar (hafif sekme), baslik ve satirlar
 * 40 ms arayla belirir, basilan satir %96'ya kuculur. Arkadaki
 * fotografin geri cekilmesi izleyicide (menu acikken kart %94).
 * "Hareketi azalt"ta hareket yok.
 *
 * SecimPenceresi ile AYNI KURAL: secim once menuyu kapatir, eylem Modal
 * agactan kalktiktan EYLEM_GECIKMESI_MS sonra kosar (iOS'ta ust uste
 * Modal sunulamaz). testID'ler de ayni (`secim-penceresi`,
 * `secim-zemini`) - testlerin `menudenSec` yardimcisi degismeden calisir.
 */
export type AnlikMenuSecimi = {
  etiket: string
  testID: string
  yikici?: boolean
  ikon: 'cop' | 'bayrak'
  onSec: () => void
}

export function AnlikMenusu({
  acikMi,
  onKapat,
  fotografUrl,
  baslik,
  altBilgi,
  secimler,
}: {
  acikMi: boolean
  onKapat: () => void
  fotografUrl: string | null
  baslik: string
  altBilgi: string
  secimler: AnlikMenuSecimi[]
}) {
  const { t } = useDil()
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const guvenliAlan = useSafeAreaInsets()
  const hareket = useHareket()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)
  const kayma = useRef(new Animated.Value(0)).current
  const [yukseklik, setYukseklik] = useState(320)

  // Yayli giris: kayma 0 -> 1 spring (ilerleme zemin opakligini tasir).
  useEffect(() => {
    if (!acikMi) {
      if (!hareket) return
      Animated.timing(kayma, { toValue: 0, duration: SURE.sayfaCikis, easing: EGRI.girisCikis, useNativeDriver: true }).start()
      return
    }
    if (!hareket) {
      kayma.setValue(1)
      return
    }
    kayma.setValue(0)
    Animated.spring(kayma, { toValue: 1, speed: 13, bounciness: 7, useNativeDriver: true }).start()
  }, [acikMi, hareket, kayma])

  const bekleyenEylem = useRef<(() => void) | null>(null)
  function sec(secim: AnlikMenuSecimi) {
    bekleyenEylem.current = secim.onSec
    onKapat()
  }
  useEffect(() => {
    if (gorunur || !bekleyenEylem.current) return
    const eylem = bekleyenEylem.current
    bekleyenEylem.current = null
    const zamanlayici = setTimeout(eylem, EYLEM_GECIKMESI_MS)
    return () => clearTimeout(zamanlayici)
  }, [gorunur])

  if (!gorunur) return null

  const y = kayma.interpolate({ inputRange: [0, 1], outputRange: [yukseklik + 40, 0] })

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.perde, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="secim-zemini" onPress={onKapat}>
        <Animated.View
          style={[stiller.kap, { marginBottom: Math.max(guvenliAlan.bottom, 12), transform: [{ translateY: y }] }]}
          onLayout={(e) => setYukseklik(e.nativeEvent.layout.height)}
        >
          <Pressable testID="secim-penceresi" onPress={() => {}} accessibilityViewIsModal style={stiller.kart}>
            <View style={stiller.tutamac} />
            <KademeliOge sira={0} acik={acikMi}>
              <View style={stiller.bas}>
                {fotografUrl ? (
                  <Image source={{ uri: fotografUrl }} style={stiller.onizleme} contentFit="cover" />
                ) : (
                  <View style={stiller.onizleme} />
                )}
                <View style={stiller.basMetin}>
                  <Text style={stiller.basBaslik} numberOfLines={1}>
                    {baslik}
                  </Text>
                  <Text style={stiller.basAlt} numberOfLines={1}>
                    {altBilgi}
                  </Text>
                </View>
              </View>
            </KademeliOge>
            <View style={stiller.ayirac} />
            {secimler.map((secim, i) => (
              <KademeliOge key={secim.testID} sira={i + 1} acik={acikMi}>
                <BasilanSatir
                  onPress={() => sec(secim)}
                  testID={secim.testID}
                  etiket={secim.etiket}
                  style={[stiller.satir, secim.yikici ? stiller.satirYikici : stiller.satirNotr]}
                >
                  <View style={[stiller.ikonKutu, secim.yikici ? stiller.ikonKutuYikici : stiller.ikonKutuNotr]}>
                    {secim.ikon === 'cop' ? <CopCizimi renk={secim.yikici ? renk.yikici : renk.metin} /> : <BayrakCizimi renk={secim.yikici ? renk.yikici : renk.metin} />}
                  </View>
                  <Text style={[stiller.satirYazi, secim.yikici && stiller.satirYaziYikici]}>{secim.etiket}</Text>
                </BasilanSatir>
              </KademeliOge>
            ))}
            <KademeliOge sira={secimler.length + 1} acik={acikMi}>
              <BasilanSatir onPress={onKapat} etiket={t('ortak.vazgec')} testID="anlik-menu-vazgec" style={stiller.vazgec}>
                <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
              </BasilanSatir>
            </KademeliOge>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

/** Satirlar 40 ms arayla asagidan belirir. */
function KademeliOge({ sira, acik, children }: { sira: number; acik: boolean; children: React.ReactNode }) {
  const hareket = useHareket()
  const d = useRef(new Animated.Value(hareket ? 0 : 1)).current
  useEffect(() => {
    if (!acik) return
    if (!hareket) {
      d.setValue(1)
      return
    }
    d.setValue(0)
    const a = Animated.timing(d, { toValue: 1, duration: 220, delay: 60 + sira * 40, easing: EGRI.girisCikis, useNativeDriver: true })
    a.start()
    return () => a.stop()
  }, [acik, hareket, d, sira])
  const y = d.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })
  return <Animated.View style={{ opacity: d, transform: [{ translateY: y }] }}>{children}</Animated.View>
}

/** Basinca %96'ya yayli kuculen satir. */
function BasilanSatir({
  onPress,
  testID,
  etiket,
  style,
  children,
}: {
  onPress: () => void
  testID: string
  etiket: string
  style: object
  children: React.ReactNode
}) {
  const hareket = useHareket()
  const o = useRef(new Animated.Value(1)).current
  const bas = (h: number) => {
    if (!hareket) return
    Animated.spring(o, { toValue: h, speed: h < 1 ? 40 : 18, bounciness: h < 1 ? 0 : 10, useNativeDriver: true }).start()
  }
  return (
    <Animated.View style={{ transform: [{ scale: o }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => bas(0.96)}
        onPressOut={() => bas(1)}
        accessibilityRole="button"
        accessibilityLabel={etiket}
        testID={testID}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

function CopCizimi({ renk }: { renk: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}

function BayrakCizimi({ renk }: { renk: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M6 21V4M6 4h11l-2 4 2 4H6" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
  perde: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  zemin: { flex: 1, justifyContent: 'flex-end' },
  kap: { marginHorizontal: 10 },
  kart: {
    backgroundColor: renk.yuzey,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: renk.cizgi,
    borderRadius: 26,
    padding: 10,
  },
  tutamac: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: renk.cizgi, marginBottom: 12 },
  bas: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingBottom: 12 },
  onizleme: { width: 40, height: 53, borderRadius: 9, backgroundColor: renk.cizgi },
  basMetin: { flex: 1 },
  basBaslik: { color: renk.metin, fontFamily: yazi.ekranBasligi, fontSize: olcek.govde },
  basAlt: { color: renk.metinIkincil, fontFamily: yazi.govde, fontSize: olcek.kucuk, marginTop: 2 },
  ayirac: { height: StyleSheet.hairlineWidth, backgroundColor: renk.cizgi, marginBottom: 8 },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, marginBottom: 8 },
  // Yari saydam ton jetondan (8 haneli hex): iki temada da dogru.
  satirYikici: { backgroundColor: `${renk.yikici}17` },
  satirNotr: { backgroundColor: `${renk.metin}0D` },
  ikonKutu: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ikonKutuYikici: { backgroundColor: `${renk.yikici}26` },
  ikonKutuNotr: { backgroundColor: `${renk.metin}14` },
  satirYazi: { color: renk.metin, fontFamily: yazi.ekranBasligi, fontSize: olcek.govde + 1 },
  satirYaziYikici: { color: renk.yikici },
  vazgec: { alignItems: 'center', paddingVertical: 15, borderRadius: 18, backgroundColor: `${renk.metin}0F` },
  vazgecYazi: { color: renk.metin, fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1 },
})
