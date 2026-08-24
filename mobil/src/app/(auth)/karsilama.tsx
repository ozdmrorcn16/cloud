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
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

/**
 * Ilk acilis ekrani - uygulamayi indiren kisinin gordugu ilk yuz.
 *
 * Onceden uygulama dogrudan giris formuna dusuyordu: Slooin'i hic
 * bilmeyen birine once telefon numarasi soruluyordu. Bu ekran o
 * boslugu dolduruyor - once ne oldugunu soyluyor, sonra istiyor.
 *
 * IMZA OGE: markanin noktasi.
 * Kelime markasi zaten "slooin." seklinde, sonunda turuncu bir nokta
 * (karar 73). Burada o nokta CANLI bir check-in noktasina donusuyor:
 * nabiz gibi atiyor ve etrafindan halka yayiliyor. Boylece marka
 * isareti ile urunun vaadi ("su an burada biri var") ayni ogede
 * birlesiyor. Kimlik kuralina da uyuyor: turuncu yalnizca eylem ve
 * CANLILIK icin kullanilir - burada tam olarak canliligi anlatiyor.
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
            { scale: ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.4, 4.2] }) },
          ],
        },
      ]}
    />
  )
}

export default function KarsilamaEkrani() {
  const router = useRouter()
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
            style={[
              stiller.nokta,
              {
                transform: [
                  { scale: nabiz.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
                ],
              },
            ]}
          />
        </View>

        <Text style={stiller.marka} accessibilityRole="header">
          slooin
        </Text>
      </View>

      <View style={stiller.orta}>
        {/* Vaat iki cumlede: once durum, sonra davet. Uygulamanin
            tamami bu iki cumlede. */}
        <Text style={stiller.baslik}>
          Aynı yerdesiniz.{'\n'}
          <Text style={stiller.baslikVurgu}>Tanışmaya ne dersin?</Text>
        </Text>
        <Text style={stiller.aciklama}>
          Bulunduğun yere check-in yap, tam o anda orada olan başka insanları gör. Konum
          paylaşımı check-in yaptığın süreyle sınırlı.
        </Text>
      </View>

      <View style={stiller.alt}>
        <Pressable
          style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
          onPress={() => router.push('/kayit')}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>Hesap oluştur</Text>
        </Pressable>

        <Pressable
          style={stiller.ikincil}
          onPress={() => router.push('/giris')}
          accessibilityRole="button"
        >
          <Text style={stiller.ikincilYazi}>
            Hesabın var mı? <Text style={stiller.ikincilVurgu}>Giriş yap</Text>
          </Text>
        </Pressable>

        {/* Yas siniri ve konum kullanimi ilk ekranda soyleniyor.
            Sonradan cikan bir kosul degil, en basta bilinen bir sey. */}
        <Text style={stiller.kucukNot}>
          18 yaşından büyük olman gerekiyor. Konumun kimseyle sürekli paylaşılmaz.
        </Text>
      </View>
    </View>
  )
}

const NOKTA_BOYUT = 18

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
    width: NOKTA_BOYUT * 5,
    height: NOKTA_BOYUT * 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nokta: {
    width: NOKTA_BOYUT,
    height: NOKTA_BOYUT,
    borderRadius: NOKTA_BOYUT / 2,
    backgroundColor: renk.turuncu,
  },
  halka: {
    position: 'absolute',
    width: NOKTA_BOYUT,
    height: NOKTA_BOYUT,
    borderRadius: NOKTA_BOYUT / 2,
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
