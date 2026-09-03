import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg'
import { type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * Karsilama ekranindaki CHECK-IN SAHNESI.
 *
 * "Hesap oluştur" dugmesinin HEMEN ustunde duruyor ve ignenin ucu
 * dugmeyi gosteriyor - kullanicinin istegi (2026-08-30): "sanki hesap
 * oluşturmayı işaret ediyormuş gibi". Bu yuzden igne sahnenin altina
 * dayali; ucu ile dugme arasinda yalnizca ~24 px var. Turuncu burada
 * dekorasyon degil "canlilik" tasiyor - kimlik kuralina uygun kullanim
 * budur.
 *
 * SAHNEDE YALNIZCA IGNE VAR (kullanicinin karari 2026-08-30). Ara bir
 * adimda ignenin cevresine insan halkalari ve ikinci bir kucuk igne
 * konmustu; kullanici "sadece check-in ignesi olucak etrafindakiler
 * olmucak" dedi ve ikisi de kaldirildi. Tekrar onerme.
 *
 * SOKAK IZGARASI DA YOK. Referans gorselde acik renkli bir kroki
 * zemini vardi; alinmadi cunku (a) `KrokiZemin` tam bu yuzden
 * 2026-08-27'de kaldirilmisti - cizilmis bir sokak izgarasi "burasi
 * neresi" sorusunu aciyor ve kullanici henuz giris yapmadigi icin
 * cevabi yok, (b) zemindeki sicaklik lekeleri zaten nefes aliyor ve
 * ikinci bir doku onlarla catisirdi.
 *
 * "Hareketi azalt" aciksa halkalar HIC atmiyor; sahne duragan bir
 * resim gibi duruyor.
 */

/** Bir nabiz halkasinin disari acilip sonme suresi. CanliHarita ile ayni. */
const NABIZ_SURESI = 2600

/** Ayni anda kac nabiz halkasi acilir. */
const HALKA_SAYISI = 3

/** Sahnenin yuksekligi. Dugme ile dort baslik arasindaki bosluga oturuyor. */
const YUKSEKLIK = 138

/** Nabiz halkalarinin en genis capi. */
const NABIZ_CAPI = 132

/** Sicak nokta isimasinin capi; nabizdan genis ki kenari gorunmesin. */
const ISIMA_CAPI = 260

/** Disari dogru acilip sonen tek bir nabiz halkasi. */
function NabizHalkasi({ gecikme }: { gecikme: number }) {
  const stiller = useStiller(stilleriYap)
  const ilerleme = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const dongu = Animated.loop(
      Animated.timing(ilerleme, {
        toValue: 1,
        duration: NABIZ_SURESI,
        delay: gecikme,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    )
    dongu.start()
    return () => dongu.stop()
  }, [gecikme, ilerleme])

  return (
    <Animated.View
      style={[
        stiller.nabiz,
        {
          opacity: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
          transform: [
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.26, 1] }) },
          ],
        },
      ]}
    />
  )
}

export function CheckInSahnesi() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const [hareketVar, setHareketVar] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => setHareketVar(!azalt))
  }, [])

  return (
    <View
      style={stiller.sahne}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Sicak nokta isimasi: sahnenin merkezini zeminden ayiriyor.
          Zemindeki lekelerle ayni dili konusuyor - kenar cizgisi yok,
          en koyu nokta bile soluk. */}
      <View style={stiller.isimaAlani} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="sahneIsima">
              <Stop offset="0" stopColor={renk.turuncu} stopOpacity={0.2} />
              <Stop offset="1" stopColor={renk.turuncu} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill="url(#sahneIsima)" />
        </Svg>
      </View>

      {/* Nabiz, merkezdeki ignenin arkasinda. */}
      <View style={stiller.nabizAlani}>
        {hareketVar ? (
          Array.from({ length: HALKA_SAYISI }, (_, i) => (
            <NabizHalkasi key={i} gecikme={(NABIZ_SURESI / HALKA_SAYISI) * i} />
          ))
        ) : (
          <View style={[stiller.nabiz, { opacity: 0.2, transform: [{ scale: 0.55 }] }]} />
        )}
      </View>

      {/* Merkezdeki check-in ignesi. Ozellik listesindeki 'konum'
          ikonuyla ayni cizim - ekranda iki farkli igne olmasin. */}
      <View style={stiller.merkezIgne}>
        <Svg width={62} height={62} viewBox="0 0 24 24">
          <Path
            d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8A7.2 7.2 0 0 0 12 2.5z"
            fill={renk.turuncu}
          />
          <Circle cx={12} cy={9.6} r={2.7} fill={renk.karsilamaZemini} />
        </Svg>
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sahne: { height: YUKSEKLIK, width: '100%', overflow: 'visible' },

  isimaAlani: {
    position: 'absolute',
    left: '50%',
    top: 90,
    width: ISIMA_CAPI,
    height: ISIMA_CAPI,
    marginLeft: -ISIMA_CAPI / 2,
    marginTop: -ISIMA_CAPI / 2,
  },

  nabizAlani: {
    position: 'absolute',
    left: '50%',
    top: 90,
    width: NABIZ_CAPI,
    height: NABIZ_CAPI,
    marginLeft: -NABIZ_CAPI / 2,
    marginTop: -NABIZ_CAPI / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nabiz: {
    position: 'absolute',
    width: NABIZ_CAPI,
    height: NABIZ_CAPI,
    borderRadius: NABIZ_CAPI / 2,
    borderWidth: 2,
    borderColor: renk.turuncu,
  },

  merkezIgne: {
    position: 'absolute',
    left: '50%',
    top: 68,
    marginLeft: -31,
  },

})
