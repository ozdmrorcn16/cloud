import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, type StyleProp, type ViewStyle } from 'react-native'
import { EGRI, useHareket } from './hareket'

/**
 * DURUM GECISI - bir dugmenin halleri arasinda teleport yerine gecis.
 *
 * "Arkadaş ekle" -> "Beklemede" -> "Arkadaşsın" gibi ayni yerde duran
 * ama icerigi/rengi degisen bir oge icin: `anahtar` degisince mevcut
 * icerik 110 ms'de %97'ye kuculup solar, icerik degisir, yeni hali
 * 110 ms'de belirir. Toplam 220 ms (kucuk durum degisimi butcesi).
 *
 * Cocuklar kendi stillerini tasir - sarmal yalnizca opacity + transform
 * animasyonu yapar; renk degisimi tam gorunmez oldugu anda olur, o
 * yuzden renk animasyonu (layout/JS) gerekmez. Ilk cizimde gecis yok.
 * "Hareketi azalt" aciksa aninda degisir.
 */
export function DurumGecisi({
  anahtar,
  children,
  style,
}: {
  anahtar: string
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const hareket = useHareket()
  const [gosterilen, setGosterilen] = useState({ anahtar, children })
  const opaklik = useRef(new Animated.Value(1)).current
  const olcek = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (anahtar === gosterilen.anahtar) {
      // Ayni hal, icerik guncellenmis (ornegin sayac): gecis yok.
      if (children !== gosterilen.children) setGosterilen({ anahtar, children })
      return
    }
    if (!hareket) {
      setGosterilen({ anahtar, children })
      return
    }
    const cikis = Animated.parallel([
      Animated.timing(opaklik, { toValue: 0, duration: 110, easing: EGRI.girisCikis, useNativeDriver: true }),
      Animated.timing(olcek, { toValue: 0.97, duration: 110, easing: EGRI.girisCikis, useNativeDriver: true }),
    ])
    cikis.start(({ finished }) => {
      if (!finished) return
      setGosterilen({ anahtar, children })
      Animated.parallel([
        Animated.timing(opaklik, { toValue: 1, duration: 110, easing: EGRI.girisCikis, useNativeDriver: true }),
        Animated.timing(olcek, { toValue: 1, duration: 110, easing: EGRI.girisCikis, useNativeDriver: true }),
      ]).start()
    })
    return () => cikis.stop()
    // gosterilen bilerek disarida: gecisi yalnizca anahtar tetikler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anahtar, children, hareket])

  return (
    <Animated.View style={[style, { opacity: opaklik, transform: [{ scale: olcek }] }]}>
      {gosterilen.children}
    </Animated.View>
  )
}
