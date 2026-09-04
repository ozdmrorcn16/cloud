import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { G, Path, Rect } from 'react-native-svg'
import { ANA_YOLLAR, ORTA_YOLLAR, INCE_YOLLAR } from './karsilama-yollari'
import { bosluk, yazi, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * KARSILAMA SAHNESI - "sicak nokta".
 *
 * Kullanicinin secimi (2026-09-03): dort kompozisyon gorsel olarak
 * sunuldu, "1" secildi. Amac uc vaadi ANLATMAK degil HISSETTIRMEK:
 *
 *   igne          -> check-in yapilmis bir yer
 *   avatar kumesi -> orada olan insanlar (tanisma)
 *   halkalar      -> hangisi daha canli (populer yerler)
 *
 * UC NOKTA VAR (kullanicinin istegi 2026-09-04): once yalnizca
 * merkezde igne vardi, diger iki leke bostu. Artik ucunde de igne ve
 * birkac kisi var - "baska yerlerde de hareket var" fikri boylece
 * gorunuyor.
 *
 * NABIZ (ayni istek): halkalar ignenin dibinden dogup disari yayiliyor
 * ve yolda soluyor - radar sinyali gibi. Uc nokta AYNI ANDA degil,
 * sirayla atiyor; ayni anda atsalardi ekran tek bir sey gibi yanip
 * sonerdi.
 *
 * HAREKETI AZALT ayari aciksa nabiz HIC BASLAMIYOR (uygulamanin
 * erisilebilirlik tabani): halkalar duruyor, kompozisyon aynen kaliyor.
 *
 * LEKELER ARTIK SVG DEGIL: SVG dairelerini `Animated` ile olceklemek
 * native surucuyu kullanamiyor. Halkalar yuvarlatilmis `Animated.View`;
 * yalnizca yollar SVG kaldi.
 *
 * UYDURMA VERI YOK. Mekan adi da, "yakininda su kadar kisi var" gibi
 * bir iddia da gecmiyor - bu bir cizim, bir veri yuzeyi degil.
 * Karsilama ekranindaki ornek check-in kartlari 2026-08-27'de tam bu
 * yuzden kaldirilmisti; o karar duruyor.
 *
 * YUZ YOK: avatarlar harfli daireler. Uygulamanin kendi kurali da bu -
 * haritada ve yogunluk sayacinda kimlik degil SAYI gosteriliyor.
 */

type Kisi = { harf: string; arka: string }

type Nokta = {
  /** Sahnenin yuzdesi olarak konum. */
  x: `${number}%`
  y: `${number}%`
  /** En dis halkanin capi. */
  cap: number
  /** Igne dugmesinin capi. */
  igne: number
  /** Avatar capi. */
  avatar: number
  /**
   * Sinyalin baslama gecikmesi (ms). KISA tutuluyor: noktalar ayni anda
   * atmasin diye var, ama uzun olursa ekran acildiginda o nokta bos
   * duruyor ve sicak nokta olmadigi saniliyor.
   */
  gecikme: number
  kisiler: Kisi[]
  /** Kumenin sonundaki "+n" balonu; yoksa hic cizilmiyor. */
  fazla?: string
}

const NOKTALAR: Nokta[] = [
  {
    x: '50%',
    y: '36%',
    cap: 190,
    igne: 44,
    avatar: 30,
    gecikme: 0,
    kisiler: [
      { harf: 'D', arka: '#7B8CFF' },
      { harf: 'E', arka: '#E0562A' },
      { harf: 'M', arka: '#0E9488' },
    ],
    fazla: '+4',
  },
  {
    x: '20%',
    y: '76%',
    cap: 120,
    igne: 32,
    avatar: 24,
    gecikme: 250,
    kisiler: [{ harf: 'S', arka: '#C084FC' }],
    fazla: '+1',
  },
  {
    x: '80%',
    y: '18%',
    cap: 96,
    igne: 28,
    avatar: 22,
    gecikme: 500,
    kisiler: [{ harf: 'B', arka: '#0E9488' }],
  },
]

function Avatar({
  harf,
  arka,
  cap,
  yaziRengi,
}: {
  harf: string
  arka: string
  cap: number
  yaziRengi?: string
}) {
  const renk = useRenk()
  return (
    <View
      style={{
        width: cap,
        height: cap,
        borderRadius: cap / 2,
        backgroundColor: arka,
        borderWidth: 2.5,
        // Halka sayfanin zeminiyle ayni: daireler birbirinden ayrilsin
        // ama zeminden kopmasin.
        borderColor: renk.karsilamaZemini,
        alignItems: 'center',
        justifyContent: 'center',
        // Ust uste binme CAPA ORANTILI: sabit bir deger kucuk
        // dairelerde harfin uzerini kapatiyordu.
        marginLeft: -Math.round(cap / 4),
      }}
    >
      <Text
        style={{
          fontFamily: yazi.ekranBasligi,
          fontSize: cap * 0.42,
          color: yaziRengi ?? '#FFFFFF',
        }}
      >
        {harf}
      </Text>
    </View>
  )
}

/**
 * Yayilan sinyal halkalari - radar nabzi.
 *
 * Kullanicinin istegi (2026-09-04): "azdan coga artan sinyal gibi
 * olsun". Onceki hal uc halkayi BIRLIKTE buyutup soluyordu, yani
 * bir nefes gibiydi; simdi her halka ignenin dibinden dogup disari
 * dogru buyuyor ve yolda soluyor - bir yerden sinyal YAYILIYOR
 * izlenimi.
 *
 * Uc halka ayni turun ucte biri kadar gecikmeyle basliyor, boylece
 * hep biri dogarken bir digeri sonuyor: dalga kesintisiz.
 *
 * Dongude gecikme YOK; ilk gecikme setTimeout ile bir kez veriliyor.
 * Gecikme dongunun ICINE konsaydi her turdan sonra tekrarlanir ve
 * halkalar arasinda olu bir bosluk olusurdu.
 *
 * TUR SURESI 2800 -> 4200 (kullanicinin istegi, 2026-09-04: "sinyaller
 * cok hizli"). Sinyal aceleci degil sakin bir nabiz olmali; ustelik
 * bu ekran ilk izlenim ve hizli hareket dikkati metinden caliyor.
 */
const TUR_SURESI = 4200

function Halkalar({ cap, gecikme, hareket }: { cap: number; gecikme: number; hareket: boolean }) {
  const renk = useRenk()
  // Uc halkanin ilerlemesi; her biri 0 -> 1 arasinda kendi turunu
  // dondurur.
  const ilerleme = useRef([0, 1, 2].map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (!hareket) return
    const zamanlayicilar: ReturnType<typeof setTimeout>[] = []
    const dongular = ilerleme.map((deger, sira) => {
      const dongu = Animated.loop(
        Animated.timing(deger, {
          toValue: 1,
          duration: TUR_SURESI,
          // Disa dogru hizli acilip yavaslayarak sonuyor.
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
      zamanlayicilar.push(setTimeout(() => dongu.start(), gecikme + (sira * TUR_SURESI) / 3))
      return dongu
    })
    return () => {
      zamanlayicilar.forEach(clearTimeout)
      dongular.forEach((d) => d.stop())
      ilerleme.forEach((d) => d.setValue(0))
    }
  }, [hareket, gecikme, ilerleme])

  // HAREKET KAPALIYSA sabit ic ice halkalar; kompozisyon aynen kaliyor.
  const duragan = [
    { oran: 1, opaklik: 0.1 },
    { oran: 0.65, opaklik: 0.13 },
    { oran: 0.36, opaklik: 0.17 },
  ]

  return (
    <>
      {/* Ignenin dibindeki sabit sicaklik: sinyal sondugu anda nokta
          bombos kalmasin. */}
      <Halka cap={cap * 0.34} opaklik={0.16} renk={renk.turuncu} />

      {hareket
        ? ilerleme.map((deger, sira) => (
            <Halka
              key={sira}
              cap={cap}
              renk={renk.turuncu}
              olcek={deger.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })}
              opaklik={deger.interpolate({
                // Dogarken hizli beliriyor, yolun tamaminda soluyor.
                inputRange: [0, 0.12, 1],
                outputRange: [0, 0.22, 0],
              })}
            />
          ))
        : duragan.map(({ oran, opaklik }) => (
            <Halka key={oran} cap={cap * oran} opaklik={opaklik} renk={renk.turuncu} />
          ))}
    </>
  )
}

/** Tek bir halka; ignenin merkezine oturur. */
function Halka({
  cap,
  renk,
  opaklik,
  olcek,
}: {
  cap: number
  renk: string
  opaklik: number | Animated.AnimatedInterpolation<number>
  olcek?: Animated.AnimatedInterpolation<number>
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        // Igne dugmesinin merkeziyle ayni eksen.
        top: -cap / 2 + 22,
        width: cap,
        height: cap,
        borderRadius: cap / 2,
        backgroundColor: renk,
        opacity: opaklik,
        transform: olcek ? [{ scale: olcek }] : [],
      }}
    />
  )
}

