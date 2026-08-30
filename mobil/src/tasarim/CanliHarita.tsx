import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native'
import Svg, { Circle, Path, G, Line } from 'react-native-svg'
import { mesafeMetre } from '../../lib/konum'
import { renk, yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * CANLI HARITA - "su an neredesin ve cevrende ne var".
 *
 * NEDEN GERCEK BIR HARITA DEGIL (2026-08-26):
 * Projede harita paketi yok ve `react-native-maps`in WEB DESTEGI YOK;
 * uygulama su an telefonda tarayicidan deneniyor, yani gercek harita
 * ekrani kullanicida hic acilmazdi. Tile servisi (OSM/Mapbox) eklemek
 * ise ayri bir bagimlilik, kota ve ucret demek.
 *
 * Bunun yerine harita KENDIMIZ CIZILIYOR: merkezde kullanici,
 * cevresinde yakindaki mekanlar GERCEK YON ve GERCEK MESAFELERIYLE.
 * Veri gercek, gosterim sematik - bir radar gibi. Bagimlilik yok, her
 * platformda ayni gorunuyor ve kimlige uyuyor. Ileride native
 * derlemeye gecilirse ayni bilesenin arkasina gercek harita takilabilir.
 *
 * YUZ YOK. Gonderilen ornekte harita uzerinde insan fotograflari
 * vardi; bizim modelde `yakin_mekanlar_yogunluk` bilerek YALNIZCA SAYI
 * donduruyor - kimin nerede oldugu, o mekana check-in yapmadan ya da
 * bag kurmadan gorunmez. Haritaya yuz koymak, taninmayan insanlarin
 * konumunu yabancilara acmak olurdu.
 */

/** Ekrandaki en kucuk gosterim yaricapi - her sey merkeze yigilmasin. */
const EN_AZ_GOSTERIM_METRE = 300

/**
 * Cerceve yaricapi bundan BUYUK olmasin (kullanicinin istegi
 * 2026-08-30: "harita cok uzaktan, biraz daha adrese yakin baslasin").
 *
 * Oncesinde cerceve EN UZAK igneye gore aciliyordu; liste 10 km oteye
 * kadar mekan tasiyabildigi icin harita bazen sehir olceginde
 * basliyordu ve merkezdeki mekan bir nokta kaliyordu. Check-in kurali
 * zaten 1 km, yani ekranda islem yapilabilir her yer bu cercevenin
 * icinde. Daha uzaktakiler kadraj disinda kaliyor; kullanici isterse
 * uzaklastirabiliyor.
 */
const EN_FAZLA_GOSTERIM_METRE = 800

/** Haritada en fazla kac mekan ignesi cizilir. */
const EN_FAZLA_IGNE = 12

/** Iki igne birbirine bundan yakinsa ikincisi cizilmez (px). */
const EN_AZ_ARALIK = 34

const NABIZ_SURESI = 2600

export type HaritaMekani = {
  id: string
  ad: string
  konum: { lat: number; lng: number } | null
  kisiSayisi: number
}

type Yerlesim = {
  mekan: HaritaMekani
  x: number
  y: number
  metre: number
}

/**
 * Enlem/boylami merkeze gore metre cinsinden duzlem koordinata cevirir.
 * Bir kac kilometrelik alanda duzlem yaklasimi yeterli; harita
 * projeksiyonu gerektirecek bir olcekte calismiyoruz.
 */
function metreyeCevir(
  merkez: { lat: number; lng: number },
  nokta: { lat: number; lng: number }
): { dogu: number; kuzey: number } {
  const enlemRadyan = (merkez.lat * Math.PI) / 180
  return {
    dogu: (nokta.lng - merkez.lng) * Math.cos(enlemRadyan) * 111320,
    kuzey: (nokta.lat - merkez.lat) * 110540,
  }
}

/** Disari dogru buyuyup sonen tek bir nabiz halkasi. */
function NabizHalkasi({ gecikme, hareketVar }: { gecikme: number; hareketVar: boolean }) {
  const ilerleme = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareketVar) return
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
  }, [hareketVar, gecikme, ilerleme])

  if (!hareketVar) {
    // "Hareketi azalt" aciksa halka sabit duruyor, hic atmiyor.
    return <View style={[stiller.halka, { opacity: 0.16, transform: [{ scale: 0.7 }] }]} />
  }

  return (
    <Animated.View
      style={[
        stiller.halka,
        {
          opacity: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
          transform: [
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) },
          ],
        },
      ]}
    />
  )
}

