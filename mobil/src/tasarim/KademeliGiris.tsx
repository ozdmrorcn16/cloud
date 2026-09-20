import { Children, useEffect, useRef, type ReactNode } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'
import { EGRI, useHareket } from './hareket'

/** Kademe arasi (Kowalski: 30-80 ms bandi). */
export const KADEME_MS = 40
/** Animasyon alan en cok satir sayisi - ilk ekran dolusu. */
export const KADEME_EN_COK = 6

/**
 * KADEMELI GIRIS - liste satirlari icin.
 *
 * Ilk yuklemede kartlar tek anda "pat" diye beliriyordu. Simdi ilk
 * ekran dolusu (en cok 6 satir) 40 ms arayla, 8 px asagidan, 260 ms
 * guclu ease-out ile gelir. Yalnizca opacity + transform.
 *
 * Sanal listede satirlar geri dondurulur ve yeniden mount olur; her
 * mount'ta yeniden oynasaydi kaydirirken kartlar ziplardi. O yuzden
 * ebeveyn bir `oynatilanlar` kumesi tutar: bir kimlik bir kez oynar.
 * Sonsuz kaydirmayla gelen sonraki sayfalar hic animasyon almaz -
 * kademe dekoratiftir, etkilesimi bekletmez.
 */
export function KademeliGiris({
  anahtar,
  sira,
  oynatilanlar,
  children,
  style,
}: {
  anahtar: string
  sira: number
  oynatilanlar: Set<string>
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const hareket = useHareket()
  // Karar MOUNT'TA bir kez verilir ve sabitlenir. Her render'da yeniden
  // hesaplansaydi kume dolunca sarmal degisir, cocuk yeniden mount olur
  // ve kartin kendi durumu (acik yorum sayfasi gibi) kaybolurdu - yasandi.
  const oynat = useRef(hareket && sira < KADEME_EN_COK && !oynatilanlar.has(anahtar)).current
  const ilerleme = useRef(new Animated.Value(oynat ? 0 : 1)).current

  useEffect(() => {
    if (!oynat) return
    oynatilanlar.add(anahtar)
    const a = Animated.timing(ilerleme, {
      toValue: 1,
      duration: 260,
      delay: sira * KADEME_MS,
      easing: EGRI.girisCikis,
      useNativeDriver: true,
    })
    a.start()
    return () => a.stop()
    // Yalnizca ilk mount'ta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sarmal hep ayni tip (Animated.View): oynamayan satirda degerler 1'de durur.
  const y = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })
  return <Animated.View style={[style, { opacity: ilerleme, transform: [{ translateY: y }] }]}>{children}</Animated.View>
}

/**
 * BOS DURUM GIRISI - ikon, baslik, aciklama, eylem sirayla.
 *
 * Nadir gorulen bir ekran; keyif butcesi burada ama tek oge hareket
 * eder: ilk cocuk (ikon/baslik) %92'den 1'e 320 ms, sonrakiler 60 ms
 * arayla 6 px suzulup belirir. Yon veren dugme en son gelir.
 */
export function BosDurumGirisi({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const hareket = useHareket()
  const cocuklar = Children.toArray(children)
  const degerler = useRef(cocuklar.map(() => new Animated.Value(hareket ? 0 : 1))).current

  useEffect(() => {
    if (!hareket) return
    const a = Animated.stagger(
      60,
      degerler.map((d) => Animated.timing(d, { toValue: 1, duration: 300, easing: EGRI.girisCikis, useNativeDriver: true }))
    )
    a.start()
    return () => a.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Animated.View style={style}>
      {cocuklar.map((cocuk, i) => {
        const d = degerler[i] ?? new Animated.Value(1)
        const donusum = i === 0
          ? [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }]
          : [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }]
        return (
          <Animated.View key={i} style={{ opacity: d, transform: donusum }}>
            {cocuk}
          </Animated.View>
        )
      })}
    </Animated.View>
  )
}
