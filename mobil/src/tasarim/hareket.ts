import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Cihazda "Hareketi azalt" KAPALI mi?
 *
 * Uygulamanin erisilebilirlik tabani: ayar aciksa animasyon HIC
 * baslamiyor, kompozisyon son haliyle duruyor. Kanca iki yerde ayni
 * sekilde kullaniliyordu (karsilama sahnesindeki nabiz, profildeki
 * kayan sekme gostergesi); ayni mantigin iki kopyasi olmasin diye
 * buraya cikarildi.
 *
 * Ayar calisma aninda degisebiliyor, o yuzden yalnizca bir kez
 * okunmuyor - dinleniyor.
 */
export function useHareket(): boolean {
  const [hareket, setHareket] = useState(true)

  useEffect(() => {
    let gecerli = true
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => {
      if (gecerli) setHareket(!azalt)
    })
    const abone = AccessibilityInfo.addEventListener('reduceMotionChanged', (azalt) =>
      setHareket(!azalt)
    )
    return () => {
      gecerli = false
      abone.remove()
    }
  }, [])

  return hareket
}
