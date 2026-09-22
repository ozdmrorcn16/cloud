import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { hikayeEkle, HIKAYE_YAZI_SINIRI } from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * HIKAYE EKLE (2026-09-22). Tam ekran, siyah zemin (izleyiciyle ayni
 * sahne). Acilista kaynak secimi (Fotograf cek / Galeriden sec); secim
 * yapilmadan kapatilirsa ekran geri doner. Fotograf gelince onizleme,
 * altta yazi (<= 200), mekan cipi ve "Paylas".
 *
 * MEKAN ETIKETI OTOMATIK: aktif check-in'im varsa onun mekani cip olarak
 * gelir, x ile kaldirilabilir. Elle mekan secimi YOK (spec) - hikaye
 * "su an buradayim" anini paylasiyor; check-in yoksa etiket de yok.
 *
 * Paylasim bitince geri (ana sayfa odaklaninca seridi tazeliyor).
 */
export default function HikayeEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()

  const [fotografUri, setFotografUri] = useState<string | null>(null)
  const [kaynakAcik, setKaynakAcik] = useState(true)
  const [yaziMetni, setYaziMetni] = useState('')
  const [mekan, setMekan] = useState<{ id: string; ad: string } | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  // SecimPenceresi secimde de `onKapat` cagirir (once kapanir, eylem
  // 80 ms sonra kosar). "Secim yapilmadan kapatildi mi" ancak o eylem
  // penceresinden SONRA anlasilir; bu iki ref o karari tasiyor.
  const seciliyorRef = useRef(false)
  const fotografUriRef = useRef<string | null>(null)
  fotografUriRef.current = fotografUri
  const kaynakAcikRef = useRef(kaynakAcik)
  kaynakAcikRef.current = kaynakAcik

  useEffect(() => {
    let gecerli = true
    aktifCheckInimiGetir()
      .then((c) => {
        if (gecerli && c) setMekan({ id: c.mekanId, ad: c.mekanAdi })
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [])

  function geri() {
    if (router.canGoBack()) router.back()
    else router.replace('/' as never)
  }

  async function kameradanCek() {
    seciliyorRef.current = true
    try {
      const izin = await ImagePicker.requestCameraPermissionsAsync()
      if (!izin.granted) {
        setHata(t('hikaye.kameraIzni'))
        setKaynakAcik(true)
        return
      }
      const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.8 })
      if (sonuc.canceled || !sonuc.assets[0]) {
        if (!fotografUriRef.current) geri()
        return
      }
      setFotografUri(sonuc.assets[0].uri)
    } finally {
      seciliyorRef.current = false
    }
  }

  async function galeridenSec() {
    seciliyorRef.current = true
    try {
      const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
      if (sonuc.canceled || !sonuc.assets[0]) {
        if (!fotografUriRef.current) geri()
        return
      }
      setFotografUri(sonuc.assets[0].uri)
    } finally {
      seciliyorRef.current = false
    }
  }

  async function paylas() {
    if (!fotografUri || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    try {
      await hikayeEkle(fotografUri, yaziMetni, mekan?.id ?? null)
      geri()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.zemin} testID="hikaye-ekle">
      {fotografUri && (
        <Image source={{ uri: fotografUri }} style={StyleSheet.absoluteFill} contentFit="contain" testID="hikaye-onizleme" />
      )}

      {/* Ust: kapat + degistir */}
      <View style={[stiller.ustCubuk, { paddingTop: guvenliAlan.top + bosluk.s }]}>
        <Pressable onPress={geri} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('ortak.kapat')} testID="hikaye-kapat" style={stiller.yuvarlakDugme}>
          <Text style={stiller.kapatYazi}>×</Text>
        </Pressable>
        <Text style={stiller.baslik}>{t('hikaye.ekleBaslik')}</Text>
        {fotografUri ? (
          <Pressable onPress={() => setKaynakAcik(true)} hitSlop={8} accessibilityRole="button" testID="hikaye-fotograf-degistir" style={stiller.degistir}>
            <Text style={stiller.degistirYazi}>{t('checkIn.degistir')}</Text>
          </Pressable>
        ) : (
          <View style={stiller.degistir} />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stiller.altKap} pointerEvents="box-none">
        <View style={[stiller.alt, { paddingBottom: guvenliAlan.bottom + bosluk.m }]}>
          {hata && (
            <Text style={stiller.hata} testID="hikaye-hata">
              {hata}
            </Text>
          )}
          {mekan ? (
            <View style={stiller.mekanCipi} testID="hikaye-mekan-cipi">
              <IgneCizimi />
              <Text style={stiller.mekanYazi} numberOfLines={1}>
                {mekan.ad}
              </Text>
              <Pressable onPress={() => setMekan(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('hikaye.mekanKaldir')} testID="hikaye-mekan-kaldir">
                <Text style={stiller.mekanKaldir}>×</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={stiller.ipucu}>{t('hikaye.mekanIpucu')}</Text>
          )}
          <View style={stiller.yaziKutusu}>
            <TextInput
              style={stiller.yaziGirdi}
              value={yaziMetni}
              onChangeText={(m) => setYaziMetni(m.slice(0, HIKAYE_YAZI_SINIRI))}
              placeholder={t('hikaye.yaziYerTutucu')}
              placeholderTextColor="rgba(255,255,255,0.6)"
              maxLength={HIKAYE_YAZI_SINIRI}
              multiline
              testID="hikaye-yazi"
            />
            <Text style={stiller.sayac}>
              {yaziMetni.length}/{HIKAYE_YAZI_SINIRI}
            </Text>
          </View>
          <Text style={stiller.sureNotu}>{t('hikaye.sureAciklama')}</Text>
          <Pressable
            onPress={paylas}
            disabled={!fotografUri || gonderiliyor}
            accessibilityRole="button"
            accessibilityState={{ disabled: !fotografUri || gonderiliyor }}
            testID="hikaye-paylas"
            style={({ pressed }) => [stiller.paylas, (!fotografUri || gonderiliyor) && stiller.paylasPasif, pressed && stiller.basili]}
          >
            {gonderiliyor ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stiller.paylasYazi}>{t('hikaye.paylas')}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <SecimPenceresi
        acikMi={kaynakAcik}
        onKapat={() => {
          setKaynakAcik(false)
          // Secim yapilmadan kapatildi ve elde fotograf yok: ekranin
          // anlami kalmadi, geri. Karar eylem penceresinden (80 ms)
          // sonra: bir kaynak secildiyse `seciliyorRef` dolu olur.
          setTimeout(() => {
            // Izin reddi menuyu yeniden acar - o durumda da kalinir.
            if (!fotografUriRef.current && !seciliyorRef.current && !kaynakAcikRef.current) geri()
          }, 400)
        }}
        secimler={[
          { etiket: t('hikaye.kamera'), testID: 'hikaye-kamera', onSec: kameradanCek },
          { etiket: t('hikaye.galeri'), testID: 'hikaye-galeri', onSec: galeridenSec },
        ]}
      />
    </View>
  )
}

function IgneCizimi() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#FFFFFF" />
      <Circle cx={12} cy={9} r={2.4} fill="#111111" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },
    ustCubuk: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: bosluk.sayfa,
      paddingBottom: bosluk.s,
    },
    yuvarlakDugme: {
      width: 36,
      height: 36,
      borderRadius: yuvarlak.hap,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    kapatYazi: { color: '#FFFFFF', fontSize: 24, lineHeight: 26, fontFamily: yazi.govde },
    baslik: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
    degistir: { minWidth: 64, alignItems: 'flex-end' },
    degistirYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk },
    altKap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    alt: {
      paddingHorizontal: bosluk.sayfa,
      paddingTop: bosluk.l,
      gap: bosluk.s,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    hata: { color: '#FFB4A2', fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk },
    mekanCipi: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: yuvarlak.hap,
      paddingHorizontal: 10,
      paddingVertical: 6,
      maxWidth: '80%',
    },
    mekanYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, flexShrink: 1 },
    mekanKaldir: { color: '#FFFFFF', fontSize: 18, lineHeight: 18, paddingLeft: 2 },
    ipucu: { color: 'rgba(255,255,255,0.7)', fontFamily: yazi.govde, fontSize: olcek.minik },
    yaziKutusu: {
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: yuvarlak.kart,
      paddingHorizontal: bosluk.m,
      paddingVertical: bosluk.s,
    },
    yaziGirdi: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.govde, minHeight: 44, maxHeight: 110, textAlignVertical: 'top' },
    sayac: { color: 'rgba(255,255,255,0.6)', fontFamily: yazi.govde, fontSize: olcek.minik, textAlign: 'right' },
    sureNotu: { color: 'rgba(255,255,255,0.7)', fontFamily: yazi.govde, fontSize: olcek.minik },
    paylas: {
      backgroundColor: renk.turuncu,
      borderRadius: yuvarlak.hap,
      paddingVertical: 14,
      alignItems: 'center',
    },
    paylasPasif: { opacity: 0.5 },
    basili: { opacity: 0.85 },
    paylasYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
  })
