import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { MarkaIsareti } from '../../tasarim/MarkaIsareti'

/**
 * Ilk acilis ekrani - uygulamayi indiren kisinin gordugu ilk yuz.
 *
 * Onceden uygulama dogrudan giris formuna dusuyordu: Slooin'i hic
 * bilmeyen birine once telefon numarasi soruluyordu. Bu ekran o
 * boslugu dolduruyor - once ne oldugunu soyluyor, sonra istiyor.
 *
 * IMZA OGE: marka isaretinden yayilan halkalar.
 * Logo (kullanicinin karari, 2026-08-25) tek bir isarette uc sey
 * birden soyluyor: bir KONUM IGNESI, icinde IKI INSAN ve bir KONUSMA
 * BALONU. Yani marka zaten "burada birileri var ve konusuyorlar"
 * diyor - uygulamanin tarifi.
 * Bu ekranda o igneden halkalar yayiliyor: isaret canlaniyor ve
 * urunun vaadi gorsellesiyor. Kimlik kuralina da uyuyor - turuncu
 * yalnizca eylem ve CANLILIK icindir.
 * Isaret zemine gore uyarlanir; bkz. MarkaIsareti.
 *
 * Ekrandaki tek hareket bu. Geri kalan her sey sabit ve sessiz;
 * boldugumuz tek yer imza ogesi.
 */

/** Yayilan halka. Gecikme ile iki tane kullaniliyor. */
function Halka({ gecikme, hareketAcik }: { gecikme: number; hareketAcik: boolean }) {
  const ilerleme = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hareketAcik) return
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.delay(gecikme),
        Animated.timing(ilerleme, {
          toValue: 1,
          duration: 2600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ilerleme, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    )
    dongu.start()
    return () => dongu.stop()
  }, [gecikme, hareketAcik, ilerleme])

  // Hareket kapaliysa halka hic cizilmiyor; sabit bir halka birakmak
  // "donacakmis gibi duran ama donmeyen" bir sey uretiyor.
  if (!hareketAcik) return null

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        stiller.halka,
        {
          opacity: ilerleme.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
          transform: [
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.85, 2.6] }) },
          ],
        },
      ]}
    />
  )
}

export default function KarsilamaEkrani() {
  const router = useRouter()
  const { t } = useDil()
  // Erisilebilirlik: "hareketi azalt" aciksa nabiz ve halkalar durur.
  const [hareketAcik, setHareketAcik] = useState(true)
  const nabiz = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let gecerli = true
    AccessibilityInfo.isReduceMotionEnabled().then((azalt) => {
      if (gecerli) setHareketAcik(!azalt)
    })
    const dinleyici = AccessibilityInfo.addEventListener('reduceMotionChanged', (azalt) =>
      setHareketAcik(!azalt)
    )
    return () => {
      gecerli = false
      dinleyici.remove()
    }
  }, [])

  useEffect(() => {
    if (!hareketAcik) return
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(nabiz, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(nabiz, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    )
    dongu.start()
    return () => dongu.stop()
  }, [hareketAcik, nabiz])

  return (
    <View style={stiller.sayfa}>
      <View style={stiller.ust}>
        <View style={stiller.noktaAlani}>
          <Halka gecikme={0} hareketAcik={hareketAcik} />
          <Halka gecikme={1300} hareketAcik={hareketAcik} />
          <Animated.View
            style={{
              transform: [
                { scale: nabiz.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
              ],
            }}
          >
            {/* Sayfa zemini acik (#FAF7F3) oldugu icin "acik" varyant:
                igne turuncu, ikinci figur acik mat seftali. */}
            <MarkaIsareti zemin="acik" boyut={ISARET_BOYUT} />
          </Animated.View>
        </View>

        <Text style={stiller.marka} accessibilityRole="header">
          slooin
        </Text>
      </View>

      <View style={stiller.orta}>
        {/* Vaat iki cumlede: once durum, sonra davet. Uygulamanin
            tamami bu iki cumlede. */}
        <Text style={stiller.baslik}>
          {t('karsilama.baslikBirinci')}
          {'\n'}
          <Text style={stiller.baslikVurgu}>{t('karsilama.baslikIkinci')}</Text>
        </Text>
        <Text style={stiller.aciklama}>{t('karsilama.aciklama')}</Text>
      </View>

      <View style={stiller.alt}>
        <Pressable
          style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
          onPress={() => router.push('/kayit')}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>{t('karsilama.hesapOlustur')}</Text>
        </Pressable>

        <Pressable
          style={stiller.ikincil}
          onPress={() => router.push('/giris')}
          accessibilityRole="button"
        >
          <Text style={stiller.ikincilYazi}>
            {t('karsilama.hesabinVarMi')}{' '}
            <Text style={stiller.ikincilVurgu}>{t('karsilama.girisYap')}</Text>
          </Text>
        </Pressable>

        {/* Yas siniri ve konum kullanimi ilk ekranda soyleniyor.
            Sonradan cikan bir kosul degil, en basta bilinen bir sey. */}
        <Text style={stiller.kucukNot}>{t('karsilama.kucukNot')}</Text>
      </View>
    </View>
  )
}

const ISARET_BOYUT = 96
// Halka isaretin ETRAFINDAN yayiliyor: baslangic capi isaretten biraz
// kucuk, sonra disari aciliyor.
const HALKA_BOYUT = 72

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingTop: 72,
    paddingBottom: bosluk.xl,
  },

  // --- Ust: imza ogesi ve marka ---
  ust: { alignItems: 'center' },
  noktaAlani: {
    width: ISARET_BOYUT * 2.6,
    height: ISARET_BOYUT * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halka: {
    position: 'absolute',
    width: HALKA_BOYUT,
    height: HALKA_BOYUT,
    borderRadius: HALKA_BOYUT / 2,
    borderWidth: 1.5,
    borderColor: renk.turuncu,
  },
  marka: {
    fontFamily: yazi.baslikKalin,
    fontSize: 34,
    color: renk.metin,
    letterSpacing: -0.8,
    marginTop: bosluk.s,
  },

  // --- Orta: vaat ---
  orta: { flex: 1, justifyContent: 'center' },
  baslik: {
    fontFamily: yazi.baslik,
    fontSize: 32,
    lineHeight: 40,
    color: renk.metin,
    letterSpacing: -0.6,
  },
  // Ikinci satir turuncu: davet olan cumle o. Turuncu yine eylemi
  // isaret ediyor, dekorasyon degil.
  baslikVurgu: { color: renk.turuncu },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 24,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
    maxWidth: 340,
  },

  // --- Alt: eylemler ---
  alt: { gap: bosluk.m },
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    ...golge.yuzer,
  },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },
  ikincil: { alignItems: 'center', paddingVertical: bosluk.s },
  ikincilYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },
  kucukNot: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: renk.metinSoluk,
    textAlign: 'center',
    paddingHorizontal: bosluk.m,
  },
})