function NoktaGorunumu({ nokta, hareket }: { nokta: Nokta; hareket: boolean }) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)

  return (
    <View style={[stiller.nokta, { left: nokta.x, top: nokta.y }]}>
      <Halkalar cap={nokta.cap} gecikme={nokta.gecikme} hareket={hareket} />

      <View
        style={[
          stiller.igne,
          { width: nokta.igne, height: nokta.igne, borderRadius: nokta.igne / 2 },
        ]}
      >
        <Svg width={nokta.igne * 0.5} height={nokta.igne * 0.5} viewBox="0 0 24 24">
          <Path
            d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
            stroke="#FFFFFF"
            strokeWidth={2.2}
            fill="none"
          />
          <Path
            d="M12 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z"
            stroke="#FFFFFF"
            strokeWidth={2.2}
            fill="none"
          />
        </Svg>
      </View>
      <View style={[stiller.kuyruk, { borderTopColor: renk.turuncu }]} />

      <View style={[stiller.kume, { paddingLeft: Math.round(nokta.avatar / 4) }]}>
        {nokta.kisiler.map(({ harf, arka }) => (
          <Avatar key={harf} harf={harf} arka={arka} cap={nokta.avatar} />
        ))}
        {nokta.fazla && (
          <Avatar
            harf={nokta.fazla}
            arka={renk.turuncuZemin}
            cap={nokta.avatar}
            yaziRengi={renk.turuncuKoyu}
          />
        )}
      </View>
    </View>
  )
}