export function CanliHarita({
  merkez,
  mekanlar,
  yukseklik = 260,
  onMekanSec,
}: {
  merkez: { lat: number; lng: number } | null
  mekanlar: HaritaMekani[]
  yukseklik?: number
  onMekanSec?: (mekanId: string) => void
}) {
  const [olcu, setOlcu] = useState({ en: 0, boy: yukseklik })
  const [hareketVar, setHareketVar] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => setHareketVar(!azalt))
  }, [])

  /**
   * Gosterim yaricapi VERIYE GORE seciliyor, kullanicinin yaricap
   * tercihine gore degil: 5 km secilmisken en yakin mekanlar 200-400 m
   * otedeyse hepsi merkeze yigiliyor ve harita bir sey anlatmiyor.
   * En uzak cizilecek igneye gore olceklendiriliyor.
   */
  const { yerlesimler, gosterimMetre } = useMemo(() => {
    if (!merkez || olcu.en === 0) return { yerlesimler: [] as Yerlesim[], gosterimMetre: 0 }

    const yaricapPx = Math.min(olcu.en, olcu.boy) / 2 - 26

    const mesafeli = mekanlar
      .filter((m) => m.konum)
      .map((m) => ({
        mekan: m,
        metre: mesafeMetre(merkez.lat, merkez.lng, m.konum!.lat, m.konum!.lng),
      }))
      .filter((m) => Number.isFinite(m.metre))
      // Once kalabaliklar: harita "nerede insan var" sorusunu
      // cevapliyor, "en yakin ne var" sorusunu degil.
      .sort((a, b) => b.mekan.kisiSayisi - a.mekan.kisiSayisi || a.metre - b.metre)
      .slice(0, EN_FAZLA_IGNE)

    if (mesafeli.length === 0) return { yerlesimler: [] as Yerlesim[], gosterimMetre: 0 }

    const enUzak = Math.max(...mesafeli.map((m) => m.metre))
    const gosterim = Math.min(
      EN_FAZLA_GOSTERIM_METRE,
      Math.max(EN_AZ_GOSTERIM_METRE, enUzak * 1.12)
    )

    const konan: Yerlesim[] = []
    for (const { mekan, metre } of mesafeli) {
      const { dogu, kuzey } = metreyeCevir(merkez, mekan.konum!)
      const olcek = yaricapPx / gosterim
      const x = olcu.en / 2 + dogu * olcek
      // Ekranin y ekseni asagi buyuyor, kuzey yukari.
      const y = olcu.boy / 2 - kuzey * olcek

      // Ust uste binen igne cizilmiyor: iki nokta ayni yerde durunca
      // ikisi de okunmuyor.
      const cakisiyor = konan.some(
        (k) => Math.hypot(k.x - x, k.y - y) < EN_AZ_ARALIK
      )
      if (cakisiyor) continue
      konan.push({ mekan, x, y, metre })
    }
    return { yerlesimler: konan, gosterimMetre: gosterim }
  }, [merkez, mekanlar, olcu])

  const yaricapPx = Math.min(olcu.en, olcu.boy) / 2 - 26

  return (
    <View
      style={[stiller.kok, { height: yukseklik }]}
      onLayout={(o) =>
        setOlcu({ en: o.nativeEvent.layout.width, boy: o.nativeEvent.layout.height })
      }
      accessibilityLabel="Çevrendeki mekanlar"
    >
      {/* Zemin: hafif bir izgara. Gercek sokak degil - oldugunu iddia
          etmiyor, yalnizca mesafe hissi veriyor. */}
      {olcu.en > 0 && (
        <Svg width={olcu.en} height={olcu.boy} style={StyleSheet.absoluteFill}>
          <G stroke={renk.cizgi} strokeWidth={1}>
            {[0.25, 0.5, 0.75].map((o) => (
              <Line key={`y${o}`} x1={0} y1={olcu.boy * o} x2={olcu.en} y2={olcu.boy * o} />
            ))}
            {[0.25, 0.5, 0.75].map((o) => (
              <Line key={`x${o}`} x1={olcu.en * o} y1={0} x2={olcu.en * o} y2={olcu.boy} />
            ))}
          </G>
          {/* Mesafe halkalari. */}
          <G fill="none" stroke={renk.turuncu} strokeOpacity={0.18}>
            {[0.4, 0.7, 1].map((o) => (
              <Circle
                key={o}
                cx={olcu.en / 2}
                cy={olcu.boy / 2}
                r={Math.max(0, yaricapPx * o)}
              />
            ))}
          </G>
        </Svg>
      )}

      {/* Nabiz: tek hareketli oge. */}
      <View style={stiller.nabizAlani} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <NabizHalkasi
            key={i}
            gecikme={(NABIZ_SURESI / 3) * i}
            hareketVar={hareketVar}
          />
        ))}
      </View>

      {/* Mekan igneleri. */}
      {yerlesimler.map(({ mekan, x, y }) => {
        const canli = mekan.kisiSayisi > 0
        return (
          <Pressable
            key={mekan.id}
            style={[stiller.igne, { left: x - 16, top: y - 16 }]}
            onPress={() => onMekanSec?.(mekan.id)}
            accessibilityRole="button"
            accessibilityLabel={
              canli ? `${mekan.ad}, ${mekan.kisiSayisi} kişi burada` : mekan.ad
            }
            hitSlop={6}
          >
            {canli ? (
              <View style={stiller.canliIgne}>
                <Text style={stiller.canliSayi}>{mekan.kisiSayisi}</Text>
              </View>
            ) : (
              <View style={stiller.sakinIgne} />
            )}
          </Pressable>
        )
      })}

      {/* Merkez: kullanicinin kendisi. */}
      <View style={stiller.merkez} pointerEvents="none">
        <Svg width={44} height={44} viewBox="0 0 24 24">
          <Path
            d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
            fill={renk.turuncu}
            stroke="#FFFFFF"
            strokeWidth={1.4}
          />
          <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
        </Svg>
      </View>

      {/* Olcek: haritanin ne kadarlik bir alani gosterdigi yazili
          olmali, yoksa mesafe hissi uydurma olur. */}
      {gosterimMetre > 0 && (
        <View style={stiller.olcek}>
          <Text style={stiller.olcekYazi}>
            {gosterimMetre >= 1000
              ? `${(gosterimMetre / 1000).toFixed(1).replace('.', ',')} km`
              : `${Math.round(gosterimMetre / 10) * 10} m`}
          </Text>
        </View>
      )}
    </View>
  )
}

const HALKA = 220

const stiller = StyleSheet.create({
  kok: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },

  nabizAlani: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: HALKA,
    height: HALKA,
    marginLeft: -HALKA / 2,
    marginTop: -HALKA / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halka: {
    position: 'absolute',
    width: HALKA,
    height: HALKA,
    borderRadius: HALKA / 2,
    backgroundColor: renk.turuncu,
  },

  merkez: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    // Ignenin ucu merkeze denk gelsin: sekil asagi dogru sivriliyor.
    marginTop: -38,
  },

  igne: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  canliIgne: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 5,
    borderRadius: 13,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  canliSayi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  sakinIgne: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: renk.metinSoluk,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  olcek: {
    position: 'absolute',
    right: bosluk.m,
    bottom: bosluk.m,
    paddingHorizontal: bosluk.s,
    paddingVertical: 3,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.zemin,
  },
  olcekYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
})
