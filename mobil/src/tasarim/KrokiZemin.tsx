import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import { renk } from './tema'

/**
 * Acilis ekraninin arka plani: bir kroki (basitlestirilmis harita),
 * ustunde check-in ignesi, nabiz gibi atan halkalar ve cevresinde
 * insan ikonlari.
 *
 * Kullanicinin kararlari (2026-08-25):
 *   - "komple acilis sayfasinin arka planini kapsayan bir harita kroki
 *      gibi birsey, uzerinde check-in ikonlari ve insani temsil eden
 *      gorseller"
 *   - "kroki daha belirgin, halkalar nabiz gibi atsin"
 *   - gercek fotograf DENENDI VE IPTAL EDILDI: "gercek insan yuzu
 *     olmasin, ozellikle nabiz gibi atan check-in'in yakininda daha
 *     cok insan ikonu olsun, cevresinde de bazi yerlerde olsun"
 *
 * Her sey CIZIM: uzerine metin biniyor ve fotografta metni okutmak
 * icin karartma gerekir; karartma da acik kimligi bozar. Insanlar da
 * ikon - gercek yuz denendi, kullanici istemedi.
 *
 * HAREKET TEK YERDE: yalnizca halkalar atiyor. Cihazda "hareketi azalt"
 * aciksa hic atmiyor, halkalar sabit duruyor.
 */

// Cizim bu tuvale gore yapiliyor; ekrana 'slice' ile yayiliyor.
const EN = 390
const BOY = 844

/**
 * YOL IZGARASI. Yatay ve dikey yollarin eksen konumlari.
 *
 * Yollar tam yatay/dikey (2026-08-26): onceden hepsi hafif egimliydi
 * ve metnin arkasindan gecen egik serit yazilari yamuk gosteriyordu.
 * Egimi duzeltmek tek gercek cozumdu - yanilsama yazi tarafinda
 * giderilemiyor.
 *
 * Aralklar BILEREK esit degil: canlilik egimden degil, ritimden
 * geliyor.
 */
const YATAY_YOL = [-20, 78, 221, 311, 414, 534, 629, 733, 864]
const DIKEY_YOL = [-20, 52, 158, 246, 324, 410]

/** Adanin yola olan payi - en kalin yolun yarisindan (8.5) buyuk. */
const ADA_PAYI = 14

/**
 * Dolu hucreler: [satir, sutun]. Hepsi doldurulsaydi kroki tekduze bir
 * dama tahtasi olurdu; bosluklar meydan/park gibi okunuyor.
 */
const DOLU_HUCRELER: readonly (readonly [number, number])[] = [
  [0, 1], [0, 3],
  [1, 0], [1, 1], [1, 4],
  [2, 1], [2, 3],
  [3, 0], [3, 3],
  [4, 1], [4, 2], [4, 4],
  [5, 0], [5, 3],
  [6, 1], [6, 4],
  [7, 0], [7, 2],
]

/**
 * Ada boyutlarindaki degisim.
 *
 * Adalar hucreyi TAM DOLDURMUYOR: her biri kendi sirasina gore biraz
 * daha kucuk cikiyor. Ilk kosumda hepsi hucreyi tam dolduruyordu ve
 * kroki ayni boyda kutulardan olusan bir dama tahtasina donuyordu.
 * Deger diziden geliyor, rastgele degil - her cizimde ayni sonuc.
 */
const EK_PAY = [0, 14, 6, 22, 10, 2]

/** Hucrelerden uretilen ada dikdortgenleri. */
const ADALAR = DOLU_HUCRELER.map(([satir, sutun], i) => {
  const ek = EK_PAY[i % EK_PAY.length]
  const ekDikey = EK_PAY[(i + 3) % EK_PAY.length]
  const x = DIKEY_YOL[sutun] + ADA_PAYI
  const y = YATAY_YOL[satir] + ADA_PAYI
  const en = DIKEY_YOL[sutun + 1] - ADA_PAYI - x - ek
  const boy = YATAY_YOL[satir + 1] - ADA_PAYI - y - ekDikey
  return { x, y, en, boy }
}).filter(({ en, boy }) => en > 26 && boy > 26)

