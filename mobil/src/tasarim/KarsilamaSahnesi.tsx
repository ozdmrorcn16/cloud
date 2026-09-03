import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import { bosluk, yazi, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * KARSILAMA SAHNESI - "sicak nokta".
 *
 * Kullanicinin secimi (2026-09-03): dort kompozisyon gorsel olarak
 * sunuldu, "1" secildi. Amac uc vaadi ANLATMAK degil HISSETTIRMEK;
 * onceki ekran uc seyi yaziyordu, bu gorsel onlari gosteriyor:
 *
 *   igne          -> check-in yapilmis bir yer
 *   avatar kumesi -> orada olan insanlar (tanisma)
 *   lekeler       -> hangisi daha canli (populer yerler)
 *
 * UYDURMA VERI YOK. Mekan adi da, "yakininda su kadar kisi var" gibi
 * bir iddia da gecmiyor - bu bir cizim, bir veri yuzeyi degil.
 * Karsilama ekranindaki ornek check-in kartlari 2026-08-27'de tam bu
 * yuzden kaldirilmisti; o karar duruyor. Kumedeki "+4" bir mekan
 * iddiasi degil, kompozisyonun parcasi.
 *
 * YUZ YOK: avatarlar harfli daireler. Uygulamanin kendi kurali da bu -
 * haritada ve yogunluk sayacinda kimlik degil SAYI gosteriliyor.
 */

/** Kumedeki daire renkleri; paletten bagimsiz, cizimin kendi renkleri. */
const KUME = [
  { harf: 'D', renk: '#7B8CFF' },
  { harf: 'E', renk: '#E0562A' },
  { harf: 'M', renk: '#0E9488' },
] as const

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
        // Ust uste binme CAPA ORANTILI: sabit -10, 24 px'lik kucuk
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

export function KarsilamaSahnesi() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)

  return (
    <View style={stiller.kok}>
      {/* Zemin: yollar ve yogunluk lekeleri. Lekelerin koyulugu
          "burasi daha canli" demenin en kisa yolu; ayni teknik
          SicaklikZemin'de de kullaniliyor. */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 330" preserveAspectRatio="xMidYMid slice">
        <Rect width={300} height={330} fill={renk.karsilamaZemini} />
        <G stroke={renk.cizgi} strokeWidth={7} fill="none">
          <Path d="M-10 78 L110 104 L200 60 L310 122" />
          <Path d="M45 -10 L70 150 L48 340" />
          <Path d="M215 -10 L200 168 L255 340" />
          <Path d="M-10 226 L140 252 L310 214" />
        </G>
        <G>
          <Circle cx={150} cy={132} r={92} fill={renk.turuncu} fillOpacity={0.13} />
          <Circle cx={150} cy={132} r={60} fill={renk.turuncu} fillOpacity={0.16} />
          <Circle cx={150} cy={132} r={33} fill={renk.turuncu} fillOpacity={0.2} />
          <Circle cx={62} cy={252} r={50} fill={renk.turuncu} fillOpacity={0.1} />
          <Circle cx={62} cy={252} r={25} fill={renk.turuncu} fillOpacity={0.13} />
          <Circle cx={240} cy={62} r={38} fill={renk.turuncu} fillOpacity={0.08} />
        </G>
      </Svg>

      {/* En sicak lekenin uzerinde: igne + o yerde olan insanlar. */}
      <View style={stiller.merkez}>
        <View style={stiller.igne}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
              d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
              stroke="#FFFFFF"
              strokeWidth={2.2}
              fill="none"
            />
            <Circle cx={12} cy={10} r={2.6} stroke="#FFFFFF" strokeWidth={2.2} fill="none" />
          </Svg>
        </View>
        <View style={stiller.kuyruk} />

        <View style={stiller.kume}>
          {KUME.map(({ harf, renk: arka }) => (
            <Avatar key={harf} harf={harf} arka={arka} cap={30} />
          ))}
          <Avatar harf="+4" arka={renk.turuncuZemin} cap={30} yaziRengi={renk.turuncuKoyu} />
        </View>
      </View>

      {/* Ikinci, daha sonuk kume: baska bir yerde de birileri var. */}
      <View style={stiller.ikinciKume}>
        <Avatar harf="S" arka="#C084FC" cap={24} />
        <Avatar harf="+1" arka={renk.turuncuZemin} cap={24} yaziRengi={renk.turuncuKoyu} />
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, overflow: 'hidden' },

    merkez: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '22%',
      alignItems: 'center',
    },
    igne: {
      width: 44,
      height: 44,
      borderRadius: 22,
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
      borderTopColor: renk.turuncu,
      marginTop: -2,
    },
    // paddingLeft ilk dairenin negatif payini geri aliyor.
    kume: { flexDirection: 'row', marginTop: bosluk.m, paddingLeft: 8 },

    ikinciKume: {
      position: 'absolute',
      // Sahne kenardan kenara oldugu icin bu kume ekran kenarina cok
      // yaklasip kirpiliyordu; sayfa payi kadar iceri alindi.
      left: bosluk.xl,
      bottom: '18%',
      flexDirection: 'row',
      paddingLeft: 6,
      opacity: 0.9,
    },
  })
