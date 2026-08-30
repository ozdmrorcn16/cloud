import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { renk } from './tema'

/**
 * Acilis ekraninin arka plani: bir SICAKLIK HARITASI.
 *
 * Kullanicinin karari (2026-08-27): alti arka plan onerisi arasindan
 * bu secildi. Onceki `KrokiZemin` (cizilmis sokak izgarasi, adalar,
 * insan ikonlari, nabiz atan halkalar) bununla degistirildi.
 *
 * Gerekce - neden harita mobilyasi YOK:
 *   Cizilmis bir sokak izgarasi "burasi neresi" sorusunu aciyor ve o
 *   sorunun cevabi yok; kullanici henuz giris yapmadigi icin gercek
 *   bir yer gosterilemez. Sicaklik lekesi ayni seyi soruyu acmadan
 *   soyluyor: "surada kalabalik var". Uygulamanin tek sorusu da budur.
 *
 * Gerekce - neden metin bu zeminde iyi okunuyor:
 *   Lekelerin hicbirinde kenar cizgisi yok ve en koyu nokta bile
 *   %34 opaklikta. Kontrast farki metnin arkasinda degil, lekenin
 *   merkezinde toplaniyor. Kroki zemindeki beyaz yol seritleri ise
 *   metnin arkasindan gecen sert kenarlar uretiyordu.
 *
 * Turuncu kullanimi kimlik kuralina uygun: burada turuncu dekorasyon
 * degil, "canlilik" anlamini tasiyor - lekeler insan yogunlugudur.
 *
 * HAREKET (kullanicinin karari 2026-08-30): lekeler "nefes" aliyor.
 * Her leke kendi suresinde (9-16 sn) en fazla %5 buyuyup kuculuyor ve
 * hepsi farkli fazda basliyor, yani ekranda tek bir hareketli oge
 * gorunmuyor - zemin butun olarak yasiyor. Urunun tek vaadi "su an
 * orada biri var"; hareket bunu kelime kullanmadan soyluyor.
 * "Hareketi azalt" aciksa animasyon HIC baslamaz ve ekran bu dosyanin
 * onceki duragan haliyle ayni cizilir.
 */

// Cizim bu tuvale gore yapiliyor; ekrana 'slice' ile yayiliyor.
const EN = 390
const BOY = 844

/** Nefesin en genis anindaki olcek. Daha buyugu "atiyor" gibi duruyor. */
const NEFES_OLCEGI = 1.05

/**
 * Sicaklik lekeleri: [x, y, yaricap, en yuksek opaklik].
 *
 * Yerlesim rastgele degil. Ekranin ust ve alt ucunda daha guclu,
 * ORTADA daha zayif lekeler var: dort baslik ekranin ortasinda duruyor
 * ve arkalarinin nispeten sakin kalmasi gerekiyor. Buyuk orta leke
 * (196, 470) bilerek genis ve yayvan - kenari basliklarin arkasina
 * denk gelmiyor, yalnizca merkezi.
 */
const LEKELER: readonly (readonly [number, number, number, number])[] = [
  [88, 150, 130, 0.3],
  [300, 250, 105, 0.22],
  [196, 470, 165, 0.34],
  [56, 620, 120, 0.26],
  [330, 700, 140, 0.3],
  [150, 790, 110, 0.2],
]

/** Lekenin nefes suresi; her leke farkli ki ikisi ayni anda dolmasin. */
function nefesSuresi(sira: number) {
  return 9000 + sira * 1400
}

/** Ilk dongunun basladigi an; fazlari birbirinden ayirir. */
function nefesGecikmesi(sira: number) {
  return sira * 2100
}

/**
 * Tek bir leke, kendi karesi icinde cizilir ve o kare olceklenir.
 *
 * Lekeler neden ayri ayri View icinde: SVG'nin `r` degerini
 * canlandirmak native surucuyle yapilamiyor, her karede JS'ten prop
 * yazmak gerekiyordu. Kareyi olceklemek `transform` oldugu icin native
 * surucude calisiyor ve gorunum birebir ayni kaliyor.
 */
