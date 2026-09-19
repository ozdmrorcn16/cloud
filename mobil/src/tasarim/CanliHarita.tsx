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
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import type { MekanDurumu } from '../../lib/mekan'
import { kumele } from '../../lib/harita-kumeleme'

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
import { cevir } from '../../lib/dil'
const EN_AZ_GOSTERIM_METRE = 200

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
const EN_FAZLA_GOSTERIM_METRE = 200

/*
 * SAYI SINIRI KALKTI (kullanicinin istegi 2026-09-09): "yakinindaki
 * mekanlar listesinde gorunen butun yerler haritada o anlik
 * gosterilsin". Native harita da ayni gun ayni kurala gecti - ayni
 * sey iki platformda farkli gorunmemeli.
 *
 * Piksel araligi kurali 2026-09-19'da KUMELEMEYE donustu (kullanicinin
 * referansi): yakin igneler artik atlanmiyor, sayili bir kume oluyor -
 * `lib/harita-kumeleme.ts`, native ile ayni kural.
 */

const NABIZ_SURESI = 2600

/** Native surumle AYNI degerler; ikisi ayrilirsa ayni mekan iki
 *  platformda farkli renk gosterirdi. */
const DURUM_RENGI: Record<MekanDurumu, string> = {
  sakin: '#2FBF5B',
  yogun: '#E5484D',
  populer: '#F5A623',
}

