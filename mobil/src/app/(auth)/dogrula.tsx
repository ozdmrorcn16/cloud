import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../../lib/supabase'
import { okunurBicim } from '../../../lib/telefon'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

/** Kodun hane sayisi - Supabase SMS OTP'si alti hane gonderiyor. */
const HANE = 6

/** Tekrar gonderme icin bekleme suresi. */
const BEKLEME_SANIYE = 60

/**
 * Telefon dogrulama.
 *
 * Kayit ekranindan sonraki adim: numaraya gelen kodu girmek.
 *
 * Kod alani ALTI KUTU olarak ciziliyor ama altta TEK bir TextInput
 * var; kutular yalnizca gorsel. Alti ayri girdi kullanmak kulaga
 * dogru geliyor, pratikte degil: silme tuşu, yapistirma ve otomatik
 * SMS doldurma alti alan arasinda bolununce bozuluyor.
 *
 * Alti hane girilince kendiliginden dogruluyor - kullaniciya ayrica
 * bir dugmeye basmasi gerektigini soylemeye gerek yok. Dugme yine de
 * duruyor, cunku otomatik gonderim basarisiz olursa tekrar denemenin
 * gorunur bir yolu olmali.
 */
export default function DogrulaEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const { telefon } = useLocalSearchParams<{ telefon: string }>()
  const [kod, setKod] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [kalanSaniye, setKalanSaniye] = useState(BEKLEME_SANIYE)
  const girdiRef = useRef<TextInput>(null)

  useEffect(() => {
    if (kalanSaniye <= 0) return
    const zamanlayici = setTimeout(() => setKalanSaniye((s) => s - 1), 1000)
    return () => clearTimeout(zamanlayici)
  }, [kalanSaniye])

  async function dogrula(girilen: string = kod) {
    if (girilen.length < HANE) {
      setHata(t('dogrula.hataEksik'))
      return
    }
    setHata(null)
    setBilgi(null)
    setGonderiliyor(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: telefon,
      token: girilen,
      type: 'sms',
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    // Sifre ve KVKK onayi bir sonraki adimda aliniyor.
    router.replace('/sifre-belirle')
  }

  function kodDegisti(yeni: string) {
    // Yalnizca rakam: SMS'ten yapistirilan metin bosluk ya da tire
    // tasiyabiliyor.
    const temiz = yeni.replace(/\D/g, '').slice(0, HANE)
    setKod(temiz)
    setHata(null)
    if (temiz.length === HANE) dogrula(temiz)
  }

  async function tekrarGonder() {
    if (kalanSaniye > 0) return
    setHata(null)
    const { error } = await supabase.auth.resend({ type: 'sms', phone: telefon })
    if (error) {
      setHata(error.message)
      return
    }
    setBilgi(t('dogrula.tekrarGonderildi'))
    setKalanSaniye(BEKLEME_SANIYE)
  }

  return (
    <View style={stiller.sayfa}>
      <Pressable
        style={stiller.geri}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('dogrula.geri')}
        hitSlop={12}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path
            d="M15 5l-7 7 7 7"
            stroke={renk.metin}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Pressable>

      <Text style={stiller.baslik}>{t('dogrula.baslik')}</Text>
      <Text style={stiller.aciklama}>{t('dogrula.aciklama', { telefon: okunurBicim(telefon ?? '') })}</Text>

      {/* Kutulara dokunmak alttaki tek girdiyi odakliyor. */}
      <Pressable
        style={stiller.kutular}
        onPress={() => girdiRef.current?.focus()}
        accessibilityRole="button"
        accessibilityLabel={t('dogrula.kodEtiketi')}
      >
        {Array.from({ length: HANE }).map((_, i) => (
          <View
            key={i}
            style={[
              stiller.kutu,
              i === kod.length && stiller.kutuSiradaki,
              kod[i] !== undefined && stiller.kutuDolu,
            ]}
          >
            <Text style={stiller.hane}>{kod[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={girdiRef}
        style={stiller.gizliGirdi}
        value={kod}
        onChangeText={kodDegisti}
        keyboardType="number-pad"
        maxLength={HANE}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        placeholder={t('dogrula.kodEtiketi')}
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}
      {bilgi && !hata && <Text style={stiller.bilgi}>{bilgi}</Text>}

      <Pressable
        style={stiller.birincil}
        onPress={() => dogrula()}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? t('dogrula.gonderiliyor') : t('dogrula.gonder')}
        </Text>
      </Pressable>

      <View style={stiller.tekrarAlani}>
        <Text style={stiller.tekrarSoru}>{t('dogrula.kodGelmedi')}</Text>
        {kalanSaniye > 0 ? (
          <Text style={stiller.tekrarBekle}>
            {t('dogrula.tekrarBekle', { saniye: kalanSaniye })}
          </Text>
        ) : (
          <Pressable onPress={tekrarGonder} accessibilityRole="button" hitSlop={8}>
            <Text style={stiller.tekrarYazi}>{t('dogrula.tekrarGonder')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
  },
  geri: { alignSelf: 'flex-start', marginBottom: bosluk.xl },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.s,
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },

  kutular: { flexDirection: 'row', gap: bosluk.s },
  kutu: {
    flex: 1,
    aspectRatio: 0.82,
    backgroundColor: renk.yuzey,
    borderWidth: 1.5,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sıradaki kutu turuncu: kullanicinin nerede oldugu gorunsun.
  kutuSiradaki: { borderColor: renk.turuncu },
  kutuDolu: { borderColor: renk.metinSoluk },
  hane: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik + 3,
    color: renk.metin,
  },
  // Gercek girdi gorunmuyor; kutular onun yerine ciziliyor.
  gizliGirdi: { position: 'absolute', opacity: 0, height: 1, width: 1 },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.m,
  },
  bilgi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
    marginTop: bosluk.m,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  tekrarAlani: { alignItems: 'center', gap: bosluk.xs, marginTop: bosluk.l },
  tekrarSoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  tekrarYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  tekrarBekle: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
})
