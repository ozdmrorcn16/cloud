import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Svg, { Circle, G, Path, Rect } from 'react-native-svg'
import {
  ANA_YOLLAR,
  ORTA_YOLLAR,
  INCE_YOLLAR,
  YESIL_ALANLAR,
  SU_ALANLAR,
  SU_CIZGILERI,
} from './karsilama-harita'
import { useDil } from '../../lib/dil'
import { bosluk, yazi, olcek, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * KARSILAMA SAHNESI - "disarida kim var".
 *
 * Kullanicinin 2026-09-08'de gonderdigi REFERANS GORSELE gore yeniden
 * yazildi (`tasarim/karsilama-referans.png`): gercek bir harita
 * uzerinde, insanlarin bulundugu mekanlar igneyle isaretli; her ignenin
 * yaninda kac kisi oldugu, altinda mekanin turu yaziyor. Ortada
 * kullanicinin kendi konumu.
 *
 * Onceki hal soyut "sicak nokta" lekeleriydi (2026-09-03). Referans
 * ayni uc vaadi daha somut anlatiyor:
 *
 *   igne + tur etiketi -> check-in yapilmis bir MEKAN
 *   fotograf + sayi    -> orada olan INSANLAR (tanisma)
 *   ignelerin dagilimi -> nerede hareket var (populer yerler)
 *
 * BU BIR CIZIM, VERI YUZEYI DEGIL. Sayilar ve fotograflar referans
 * gorselden geliyor; hicbiri sunucudan okunmuyor ve hicbiri kullanicinin
 * cevresi hakkinda bir iddia tasimiyor.
 *
 * HARITA GERCEK: Bursa/Nilufer'in yol agi ve yesil alanlari
 * OpenStreetMap'ten bir kez cikarilip vektor olarak gomulu
 * (`karsilama-harita.ts`). Ag istegi yok, etiket yok. ODbL atfi
 * karsilama ekraninin altinda duruyor - hukuken sart.
 *
 * HAREKETI AZALT ayari aciksa merkezdeki nabiz HIC BASLAMIYOR;
 * kompozisyon aynen kaliyor.
 */

/** Harita verisinin uretildigi SVG kutusu; uretici betikle AYNI olmali. */
const KUTU_EN = 300
const KUTU_BOY = 220

/**
 * Harita renkleri.
 *
 * Referanstan olculdu: zemin #F7F1EB, yesil #D5EBBD, yollar beyaz.
 * Jetonlara baglanmadilar cunku bunlar TEMA rengi degil HARITA rengi -
 * bir haritanin cimeni koyu modda da yesildir.
 */
const HARITA = {
  zemin: '#F6F1EA',
  yesil: '#D9EBC2',
  su: '#C5DDF2',
  yol: '#FFFFFF',
  yolIkincil: '#FBF8F4',
  /**
   * Haritanin UZERINDEKI haplarin zemini ve yazisi.
   *
   * Bunlar da SABIT, jeton degil - ve sebebi olculdu: hap zemini beyaz
   * ama yazi `renk.metin` olsaydi koyu modda yazi ACILIR ve beyaz
   * hapta okunmaz hale gelirdi (koyu modda ekran goruntusuyle
   * gorulen gercek kusur). Harita katmani temadan bagimsiz: iki modda
   * da ayni acik haritayi gosteriyoruz, dolayisiyla uzerindeki her sey
   * de acik zemine gore secilir.
   */
  hap: '#FFFFFF',
  hapYazi: '#17130F',
}

type Igne = {
  ad: 'kafe' | 'restoran' | 'bar' | 'etkinlik'
  /** Sahne kutusunun yuzdesi olarak ignenin dairesinin MERKEZI. */
  x: number
  y: number
  /** Igne dairesinin capi, sahne genisliginin yuzdesi. */
  cap: number
  kisi: number
  turAnahtari: 'turKafe' | 'turRestoran' | 'turBar' | 'turEtkinlik'
}

/**
 * Dort igne - konum ve sayilar referans gorselden OLCULDU (853 px
 * genislikteki gorselde daire merkezleri).
 *
 * CAPLAR ESITLENDI (2026-09-08, kullanicinin istegi "3 profil
 * gorunenleri teke duesuer"): referansta kalabalik iginler daha buyuk
 * bir daireydi cunku icinde UC yuzluk kolaj vardi. Tek yuze duesuence
 * o buyukluk hem gereksiz kaldi hem de zararli oldu - kolajdan
 * kirpilan yuz 40 px, tek kisilik ignelerinki 68 px, yani buyuk daire
 * kucuk kaynagi daha cok gerdiriyordu.
 *
 * ETKINLIK IGNESI referanstan biraz YUKARI alindi (y 63 -> 50):
 * 390 px'lik bir telefonda alt serit ("Yakininda N kisi disarida")
 * oransal olarak referanstakinden cok daha genis kaliyor - ayni metin,
 * dar tuval - ve ignenin tur etiketini ortuyordu. Olculdu, gozle
 * tahmin edilmedi.
 */
const IGNELER: Igne[] = [
  { ad: 'kafe', x: 22.5, y: 15, cap: 10.5, kisi: 8, turAnahtari: 'turKafe' },
  { ad: 'restoran', x: 77, y: 20, cap: 10.5, kisi: 3, turAnahtari: 'turRestoran' },
  { ad: 'bar', x: 14, y: 52, cap: 10.5, kisi: 2, turAnahtari: 'turBar' },
  { ad: 'etkinlik', x: 71, y: 52, cap: 10.5, kisi: 5, turAnahtari: 'turEtkinlik' },
]

/*
 * BOS IGNELER KALDIRILDI (kullanicinin istegi 2026-09-08: "bos check-in
 * ignelerini de kaldir"). Referansta cevreye serpistirilmis, icinde
 * kimse olmayan yedi kucuk igne vardi; hicbir sey anlatmiyorlardi -
 * sahnenin soyledigi sey "su mekanda su kadar kisi var", bos bir igne
 * ise ne mekani ne kisiyi gosteriyordu.
 */

/** Sahnedeki toplam kisi - alt seritte yaziyor. */
const TOPLAM_KISI = IGNELER.reduce((t, i) => t + i.kisi, 0) + 6

const AVATARLAR = {
  kafe: require('../../assets/karsilama/kafe.png'),
  restoran: require('../../assets/karsilama/restoran.png'),
  bar: require('../../assets/karsilama/bar.png'),
  etkinlik: require('../../assets/karsilama/etkinlik.png'),
} as const

/**
 * Harita zemini. Ciziliyor: yesil alanlar (dolgu), su, sonra yollar -
 * kalindan inceye. Sira onemli: ince sokaklar en ustte kalmali, yoksa
 * ana arterler onlari yutuyor.
 */
function HaritaZemini() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox={`0 0 ${KUTU_EN} ${KUTU_BOY}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect x={0} y={0} width={KUTU_EN} height={KUTU_BOY} fill={HARITA.zemin} />
      <G>
        {YESIL_ALANLAR.map((d, i) => (
          <Path key={`y${i}`} d={d} fill={HARITA.yesil} />
        ))}
        {SU_ALANLAR.map((d, i) => (
          <Path key={`s${i}`} d={d} fill={HARITA.su} />
        ))}
        {SU_CIZGILERI.map((d, i) => (
          <Path key={`d${i}`} d={d} stroke={HARITA.su} strokeWidth={3.2} fill="none" />
        ))}
        {INCE_YOLLAR.map((d, i) => (
          <Path
            key={`i${i}`}
            d={d}
            stroke={HARITA.yolIkincil}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {ORTA_YOLLAR.map((d, i) => (
          <Path
            key={`o${i}`}
            d={d}
            stroke={HARITA.yol}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {ANA_YOLLAR.map((d, i) => (
          <Path
            key={`a${i}`}
            d={d}
            stroke={HARITA.yol}
            strokeWidth={6.5}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </G>
    </Svg>
  )
}

/** Igne sekli: daire + asagi sivri uc. Fotograf dairenin icine oturuyor. */
function IgneGovdesi({ cap, children }: { cap: number; children?: React.ReactNode }) {
  const renk = useRenk()
  // Ucun boyu capin %38'i - referanstaki oran (igne yuksekligi 130,
  // daire capi 96 -> uc 34).
  const boy = cap * 1.38
  return (
    <View style={{ width: cap, height: boy }}>
      <Svg width={cap} height={boy} viewBox="0 0 100 138" style={StyleSheet.absoluteFill}>
        {/* Once uc, sonra daire: daire ustte cizilince birlesim yeri
            gorunmuyor. */}
        <Path d="M26 72 L50 136 L74 72 Z" fill={renk.turuncu} />
        <Circle cx={50} cy={50} r={48} fill={renk.turuncu} />
      </Svg>
      {children}
    </View>
  )
}

function KisilerIkonu({ boyut, renk: r }: { boyut: number; renk: string }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={9} cy={8.4} r={3.5} fill={r} />
      <Path d="M2.6 19.4c0-3.5 2.9-5.8 6.4-5.8s6.4 2.3 6.4 5.8z" fill={r} />
      <Circle cx={17.2} cy={9.4} r={2.6} fill={r} />
      <Path d="M14.6 19.4c0-2.6 1.4-4.4 3.4-4.4 2 0 3.4 1.8 3.4 4.4z" fill={r} />
    </Svg>
  )
}

/** Tur hapindaki kucuk ikonlar - referanstakilerle ayni dort sekil. */
function TurIkonu({ ad, boyut, renk: r }: { ad: Igne['ad']; boyut: number; renk: string }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      {ad === 'kafe' && (
        <>
          <Path
            d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"
            stroke={r}
            strokeWidth={1.8}
            fill="none"
          />
          <Path d="M16 10h2.2a2.3 2.3 0 0 1 0 4.6H16" stroke={r} strokeWidth={1.8} fill="none" />
          <Path d="M7 5.2V3.4M10.5 5.2V3.4M14 5.2V3.4" stroke={r} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {ad === 'restoran' && (
        <>
          <Path d="M6 3v8M9 3v8M7.5 11v10" stroke={r} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M16.5 3c-1.6 0-2.5 2-2.5 4.5S15 12 16.5 12 19 9.5 19 7.5 18.1 3 16.5 3z" stroke={r} strokeWidth={1.8} fill="none" />
          <Path d="M16.5 12v9" stroke={r} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {ad === 'bar' && (
        <>
          <Path d="M4 4h16l-8 8z" stroke={r} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
          <Path d="M12 12v8M8 20h8" stroke={r} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {ad === 'etkinlik' && (
        <>
          <Path d="M9 18V5.5l10-2V16" stroke={r} strokeWidth={1.8} strokeLinejoin="round" fill="none" />
          <Circle cx={6.6} cy={18} r={2.6} fill={r} />
          <Circle cx={16.6} cy={16} r={2.6} fill={r} />
        </>
      )}
    </Svg>
  )
}

/**
 * Merkezdeki kullanici noktasi ve yayilan sinyal.
 *
 * Nabiz KORUNDU (2026-09-04 kararlari): tur 4200 ms, halkalar ignenin
 * dibinden dogup disari yayilarak soluyor. Referans gorsel duragan bir
 * kare oldugu icin hareketi gostermiyor; ekranin tek hareketli ogesi
 * burasi ve "su an oluyor" fikrini o tasiyor.
 */
const TUR_SURESI = 4200

function MerkezNokta({ cap, hareket }: { cap: number; hareket: boolean }) {
  const renk = useRenk()
  const ilerleme = useRef([0, 1, 2].map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (!hareket) return
    const zamanlayicilar: ReturnType<typeof setTimeout>[] = []
    const dongular = ilerleme.map((deger, sira) => {
      const dongu = Animated.loop(
        Animated.timing(deger, {
          toValue: 1,
          duration: TUR_SURESI,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      )
      zamanlayicilar.push(setTimeout(() => dongu.start(), (sira * TUR_SURESI) / 3))
      return dongu
    })
    return () => {
      zamanlayicilar.forEach(clearTimeout)
      dongular.forEach((d) => d.stop())
      ilerleme.forEach((d) => d.setValue(0))
    }
  }, [hareket, ilerleme])

  const nokta = cap * 0.3
  return (
    <View style={{ width: cap, height: cap, alignItems: 'center', justifyContent: 'center' }}>
      {hareket
        ? ilerleme.map((deger, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: cap,
                height: cap,
                borderRadius: cap / 2,
                backgroundColor: renk.turuncu,
                opacity: deger.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.22, 0] }),
                transform: [
                  { scale: deger.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) },
                ],
              }}
            />
          ))
        : [0.55, 1].map((oran, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: cap * oran,
                height: cap * oran,
                borderRadius: cap / 2,
                backgroundColor: renk.turuncu,
                opacity: 0.14,
              }}
            />
          ))}
      <View
        style={{
          width: nokta,
          height: nokta,
          borderRadius: nokta / 2,
          backgroundColor: renk.turuncu,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: nokta * 0.42,
            height: nokta * 0.42,
            borderRadius: nokta,
            backgroundColor: '#FFFFFF',
          }}
        />
      </View>
    </View>
  )
}

export function KarsilamaSahnesi() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [hareket, setHareket] = useState(true)
  // Sahnenin genisligi: igne olculeri ona oranli. Baslangic degeri
  // EKRAN GENISLIGI, sifir degil - sahne zaten kenardan kenara. Sifirla
  // baslasaydi ilk kare bos bir harita cizer, olcum gelince igneler
  // birden belirirdi; ayrica testte `onLayout` hic tetiklenmedigi icin
  // igneler HIC gorunmuyordu.
  const [en, setEn] = useState(() => Dimensions.get('window').width)

  useEffect(() => {
    let gecerli = true
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => {
      if (gecerli) setHareket(!azalt)
    })
    const abone = AccessibilityInfo.addEventListener('reduceMotionChanged', (azalt) =>
      setHareket(!azalt)
    )
    return () => {
      gecerli = false
      abone.remove()
    }
  }, [])

  return (
    <View
      style={stiller.sahne}
      onLayout={(o) => setEn(o.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel={t('karsilama.aciklama')}
    >
      <HaritaZemini />

      {en > 0 && (
        <>
          {IGNELER.map((igne) => {
            const cap = (en * igne.cap) / 100
            const foto = cap * 0.85
            // HAPLAR IGNENIN COCUGU DEGIL, SAHNENIN. Once ignenin
            // icinde duruyorlardi ve metin sarmasi ignenin genisligiyle
            // (~40 px) sinirli kaliyordu: "Restoran" ekranda "Res..."
            // diye kirpiliyordu (kullanicinin ekran goruntusunde
            // gorulduegue gercek kusur). Sahnenin dogrudan cocugu olunca
            // hap ihtiyaci kadar genisliyor.
            const konum = { left: `${igne.x}%` as const, top: `${igne.y}%` as const }
            return (
              <View key={igne.ad} style={StyleSheet.absoluteFill} pointerEvents="none">
                <View
                  style={[stiller.konum, konum, { marginLeft: -cap / 2, marginTop: -cap / 2 }]}
                >
                  <IgneGovdesi cap={cap}>
                    <Image
                      source={AVATARLAR[igne.ad]}
                      style={{
                        position: 'absolute',
                        left: (cap - foto) / 2,
                        top: (cap - foto) / 2,
                        width: foto,
                        height: foto,
                        borderRadius: foto / 2,
                      }}
                    />
                  </IgneGovdesi>
                </View>

                {/* KISI SAYISI - ignenin sagindan cikan hap, dairenin
                    dikey ortasina hizali. */}
                <View
                  style={[
                    stiller.sayiHapi,
                    konum,
                    { marginLeft: cap * 0.36, marginTop: -cap * 0.24 },
                  ]}
                >
                  <KisilerIkonu boyut={12} renk={renk.turuncu} />
                  <Text style={stiller.sayiYazi} numberOfLines={1}>
                    {t('karsilama.kisiSayisi', { sayi: igne.kisi })}
                  </Text>
                </View>

                {/* TUR - ignenin sivri ucunun altinda. */}
                <View
                  style={[
                    stiller.turHapi,
                    konum,
                    { marginLeft: -cap * 0.4, marginTop: cap * 0.84 },
                  ]}
                >
                  <TurIkonu ad={igne.ad} boyut={12} renk={HARITA.hapYazi} />
                  <Text style={stiller.turYazi} numberOfLines={1}>
                    {t(`karsilama.${igne.turAnahtari}`)}
                  </Text>
                </View>
              </View>
            )
          })}

          {/* KULLANICININ KENDI KONUMU - ortada, tek hareketli oge. */}
          <View
            style={[
              stiller.konum,
              {
                left: '50%',
                top: '43%',
                marginLeft: -(en * 0.26) / 2,
                marginTop: -(en * 0.26) / 2,
              },
            ]}
          >
            <MerkezNokta cap={en * 0.26} hareket={hareket} />
          </View>
        </>
      )}

      {/* ALT SERIT: sahnenin ozeti. Referanstaki gibi haritanin uzerinde
          duruyor ve tikanabilir GORUNMUYOR - bir dugme degil, cizimin
          parcasi. */}
      <View style={stiller.serit}>
        <KisilerIkonu boyut={16} renk={renk.turuncu} />
        <Text style={stiller.seritYazi}>
          {t('karsilama.disarida', { sayi: TOPLAM_KISI })}
        </Text>
        <Text style={stiller.seritOk}>›</Text>
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    sahne: {
      flex: 1,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    konum: { position: 'absolute' },

    sayiHapi: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: HARITA.hap,
      borderRadius: yuvarlak.hap,
      paddingHorizontal: 8,
      paddingVertical: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    sayiYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.minik,
      color: HARITA.hapYazi,
    },

    turHapi: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: HARITA.hap,
      borderRadius: yuvarlak.hap,
      paddingHorizontal: 8,
      paddingVertical: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    turYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.minik,
      color: HARITA.hapYazi,
    },

    serit: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.s,
      backgroundColor: HARITA.hap,
      borderRadius: yuvarlak.hap,
      paddingHorizontal: bosluk.l,
      paddingVertical: 10,
      marginBottom: bosluk.l,
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    seritYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: HARITA.hapYazi,
    },
    seritOk: {
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: '#A39B93',
    },
  })
