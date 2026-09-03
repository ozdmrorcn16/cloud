import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { G, Path, Rect } from 'react-native-svg'
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
 * NABIZ (ayni istek): halkalar yavasca buyuyup soluyor. Uc nokta AYNI
 * ANDA degil, sirayla atiyor - ayni anda atsalardi ekran tek bir sey
 * gibi yanip sonerdi; gecikmeli olunca "burada da, surada da hareket
 * var" okunuyor.
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
  /** Nabzin baslama gecikmesi (ms). */
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
    gecikme: 900,
    kisiler: [{ harf: 'S', arka: '#C084FC' }],
    fazla: '+1',
  },
  {
    x: '80%',
    y: '18%',
    cap: 96,
    igne: 28,
    avatar: 22,
    gecikme: 1800,
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

/** Nabiz atan halkalar; hareket kapaliysa sabit duruyorlar. */
function Halkalar({ cap, gecikme, hareket }: { cap: number; gecikme: number; hareket: boolean }) {
  const renk = useRenk()
  const nabiz = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareket) return
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.delay(gecikme),
        Animated.timing(nabiz, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(nabiz, {
          toValue: 0,
          duration: 1400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    dongu.start()
    return () => dongu.stop()
  }, [hareket, gecikme, nabiz])

  const olcek = nabiz.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] })
  const solma = nabiz.interpolate({ inputRange: [0, 1], outputRange: [1, 0.65] })

  const katmanlar = [
    { oran: 1, opaklik: 0.13 },
    { oran: 0.65, opaklik: 0.16 },
    { oran: 0.36, opaklik: 0.2 },
  ]

  return (
    <>
      {katmanlar.map(({ oran, opaklik }) => {
        const boyut = cap * oran
        return (
          <Animated.View
            key={oran}
            pointerEvents="none"
            style={{
              position: 'absolute',
              // Halkalar ignenin merkezine oturuyor.
              top: -boyut / 2 + 22,
              width: boyut,
              height: boyut,
              borderRadius: boyut / 2,
              backgroundColor: renk.turuncu,
              opacity: Animated.multiply(solma, opaklik),
              transform: [{ scale: olcek }],
            }}
          />
        )
      })}
    </>
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
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 330" preserveAspectRatio="xMidYMid slice">
        <Rect width={300} height={330} fill={renk.karsilamaZemini} />
        <G stroke={renk.cizgi} strokeWidth={7} fill="none">
          <Path d="M-10 78 L110 104 L200 60 L310 122" />
          <Path d="M45 -10 L70 150 L48 340" />
          <Path d="M215 -10 L200 168 L255 340" />
          <Path d="M-10 226 L140 252 L310 214" />
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
