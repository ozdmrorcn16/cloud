import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  AppState,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import {
  hikayeEkle,
  ANI_KART_ORANI,
  type HikayeGorunurlugu,
} from '../../../lib/hikaye'
import { aktifCheckInimiGetir } from '../../../lib/checkin'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir } from '../../../lib/mekan'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { KonumHapi } from '../../tasarim/KonumHapi'
import { HareketliDugme } from '../../tasarim/HareketliDugme'
import { AnlikArsiviIkonu } from '../../tasarim/AnlikArsiviIkonu'
import { kameraGorunumu, kameraIzinDurumu, type KameraIzinDurumu } from '../../../lib/kamera'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * ANI EKLE (2026-09-23, kullanicinin karari: "hikaye kismini
 * Instagram'in sipsak icerigi gibi yapicaz; galeriden fotograf
 * yuklenemicek, sadece anlik fotograf cekilip paylasilabilcek; ismi de
 * Anı ekle olacak"). AD 2026-09-24'te "ANLIK" oldu (kullanicinin karari):
 * "Anı" profildeki check-in gecmisiyle (Anılar) karisiyordu; ozellik
 * her ekranda ve 7 dilde tek adla (tr Anlık, en moment, fr instant...).
 *
 * GALERI YOLU TAMAMEN KALKTI: ne kucuk kare, ne alttan galeri sayfasi,
 * ne sistem secicisi, ne disaridan `?foto=` parametresi. Tek kaynak
 * ANLIK CEKIM - icerik "su an" cekilmis olmali. (`lib/galeri.ts` ve
 * `GaleriSayfasi` duruyor ama yalnizca check-in fotograflari icin.)
 *
 * CEKIM EKRANI referansa gore: ust cubuk × + "Anlık ekle", ortada
 * yuvarlatilmis canli onizleme, altta flas / YUVARLAK DEKLANSOR /
 * kamera cevirme, en altta gorunurluk hapi. Kare cekilince (2026-09-24,
 * kullanicinin tarifi) fotograf AYNI KARTTA kalir - izleyen de tam bu
 * kareyi gorur (KART_ORANI ortak); cekim dugmeleri kalkar, altta
 * check-in'den gelen mekan (kaldirilabilir) + Paylas, en altta
 * gizlilik. Paylasan YAZI, IFADE ya da ETIKET EKLEYEMEZ - ifadeyi
 * izleyen atar. × fotografi kaldirip cekim ekranina donduruyor.
 *
 * CANLI KAMERA NATIVE: modulu icermeyen eski bir derlemede (OTA ile
 * guncellenen surum) onizleme cizilmiyor ve deklansor SISTEM KAMERASINI
 * aciyor - ekran hicbir halde islevsiz kalmiyor.
 */
/** Kartin en/boy orani (3:4, kameranin kendi orani) - izleyici ve arsiv ayni sabiti kullanir. */
const KART_ORANI = ANI_KART_ORANI
/** Ust cubugun guvenli alan altindaki boyu (kart bunun altinda baslar). */
const UST_CUBUK_BOYU = 64
/** Kartin altindaki blogun (paylas satiri + gizlilik) yaklasik boyu. */
const ALT_BLOK_BOYU = 150

export default function HikayeEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const { width: ekranEni, height: ekranBoyu } = useWindowDimensions()

  const [fotografUri, setFotografUri] = useState<string | null>(null)
  const [flas, setFlas] = useState<'off' | 'on'>('off')
  // null: henuz okunmadi. Kart her durumda NE OLDUGUNU yazar (2026-09-24).
  const [kameraDurumu, setKameraDurumu] = useState<KameraIzinDurumu | null>(null)
  const kameraHazir = kameraDurumu === 'verildi'
  const [onKamera, setOnKamera] = useState(false)
  const kameraRef = useRef<{ takePictureAsync: (s?: object) => Promise<{ uri: string } | undefined> } | null>(null)
  const [mekan, setMekan] = useState<{ id: string; ad: string } | null>(null)
  const [mekanAcik, setMekanAcik] = useState(false)
  const [mekanSecenekleri, setMekanSecenekleri] = useState<{ id: string; ad: string }[] | null>(null)
  const [gorunurluk, setGorunurluk] = useState<HikayeGorunurlugu>('arkadaslar')
  const [gorunurlukAcik, setGorunurlukAcik] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    let gecerli = true
    aktifCheckInimiGetir()
      .then((c) => {
        if (gecerli && c) setMekan({ id: c.mekanId, ad: c.mekanAdi })
      })
      .catch(() => {})
    kameraIzinDurumu(true)
      .then((d) => {
        if (gecerli) setKameraDurumu(d)
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [])

  // Ayarlar'dan izin verip donunce onizleme kendiliginden acilsin:
  // uygulama one gelince izin SORMADAN yeniden okunur.
  useEffect(() => {
    const abonelik = AppState.addEventListener('change', (hal) => {
      if (hal !== 'active') return
      kameraIzinDurumu(false)
        .then((d) => setKameraDurumu((onceki) => (onceki === 'verildi' || onceki === 'modul-yok' ? onceki : d)))
        .catch(() => {})
    })
    return () => abonelik.remove()
  }, [])

  async function kameraIzniIste() {
    if (kameraDurumu === 'ayarlardan') {
      void Linking.openSettings()
      return
    }
    setKameraDurumu(await kameraIzinDurumu(true))
  }

  function geri() {
    if (router.canGoBack()) router.back()
    else router.replace('/' as never)
  }

  /** × : fotograf KALKAR ve siyah ekrana donulur (kullanicinin karari -
   *  ayri "Fotografi degistir" dugmesi yok); fotograf yoksa cikar. */
  function kapat() {
    if (fotografUri) {
      setFotografUri(null)
      return
    }
    geri()
  }

  /** Sistem kamerasi - canli onizleme olmayan (eski) derlemede. Iptal
   *  edilirse cekim ekraninda kalinir. */
  async function kameradanCek() {
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      setHata(t('hikaye.kameraIzni'))
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (sonuc.canceled || !sonuc.assets[0]) return
    setFotografUri(sonuc.assets[0].uri)
  }

  /** Yuvarlak tus: canli onizlemeden kare alir; canli kamera yoksa
   *  (eski derleme) sistem kamerasini acar. Galeri YOK. */
  async function kareCek() {
    if (!kameraRef.current) {
      void kameradanCek()
      return
    }
    try {
      const kare = await kameraRef.current.takePictureAsync({ quality: 0.8 })
      if (kare?.uri) setFotografUri(kare.uri)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }


  /** Konum sec: yakindaki mekanlar. Konum alinamazsa liste bos gelir ve
   *  pencere "yakininda mekan bulunamadi" der - sessiz kalmaz. */
  async function mekanlariAc() {
    setMekanSecenekleri(null)
    setMekanAcik(true)
    try {
      const konum = await cihazKonumunuAl()
      const liste = await yakinMekanlariGetir(konum.lat, konum.lng)
      setMekanSecenekleri(liste.slice(0, 15).map((m) => ({ id: m.id, ad: m.ad })))
    } catch {
      setMekanSecenekleri([])
    }
  }

  async function paylas() {
    if (!fotografUri || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    try {
      // Paylasan yazi, ifade ya da arkadas etiketi EKLEYEMEZ (kullanicinin
      // karari 2026-09-24); ifadeyi IZLEYEN atar (hikaye/izle.tsx).
      await hikayeEkle(fotografUri, '', mekan?.id ?? null, null, [], gorunurluk, {})
      geri()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      setGonderiliyor(false)
    }
  }

  const KameraGorunumu = kameraGorunumu() as React.ComponentType<Record<string, unknown>> | null

  // KART OLCUSU: oran SABIT (KART_ORANI) - izleyici ayni oranda ve ayni
  // kirpmayla ciziyor, yani paylasanin gordugu kare = izleyenin gordugu.
  // Kisa ekranda (SE) alttaki satirlar sigsin diye yalnizca ENI kuculur.
  const ustPay = guvenliAlan.top + UST_CUBUK_BOYU
  const altIcinYer = ALT_BLOK_BOYU + guvenliAlan.bottom
  const kartEn = Math.max(
    200,
    Math.min(ekranEni - bosluk.sayfa * 2, (ekranBoyu - ustPay - altIcinYer) * KART_ORANI)
  )

  return (
    <View style={stiller.zemin} testID="hikaye-ekle">
      <View style={[stiller.ustCubuk, { paddingTop: guvenliAlan.top + bosluk.s }]} pointerEvents="box-none">
        <YuvarlakDugme etiket={t('ortak.kapat')} testID="hikaye-kapat" onPress={kapat} sira={0}>
          <CarpiCizimi />
        </YuvarlakDugme>
        <Text style={stiller.baslik}>{t('hikaye.ekleBaslik')}</Text>
        {/* SAG USTTE ANLIK ARSIVI (kullanicinin karari 2026-09-24: "ana
            sayfada gorunmeyecek, anlik ekle sayfasinda gorunecek"). */}
        <View style={stiller.ustSag}>
          <YuvarlakDugme etiket={t('hikaye.arsivAc')} testID="anlik-arsivi" onPress={() => router.push('/anlik-arsivi' as never)} sira={1}>
            <AnlikArsiviIkonu renk="#FFFFFF" boyut={23} kalinlik={2.3} />
          </YuvarlakDugme>
        </View>
      </View>

      {/* Kart iki modda da AYNI YERDE: cekimde canli onizleme, cekimden
          sonra fotografin kendisi (kullanicinin istegi 2026-09-24:
          "fotograf cekilince bu kare icinde gorunecek, baskalari sadece
          o kareyi gorucek"). */}
      <View style={[stiller.sutun, { paddingTop: ustPay, paddingBottom: guvenliAlan.bottom + bosluk.m }]}>
        <View
          style={[stiller.kart, { width: kartEn }]}
          testID="hikaye-kart"
        >
          {fotografUri ? (
            <>
              <Image source={{ uri: fotografUri }} style={StyleSheet.absoluteFill} contentFit="cover" testID="hikaye-onizleme" />
              {/* KONUM HAPI fotografin uzerinde, altta ortada (kullanicinin
                  karari 2026-09-26: "onceki hali gibi"). */}
              <View style={stiller.konumKabi} pointerEvents="box-none">
                <KonumHapi
                  ad={mekan?.ad ?? null}
                  bosEtiket={t('hikaye.konumEkle')}
                  onPress={mekanlariAc}
                  onKaldir={() => setMekan(null)}
                  kaldirEtiketi={t('hikaye.mekanKaldir')}
                  testID="hikaye-konum"
                  metinTestID={mekan ? 'hikaye-mekan' : undefined}
                  kaldirTestID="hikaye-mekan-kaldir"
                />
              </View>
            </>
          ) : KameraGorunumu && kameraHazir ? (
            <KameraGorunumu
              ref={kameraRef}
              style={StyleSheet.absoluteFill}
              facing={onKamera ? 'front' : 'back'}
              flash={flas}
              testID="hikaye-kamera-onizleme"
            />
          ) : (
            <View style={stiller.onizlemeBos} testID="hikaye-kamera-durumu">
              <KameraCizimi />
              {kameraDurumu === 'modul-yok' && (
                <Text style={stiller.onizlemeYazi}>{t('hikaye.canliKameraYok')}</Text>
              )}
              {(kameraDurumu === 'sorulabilir' || kameraDurumu === 'ayarlardan') && (
                <>
                  <Text style={stiller.onizlemeYazi}>{t('hikaye.kameraIzniKapali')}</Text>
                  <Pressable
                    onPress={kameraIzniIste}
                    accessibilityRole="button"
                    testID="hikaye-kamera-izin"
                    style={({ pressed }) => [stiller.izinDugmesi, pressed && stiller.basili]}
                  >
                    <Text style={stiller.izinYazi}>
                      {t(kameraDurumu === 'ayarlardan' ? 'hikaye.ayarlariAc' : 'hikaye.izinVer')}
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>

        {hata && (
          <Text style={stiller.hata} testID="hikaye-hata">
            {hata}
          </Text>
        )}

        {!fotografUri ? (
          /* CEKIM: flas / deklansor / cevir. Kare gelince KALKAR. */
          <View style={stiller.cekimSatiri}>
            {kameraHazir ? (
              <YuvarlakDugme
                etiket={t('hikaye.flas')}
                testID="hikaye-flas"
                onPress={() => setFlas((f) => (f === 'on' ? 'off' : 'on'))}
                sira={2}
                buyuk
                secili={flas === 'on'}
              >
                <FlasCizimi acik={flas === 'on'} />
              </YuvarlakDugme>
            ) : (
              <View style={stiller.yanDugme} />
            )}

            <Pressable
              onPress={kareCek}
              accessibilityRole="button"
              accessibilityLabel={t('hikaye.kamera')}
              testID="hikaye-deklansor"
              style={({ pressed }) => [stiller.deklansor, pressed && stiller.deklansorBasili]}
            >
              <View style={stiller.deklansorIc} />
            </Pressable>

            {kameraHazir ? (
              <YuvarlakDugme
                etiket={t('hikaye.kamerayiCevir')}
                testID="hikaye-kamera-cevir"
                onPress={() => setOnKamera((k) => !k)}
                sira={3}
                buyuk
              >
                <CevirCizimi />
              </YuvarlakDugme>
            ) : (
              <View style={stiller.yanDugme} />
            )}
          </View>
        ) : (
          /* DUZENLEME (kullanicinin karari 2026-09-26): fotografin hemen
             altinda solda gizlilik (Arkadaslar), saginda Paylas; ikisi de
             hareketli dugme. */
          <View style={[stiller.ikiliSatir, { width: kartEn }]}>
            <HareketliDugme
              sira={0}
              onPress={() => setGorunurlukAcik(true)}
              etiket={t('hikaye.gorunurlukSec')}
              testID="hikaye-gorunurluk"
              style={stiller.griDugme}
            >
              <KisilerCizimi />
              <Text style={stiller.griDugmeYazi} numberOfLines={1}>
                {t(gorunurluk === 'herkese_acik' ? 'hikaye.herkese' : 'hikaye.arkadaslar')}
              </Text>
              <AsagiOkCizimi />
            </HareketliDugme>
            <HareketliDugme
              sira={1}
              onPress={paylas}
              disabled={gonderiliyor}
              etiket={t('hikaye.paylas')}
              testID="hikaye-paylas"
              style={[stiller.paylas, gonderiliyor && stiller.paylasPasif]}
            >
              {gonderiliyor ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stiller.paylasYazi}>{t('hikaye.paylas')}</Text>}
            </HareketliDugme>
          </View>
        )}
      </View>

      <SecimPenceresi
        acikMi={mekanAcik}
        onKapat={() => setMekanAcik(false)}
        baslik={
          <Text style={stiller.secimBasligi} testID="hikaye-konum-basligi">
            {mekanSecenekleri === null ? t('hikaye.konumAraniyor') : mekanSecenekleri.length === 0 ? t('hikaye.konumYok') : t('hikaye.konumSec')}
          </Text>
        }
        secimler={(mekanSecenekleri ?? []).map((m) => ({
          etiket: m.ad,
          testID: `hikaye-mekan-${m.id}`,
          onSec: () => setMekan({ id: m.id, ad: m.ad }),
        }))}
      />

      <SecimPenceresi
        acikMi={gorunurlukAcik}
        onKapat={() => setGorunurlukAcik(false)}
        secimler={[
          { etiket: t('hikaye.arkadaslar'), testID: 'hikaye-gorunurluk-arkadaslar', onSec: () => setGorunurluk('arkadaslar') },
          { etiket: t('hikaye.herkese'), testID: 'hikaye-gorunurluk-herkese', onSec: () => setGorunurluk('herkese_acik') },
        ]}
      />
    </View>
  )
}

/** Ust cubuk ve cekim satirindaki yuvarlak dugme (44 / 56 pt). */
function YuvarlakDugme({
  buyuk = false,
  ...digerleri
}: {
  etiket: string
  testID: string
  onPress: () => void
  children: ReactNode
  sira?: number
  buyuk?: boolean
  secili?: boolean
}) {
  const stiller = useStiller(stilleriYap)
  return <HareketliDugme {...digerleri} kucukme={0.86} style={[stiller.yuvarlakDugme, buyuk && stiller.yuvarlakBuyuk]} />
}

function CarpiCizimi() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  )
}

function KameraCizimi() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path d="M4 8h3l1.4-2h7.2L17 8h3v11H4V8z" stroke="#FFFFFF" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.6} stroke="#FFFFFF" strokeWidth={1.7} fill="none" />
    </Svg>
  )
}

function FlasCizimi({ acik }: { acik: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M13 2L5 13h5l-1 9 8-11h-5l1-9z" fill={acik ? '#FFFFFF' : 'none'} stroke="#FFFFFF" strokeWidth={1.8} strokeLinejoin="round" />
      {!acik && <Path d="M4 4l16 16" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />}
    </Svg>
  )
}

function CevirCizimi() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M4 9a8 8 0 0 1 13.3-3M20 15A8 8 0 0 1 6.7 18" stroke="#FFFFFF" strokeWidth={1.9} fill="none" strokeLinecap="round" />
      <Path d="M17.5 3.5V6.5h-3M6.5 20.5V17.5h3" stroke="#FFFFFF" strokeWidth={1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function AsagiOkCizimi() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M6 9l6 6 6-6" stroke="#FFFFFF" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function KisilerCizimi() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={9} cy={9} r={3.2} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Path d="M3 19c0-3.1 2.7-4.9 6-4.9s6 1.8 6 4.9" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M16 6.2a3.2 3.2 0 0 1 0 5.6M18 19c0-2.4-.9-3.9-2.4-4.6" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },

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
    /** Kalin (kullanicinin istegi 2026-09-25): tek dosyali fontta fontWeight
     *  telefonda islemez, KALIN AILE verilir. */
    baslik: { flex: 1, textAlign: 'center', fontFamily: yazi.ekranBasligi, fontSize: olcek.govde, color: '#FFFFFF' },
    ustSag: { flexDirection: 'row', gap: bosluk.s, minWidth: 40, justifyContent: 'flex-end' },
    yuvarlakDugme: {
      width: 44,
      height: 44,
      borderRadius: yuvarlak.hap,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    hata: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: '#FFB4A2', textAlign: 'center' },
    onizlemeBos: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: bosluk.m,
      paddingHorizontal: bosluk.xl,
    },
    onizlemeYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, lineHeight: 22, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
    izinDugmesi: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: yuvarlak.hap, backgroundColor: renk.turuncu },
    izinYazi: { fontFamily: yazi.govde, fontWeight: '700', fontSize: olcek.govde, color: '#FFFFFF' },
    cekimSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: bosluk.xl },
    // Kamera hazir degilken flas/cevir yerinde duran BOS yer tutucu
    // (deklansor ortada kalsin); gorunur dugmeler YuvarlakDugme.
    yanDugme: { width: 56, height: 56 },
    yuvarlakBuyuk: { width: 56, height: 56 },
    deklansor: {
      width: 86,
      height: 86,
      borderRadius: yuvarlak.hap,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deklansorBasili: { transform: [{ scale: 0.94 }] },
    deklansorIc: { width: 70, height: 70, borderRadius: yuvarlak.hap, backgroundColor: 'rgba(255,255,255,0.9)' },
    /** Referans (2026-09-26): koyu gri, yuvarlatilmis genis dugmeler. */
    ikiliSatir: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    griDugme: {
      flex: 1,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 14,
      borderRadius: 24,
      backgroundColor: '#242220',
    },
    griDugmeYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde + 1, color: '#FFFFFF', flexShrink: 1 },
    konumKabi: { position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center' },
    /* Tek sutun: kart + alttakiler. Kart iki modda da ayni yerde. */
    sutun: { ...StyleSheet.absoluteFill, alignItems: 'center', gap: bosluk.l, paddingHorizontal: bosluk.sayfa },
    kart: { aspectRatio: KART_ORANI, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1C1A18' },
    secimBasligi: { fontFamily: yazi.govde, fontWeight: '600', fontSize: olcek.govde, color: renk.metin, paddingHorizontal: bosluk.sayfa, paddingVertical: bosluk.s },
    paylas: {
      flex: 1,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: renk.turuncu,
    },
    paylasPasif: { opacity: 0.5 },
    paylasYazi: { fontFamily: yazi.ekranBasligi, fontSize: olcek.govde + 2, color: '#FFFFFF' },
    basili: { opacity: 0.85 },
  })
