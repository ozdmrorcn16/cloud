import { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import { KalpIkonu } from './etkilesim-ikonlari'
import { useHareket } from './hareket'

/**
 * BEGENI KALBI - dolarken bir kez atar.
 *
 * Gunde onlarca kez basilan bir dugme; Kowalski olcutunde bu tier
 * yalnizca "neredeyse gorunmez" hareket alir. O yuzden:
 * - YALNIZCA bosken dolarken (begenirken) atar; kaldirirken hicbir sey.
 * - Tek vurus: 1 -> 1.22 -> 1, ~360 ms, spring (parmak dokundu).
 * - Yalnizca transform, native driver; "Hareketi azalt" aciksa atmaz.
 *
 * Ilk cizimde dolu geliyorsa (daha once begenilmis kart) atmaz - kart
 * ekrana gelirken kalpler zipliyorsa o dekorasyondur, geri bildirim degil.
 */
export function BegeniKalbi({ dolu, boyut }: { dolu: boolean; boyut?: number }) {
  const hareket = useHareket()
  const olcek = useRef(new Animated.Value(1)).current
  const onceki = useRef(dolu)

  useEffect(() => {
    const dolduMu = dolu && !onceki.current
    onceki.current = dolu
    if (!dolduMu || !hareket) return
    olcek.setValue(1)
    const a = Animated.sequence([
      Animated.spring(olcek, { toValue: 1.22, speed: 40, bounciness: 8, useNativeDriver: true }),
      Animated.spring(olcek, { toValue: 1, speed: 26, bounciness: 6, useNativeDriver: true }),
    ])
    a.start()
    return () => a.stop()
  }, [dolu, hareket, olcek])

  return (
    <Animated.View style={{ transform: [{ scale: olcek }] }} testID="begeni-kalbi">
      <KalpIkonu dolu={dolu} boyut={boyut} />
    </Animated.View>
  )
}
