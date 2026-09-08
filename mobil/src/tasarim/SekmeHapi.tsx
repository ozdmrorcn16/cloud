import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { useHareket } from './hareket'

/**
 * HAP SEKLINDE SEKME CUBUGU - icinde secili buton KAYIYOR.
 *
 * Kullanicinin istegi (2026-09-08): "hap sekilde bastan sona icinde
 * kaymali sutunlu butonlu". Alt cizgili sekme deseninin yerini aldi.
 *
 * DIL KESFET EKRANINDAKI Harita/Liste segmentiyle ayni: kapsayici
 * turuncu tonlu, secili buton beyaz + turuncu kenarlik, secili yazi
 * turuncu, oteki soluk.
 *
 * Kayan dolgu SEKMENIN DEGIL kapsayicinin cocugu ve agacta EN ALTTA:
 * sekmeye baglansaydi her sekmenin kendi dolgusu olur, kayma diye bir
 * sey olmazdi; butonlardan sonra cizilseydi yazilari orterdi.
 */

/** Hapin ic dolgusu; kayan butonun sinirlarini da bu belirliyor. */
const HAP_DOLGUSU = 3

export function SekmeHapi<T extends string>({
  sekmeler,
  secili,
  onSec,
  yanPay = bosluk.sayfa,
}: {
  sekmeler: { anahtar: T; etiket: string }[]
  secili: T
  onSec: (anahtar: T) => void
  /** Baslangic genisligini ekrandan turetmek icin sayfanin yan payi. */
  yanPay?: number
}) {
  const stiller = useStiller(stilleriYap)
  const hareket = useHareket()
  // Baslangic degeri EKRANDAN turetiliyor, sifirdan degil: sifirla
  // baslasa gosterge ilk karede hic cizilmez ve olcum gelince birden
  // belirirdi. Testte de `onLayout` tetiklenmiyor.
  const [butonGenisligi, setButonGenisligi] = useState(
    () => (Dimensions.get('window').width - yanPay * 2 - HAP_DOLGUSU * 2) / sekmeler.length
  )
  const konum = useRef(new Animated.Value(0)).current
  const sira = Math.max(
    0,
    sekmeler.findIndex((s) => s.anahtar === secili)
  )

  useEffect(() => {
    if (!hareket) {
      konum.setValue(sira)
      return
    }
    const animasyon = Animated.spring(konum, {
      toValue: sira,
      useNativeDriver: true,
      // Yay SERT ve SONMUS: sekmeler bitisik oldugu icin tasip geri
      // donen bir hareket "yanlis sekme secildi" gibi okunuyor.
      speed: 18,
      bounciness: 0,
    })
    animasyon.start()
    return () => animasyon.stop()
  }, [sira, hareket, konum])

  return (
    <View
      style={stiller.hap}
      onLayout={(o) =>
        setButonGenisligi(
          (o.nativeEvent.layout.width - HAP_DOLGUSU * 2) / sekmeler.length
        )
      }
    >
      <Animated.View
        testID="sekme-gostergesi"
        pointerEvents="none"
        style={[
          stiller.kayanButon,
          {
            width: butonGenisligi,
            transform: [
              {
                translateX: konum.interpolate({
                  inputRange: sekmeler.map((_, i) => i),
                  outputRange: sekmeler.map((_, i) => i * butonGenisligi),
                }),
              },
            ],
          },
        ]}
      />
      {sekmeler.map((s) => (
        <Pressable
          key={s.anahtar}
          style={stiller.sekme}
          onPress={() => onSec(s.anahtar)}
          accessibilityRole="button"
          accessibilityState={{ selected: s.anahtar === secili }}
        >
          <Text style={[stiller.yazi, s.anahtar === secili && stiller.yaziAktif]}>{s.etiket}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    hap: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      backgroundColor: renk.turuncuZemin,
      borderRadius: yuvarlak.hap,
      padding: HAP_DOLGUSU,
      marginTop: bosluk.l,
    },
    sekme: { flex: 1, alignItems: 'center', paddingVertical: bosluk.s + 2 },
    // Dikeyde `top`/`bottom` ile geriliyor: sabit bir yukseklik
    // yazilsaydi yazi puntosu degisince hap sekmeye oturmazdi.
    kayanButon: {
      position: 'absolute',
      left: HAP_DOLGUSU,
      top: HAP_DOLGUSU,
      bottom: HAP_DOLGUSU,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.yuzey,
      borderWidth: 1.2,
      borderColor: renk.turuncu,
    },
    yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metinSoluk },
    yaziAktif: { color: renk.turuncuYazi },
  })