function NefesLekesi({
  sira,
  olcek,
  sol,
  ust,
  boyut,
  opaklik,
}: {
  sira: number
  olcek: Animated.AnimatedInterpolation<number>
  sol: number
  ust: number
  boyut: number
  opaklik: number
}) {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: sol,
        top: ust,
        width: boyut,
        height: boyut,
        transform: [{ scale: olcek }],
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={`nefes${sira}`}>
            <Stop offset="0" stopColor={renk.turuncu} stopOpacity={opaklik} />
            <Stop offset="1" stopColor={renk.turuncu} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill={`url(#nefes${sira})`} />
      </Svg>
    </Animated.View>
  )
}

/** Duragan hal: "hareketi azalt" aciksa ve olcum alinmadan once cizilir. */
function DuraganZemin() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${EN} ${BOY}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        {/* Her lekenin kendi gecisi var cunku en yuksek opaklik
            lekeden lekeye degisiyor; tek bir gecisi yeniden
            kullanip opakligi disaridan vermek react-native-svg'de
            iOS ve Android'de farkli sonuc veriyor. */}
        {LEKELER.map(([, , , opaklik], i) => (
          <RadialGradient key={i} id={`leke${i}`}>
            <Stop offset="0" stopColor={renk.turuncu} stopOpacity={opaklik} />
            <Stop offset="1" stopColor={renk.turuncu} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>

      <Rect x={0} y={0} width={EN} height={BOY} fill={renk.karsilamaZemini} />

      {LEKELER.map(([x, y, yaricap], i) => (
        <Circle key={i} cx={x} cy={y} r={yaricap} fill={`url(#leke${i})`} />
      ))}
    </Svg>
  )
}

export function SicaklikZemin() {
  const [hareketVar, setHareketVar] = useState(false)
  const [olcu, setOlcu] = useState({ en: 0, boy: 0 })
  const olcekler = useRef(LEKELER.map(() => new Animated.Value(0))).current

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => setHareketVar(!azalt))
  }, [])

  useEffect(() => {
    if (!hareketVar) return

    const donguler: Animated.CompositeAnimation[] = []
    // Gecikme dongunun ICINE konursa her turda tekrarlanir ve lekeler
    // aralikli duraklar; bu yuzden yalnizca ilk baslangic geciktiriliyor.
    const zamanlayicilar = olcekler.map((olcek, i) => {
      const yarimSure = nefesSuresi(i) / 2
      return setTimeout(() => {
        const dongu = Animated.loop(
          Animated.sequence([
            Animated.timing(olcek, {
              toValue: 1,
              duration: yarimSure,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(olcek, {
              toValue: 0,
              duration: yarimSure,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        )
        donguler.push(dongu)
        dongu.start()
      }, nefesGecikmesi(i))
    })

    return () => {
      zamanlayicilar.forEach(clearTimeout)
      donguler.forEach((d) => d.stop())
    }
  }, [hareketVar, olcekler])

  // 'slice' ile ayni yerlesim: tuval kisa kenardan tasacak sekilde
  // buyutulup ortalaniyor.
  const buyutme = olcu.en > 0 ? Math.max(olcu.en / EN, olcu.boy / BOY) : 0
  const kaydirmaX = (olcu.en - EN * buyutme) / 2
  const kaydirmaY = (olcu.boy - BOY * buyutme) / 2

  return (
    <View
      style={stiller.kok}
      pointerEvents="none"
      onLayout={(o) =>
        setOlcu({ en: o.nativeEvent.layout.width, boy: o.nativeEvent.layout.height })
      }
    >
      {!hareketVar || buyutme === 0 ? (
        <DuraganZemin />
      ) : (
        <View style={stiller.kok}>
          <View style={[stiller.kok, { backgroundColor: renk.karsilamaZemini }]} />
          {LEKELER.map(([x, y, yaricap, opaklik], i) => {
            const boyut = 2 * yaricap * buyutme
            return (
              <NefesLekesi
                key={i}
                sira={i}
                olcek={olcekler[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, NEFES_OLCEGI],
                })}
                sol={x * buyutme + kaydirmaX - yaricap * buyutme}
                ust={y * buyutme + kaydirmaY - yaricap * buyutme}
                boyut={boyut}
                opaklik={opaklik}
              />
            )
          })}
        </View>
      )}
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
})
