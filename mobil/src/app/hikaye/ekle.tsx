import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { hikayeEkle, HIKAYE_YAZI_SINIRI } from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import type { BagKisi } from '../../../lib/bag'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { IfadeSecici, IfadeCipi } from '../../tasarim/IfadeSecici'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { Avatar } from '../../tasarim/Avatar'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * HIKAYE EKLE (2026-09-22, kullanicinin istegi: "hikaye eklemeye
 * basinca siyah ekran gelsin, altta yaptigi check-in yeri gelsin
 * isterse kaldirabilsin, not ekleme kalsin, kendi ifade setimizden de
 * ekleme yapabilsin, arkadas ekleme bunlar eklensin; once siyah ekran,
 * fotograf yuklenince ekrana geliyor ve sonra obur seceneklerden de
 * eklemeler yapabiliyor uzerine").
 *
 * EKRAN SIYAH BIR TUVAL olarak aciliyor; kaynak secimi onun USTUNDE
 * duruyor. Fotograf secilince tuvale yerlesiyor ve butun eklemeler
 * (mekan, not, ifade, arkadas) fotografin UZERINDE yapiliyor - arac
 * seridi yalnizca fotograf geldikten sonra ciziliyor.
 *
 * MEKAN OTOMATIK: aktif check-in varsa cip olarak geliyor, x ile
 * kaldirilabiliyor. Elle mekan secimi YOK - hikaye "su an buradayim"
 * anini paylasiyor.
 *
 * IFADE check-in ile AYNI sozlukten (`public.ifadeler`), ARKADAS
 * etiketi check-in ile ayni onay kuralina tabi (sunucu tarafinda).
 */
export default function HikayeEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()

  const [fotografUri, setFotografUri] = useState<string | null>(null)
  const [kaynakAcik, setKaynakAcik] = useState(true)
  const [yaziMetni, setYaziMetni] = useState('')
  const [notAcik, setNotAcik] = useState(false)
  const [mekan, setMekan] = useState<{ id: string; ad: string } | null>(null)
  const [ifade, setIfade] = useState<string | null>(null)
  const [ifadeAcik, setIfadeAcik] = useState(false)
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [etiketler, setEtiketler] = useState<string[]>([])
  const [arkadasAcik, setArkadasAcik] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  // SecimPenceresi secimde de `onKapat` cagiriyor; "secim yapilmadan
  // kapatildi mi" karari ancak eylem penceresinden SONRA verilebilir.
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
    // Arkadas listesi ONCEDEN: secici acildiginda bekleme olmasin.
    takipcilerimiGetir()
      .then((liste) => {
        if (gecerli) setArkadaslar(liste)
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
      if (sonuc.canceled || !sonuc.assets[0]) return
      setFotografUri(sonuc.assets[0].uri)
    } finally {
      seciliyorRef.current = false
    }
  }

  async function galeridenSec() {
    seciliyorRef.current = true
    try {
      const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
      if (sonuc.canceled || !sonuc.assets[0]) return
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
      await hikayeEkle(fotografUri, yaziMetni, mekan?.id ?? null, ifade, etiketler)
      geri()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      setGonderiliyor(false)
    }
  }

  const etiketliler = arkadaslar.filter((a) => etiketler.includes(a.id))

  return (
    <View style={stiller.zemin} testID="hikaye-ekle">
      {fotografUri && (
        <Image source={{ uri: fotografUri }} style={StyleSheet.absoluteFill} contentFit="contain" testID="hikaye-onizleme" />
      )}

      {/* Okunurluk golgeleri: acik renkli fotografta da arayuz gorunsun
          (izleyicideki ayni cozum, 2026-09-22). */}
      <LinearGradient
        colors={['rgba(0,0,0,0.70)', 'rgba(0,0,0,0)']}
        style={[stiller.ustGolge, { height: guvenliAlan.top + 96 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={[stiller.altGolge, { height: guvenliAlan.bottom + 260 }]}
        pointerEvents="none"
      />

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

      {/* Fotograf gelene kadar tuval BOS ve siyah; dokunmak kaynak
          secimini yeniden acar (kullanici vazgecip geri gelebilir). */}
      {!fotografUri && !kaynakAcik && (
        <Pressable style={stiller.bosTuval} onPress={() => setKaynakAcik(true)} testID="hikaye-tuval">
          <Text style={stiller.bosTuvalYazi}>{t('hikaye.kameraVeyaGaleri')}</Text>
        </Pressable>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stiller.altKap} pointerEvents="box-none">
        <View style={[stiller.alt, { paddingBottom: guvenliAlan.bottom + bosluk.m }]} pointerEvents="box-none">
          {hata && (
            <Text style={stiller.hata} testID="hikaye-hata">
              {hata}
            </Text>
          )}

          {/* Secilenler: mekan, ifade, etiketlenen arkadaslar - hepsi
              kaldirilabilir cip. */}
          {(mekan || ifade || etiketliler.length > 0) && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.cipSeridi}>
              {mekan && (
                <View style={stiller.cip} testID="hikaye-mekan-cipi">
                  <IgneCizimi />
                  <Text style={stiller.cipYazi} numberOfLines={1}>
                    {mekan.ad}
                  </Text>
                  <Pressable onPress={() => setMekan(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('hikaye.mekanKaldir')} testID="hikaye-mekan-kaldir">
                    <Text style={stiller.cipKaldir}>×</Text>
                  </Pressable>
                </View>
              )}
              {ifade && <IfadeCipi slug={ifade} onKaldir={() => setIfade(null)} onPress={() => setIfadeAcik(true)} />}
              {etiketliler.map((k) => (
                <View key={k.id} style={stiller.cip} testID={`hikaye-etiket-${k.id}`}>
                  <Avatar fotografUrl={k.avatarUrl ?? null} ad={k.ad} kullaniciAdi={k.kullaniciAdi} cap={20} />
                  <Text style={stiller.cipYazi} numberOfLines={1}>
                    {k.kullaniciAdi}
                  </Text>
                  <Pressable
                    onPress={() => setEtiketler((m) => m.filter((id) => id !== k.id))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('hikaye.etiketKaldir', { ad: k.kullaniciAdi })}
                    testID={`hikaye-etiket-kaldir-${k.id}`}
                  >
                    <Text style={stiller.cipKaldir}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {notAcik ? (
            <View style={stiller.yaziKutusu}>
              <TextInput
                style={stiller.yaziGirdi}
                value={yaziMetni}
                onChangeText={(m) => setYaziMetni(m.slice(0, HIKAYE_YAZI_SINIRI))}
                placeholder={t('hikaye.yaziYerTutucu')}
                placeholderTextColor="rgba(255,255,255,0.6)"
                maxLength={HIKAYE_YAZI_SINIRI}
                multiline
                autoFocus
                testID="hikaye-yazi"
              />
              <Text style={stiller.sayac}>
                {yaziMetni.length}/{HIKAYE_YAZI_SINIRI}
              </Text>
            </View>
          ) : yaziMetni.trim() ? (
            <Pressable onPress={() => setNotAcik(true)} style={stiller.notOnizleme} testID="hikaye-not-onizleme">
              <Text style={stiller.notOnizlemeYazi} numberOfLines={2}>
                {yaziMetni}
              </Text>
            </Pressable>
          ) : null}

          {/* ARAC SERIDI yalnizca fotograf geldikten sonra: fotografsiz
              not/ifade/arkadas eklemek anlamsiz. */}
          {fotografUri && (
            <View style={stiller.araclar} testID="hikaye-araclar">
              <AracDugmesi etiket={t('hikaye.notEkle')} testID="hikaye-arac-not" onPress={() => setNotAcik(true)} ikon={<KalemCizimi />} />
              <AracDugmesi etiket={t('hikaye.ifadeEkle')} testID="hikaye-arac-ifade" onPress={() => setIfadeAcik(true)} ikon={<GulenYuzCizimi />} />
              <AracDugmesi etiket={t('hikaye.arkadasEkle')} testID="hikaye-arac-arkadas" onPress={() => setArkadasAcik(true)} ikon={<KisilerCizimi />} />
            </View>
          )}

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
          // Secim yapilmadan kapatildi ve elde fotograf yok: siyah tuval
          // kaliyor, kullanici tuvale dokunup yeniden acabilir. Ekrandan
          // ancak × ile cikilir - "once siyah ekran" istegi bu.
        }}
        secimler={[
          { etiket: t('hikaye.kamera'), testID: 'hikaye-kamera', onSec: kameradanCek },
          { etiket: t('hikaye.galeri'), testID: 'hikaye-galeri', onSec: galeridenSec },
        ]}
      />

      <IfadeSecici acikMi={ifadeAcik} secili={ifade} onSec={(slug) => setIfade(slug)} onKapat={() => setIfadeAcik(false)} />

      <ArkadasSecici
        acikMi={arkadasAcik}
        arkadaslar={arkadaslar}
        secili={etiketler}
        onDegistir={(kullaniciId) =>
          setEtiketler((m) => (m.includes(kullaniciId) ? m.filter((id) => id !== kullaniciId) : [...m, kullaniciId]))
        }
        onKapat={() => setArkadasAcik(false)}
      />
    </View>
  )
}

/** Arac seridi dugmesi: ikon + etiket, ucu de ayni genislikte. */
function AracDugmesi({
  etiket,
  ikon,
  onPress,
  testID,
}: {
  etiket: string
  ikon: ReactNode
  onPress: () => void
  testID: string
}) {
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      testID={testID}
      style={({ pressed }) => [stiller.arac, pressed && stiller.basili]}
    >
      <View style={stiller.aracIkon}>{ikon}</View>
      <Text style={stiller.aracYazi} numberOfLines={1}>
        {etiket}
      </Text>
    </Pressable>
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

function KalemCizimi() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  )
}

function GulenYuzCizimi() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.2} fill="#FFFFFF" />
      <Circle cx={15} cy={10} r={1.2} fill="#FFFFFF" />
      <Path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

function KisilerCizimi() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.2} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M16 7.5a3 3 0 0 1 0 5.5M17.5 19c0-2-.7-3.6-1.9-4.6" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },
    ustGolge: { position: 'absolute', left: 0, right: 0, top: 0 },
    altGolge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
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
    bosTuval: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bosTuvalYazi: { color: 'rgba(255,255,255,0.5)', fontFamily: yazi.govde, fontSize: olcek.govde },
    altKap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    alt: { paddingHorizontal: bosluk.sayfa, paddingTop: bosluk.l, gap: bosluk.s },
    hata: { color: '#FFB4A2', fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk },
    cipSeridi: { gap: bosluk.s, paddingVertical: 2 },
    cip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: yuvarlak.hap,
      paddingHorizontal: 10,
      paddingVertical: 6,
      maxWidth: 220,
    },
    cipYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, flexShrink: 1 },
    cipKaldir: { color: '#FFFFFF', fontSize: 18, lineHeight: 18, paddingLeft: 2 },
    yaziKutusu: {
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: yuvarlak.kart,
      paddingHorizontal: bosluk.m,
      paddingVertical: bosluk.s,
    },
    yaziGirdi: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.govde, minHeight: 44, maxHeight: 110, textAlignVertical: 'top' },
    sayac: { color: 'rgba(255,255,255,0.6)', fontFamily: yazi.govde, fontSize: olcek.minik, textAlign: 'right' },
    notOnizleme: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: yuvarlak.kart,
      paddingHorizontal: bosluk.m,
      paddingVertical: bosluk.s,
      maxWidth: '100%',
    },
    notOnizlemeYazi: { color: '#FFFFFF', fontFamily: yazi.govdeOrta, fontSize: olcek.govde },
    araclar: { flexDirection: 'row', gap: bosluk.s },
    arac: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderRadius: yuvarlak.kart,
      paddingVertical: 10,
    },
    aracIkon: { alignItems: 'center', justifyContent: 'center' },
    aracYazi: { color: '#FFFFFF', fontFamily: yazi.govdeOrta, fontSize: olcek.minik },
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