export function KarsilamaSahnesi() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)

  // Hareketi azalt aciksa nabiz hic baslamiyor.
  const [hareket, setHareket] = useState(true)
  useEffect(() => {
    let gecerli = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then((azalt) => {
        if (gecerli) setHareket(!azalt)
      })
      .catch(() => {
        // Ayar okunamazsa hareket acik kalir; her platformda bu cagri
        // desteklenmiyor.
      })
    return () => {
      gecerli = false
    }
  }, [])

  return (
    <View style={stiller.kok}>
      {/* Zemin yalnizca yollar: lekeler artik animasyonlu gorunumler. */}
      {/* ZEMIN GERCEK BIR YOL AGI (kullanicinin istegi 2026-09-04:
          "Bunu gercek map goruntusuyle olustursana"). Onceden dort elle
          cizilmis cizgiydi. Geometri OpenStreetMap'ten, Bursa/Nilufer
          kesiti; `araclar/karsilama-yollari-uret.py` bir kez cikarip
          `karsilama-yollari.ts` icine yaziyor.

          HAZIR HARITA BILESENI KULLANILMADI, uc sebeple: web'de
          `react-native-maps` calismiyor ve bu ekran tarayicida da
          aciliyor; Android'de Google anahtari olmadigi icin zemin gri
          kalirdi; ve hazir dosemelerde SOKAK ADLARI gomulu geliyor -
          kullanici tam olarak onlari istemedi ("Sokak cadde gibi seyler
          yazmasin"). Vektor cizim uculunu de cozuyor, ustelik acilista
          hicbir ag istegi yapmiyor.

          UC KALINLIK: hepsi ayni kalinlikta olsaydi yol agi tek tip bir
          ag gibi okunurdu; gercek haritada arter ile sokak ayirt
          edilir. */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 330" preserveAspectRatio="xMidYMid slice">
        <Rect width={300} height={330} fill={renk.karsilamaZemini} />
        <G stroke={renk.cizgi} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <G strokeWidth={1.6} opacity={0.75}>
            {INCE_YOLLAR.map((d) => (
              <Path key={d} d={d} />
            ))}
          </G>
          <G strokeWidth={3.4}>
            {ORTA_YOLLAR.map((d) => (
              <Path key={d} d={d} />
            ))}
          </G>
          <G strokeWidth={6.5}>
            {ANA_YOLLAR.map((d) => (
              <Path key={d} d={d} />
            ))}
          </G>
        </G>
      </Svg>

      {NOKTALAR.map((nokta) => (
        <NoktaGorunumu key={nokta.x + nokta.y} nokta={nokta} hareket={hareket} />
      ))}
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, overflow: 'hidden' },

    // Nokta kendi merkezine gore konumlaniyor: halkalar da igne de
    // ayni eksende.
    nokta: {
      position: 'absolute',
      alignItems: 'center',
      transform: [{ translateX: -70 }, { translateY: -30 }],
      width: 140,
    },
    igne: {
      backgroundColor: renk.turuncu,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Igne ucu: dugmenin altindaki kucuk ucgen.
    kuyruk: {
      width: 0,
      height: 0,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -2,
    },
    kume: { flexDirection: 'row', marginTop: bosluk.s },
  })
