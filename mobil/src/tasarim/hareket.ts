import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing } from 'react-native'

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

/*
 * HAREKET SOZLUGU (2026-09-20, Emil Kowalski olcutleri).
 *
 * Yerlesik easing'ler zayif kalir; uc egri her yerde ayni:
 *   GIRIS_CIKIS  - beliren/kaybolan seyler (guclu ease-out)
 *   HAREKET      - ekranda yer degistiren seyler (ease-in-out)
 *   CEKMECE      - alttan gelen sayfalar (iOS cekmece egrisi)
 * Sureler: basili geri bildirim 100-150 ms, kucuk durum degisimi
 * 150-220 ms, pencere/sayfa 200-320 ms. Yalnizca transform ve opacity
 * animasyonu yapilir (native driver); layout ozellikleri asla.
 *
 * Neden RN `Animated`, Reanimated degil: proje jest'inde Reanimated
 * calismiyor (2026-09-14) ve mevcut butun hareketler Animated ile.
 */
export const EGRI = {
  girisCikis: Easing.bezier(0.23, 1, 0.32, 1),
  hareket: Easing.bezier(0.77, 0, 0.175, 1),
  cekmece: Easing.bezier(0.32, 0.72, 0, 1),
} as const

export const SURE = {
  basili: 120,
  durum: 220,
  pencereGiris: 200,
  pencereCikis: 150,
  sayfaGiris: 320,
  sayfaCikis: 240,
} as const

/**
 * Modal pencere/sayfa hareketi: `acikMi` true olunca girer, false
 * olunca CIKIS animasyonunu oynatip sonra agactan duser (ebeveyn
 * `acikMi`yi kapatir kapatmaz kaybolsaydi cikis hic gorunmezdi).
 *
 * `ilerleme` 0 -> 1 (kapali -> acik). Bilesen bunu zemin opakligina ve
 * icerik transform'una baglar. "Hareketi azalt" aciksa deger dogrudan
 * hedefe atlar; solma yine kalir (Kowalski: azaltmak sifir degil).
 */
export function useModalHareketi(acikMi: boolean, giris: number = SURE.pencereGiris, cikis: number = SURE.pencereCikis) {
  const hareket = useHareket()
  const [gorunur, setGorunur] = useState(acikMi)
  const ilerleme = useRef(new Animated.Value(acikMi ? 1 : 0)).current

  useEffect(() => {
    if (acikMi) {
      setGorunur(true)
      if (!hareket) {
        ilerleme.setValue(1)
        return
      }
      ilerleme.setValue(0)
      const a = Animated.timing(ilerleme, {
        toValue: 1,
        duration: giris,
        easing: EGRI.girisCikis,
        useNativeDriver: true,
      })
      a.start()
      return () => a.stop()
    }
    if (!gorunur) return
    const a = Animated.timing(ilerleme, {
      toValue: 0,
      duration: hareket ? cikis : 0,
      easing: EGRI.girisCikis,
      useNativeDriver: true,
    })
    a.start(({ finished }) => {
      if (finished) setGorunur(false)
    })
    return () => a.stop()
    // gorunur bilerek disarida: kapanis yalnizca acikMi degisince tetiklenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acikMi, hareket, ilerleme, giris, cikis])

  return { gorunur, ilerleme }
}