// Nabzin merkezi. 2026-08-26'da 630'dan 674'e INDIRILDI: acilis
// ekranina slogan ve ornek check-in kartlari eklenince ozellik
// listesi asagi kaydi ve son satir ("Populer yerleri kesfet") alttaki
// insan ikonlarinin uzerine biniyordu.
// 2026-08-26'da once 630'dan 674'e indirilmisti (icerik uzayinca son
// ozellik satiri alttaki ikonlarin uzerine biniyordu). Slogan ve alt
// not kaldirilinca icerik yeniden kisaldi ve bu sefer nabiz "Hesap
// olustur" dugmesinin altinda kaldi; 640'a CIKARILDI. Ignenin kendisi
// MERKEZ.y + 26'da, yani insan ikonlarinin tam ortasinda duruyor.
const MERKEZ = { x: 196, y: 640 }

/**
 * Insan ikonlari. Konumlar rastgele degil: hicbiri metnin uzerine
 * gelmiyor (ilk denemede ozellik satirlarinin uzerine biniyorlardi) ve
 * kalabalik bilerek nabzin cevresinde topluyor.
 */
const KISILER = [
  // Ust serit: marka kilidinin iki yani. Ortaya konan bir ikon logonun
  // arkasindan gorunuyordu, kaldirildi.
  { x: 74, y: 148, r: 20 },
  { x: 316, y: 176, r: 18 },
  // Alt bant: nabzin cevresi, yatayda esit araliklarla. Ustteki ikisi
  // once daha yukaridaydi ve son ozellik satirinin uzerine biniyordu;
  // asagi cekildi. Butonun altina denk gelen ikon da kaldirildi.
  // Dordu de 2026-08-26'da ~44 birim asagi alindi; gerekcesi MERKEZ
  // tanimindaki notta.
  { x: 152, y: 662, r: 19 },
  { x: 250, y: 666, r: 18 },
  // Yandaki ikisi butonun altina girmesin diye 698/700'de duruyor.
  { x: 72, y: 698, r: 16 },
  { x: 322, y: 700, r: 16 },
]

// Kenar payi: 'slice' olceklemesinde tuvalin yanlari kirpilabiliyor.
// Ilk denemede kenara yakin ikonlar yarim gorunuyordu ("yamuk").
// Yukaridaki x degerleri en dar telefonda bile tam kaliyor.

/** Krokideki ikincil check-in igneleri - metnin ustune binmeyen yerler. */
const IGNELER = [
  { x: 84, y: 84, olcek: 0.45 },
  { x: 306, y: 112, olcek: 0.4 },
  { x: 236, y: 626, olcek: 0.45 },
]

const HALKA_SURESI = 2800
const HALKA_ADEDI = 3
/** Nabzin en genis hali - merkezden yaricap (tuval birimi). */
const HALKA_YARICAP = 150

/** Insan ikonu: turuncu cerceveli daire icinde sade bir siluet. */
function Kisi({ x, y, r }: { x: number; y: number; r: number }) {
  const o = r / 22
  return (
    <G>
      <Circle
        cx={x}
        cy={y}
        r={r}
        fill={renk.yuzey}
        stroke={renk.turuncu}
        strokeWidth={1.8}
        opacity={0.85}
      />
      {/* Siluet SOLUK: kullanicinin istegi - "renkleri gorseldeki gibi
          olsun, cok belirgin olmasin". Dolu turuncu ikonlar arka plani
          one cikariyordu. */}
      <G opacity={0.42}>
        <Circle cx={x} cy={y - 4 * o} r={6 * o} fill={renk.turuncu} />
        <Path
          d={`M${x - 10 * o} ${y + 13 * o}c0-6 4.5-9.5 10-9.5s10 3.5 10 9.5z`}
          fill={renk.turuncu}
        />
      </G>
    </G>
  )
}

function Igne({ x, y, olcek }: { x: number; y: number; olcek: number }) {
  return (
    <G transform={`translate(${x - 12 * olcek} ${y - 24 * olcek}) scale(${olcek})`}>
      <Path
        d="M12 0C5.9 0 1 4.9 1 11c0 8 11 19 11 19s11-11 11-19c0-6.1-4.9-11-11-11z"
        fill={renk.turuncu}
      />
      <Circle cx={12} cy={10.6} r={4.2} fill={renk.zemin} />
    </G>
  )
}

