import { StyleSheet, View } from 'react-native'
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
 * HAREKET YOK. Kroki zeminde nabiz gibi atan halkalar vardi; secilen
 * tasarimda yer almiyor. Hareket istenirse lekelere cok yavas bir
 * "nefes" (olcek 1 -> 1.04) eklenebilir; o zaman "hareketi azalt"
 * kontrolu de geri gelmeli.
 */

// Cizim bu tuvale gore yapiliyor; ekrana 'slice' ile yayiliyor.
const EN = 390
const BOY = 844

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

export function SicaklikZemin() {
  return (
    <View style={stiller.kok} pointerEvents="none">
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
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
})
