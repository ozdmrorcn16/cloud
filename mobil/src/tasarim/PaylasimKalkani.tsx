import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { paylasimDinle, paylasimKapandiVarsay, paylasimSonrasiBaskiMi, PAYLASIM_KORUMA_MS } from '../../lib/paylasim'

/**
 * PAYLASIM KALKANI - kok duzende, her seyin USTUNDE, gorunmez.
 *
 * iOS sistem paylasim sayfasi DISINA dokunarak kapatilinca o dokunus
 * altta kalan ekrana da dusuyor: kullanicinin bildirimi (2026-09-18)
 * "arkadaki fotografa basinca hemen buyuk ekran aciliyor" ve
 * genellemesi: "bir sey acikken arkada baska bir seye basilinca direkt
 * acilmamali, once bos basilmasina izin verilmeli". Kalkan, paylasim
 * sayfasi kapandiktan sonraki kisa pencerede butun dokunuslari yutar;
 * ekran hangi ekran olursa olsun (akis, profil, mekan) ayni kural.
 *
 * Kartin icinde yerel bir koruma yazmak yerine BURADA tek yerde: bir
 * sonraki paylasim dugmesini ekleyen kisi hicbir sey yapmak zorunda
 * kalmasin - `sistemPaylasimi` sarmalayicisindan gectigi surece.
 */
export function PaylasimKalkani() {
  const [acik, setAcik] = useState(paylasimSonrasiBaskiMi())

  useEffect(() => {
    let zamanlayici: ReturnType<typeof setTimeout> | null = null
    const kapat = () => setAcik(false)
    const abonelikIptal = paylasimDinle((olay) => {
      if (zamanlayici) clearTimeout(zamanlayici)
      setAcik(true)
      // Acilista kalkan sayfa kapanana kadar kalir; kapanista 700 ms daha.
      if (olay === 'kapandi') zamanlayici = setTimeout(kapat, PAYLASIM_KORUMA_MS)
    })
    return () => {
      abonelikIptal()
      if (zamanlayici) clearTimeout(zamanlayici)
    }
  }, [])

  if (!acik) return null
  // KALKAN KENDINI KILITLEYEMEZ (2026-09-20): sayfa acikken dokunus
  // buraya ulasamaz; ulasan dokunus yutulur ve kalkan kapanis
  // penceresine gecer (700 ms sonra kalkar). Soz hic cozulmezse bile
  // ekran tek dokunusla geri gelir.
  return (
    <View
      style={StyleSheet.absoluteFill}
      testID="paylasim-kalkani"
      pointerEvents="auto"
      onStartShouldSetResponder={() => true}
      onResponderGrant={paylasimKapandiVarsay}
    />
  )
}
