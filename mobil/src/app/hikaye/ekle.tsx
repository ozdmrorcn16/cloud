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
  AppState,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
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
import { kameraGorunumu, kameraIzinDurumu, type KameraIzinDurumu } from '../../../lib/kamera'
import { IfadeSecici } from '../../tasarim/IfadeSecici'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { HikayeOgesi } from '../../tasarim/HikayeOgesi'
import { ifadeBul } from '../../../lib/ifadeler'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * ANI EKLE (2026-09-23, kullanicinin karari: "hikaye kismini
 * Instagram'in sipsak icerigi gibi yapicaz; galeriden fotograf
 * yuklenemicek, sadece anlik fotograf cekilip paylasilabilcek; ismi de
 * Anı ekle olacak").
 *
 * GALERI YOLU TAMAMEN KALKTI: ne kucuk kare, ne alttan galeri sayfasi,
 * ne sistem secicisi, ne disaridan `?foto=` parametresi. Tek kaynak
 * ANLIK CEKIM - icerik "su an" cekilmis olmali. (`lib/galeri.ts` ve
 * `GaleriSayfasi` duruyor ama yalnizca check-in fotograflari icin.)
 *
 * CEKIM EKRANI referansa gore: ust cubuk × + "Anı ekle", ortada
 * yuvarlatilmis canli onizleme, altta flas / YUVARLAK DEKLANSOR /
 * kamera cevirme, en altta gorunurluk hapi. Kare cekilince ekran
 * DUZENLEME moduna geciyor: fotograf tam ekran, sol rafta Not/Mekan/
 * Ifade/Etiketle, altta Arkadaslar + Paylas. × fotografi kaldirip
 * cekim ekranina donduruyor.
 *
 * CANLI KAMERA NATIVE: modulu icermeyen eski bir derlemede (OTA ile
 * guncellenen surum) onizleme cizilmiyor ve deklansor SISTEM KAMERASINI
 * aciyor - ekran hicbir halde islevsiz kalmiyor.
 */
export default function HikayeEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()

  const [fotografUri, setFotografUri] = useState<string | null>(null)
  const [flas, setFlas] = useState<'off' | 'on'>('off')
  // null: henuz okunmadi. Kart her durumda NE OLDUGUNU yazar (2026-09-24).
  const [kameraDurumu, setKameraDurumu] = useState<KameraIzinDurumu | null>(null)
  const kameraHazir = kameraDurumu === 'verildi'
  const [onKamera, setOnKamera] = useState(false)
  const kameraRef = useRef<{ takePictureAsync: (s?: object) => Promise<{ uri: string } | undefined> } | null>(null)
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
      setYerlesim({})
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
  // Canli onizleme bileseni: modul yoksa null (eski derleme).
  const KameraGorunumu = kameraGorunumu() as React.ComponentType<Record<string, unknown>> | null
  const ifadeKaynagi = ifade ? (ifadeBul(ifade)?.kaynak ?? null) : null

  return (
    <View style={stiller.zemin} testID="hikaye-ekle">
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(o) => setAlan({ en: o.nativeEvent.layout.width, boy: o.nativeEvent.layout.height })}
      >
        {/* Canli kamera BURADA DEGIL, yalnizca cekim modundaki yuvarlatilmis
            kartta: ikisi birden cizilince ayni ref'i paylasan IKI kamera
            oturumu aciliyordu (test yakaladi, 2026-09-24). */}
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

      {/* CEKIM MODU (fotograf yok): ortada yuvarlatilmis canli onizleme,
          altta flas / deklansor / kamera cevirme, en altta gorunurluk.
          Galeri yolu YOK - icerik anlik cekilmis olmali. */}
      {!fotografUri && (
        <View style={[stiller.cekimKabi, { paddingBottom: guvenliAlan.bottom + bosluk.l }]} pointerEvents="box-none">
          <View style={stiller.onizlemeKarti}>
            {KameraGorunumu && kameraHazir ? (
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

          <View style={stiller.cekimSatiri}>
            {kameraHazir ? (
              <Pressable
                onPress={() => setFlas((f) => (f === 'on' ? 'off' : 'on'))}
                accessibilityRole="button"
                accessibilityState={{ selected: flas === 'on' }}
                accessibilityLabel={t('hikaye.flas')}
                testID="hikaye-flas"
                style={({ pressed }) => [stiller.yanDugme, pressed && stiller.basili]}
              >
                <FlasCizimi acik={flas === 'on'} />
              </Pressable>
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
              <Pressable
                onPress={() => setOnKamera((k) => !k)}
                accessibilityRole="button"
                accessibilityLabel={t('hikaye.kamerayiCevir')}
                testID="hikaye-kamera-cevir"
                style={({ pressed }) => [stiller.yanDugme, pressed && stiller.basili]}
              >
                <CevirCizimi />
              </Pressable>
            ) : (
              <View style={stiller.yanDugme} />
            )}
          </View>

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
        </View>
      )}

      {/* DUZENLEME MODU (kare cekildi): sol raf + alt satir. */}
      {fotografUri && (
        <>
          <View style={stiller.solRafKabi} pointerEvents="box-none">
            <View style={stiller.solRaf} testID="hikaye-araclar">
              <AracIkonu etiket={t('hikaye.notEkle')} testID="hikaye-arac-not" onPress={() => setNotAcik(true)} ikon={<Text style={stiller.aaYazi}>Aa</Text>} />
              <AracIkonu etiket={t('hikaye.mekanEkle')} testID="hikaye-arac-mekan" onPress={mekanlariAc} ikon={<IgneCizimi renk="#FFFFFF" boyut={28} />} />
              <AracIkonu etiket={t('hikaye.ifadeEkle')} testID="hikaye-arac-ifade" onPress={() => setIfadeAcik(true)} ikon={<GulenYuzCizimi />} />
              <AracIkonu etiket={t('hikaye.etiketle')} testID="hikaye-arac-arkadas" onPress={() => setArkadasAcik(true)} ikon={<KisiEkleCizimi />} />
            </View>
          </View>

          <View style={[stiller.alt, { paddingBottom: guvenliAlan.bottom + bosluk.m }]} pointerEvents="box-none">
            {hata && (
              <Text style={stiller.hata} testID="hikaye-hata">
                {hata}
              </Text>
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
                disabled={gonderiliyor}
                accessibilityRole="button"
                accessibilityState={{ disabled: gonderiliyor }}
                testID="hikaye-paylas"
                style={({ pressed }) => [stiller.paylas, gonderiliyor && stiller.paylasPasif, pressed && stiller.basili]}
              >
                {gonderiliyor ? <ActivityIndicator color="#FFFFFF" /> : <Text style={stiller.paylasYazi}>{t('hikaye.paylas')}</Text>}
              </Pressable>
            </View>
          </View>
        </>
      )}

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

/**
 * Sol raftaki arac (2026-09-23 referansi): IKON + YANINDA YAZI, hap
 * yok. Ikon sabit genislikte bir sutunda ORTALI, yazilar boylece ortak
 * bir hizada basliyor ('Aa' genis, igne dar oldugu icin hizasiz
 * gorunuyordu).
 */
function AracIkonu({ etiket, ikon, onPress, testID }: { etiket: string; ikon: ReactNode; onPress: () => void; testID: string }) {
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={etiket}
      testID={testID}
      style={({ pressed }) => [stiller.aracSatiri, pressed && stiller.basili]}
    >
      <View style={stiller.aracIkonu}>{ikon}</View>
      <Text style={stiller.aracYazi} numberOfLines={1}>
        {etiket}
      </Text>
    </Pressable>
  )
}

function IgneCizimi({ renk = '#FFFFFF', boyut = 16 }: { renk?: string; boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill={renk} />
      <Circle cx={12} cy={9} r={2.4} fill="#FFFFFF" />
    </Svg>
  )
}

function GulenYuzCizimi() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.2} fill="#FFFFFF" />
      <Circle cx={15} cy={10} r={1.2} fill="#FFFFFF" />
      <Path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" />
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

function KisiEkleCizimi() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
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
    aaYazi: { fontFamily: yazi.govde, fontWeight: '700', fontSize: 24, color: '#FFFFFF' },


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
    /* SOL RAF (2026-09-23 referansi): araclar solda, yukaridan asagiya.
       `alignItems: flex-start` haplari icerikleri kadar birakiyor. */
    solRafKabi: {
      position: 'absolute',
      left: bosluk.sayfa,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    solRaf: { alignItems: 'flex-start', gap: bosluk.xs },
    /* Referans duzeni: [ikon sutunu][yazi], hap YOK. Ikon sabit
       genislikte kutuda ORTALI, yazilar boylece ortak hizada basliyor
       ('Aa' genis, igne dar oldugu icin hizasiz goruniyordu). */
    aracSatiri: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
    aracIkonu: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    aracYazi: {
      fontFamily: yazi.govde,
      fontWeight: '600',
      fontSize: 16,
      color: '#FFFFFF',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowRadius: 6,
    },
    /* CEKIM MODU (referans duzeni): onizleme ortada, altinda
       flas / deklansor / cevir, en altta gorunurluk hapi. */
    cekimKabi: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      gap: bosluk.xl,
      paddingHorizontal: bosluk.sayfa,
    },
    onizlemeKarti: {
      width: '100%',
      aspectRatio: 0.88,
      borderRadius: 44,
      overflow: 'hidden',
      backgroundColor: '#1C1A18',
    },
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
    yanDugme: {
      width: 56,
      height: 56,
      borderRadius: yuvarlak.hap,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
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