/** Disari dogru buyuyup sonen tek bir halka. */
function NabizHalkasi({ gecikme, hareketVar }: { gecikme: number; hareketVar: boolean }) {
  const ilerleme = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareketVar) return
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.delay(gecikme),
        Animated.timing(ilerleme, {
          toValue: 1,
          duration: HALKA_SURESI,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ilerleme, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    )
    dongu.start()
    return () => dongu.stop()
  }, [gecikme, hareketVar, ilerleme])

  if (!hareketVar) {
    // Hareket kapaliysa halka sabit ve orta genislikte durur.
    return <View style={[stiller.halka, stiller.halkaSabit]} />
  }

  return (
    <Animated.View
      style={[
        stiller.halka,
        {
          opacity: ilerleme.interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0, 0.28, 0],
          }),
          transform: [
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.32, 1] }) },
          ],
        },
      ]}
    />
  )
}

export function KrokiZemin() {
  const [hareketVar, setHareketVar] = useState(true)

  useEffect(() => {
    // Cihazda "hareketi azalt" aciksa animasyon hic baslamiyor.
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => setHareketVar(!azalt))
  }, [])

  return (
    <View style={stiller.kok} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${EN} ${BOY}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect x={0} y={0} width={EN} height={BOY} fill={renk.zemin} />

        {/* Yapi adalari. Artik elle konmuyor: YOL IZGARASININ
            hucrelerinden turetiliyor (bkz. ADALAR). Onceden koordinatlar
            elle yazilmisti ve yollar duzlestirilince adalar yollarin
            uzerine binmeye basladi. */}
        <G>
          {ADALAR.map(({ x, y, en, boy }, i) => (
            <Rect key={i} x={x} y={y} width={en} height={boy} rx={14} fill="#EFE6DA" />
          ))}
        </G>

        {/* Yollar: adalarin uzerinden gecen BEYAZ seritler. Haritalarin
            okunma bicimi bu - koyu ada, acik yol. */}
        {/* Yollar TAM YATAY / TAM DIKEY.
            Onceden hepsi hafif egimliydi (yataylarda 430 birimde 20-36
            birim dusus, ~3 derece). Kullanici yazilarin yamuk
            gorundugunu bildirdi ve sebebi buydu: metnin arkasindan
            gecen egik bir seride bakan goz, duz olan yaziyi da egik
            okuyor. Klasik bir optik yanilsama, yazi tarafinda
            duzeltilemiyor - referans cizgileri duzeltmek gerekiyor.

            Duzenlilik sikici olmasin diye ARALIKLAR esit degil ve
            kalinliklar degisiyor; canlilik egimden degil ritimden
            geliyor. */}
        <G stroke="#FFFFFF" strokeWidth={17} strokeLinecap="round">
          <Path d="M-20 221 L410 221" />
          <Path d="M-20 414 L410 414" />
          <Path d="M-20 629 L410 629" />
          <Path d="M158 -20 L158 864" />
          <Path d="M324 -20 L324 864" />
        </G>
        <G stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round">
          <Path d="M-20 78 L410 78" />
          <Path d="M-20 311 L410 311" />
          <Path d="M-20 534 L410 534" />
          <Path d="M-20 733 L410 733" />
          <Path d="M52 -20 L52 864" />
          <Path d="M246 -20 L246 864" />
        </G>

        {IGNELER.map((igne, i) => (
          <Igne key={i} {...igne} />
        ))}

        {KISILER.map((kisi, i) => (
          <Kisi key={i} {...kisi} />
        ))}

        {/* Merkezdeki check-in ignesi: krokinin odagi, insanlarin
            ortasinda duruyor. */}
        <Igne x={MERKEZ.x} y={MERKEZ.y + 26} olcek={1.5} />
      </Svg>

      {/* Nabiz halkalari SVG'nin degil Animated'in isi: olcek ve
          saydamlik yerli surucude donuyor. */}
      <View
        style={[
          stiller.nabizAlani,
          {
            left: `${((MERKEZ.x - HALKA_YARICAP) / EN) * 100}%`,
            top: `${((MERKEZ.y - HALKA_YARICAP) / BOY) * 100}%`,
            width: `${((HALKA_YARICAP * 2) / EN) * 100}%`,
            aspectRatio: 1,
          },
        ]}
      >
        {Array.from({ length: HALKA_ADEDI }).map((_, i) => (
          <NabizHalkasi
            key={i}
            gecikme={(HALKA_SURESI / HALKA_ADEDI) * i}
            hareketVar={hareketVar}
          />
        ))}
      </View>

    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  nabizAlani: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  halka: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: renk.turuncu,
  },
  halkaSabit: { opacity: 0.14, transform: [{ scale: 0.7 }] },
})
