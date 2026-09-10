import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { bosluk, olcek, yazi, type Renk } from './tema'
import { useStiller } from './tema-baglami'
import { useHareket } from './hareket'

/**
 * SEKME CUBUGU - secili sekmenin ALTINDA kayan turuncu cizgi.
 *
 * DOSYA ADI TARIHSEL: bilesen 2026-09-08'de HAP seklindeydi
 * ("hap sekilde bastan sona icinde kaymali sutunlu butonlu") ve adini
 * oradan aliyor. 2026-09-10'da kullanicinin gonderdigi referansla ALT
 * CIZGIYE donduruIdue; ad degistirilmedi cunku iki ekran onu bu adla
 * cagiriyor ve isim degisikligi bu isin kapsami disinda.
 *
 * KAYMA KORUNDU: gosterge hala yay ile kayiyor, yalnizca sekli
 * degisti - dolu bir buton yerine ince bir cizgi. Kayan oge
 * SEKMENIN DEGIL kapsayicinin cocugu: sekmeye baglansaydi her
 * sekmenin kendi cizgisi olur, kayma diye bir sey olmazdi.
 */

/**
 * Gostergenin sekme genisligine gore payi.
 *
 * Cizgi sekmenin TAMAMI kadar degil: referansta metnin altinda daha
 * dar duruyor ve iki sekme arasindaki sinir boylece yumusak kaliyor.
 */
const GOSTERGE_ORANI = 0.56

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
    () => (Dimensions.get('window').width - yanPay * 2) / sekmeler.length
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
      onLayout={(o) => setButonGenisligi(o.nativeEvent.layout.width / sekmeler.length)}
    >
      <Animated.View
        testID="sekme-gostergesi"
        pointerEvents="none"
        style={[
          stiller.kayanButon,
          {
            width: butonGenisligi * GOSTERGE_ORANI,
            transform: [
              {
                translateX: konum.interpolate({
                  inputRange: sekmeler.map((_, i) => i),
                  // Cizgi sekmenin ORTASINDA duruyor: sol kenara
                  // hizalansaydi dar cizgi metnin altindan kacardi.
                  outputRange: sekmeler.map(
                    (_, i) => i * butonGenisligi + (butonGenisligi * (1 - GOSTERGE_ORANI)) / 2
                  ),
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
    /* Zemin YOK; tabandaki ince cizgi sekmeleri icerikten ayiriyor. */
    hap: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      marginTop: bosluk.l,
      borderBottomWidth: 1,
      borderBottomColor: renk.cizgi,
    },
    sekme: { flex: 1, alignItems: 'center', paddingVertical: bosluk.m },
    /* Gosterge tabandaki gri cizginin UZERINE biniyor (`bottom: -1`),
       yoksa ikisi alt alta iki cizgi gibi gorunurdu. */
    kayanButon: {
      position: 'absolute',
      left: 0,
      bottom: -1,
      height: 3,
      borderRadius: 2,
      backgroundColor: renk.turuncu,
    },
    yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metinSoluk },
    yaziAktif: { color: renk.turuncuYazi },
  })