export type HaritaMekani = {
  id: string
  ad: string
  konum: { lat: number; lng: number } | null
  kisiSayisi: number
  /**
   * Mekanin butun gecmisindeki check-in sayisi - "Populer" olcusu.
   * Istege bagli: haritayi baska bir yerden besleyen cagirici (ornegin
   * mekan sayfasindaki cevre listesi) bunu vermeyebilir; o zaman igne
   * populer sayilmaz ama harita yine cizilir.
   */
  toplamCheckIn?: number
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
  const stiller = useStiller(stilleriYap)
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
  merkezDurumu,
  kullaniciKonumu,
  seciliId = null,
  konumDugmesi = false,
  konumDugmesiAltPayi = 16,
  doldur = false,
  altPay = 0,
  onBosaDokun,
}: {
  merkez: { lat: number; lng: number } | null
  mekanlar: HaritaMekani[]
  yukseklik?: number
  onMekanSec?: (mekanId: string) => void
  /** Native surumle ayni sozlesme (2026-09-19): secili igne + ad, kumeler. */
  seciliId?: string | null
  /** Sag altta "konuma don" dugmesi (web'de radar zaten merkezde; gorsel es). */
  konumDugmesi?: boolean
  konumDugmesiAltPayi?: number
  /** Kapsayiciyi doldur (kose ve cerceve yok). */
  doldur?: boolean
  /** Alttaki panelin yuksekligi: radar merkezi gorunen alanin ortasina kayar. */
  altPay?: number
  /** Native ile ayni sozlesme: bos yere dokunma. */
  onBosaDokun?: () => void
  /**
   * Merkez ignesinin durumu; verilmezse turuncu kaliyor. Native
   * surumle AYNI sozlesme - ekranlar hangi platformda calistigini
   * bilmek zorunda kalmasin.
   */
  merkezDurumu?: MekanDurumu
  /**
   * Web'de RADAR ciziliyor ve radarin merkezi zaten kullanicinin
   * kendisi; ayri bir kullanici noktasi cizmenin karsiligi yok. Prop
   * yalnizca imzayi native surumle ayni tutmak icin duruyor.
   */
  kullaniciKonumu?: { lat: number; lng: number } | null
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
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
  // Gorunen alan: alttaki panel (altPay) dusulmus yukseklik; merkez onun ortasi.
  const gorunenBoy = Math.max(120, olcu.boy - altPay)
  const merkezY = gorunenBoy / 2

  const { yerlesimler, gosterimMetre } = useMemo(() => {
    if (!merkez || olcu.en === 0) return { yerlesimler: [] as Yerlesim[], gosterimMetre: 0 }

    const yaricapPx = Math.min(olcu.en, gorunenBoy) / 2 - 26

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
      const y = merkezY - kuzey * olcek
      konan.push({ mekan, x, y, metre })
    }
    return { yerlesimler: konan, gosterimMetre: gosterim }
  }, [merkez, mekanlar, olcu, gorunenBoy, merkezY])

  // KUMELER (native ile ayni kural, 2026-09-19): piksel duzleminde
  // kumele - lngDelta yerine "1 piksel = 1 derece" varsayimiyla, hucre
  // yine KUME_HUCRE_PX. Secili mekan kumelenmez.
  const kumeler = useMemo(() => {
    const noktalar = yerlesimler.map((y) => ({ id: y.mekan.id, lat: -y.y, lng: y.x }))
    return kumele(noktalar, olcu.en || 1, olcu.en || 1, seciliId)
  }, [yerlesimler, olcu.en, seciliId])
  const yerlesimHaritasi = useMemo(
    () => new Map(yerlesimler.map((y) => [y.mekan.id, y])),
    [yerlesimler]
  )

  const yaricapPx = Math.min(olcu.en, gorunenBoy) / 2 - 26

  return (
    <Pressable
      style={doldur ? stiller.kokDolu : [stiller.kok, { height: yukseklik }]}
      onPress={onBosaDokun}
      accessible={false}
      onLayout={(o) =>
        setOlcu({ en: o.nativeEvent.layout.width, boy: o.nativeEvent.layout.height })
      }
      accessibilityLabel={cevir('harita.cevre')}
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
                cy={merkezY}
                r={Math.max(0, yaricapPx * o)}
              />
            ))}
          </G>
        </Svg>
      )}

      {/* Nabiz: tek hareketli oge. */}
      <View style={[stiller.nabizAlani, { top: merkezY }]} pointerEvents="none">
        {[0, 1, 2].map((i) => (
          <NabizHalkasi
            key={i}
            gecikme={(NABIZ_SURESI / 3) * i}
            hareketVar={hareketVar}
          />
        ))}
      </View>

      {/* Igneler (referans 2026-09-19): sayili KUME, TEKIL beyaz daire,
          SECILI buyuk turuncu igne + ad. Web'de kume dokunusu
          yakinlastirmiyor (radar sabit olcekli), yalnizca cizim. */}
      {kumeler.map((k) => {
        if (k.uyeler.length > 1) {
          const x = k.lng
          const y = -k.lat
          return (
            <View
              key={k.id}
              style={[stiller.kume, { left: x - 22, top: y - 22 }]}
              accessibilityLabel={cevir('harita.kumeEtiketi', { sayi: k.uyeler.length })}
              testID={`kume-${k.id}`}
            >
              <Text style={stiller.kumeSayi}>{k.uyeler.length}</Text>
              <View style={stiller.kumeNokta} />
            </View>
          )
        }
        const yer = yerlesimHaritasi.get(k.uyeler[0].id)
        if (!yer) return null
        const { mekan, x, y } = yer
        const secili = mekan.id === seciliId
        const canli = mekan.kisiSayisi > 0
        return (
          <Pressable
            key={mekan.id}
            style={[stiller.igne, secili ? { left: x - 20, top: y - 40 } : { left: x - 16, top: y - 16 }]}
            onPress={() => onMekanSec?.(mekan.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: secili }}
            accessibilityLabel={
              canli ? cevir('harita.kisiBurada', { ad: mekan.ad, sayi: mekan.kisiSayisi }) : mekan.ad
            }
            hitSlop={6}
            testID={`igne-${mekan.id}`}
          >
            {secili ? (
              <View style={stiller.seciliKutu}>
                <Svg width={40} height={40} viewBox="0 0 24 24">
                  <Path d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z" fill={renk.turuncu} stroke="#FFFFFF" strokeWidth={1.4} />
                  <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
                </Svg>
                <View style={stiller.igneEtiket}>
                  <Text style={stiller.igneAd} numberOfLines={1}>
                    {mekan.ad}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={stiller.tekil}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z" fill={renk.turuncu} />
                  <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
                </Svg>
              </View>
            )}
          </Pressable>
        )
      })}

      {/* Merkez. Kesfet ekraninda kullanicinin kendisi (MAVI NOKTA,
          referans 2026-09-19), mekan sayfasinda o mekan (durum rengi). */}
      <View style={[stiller.merkez, { top: merkezY, marginTop: merkezDurumu ? -38 : -22 }]} pointerEvents="none">
        {merkezDurumu ? (
          <Svg width={44} height={44} viewBox="0 0 24 24">
            <Path d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z" fill={DURUM_RENGI[merkezDurumu]} stroke="#FFFFFF" strokeWidth={1.4} />
            <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
          </Svg>
        ) : (
          <View style={stiller.kullaniciHale} testID="kullanici-noktasi">
            <View style={stiller.kullaniciNokta} />
          </View>
        )}
      </View>

      {konumDugmesi && (
        <Pressable
          style={[stiller.konumDugmesi, { bottom: konumDugmesiAltPayi }]}
          accessibilityRole="button"
          accessibilityLabel={cevir('harita.konumaDon')}
          testID="konuma-don"
        >
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={6.5} stroke="#17130F" strokeWidth={1.8} fill="none" />
            <Circle cx={12} cy={12} r={2.2} fill="#17130F" />
            <Path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" stroke="#17130F" strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}

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
    </Pressable>
  )
}

const HALKA = 220

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kokDolu: { flex: 1, backgroundColor: renk.yuzey, overflow: 'hidden' },
  kume: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  kumeSayi: { fontFamily: yazi.govdeKalin, fontSize: 15, lineHeight: 18, color: '#17130F' },
  kumeNokta: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: renk.turuncu,
  },
  tekil: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  seciliKutu: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  igneEtiket: {
    maxWidth: 160,
    backgroundColor: '#FFFFFFF2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  igneAd: { fontFamily: yazi.govdeKalin, fontSize: 13, lineHeight: 16, color: '#17130F' },
  kullaniciHale: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A7BF233',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kullaniciNokta: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1A7BF2',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  konumDugmesi: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
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
