import { useEffect, useRef, type ReactNode } from 'react'
import { Animated, StyleSheet, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { usePathname, useRouter } from 'expo-router'
import { yatayKilitliMi } from '../../lib/yatay-kilit'
import { EGRI, useHareket } from './hareket'

/**
 * ANA SEKMELER ARASI KAYDIRMA (kullanicinin istegi 2026-09-24: "ekranda
 * saga ve sola kaydirarak sabit menu sutununda gecis yapilabilsin").
 *
 * Sira alt gezinmeyle AYNI: Ana sayfa, Bildirimler, Check-in, Mesajlar,
 * Profil. Sola kaydirmak SONRAKI, saga kaydirmak ONCEKI sekme. Yalnizca
 * bu bes KOK ekranda calisir; alt sayfalarda (sohbet, mekan, ayarlar...)
 * yok.
 *
 * HIS: sayfa parmagi izler; ekranin %25'i ya da hizli firlatma gecince
 * sayfa o yone kayip cikar ve yeni sekme ters yonden kayarak girer,
 * yoksa yayli geri doner. Ilk/son sekmede lastik direnci. "Hareketi
 * azalt"ta kayma yok, yalnizca gecis.
 *
 * CAKISMA: dikey hareket once gelirse (14 px) vazgecilir - listeler
 * kaydirilir. Kendi yatay hareketi olan ogeler (harita, serit, fotograf
 * serisi, mesaj "Sil") `yatayAlan` ile kilit alir; kilit varken bu
 * hareket baslamaz (lib/yatay-kilit.ts).
 */
export const SEKME_SIRASI = ['/', '/bildirimler', '/mekanlar', '/mesajlar', '/profil'] as const

const GECIS_ORANI = 0.25
const GECIS_HIZI = 650

export function SekmeKaydirma({ children }: { children: ReactNode }) {
  const router = useRouter()
  const yol = usePathname()
  const hareket = useHareket()
  const { width } = useWindowDimensions()
  const sira = SEKME_SIRASI.indexOf(yol as (typeof SEKME_SIRASI)[number])

  const x = useRef(new Animated.Value(0)).current
  const opaklik = useRef(new Animated.Value(1)).current
  const iptalRef = useRef(false)
  // Gecisle gelinen yonde giris animasyonu: 1 = sagdan gir, -1 = soldan.
  const girisYonuRef = useRef(0)

  useEffect(() => {
    const yon = girisYonuRef.current
    girisYonuRef.current = 0
    if (!yon || !hareket) {
      x.setValue(0)
      opaklik.setValue(1)
      return
    }
    x.setValue(yon * width * 0.3)
    opaklik.setValue(0.4)
    Animated.parallel([
      Animated.timing(x, { toValue: 0, duration: 240, easing: EGRI.girisCikis, useNativeDriver: true }),
      Animated.timing(opaklik, { toValue: 1, duration: 200, easing: EGRI.girisCikis, useNativeDriver: true }),
    ]).start()
  }, [yol, hareket, width, x, opaklik])

  function git(hedefSira: number, yon: 1 | -1) {
    const hedef = SEKME_SIRASI[hedefSira]
    girisYonuRef.current = yon
    if (!hareket) {
      router.replace(hedef as never)
      return
    }
    Animated.timing(x, { toValue: -yon * width, duration: 160, easing: EGRI.girisCikis, useNativeDriver: true }).start(() => {
      router.replace(hedef as never)
    })
  }

  const kaydirma = Gesture.Pan()
    .runOnJS(true)
    .enabled(sira >= 0)
    .activeOffsetX([-25, 25])
    .failOffsetY([-14, 14])
    .onStart(() => {
      iptalRef.current = yatayKilitliMi()
    })
    .onUpdate((e) => {
      if (iptalRef.current || !hareket) return
      const sonraYok = sira === SEKME_SIRASI.length - 1 && e.translationX < 0
      const onceYok = sira === 0 && e.translationX > 0
      x.setValue(sonraYok || onceYok ? e.translationX * 0.25 : e.translationX)
    })
    .onEnd((e) => {
      if (iptalRef.current) return
      const esik = Math.abs(e.translationX) > width * GECIS_ORANI || Math.abs(e.velocityX) > GECIS_HIZI
      if (esik && e.translationX < 0 && sira < SEKME_SIRASI.length - 1) {
        git(sira + 1, 1)
        return
      }
      if (esik && e.translationX > 0 && sira > 0) {
        git(sira - 1, -1)
        return
      }
      if (hareket) Animated.spring(x, { toValue: 0, speed: 18, bounciness: 6, useNativeDriver: true }).start()
    })
    .withTestId('sekme-kaydirma')

  return (
    <GestureDetector gesture={kaydirma}>
      <Animated.View style={[stiller.kap, { opacity: opaklik, transform: [{ translateX: x }] }]}>{children}</Animated.View>
    </GestureDetector>
  )
}

const stiller = StyleSheet.create({
  kap: { flex: 1 },
})
