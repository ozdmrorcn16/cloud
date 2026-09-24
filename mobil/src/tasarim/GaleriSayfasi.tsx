import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { sonFotograflariGetir, galeriKullanilabilirMi } from '../../lib/galeri'
import { SURE, useHareket, useModalHareketi } from './hareket'
import { EYLEM_GECIKMESI_MS } from './SecimPenceresi'
import { yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * GALERI SAYFASI - alttan gelen koyu sayfa: ILK KARE KAMERA (dokununca
 * canli cekim), arkasindan telefonun son fotograflari 3 sutunlu
 * izgarada. Parmakla asagi cekilerek kapaniyor (`useModalHareketi` +
 * PanGestureHandler).
 *
 * KULLANIM YERI (2026-09-23, kullanicinin karari "check-in duzenleme ve
 * yeni check-in kisminda ayni galeri akisini kullanicaz"): CHECK-IN
 * formu ve "Check-in'i duzenle" - ikisi de `FotografIzgarasiDuzenle`
 * uzerinden. Hikaye ("Anlık ekle") artik galeri KULLANMIYOR, yalnizca
 * anlik cekim; bu sayfa oradan cikti. Mekan duzenleme, sikayet ve
 * profil fotografi eski Kamera/Galeri penceresinde kaldi (kullanicinin
 * "obur yerlerde galeri yolu ayni kalicak" kurali).
 *
 * `enFazla > 1` iken izgara COKLU SECIM yapiyor: kareler numarali
 * rozetle isaretleniyor, altta "Ekle (N)" cubugu cikiyor. `enFazla`
 * 1 iken (Degistir) dokunmak fotografi aninda secer.
 *
 * Izgara `expo-media-library` istiyor; modul yoksa (OTA ile guncellenen
 * eski derleme) yalnizca kamera karesi ve "Galeriden sec" satiri
 * kaliyor, sistem secicisi aciliyor - ekran bos kalmiyor.
 *
 * MODAL TUZAGI (kullanicinin bildirimi 2026-09-23 "basinca da galeri
 * direkt acilmiyor / acilmiyor"): iOS acik bir Modal'in USTUNE ikinci
 * bir pencere SUNAMAZ; sayfa kapanma animasyonunu bitirmeden kamera ya
 * da sistem galerisi cagrilinca hicbir sey olmuyordu. Bu yuzden secim
 * once sayfayi kapatiyor, eylem sayfa AGACTAN KALKTIKTAN sonra
 * kosuyor - `SecimPenceresi`deki kanitlanmis desenin aynisi.
 */

const KAPANMA_HIZI = 800

export function GaleriSayfasi({
  acikMi,
  onKapat,
  onFotograf,
  onKamera,
  onSistemSecicisi,
  enFazla = 1,
}: {
  acikMi: boolean
  onKapat: () => void
  /** Secilen fotograflarin yerel adresleri (tekli secimde tek ogeli). */
  onFotograf: (uriler: string[]) => void
  /** Kamera karesi. */
  onKamera: () => void
  /** Izgara yokken kullanilan sistem secicisi. */
  onSistemSecicisi: () => void
  /** En fazla kac fotograf secilebilir; 1 ise dokunus aninda secer. */
  enFazla?: number
}) {
  const { t } = useDil()
  const hareket = useHareket()
  const guvenliAlan = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)

  const [fotograflar, setFotograflar] = useState<{ id: string; uri: string }[]>([])
  const [izgaraVar, setIzgaraVar] = useState(false)
  const [secilenler, setSecilenler] = useState<string[]>([])

  // Sayfa kapandiktan SONRA kosacak eylem (native pencere acanlar).
  const bekleyenEylem = useRef<(() => void) | null>(null)
  function sec(eylem: () => void) {
    bekleyenEylem.current = eylem
    onKapat()
  }
  useEffect(() => {
    if (gorunur || !bekleyenEylem.current) return
    const eylem = bekleyenEylem.current
    bekleyenEylem.current = null
    const zamanlayici = setTimeout(eylem, EYLEM_GECIKMESI_MS)
    return () => clearTimeout(zamanlayici)
  }, [gorunur])

  useEffect(() => {
    if (!acikMi) return
    setSecilenler([])
    let gecerli = true
    if (!galeriKullanilabilirMi()) {
      setIzgaraVar(false)
      return
    }
    sonFotograflariGetir(60)
      .then((liste) => {
        if (!gecerli) return
        setFotograflar(liste)
        setIzgaraVar(liste.length > 0)
      })
      .catch(() => gecerli && setIzgaraVar(false))
    return () => {
      gecerli = false
    }
  }, [acikMi])

  const sayfaBoyu = Math.round(height * 0.72)
  const surukleme = useRef(new Animated.Value(0)).current
  const suruklemeOlayi = useRef(
    Animated.event([{ nativeEvent: { translationY: surukleme } }], { useNativeDriver: true })
  ).current

  if (!gorunur) return null

  const ARA = 2
  const kare = Math.floor((width - ARA * 2) / 3)
  const cokluMu = enFazla > 1

  /** Izgaradan bir kareye dokunmak: tekli secimde aninda gonderir,
   *  coklu secimde isaretler/kaldirir (tavana ulasinca yenisini almaz). */
  function kareyeDokun(uri: string) {
    if (!cokluMu) {
      onFotograf([uri])
      return
    }
    setSecilenler((onceki) => {
      if (onceki.includes(uri)) return onceki.filter((u) => u !== uri)
      if (onceki.length >= enFazla) return onceki
      return [...onceki, uri]
    })
  }

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [sayfaBoyu, 0] })
  const suruklemeY = surukleme.interpolate({
    inputRange: [-200, 0, sayfaBoyu],
    outputRange: [-28, 0, sayfaBoyu],
    extrapolate: 'clamp',
  })
  const toplamY = Animated.add(girisY, suruklemeY)

  function suruklemeBitti(e: PanGestureHandlerStateChangeEvent) {
    if (e.nativeEvent.oldState !== State.ACTIVE) return
    const { translationY, velocityY } = e.nativeEvent
    if (velocityY > KAPANMA_HIZI || translationY > sayfaBoyu / 3) {
      onKapat()
      return
    }
    if (!hareket) {
      surukleme.setValue(0)
      return
    }
    Animated.spring(surukleme, { toValue: 0, velocity: velocityY / 1000, speed: 22, bounciness: 4, useNativeDriver: true }).start()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      {/* ANDROID: Modal icerigi AYRI bir native hiyerarside aciliyor ve
          koktekii GestureHandlerRootView'in disinda kaliyor - sarmadan
          PanGestureHandler olay ALMIYOR, yani parmakla kapatma
          calismiyor (RNGH 2.32 kaynagi: Android'de kok NATIVE bir
          bilesen, iOS'ta duz View - bu yuzden iPhone'da sorun
          gorunmuyordu). Sarmak iOS'ta zararsiz. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="galeri-zemini" onPress={onKapat}>
        <PanGestureHandler onGestureEvent={suruklemeOlayi} onHandlerStateChange={suruklemeBitti} activeOffsetY={6}>
          <Animated.View style={[stiller.sayfa, { height: sayfaBoyu, transform: [{ translateY: toplamY }] }]}>
            <Pressable style={stiller.ic} onPress={() => {}} accessibilityViewIsModal testID="galeri-sayfasi">
              <View style={stiller.tutamac} />
              <Text style={stiller.baslik}>
                {t(izgaraVar ? 'galeri.sonFotograflar' : 'galeri.baslik')}
              </Text>

              <FlatList
                data={fotograflar}
                keyExtractor={(f) => f.id}
                numColumns={3}
                columnWrapperStyle={{ gap: ARA }}
                contentContainerStyle={{ gap: ARA, paddingBottom: guvenliAlan.bottom + bosluk.m }}
                ListHeaderComponent={
                  /* Izgara yoksa kamera karesi tek basina anlamli
                     kalmiyor; sistem secicisi satiri da geliyor. */
                  !izgaraVar ? (
                    <Pressable
                      onPress={() => sec(onSistemSecicisi)}
                      accessibilityRole="button"
                      testID="galeri-sistem"
                      style={({ pressed }) => [stiller.sistemSatiri, pressed && stiller.basili]}
                    >
                      <Text style={stiller.sistemYazi}>{t('galeri.galeridenSec')}</Text>
                      <Text style={stiller.sistemOk}>›</Text>
                    </Pressable>
                  ) : null
                }
                ListEmptyComponent={
                  <Pressable
                    onPress={() => sec(onKamera)}
                    accessibilityRole="button"
                    accessibilityLabel={t('galeri.kamera')}
                    testID="galeri-kamera"
                    style={[stiller.kameraKaresi, { width: kare, height: kare }]}
                  >
                    <KameraCizimi />
                  </Pressable>
                }
                renderItem={({ item, index }) =>
                  index === 0 ? (
                    /* ILK SIRA KAMERA + ilk fotograf yan yana dursun
                       diye kamera karesi ilk hucrenin yerine geciyor ve
                       fotograf bir sonraki hucreye kayiyor. */
                    <View style={stiller.ilkSira}>
                      <Pressable
                        onPress={() => sec(onKamera)}
                        accessibilityRole="button"
                        accessibilityLabel={t('galeri.kamera')}
                        testID="galeri-kamera"
                        style={[stiller.kameraKaresi, { width: kare, height: kare }]}
                      >
                        <KameraCizimi />
                      </Pressable>
                      <View style={{ marginLeft: ARA }}>
                        <Kare
                          uri={item.uri}
                          id={item.id}
                          boy={kare}
                          sira={cokluMu ? secilenler.indexOf(item.uri) : -1}
                          onDokun={kareyeDokun}
                        />
                      </View>
                    </View>
                  ) : (
                    <Kare
                      uri={item.uri}
                      id={item.id}
                      boy={kare}
                      sira={cokluMu ? secilenler.indexOf(item.uri) : -1}
                      onDokun={kareyeDokun}
                    />
                  )
                }
              />

              {cokluMu && secilenler.length > 0 && (
                <View style={[stiller.ekleCubugu, { paddingBottom: guvenliAlan.bottom + bosluk.s }]}>
                  <Pressable
                    onPress={() => onFotograf(secilenler)}
                    accessibilityRole="button"
                    testID="galeri-ekle"
                    style={({ pressed }) => [stiller.ekleDugmesi, pressed && stiller.basili]}
                  >
                    <Text style={stiller.ekleYazi}>
                      {t('galeri.ekle', { adet: String(secilenler.length) })}
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </Pressable>
      </GestureHandlerRootView>
    </Modal>
  )
}

/** Izgaradaki tek fotograf; `sira` >= 0 ise coklu secimde kacinci. */
function Kare({
  uri,
  id,
  boy,
  sira,
  onDokun,
}: {
  uri: string
  id: string
  boy: number
  sira: number
  onDokun: (uri: string) => void
}) {
  return (
    <Pressable
      onPress={() => onDokun(uri)}
      accessibilityRole="button"
      accessibilityState={{ selected: sira >= 0 }}
      testID={`galeri-${id}`}
      style={{ width: boy, height: boy }}
    >
      <Image source={{ uri }} style={stiller.resim} contentFit="cover" />
      {sira >= 0 && (
        <>
          <View style={stiller.seciliOrtu} />
          <View style={stiller.rozet}>
            <Text style={stiller.rozetYazi}>{sira + 1}</Text>
          </View>
        </>
      )}
    </Pressable>
  )
}

function KameraCizimi() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24">
      <Path d="M4 8h3l1.4-2h7.2L17 8h3v11H4V8z" stroke="#FFFFFF" strokeWidth={1.7} fill="none" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.6} stroke="#FFFFFF" strokeWidth={1.7} fill="none" />
    </Svg>
  )
}

const stiller = StyleSheet.create({
  zeminRenk: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  zemin: { flex: 1, justifyContent: 'flex-end' },
  sayfa: { backgroundColor: '#17130F', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  ic: { flex: 1 },
  tutamac: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: yuvarlak.hap,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: bosluk.s,
  },
  baslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
    paddingHorizontal: bosluk.sayfa,
    paddingVertical: bosluk.s,
  },
  ilkSira: { flexDirection: 'row' },
  kameraKaresi: { backgroundColor: '#3A342F', alignItems: 'center', justifyContent: 'center' },
  resim: { width: '100%', height: '100%' },
  seciliOrtu: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(254,120,19,0.28)' },
  rozet: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: '#FE7813',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#FFFFFF' },
  ekleCubugu: {
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.s,
    backgroundColor: '#17130F',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  ekleDugmesi: {
    height: 48,
    borderRadius: yuvarlak.hap,
    backgroundColor: '#FE7813',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ekleYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  sistemSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.sayfa,
    paddingVertical: bosluk.m,
  },
  sistemYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: '#FFFFFF' },
  sistemOk: { fontFamily: yazi.govde, fontSize: 22, color: 'rgba(255,255,255,0.6)' },
  basili: { opacity: 0.85 },
})
