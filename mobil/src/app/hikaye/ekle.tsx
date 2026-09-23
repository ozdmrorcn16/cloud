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
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import {
  hikayeEkle,
  HIKAYE_YAZI_SINIRI,
  VARSAYILAN_KONUM,
  type HikayeGorunurlugu,
  type HikayeKonum,
  type HikayeYerlesimi,
} from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir } from '../../../lib/mekan'
import type { BagKisi } from '../../../lib/bag'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { GaleriSayfasi } from '../../tasarim/GaleriSayfasi'
import { sonFotograflariGetir, galeriKullanilabilirMi } from '../../../lib/galeri'
import { IfadeSecici } from '../../tasarim/IfadeSecici'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { HikayeOgesi } from '../../tasarim/HikayeOgesi'
import { ifadeBul } from '../../../lib/ifadeler'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * HIKAYE OLUSTUR (2026-09-22, kullanicinin referansi "02 / Hikâye
 * oluştur"): fotograf TAM EKRAN; yazi, Slooin ifadesi, mekan ve arkadas
 * etiketleri fotografin UZERINE konur, SURUKLENIP BOYUTLANDIRILIR
 * (`HikayeOgesi`). Altta gorunurluk secimi (Arkadaslar / Herkese) ve
 * Paylas.
 *
 * GIRIS AKISI (kullanicinin tarifi 2026-09-23): ekran SIYAH aciliyor;
 * sol altta kucuk karede GALERIDEKI SON FOTOGRAF duruyor, ona dokunmak
 * alttan galeri sayfasini aciyor (`GaleriSayfasi`); oradaki kamera
 * karesi canli cekimi, digerleri galeriyi veriyor. Ayri bir "fotograf
 * sec" EKRANI YOK.
 *
 * Ust cubuk: × (fotografi KALDIRIR, siyah ekrana doner - ayri
 * "Fotografi degistir" dugmesi YOK), ortada "Yeni hikaye".
 *
 * MEKAN ISTEGE BAGLI (kullanicinin karari): aktif check-in varsa cip
 * hazir gelir, elle de secilebilir, x ile kaldirilir. Hikaye paylasmak
 * check-in OLUSTURMAZ - ikisi ayri kayit.
 *
 * VIDEO henuz yok: yeni bir native modul (expo-video) gerektirdigi icin
 * bir sonraki derlemeye birakildi; bugunku surumde fotograf.
 */
export default function HikayeEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()

  // Fotograf secme ekranindan (`/hikaye/fotograf`) geliyor; dogrudan
  // acildiginda (eski yol) kaynak secimi yine gosteriliyor.
  const { foto } = useLocalSearchParams<{ foto?: string }>()
  const [fotografUri, setFotografUri] = useState<string | null>(foto ?? null)
  const [galeriAcik, setGaleriAcik] = useState(false)
  /** Sol alttaki kucuk karede gosterilen son galeri fotografi. */
  const [sonFotograf, setSonFotograf] = useState<string | null>(null)
  const [yaziMetni, setYaziMetni] = useState('')
  const [notAcik, setNotAcik] = useState(false)
  const [mekan, setMekan] = useState<{ id: string; ad: string } | null>(null)
  const [mekanSecenekleri, setMekanSecenekleri] = useState<{ id: string; ad: string }[]>([])
  const [mekanAcik, setMekanAcik] = useState(false)
  const [ifade, setIfade] = useState<string | null>(null)
  const [ifadeAcik, setIfadeAcik] = useState(false)
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [etiketler, setEtiketler] = useState<string[]>([])
  const [arkadasAcik, setArkadasAcik] = useState(false)
  const [gorunurluk, setGorunurluk] = useState<HikayeGorunurlugu>('arkadaslar')
  const [gorunurlukAcik, setGorunurlukAcik] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [alan, setAlan] = useState({ en: 0, boy: 0 })
  const [yerlesim, setYerlesim] = useState<HikayeYerlesimi>({})

  const seciliyorRef = useRef(false)

  useEffect(() => {
    let gecerli = true
    aktifCheckInimiGetir()
      .then((c) => {
        if (gecerli && c) setMekan({ id: c.mekanId, ad: c.mekanAdi })
      })
      .catch(() => {})
    takipcilerimiGetir()
      .then((liste) => {
        if (gecerli) setArkadaslar(liste)
      })
      .catch(() => {})
    if (galeriKullanilabilirMi()) {
      sonFotograflariGetir(1)
        .then((liste) => {
          if (gecerli && liste[0]) setSonFotograf(liste[0].uri)
        })
        .catch(() => {})
    }
    return () => {
      gecerli = false
    }
  }, [])

  function geri() {
    if (router.canGoBack()) router.back()
    else router.replace('/' as never)
  }

  /** × : fotograf KALKAR ve siyah ekrana donulur (kullanicinin karari -
   *  ayri "Fotografi degistir" dugmesi yok); fotograf yoksa cikar. */
  function kapat() {
    if (fotografUri) {
      setFotografUri(null)
      setYerlesim({})
      return
    }
    geri()
  }

  async function kameradanCek() {
    seciliyorRef.current = true
    try {
      const izin = await ImagePicker.requestCameraPermissionsAsync()
      if (!izin.granted) {
        setHata(t('hikaye.kameraIzni'))
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

  /** Mekan secimi: yakindakiler. Konum alinamazsa liste bos gelir ve
   *  pencere "yakinda mekan yok" satiriyla acilir - sessiz kalmaz. */
  async function mekanlariAc() {
    setMekanAcik(true)
    try {
      const konum = await cihazKonumunuAl()
      const liste = await yakinMekanlariGetir(konum.lat, konum.lng)
      setMekanSecenekleri(liste.slice(0, 12).map((m) => ({ id: m.id, ad: m.ad })))
    } catch {
      setMekanSecenekleri([])
    }
  }

  function konumAl(tur: 'yazi' | 'ifade' | 'mekan'): HikayeKonum {
    return yerlesim[tur] ?? VARSAYILAN_KONUM[tur]
  }
  function konumYaz(tur: 'yazi' | 'ifade' | 'mekan', konum: HikayeKonum) {
    setYerlesim((y) => ({ ...y, [tur]: konum }))
  }
  function etiketKonumu(id: string, sira: number): HikayeKonum {
    return yerlesim.etiketler?.[id] ?? { x: 0.5, y: 0.84 + sira * 0.05, olcek: 1 }
  }
  function etiketKonumuYaz(id: string, konum: HikayeKonum) {
    setYerlesim((y) => ({ ...y, etiketler: { ...(y.etiketler ?? {}), [id]: konum } }))
  }

  async function paylas() {
    if (!fotografUri || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    try {
      await hikayeEkle(fotografUri, yaziMetni, mekan?.id ?? null, ifade, etiketler, gorunurluk, yerlesim)
      geri()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      setGonderiliyor(false)
    }
  }

  const etiketliler = arkadaslar.filter((a) => etiketler.includes(a.id))
  const ifadeKaynagi = ifade ? (ifadeBul(ifade)?.kaynak ?? null) : null

  return (
    <View style={stiller.zemin} testID="hikaye-ekle">
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(o) => setAlan({ en: o.nativeEvent.layout.width, boy: o.nativeEvent.layout.height })}
      >
        {fotografUri && (
          <Image source={{ uri: fotografUri }} style={StyleSheet.absoluteFill} contentFit="cover" testID="hikaye-onizleme" />
        )}

        {/* Etiketler fotografin UZERINDE; her biri suruklenip
            boyutlandirilabiliyor. Fotograf yokken cizilmezler. */}
        {fotografUri && (
          <>
            {yaziMetni.trim() !== '' && (
              <HikayeOgesi
                konum={konumAl('yazi')}
                alan={alan}
                onDegis={(k) => konumYaz('yazi', k)}
                testID="hikaye-oge-yazi"
              >
                <Text style={stiller.tuvalYazi}>{yaziMetni}</Text>
              </HikayeOgesi>
            )}

            {ifadeKaynagi && (
              <HikayeOgesi konum={konumAl('ifade')} alan={alan} onDegis={(k) => konumYaz('ifade', k)} testID="hikaye-oge-ifade">
                <Image source={ifadeKaynagi} style={stiller.tuvalIfade} contentFit="contain" />
              </HikayeOgesi>
            )}

            {mekan && (
              <HikayeOgesi konum={konumAl('mekan')} alan={alan} onDegis={(k) => konumYaz('mekan', k)} testID="hikaye-oge-mekan">
                <View style={stiller.mekanHapi}>
                  <IgneCizimi renk="#FE7813" />
                  <Text style={stiller.mekanYazi} numberOfLines={1}>
                    {mekan.ad}
                  </Text>
                </View>
              </HikayeOgesi>
            )}

            {etiketliler.map((k, i) => (
              <HikayeOgesi
                key={k.id}
                konum={etiketKonumu(k.id, i)}
                alan={alan}
                onDegis={(konum) => etiketKonumuYaz(k.id, konum)}
                testID={`hikaye-oge-etiket-${k.id}`}
              >
                <View style={stiller.etiketHapi}>
                  <Text style={stiller.etiketYazi}>@{k.kullaniciAdi}</Text>
                </View>
              </HikayeOgesi>
            ))}
          </>
        )}
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        style={[stiller.ustGolge, { height: guvenliAlan.top + 96 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={[stiller.altGolge, { height: guvenliAlan.bottom + 220 }]}
        pointerEvents="none"
      />

      <View style={[stiller.ustCubuk, { paddingTop: guvenliAlan.top + bosluk.s }]} pointerEvents="box-none">
        <YuvarlakDugme etiket={t('ortak.kapat')} testID="hikaye-kapat" onPress={kapat}>
          <Text style={stiller.kapatYazi}>×</Text>
        </YuvarlakDugme>
        <Text style={stiller.baslik}>{t('hikaye.ekleBaslik')}</Text>
        {/* Sag taraf BOS: Aa ve ifade alt cip seridinde (kullanicinin
            duzeltmesi 2026-09-22: "onu asagi cek ... ifade ekleme
            simgesini de kaldir"). */}
        <View style={stiller.ustSag} />
      </View>

      {/* Yazi girisi: Aa'ya basinca acilan tam ekran katman. Yazilan
          metin kapaninca tuvalde suruklenebilir bir ogeye donusuyor. */}
      {notAcik && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stiller.yaziKatmani}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setNotAcik(false)} accessibilityRole="button" accessibilityLabel={t('ortak.kapat')} />
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
            <Pressable onPress={() => setNotAcik(false)} accessibilityRole="button" testID="hikaye-yazi-tamam" style={stiller.yaziTamam}>
              <Text style={stiller.yaziTamamYazi}>{t('ortak.tamam')}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      <View style={[stiller.alt, { paddingBottom: guvenliAlan.bottom + bosluk.m }]} pointerEvents="box-none">
        {hata && (
          <Text style={stiller.hata} testID="hikaye-hata">
            {hata}
          </Text>
        )}

        {/* SIYAH EKRAN: galerideki son fotografin kucuk karesi (kullanicinin
            tarifi 2026-09-23). Fotograf secilince yerini tuvale birakiyor. */}
        {!fotografUri && (
          <View style={stiller.galeriSatiri}>
            <Pressable
              onPress={() => setGaleriAcik(true)}
              accessibilityRole="button"
              accessibilityLabel={t('hikaye.fotografSec')}
              testID="hikaye-galeri-karesi"
              style={({ pressed }) => [stiller.galeriKaresi, pressed && stiller.basili]}
            >
              {sonFotograf ? (
                <Image source={{ uri: sonFotograf }} style={stiller.galeriKaresiResim} contentFit="cover" />
              ) : (
                <ResimCizimi />
              )}
            </Pressable>
            <Text style={stiller.bosTuvalYazi}>{t('hikaye.fotografSec')}</Text>
          </View>
        )}

        {/* ARAC CIPLERI siyah ekranda da duruyor (kullanicinin istegi
            2026-09-23: "O siyah ekrana bunlari yerlestir"). Paylas
            fotograf gelene kadar pasif - bos hikaye paylasilmaz. */}
        {(
          <View style={stiller.araclar} testID="hikaye-araclar">
            <AracHapi etiket={t('hikaye.notEkle')} testID="hikaye-arac-not" onPress={() => setNotAcik(true)} ikon={<Text style={stiller.aaYazi}>Aa</Text>} />
            <AracHapi etiket={t('hikaye.mekanEkle')} testID="hikaye-arac-mekan" onPress={mekanlariAc} ikon={<IgneCizimi renk="#FFFFFF" />} />
            <AracHapi etiket={t('hikaye.ifadeEkle')} testID="hikaye-arac-ifade" onPress={() => setIfadeAcik(true)} ikon={<GulenYuzCizimi />} />
            <AracHapi etiket={t('hikaye.etiketle')} testID="hikaye-arac-arkadas" onPress={() => setArkadasAcik(true)} ikon={<KisiEkleCizimi />} />
          </View>
        )}

        <View style={stiller.altSatir}>
          <Pressable
            onPress={() => setGorunurlukAcik(true)}
            accessibilityRole="button"
            accessibilityLabel={t('hikaye.gorunurlukSec')}
            testID="hikaye-gorunurluk"
            style={({ pressed }) => [stiller.gorunurlukHapi, pressed && stiller.basili]}
          >
            <KisilerCizimi />
            <Text style={stiller.gorunurlukYazi} numberOfLines={1}>
              {t(gorunurluk === 'herkese_acik' ? 'hikaye.herkese' : 'hikaye.arkadaslar')}
            </Text>
            <Text style={stiller.gorunurlukOk}>⌄</Text>
          </Pressable>

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
      </View>

      <GaleriSayfasi
        acikMi={galeriAcik}
        onKapat={() => setGaleriAcik(false)}
        onFotograf={(uri) => {
          setGaleriAcik(false)
          setFotografUri(uri)
        }}
        onKamera={() => {
          setGaleriAcik(false)
          void kameradanCek()
        }}
        onSistemSecicisi={() => {
          setGaleriAcik(false)
          void galeridenSec()
        }}
      />

      <SecimPenceresi
        acikMi={gorunurlukAcik}
        onKapat={() => setGorunurlukAcik(false)}
        secimler={[
          { etiket: t('hikaye.arkadaslar'), testID: 'hikaye-gorunurluk-arkadaslar', onSec: () => setGorunurluk('arkadaslar') },
          { etiket: t('hikaye.herkese'), testID: 'hikaye-gorunurluk-herkese', onSec: () => setGorunurluk('herkese_acik') },
        ]}
      />

      <SecimPenceresi
        acikMi={mekanAcik}
        onKapat={() => setMekanAcik(false)}
        secimler={[
          ...(mekan ? [{ etiket: t('hikaye.mekanKaldir'), yikici: true, testID: 'hikaye-mekan-kaldir', onSec: () => setMekan(null) }] : []),
          ...mekanSecenekleri.map((m) => ({
            etiket: m.ad,
            testID: `hikaye-mekan-${m.id}`,
            onSec: () => setMekan({ id: m.id, ad: m.ad }),
          })),
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

/** Ust cubuktaki koyu yuvarlak dugme (×, Aa, cikartma). */
function YuvarlakDugme({
  etiket,
  testID,
  onPress,
  children,
}: {
  etiket: string
  testID: string
  onPress: () => void
  children: ReactNode
}) {
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      testID={testID}
      style={({ pressed }) => [stiller.yuvarlakDugme, pressed && stiller.basili]}
    >
      {children}
    </Pressable>
  )
}

/** Alttaki koyu seffaf arac hapi: ikon + etiket. */
function AracHapi({ etiket, ikon, onPress, testID }: { etiket: string; ikon: ReactNode; onPress: () => void; testID: string }) {
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      testID={testID}
      style={({ pressed }) => [stiller.aracHapi, pressed && stiller.basili]}
    >
      {ikon}
      <Text style={stiller.aracYazi} numberOfLines={1}>
        {etiket}
      </Text>
    </Pressable>
  )
}

function IgneCizimi({ renk = '#FFFFFF' }: { renk?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill={renk} />
      <Circle cx={12} cy={9} r={2.4} fill="#FFFFFF" />
    </Svg>
  )
}

function GulenYuzCizimi() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.2} fill="#FFFFFF" />
      <Circle cx={15} cy={10} r={1.2} fill="#FFFFFF" />
      <Path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

function ResimCizimi() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M3.5 7.4A2.4 2.4 0 0 1 5.9 5h12.2a2.4 2.4 0 0 1 2.4 2.4v9.2a2.4 2.4 0 0 1-2.4 2.4H5.9a2.4 2.4 0 0 1-2.4-2.4V7.4z" stroke="#FFFFFF" strokeWidth={1.7} fill="none" />
      <Circle cx={9} cy={10} r={1.6} fill="#FFFFFF" />
      <Path d="M5 17l4.5-4.5 3 3 3-2.5L19 17" stroke="#FFFFFF" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
    </Svg>
  )
}

function KisiEkleCizimi() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={10} cy={8} r={3.4} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M4 19c0-3.3 2.7-5.2 6-5.2s6 1.9 6 5.2" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M18 8v5M15.5 10.5h5" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

function KisilerCizimi() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={9} cy={9} r={3.2} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M3 19c0-3.1 2.7-4.9 6-4.9s6 1.8 6 4.9" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M16 6.2a3.2 3.2 0 0 1 0 5.6M18 19c0-2.4-.9-3.9-2.4-4.6" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },
    ustGolge: { position: 'absolute', top: 0, left: 0, right: 0 },
    altGolge: { position: 'absolute', bottom: 0, left: 0, right: 0 },

    ustCubuk: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: bosluk.sayfa,
      gap: bosluk.s,
    },
    baslik: { flex: 1, textAlign: 'center', fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.govde, color: '#FFFFFF' },
    ustSag: { flexDirection: 'row', gap: bosluk.s, minWidth: 40, justifyContent: 'flex-end' },
    yuvarlakDugme: {
      width: 40,
      height: 40,
      borderRadius: yuvarlak.hap,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    kapatYazi: { fontFamily: yazi.govde, fontSize: 24, lineHeight: 26, color: '#FFFFFF' },
    aaYazi: { fontFamily: yazi.govde, fontWeight: '700', fontSize: olcek.minik, color: '#FFFFFF' },

    galeriSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
    galeriKaresi: {
      width: 56,
      height: 56,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    galeriKaresiResim: { width: '100%', height: '100%' },
    bosTuvalYazi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: 'rgba(255,255,255,0.75)' },

    // Tuval uzerindeki ogeler
    tuvalYazi: {
      fontFamily: yazi.govde,
      fontWeight: '700',
      fontSize: 26,
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowRadius: 8,
      maxWidth: 300,
    },
    tuvalIfade: { width: 88, height: 88 },
    mekanHapi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: yuvarlak.hap,
    },
    mekanYazi: { fontFamily: yazi.govde, fontWeight: '700', fontSize: olcek.govde, color: '#17130F', maxWidth: 220 },
    etiketHapi: { backgroundColor: 'rgba(255,255,255,0.85)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: yuvarlak.hap },
    etiketYazi: { fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.kucuk, color: '#17130F' },

    // Yazi girisi katmani
    yaziKatmani: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: bosluk.sayfa },
    yaziKutusu: { gap: bosluk.s },
    yaziGirdi: {
      fontFamily: yazi.govde,
      fontWeight: '700',
      fontSize: 26,
      color: '#FFFFFF',
      textAlign: 'center',
      minHeight: 80,
      maxHeight: 220,
    },
    yaziTamam: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 24, borderRadius: yuvarlak.hap, backgroundColor: renk.turuncu },
    yaziTamamYazi: { fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.govde, color: '#FFFFFF' },

    // Alt blok
    alt: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: bosluk.sayfa, gap: bosluk.s },
    hata: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: '#FFB4A2', textAlign: 'center' },
    araclar: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    /* Hap SIYAH ekranda da gorunmeli: koyu dolgu + ince aydinlik
       cerceve. Dolgu fotograf uzerinde referanstaki gibi koyu kaliyor,
       cerceve siyah zeminde kenari veriyor. Dort hap 390 px'e sigsin
       diye dolgu dar. */
    aracHapi: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      paddingVertical: 11,
      paddingHorizontal: 11,
      borderRadius: yuvarlak.hap,
    },
    aracYazi: { fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.minik, color: '#FFFFFF' },
    altSatir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    gorunurlukHapi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: yuvarlak.hap,
    },
    gorunurlukYazi: { fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.kucuk, color: '#FFFFFF', maxWidth: 120 },
    gorunurlukOk: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: '#FFFFFF' },
    paylas: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncu,
    },
    paylasPasif: { opacity: 0.5 },
    paylasYazi: { fontFamily: yazi.govde, fontWeight: '700', fontSize: olcek.govde, color: '#FFFFFF' },
    basili: { opacity: 0.85 },
  })
