import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { PanGestureHandler, State, type PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler'
import Svg, { Circle, Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { EGRI, SURE, useHareket, useModalHareketi } from './hareket'

/**
 * UC NOKTA MENUSU - ortak.
 *
 * Kullanicinin karari (2026-09-02): kendi paylasiminin islemleri
 * baslikta tek bir uc nokta ikonunun icinde toplaniyor. Ayni desen
 * yorumlarda da kullaniliyor (Sil / Şikâyet et), bu yuzden bilesen
 * paylasima ozel degil: gosterilecek secimler disaridan geliyor.
 *
 * `Alert.alert` DEGIL, kendi Modal'imiz. Sebep: uygulama web'de de
 * calisiyor (slooin.expo.app) ve React Native Web'de Alert sessizce
 * hicbir sey yapmiyor (bkz. OnayPenceresi'ndeki ayni gerekce).
 *
 * Yikici secim (Sil, Şikâyet et) kirmizi ve genelde ONAY PENCERESI
 * aciyor - menuden secmek isi yapmiyor, yalnizca soruyor.
 *
 * ALTTAN GELEN SAYFA (2026-09-20, kullanicinin onayladigi ornek):
 * onceden ekranin ortasinda `fade` ile beliriyordu - nereden geldigi
 * belli degildi. Simdi alttan geliyor (iOS cekmece egrisi, 320 ms),
 * ayni kenardan gidiyor (240 ms), tutamactan asagi surukleyip
 * birakinca kapaniyor: hizli bir fiske ya da yuksekliginin ucte biri
 * yeter; yukari cekmek lastik gibi direnir. Surukleme native driver'da
 * (`Animated.event`), JS is parcacigina hic dokunmaz.
 */

/**
 * Baslik satirindaki uc nokta.
 *
 * Boyut ve renk ISTEGE BAGLI; varsayilanlar (18 px, soluk) degismedi -
 * akis kartindaki ve yorumlardaki menuler oyle. Baskasinin profilinde
 * (2026-09-17) ikon tek basina bir dugme oldugu icin daha buyuk ve
 * daha koyu veriliyor: kullanici "daha belirgin olsun" dedi.
 */
export function UcNoktaIkonu({ boyut = 18, renk: verilen }: { boyut?: number; renk?: string } = {}) {
  const renk = useRenk()
  const c = verilen ?? renk.metinSoluk
  // viewBox sabit (24): noktalarin yaricapi da sabit kaliyor, ikon
  // `boyut` ile birlikte orantili buyuyor.
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.7} fill={c} />
      <Circle cx={12} cy={12} r={1.7} fill={c} />
      <Circle cx={19} cy={12} r={1.7} fill={c} />
    </Svg>
  )
}

export function KalemIkonu() {
  const renk = useRenk()
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M4 20h4l10-10-4-4L4 16v4z M13.5 6.5l4 4"
        stroke={renk.metin}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function CopIkonu() {
  const renk = useRenk()
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12"
        stroke={renk.yikici}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function BayrakIkonu() {
  const renk = useRenk()
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M6 21V4M6 4h11l-2 3.5L17 11H6"
        stroke={renk.yikici}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export type Secim = {
  etiket: string
  testID?: string
  ikon?: ReactNode
  /** Kirmizi gosterilir. */
  yikici?: boolean
  /** Basilamaz, soluk: yapilmis bir eylemin izi ("Sikayet edildi"). */
  pasif?: boolean
  onSec: () => void
}

/** Sayfa yuksekligi olculmeden once girisin basladigi varsayilan uzaklik. */
const VARSAYILAN_YUKSEKLIK = 420

/** Menu Modal'i kalktiktan sonra eylemin kosmasina kadar beklenen sure. */
export const EYLEM_GECIKMESI_MS = 80

export function SecimPenceresi({
  acikMi,
  secimler,
  baslik,
  onKapat,
}: {
  acikMi: boolean
  secimler: Secim[]
  /** Tutamacin altinda, satirlarin ustunde istege bagli baslik (ornegin kisi karti). */
  baslik?: ReactNode
  onKapat: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const hareket = useHareket()
  const { gorunur, ilerleme } = useModalHareketi(acikMi, SURE.sayfaGiris, SURE.sayfaCikis)

  /*
   * SECIM ONCE MENUYU KAPATIR, EYLEM MENU KALKINCA CALISIR (kullanicinin
   * bildirimi 2026-09-20: baskasinin profilindeki uc nokta menusunun
   * islevleri hatali). Onceden satir dogrudan `onSec`i cagiriyor ve
   * menu ACIK KALIYORDU: iOS'ta bu Modal'in ustune ikinci bir Modal
   * (engelleme onayi) SUNULAMIYOR - onay hic cikmiyordu; sayfa gecisi
   * (sikayet) menunun arkasinda kaliyordu; paylasim sayfasi kapaninca
   * menu duruyordu. Eylem `gorunur` false olunca, yani Modal agactan
   * kalktiktan sonra kosuyor: ardisik Modal, push ve Share temiz acilir.
   * Ekranlarin kendi kapatma cagrilari (setX(false)) zararsiz.
   */
  const bekleyenEylem = useRef<(() => void) | null>(null)
  function sec(secim: Secim) {
    bekleyenEylem.current = secim.onSec
    onKapat()
  }
  useEffect(() => {
    if (gorunur || !bekleyenEylem.current) return
    const eylem = bekleyenEylem.current
    bekleyenEylem.current = null
    // BIR KARE BEKLE (kullanicinin bildirimi 2026-09-20: "Profili
    // paylas'a bastim hicbir sey olmadi"): Modal'in agactan kalkmasi
    // native'e UIManager toplu isiyle gidiyor, ayni turda cagrilan
    // Share.share ise dogrudan; paylasim sayfasi henuz kapanmamis menu
    // VC'sinden sunulup onunla birlikte kapaniyordu. Kisa gecikme
    // Modal'in gercekten dismiss olmasini garanti ediyor.
    const zamanlayici = setTimeout(eylem, EYLEM_GECIKMESI_MS)
    return () => clearTimeout(zamanlayici)
  }, [gorunur])

  // Surukleme: parmak sayfayi asagi ceker. Yukari cekiste lastik direnc:
  // -200 birim cekis yalnizca -28 birim hareket ettirir.
  const [yukseklik, setYukseklik] = useState(VARSAYILAN_YUKSEKLIK)
  const surukleme = useRef(new Animated.Value(0)).current
  const suruklemeOlayi = useRef(
    Animated.event([{ nativeEvent: { translationY: surukleme } }], { useNativeDriver: true })
  ).current

  if (!gorunur) return null

  const girisY = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [yukseklik, 0] })
  const suruklemeY = surukleme.interpolate({
    inputRange: [-200, 0, yukseklik],
    outputRange: [-28, 0, yukseklik],
    extrapolate: 'clamp',
  })
  const toplamY = Animated.add(girisY, suruklemeY)

  function suruklemeBitti(e: PanGestureHandlerStateChangeEvent) {
    if (e.nativeEvent.oldState !== State.ACTIVE) return
    const { translationY, velocityY } = e.nativeEvent
    // Fiske (hiz) YA DA mesafe yeter - ikisi de gerekmez.
    const kapat = velocityY > 800 || translationY > yukseklik / 3
    if (kapat) {
      // Surukleme degerini oldugu yerde birakip cikisi ebeveyne devret:
      // useModalHareketi kalan yolu 240 ms'de tamamlar.
      onKapat()
      return
    }
    if (!hareket) {
      surukleme.setValue(0)
      return
    }
    // Parmak biraktiysa spring: hiz tasinir, yerine oturur.
    Animated.spring(surukleme, {
      toValue: 0,
      velocity: velocityY / 1000,
      speed: 22,
      bounciness: 4,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={onKapat}>
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      <Pressable style={stiller.zemin} testID="secim-zemini" onPress={onKapat}>
        <PanGestureHandler onGestureEvent={suruklemeOlayi} onHandlerStateChange={suruklemeBitti} activeOffsetY={6}>
          <Animated.View
            style={[
              stiller.sayfa,
              { paddingBottom: Math.max(guvenliAlan.bottom, bosluk.s) + bosluk.s, transform: [{ translateY: toplamY }] },
            ]}
            onLayout={(e) => setYukseklik(e.nativeEvent.layout.height)}
          >
            {/* Icerige dokunmak kapatmamali; bos onPress dokunusu zemine gecirmez. */}
            <Pressable testID="secim-penceresi" onPress={() => {}} accessibilityViewIsModal>
              <View style={stiller.tutamac} />
              {baslik}
              {secimler.map((secim) => (
                <Pressable
                  key={secim.testID ?? secim.etiket}
                  style={({ pressed }) => [stiller.satir, pressed && !secim.pasif && stiller.satirBasili]}
                  testID={secim.testID}
                  onPress={() => sec(secim)}
                  disabled={secim.pasif}
                  accessibilityRole="button"
                  accessibilityState={secim.pasif ? { disabled: true } : undefined}
                >
                  {secim.ikon}
                  <Text
                    style={[
                      stiller.yazi,
                      secim.yikici && stiller.yikici,
                      secim.pasif && stiller.pasif,
                    ]}
                  >
                    {secim.etiket}
                  </Text>
                </Pressable>
              ))}

              <View style={stiller.ayirac} />
              <Pressable
                style={({ pressed }) => [stiller.satir, pressed && stiller.satirBasili]}
                onPress={onKapat}
                accessibilityRole="button"
              >
                <Text style={[stiller.yazi, stiller.vazgec]}>{t('ortak.vazgec')}</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  zeminRenk: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.55)',
  },
  zemin: { flex: 1, justifyContent: 'flex-end' },
  sayfa: {
    backgroundColor: renk.yuzey,
    borderTopLeftRadius: yuvarlak.buyuk,
    borderTopRightRadius: yuvarlak.buyuk,
    paddingHorizontal: bosluk.s,
    paddingTop: bosluk.s,
  },
  tutamac: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: renk.cizgi,
    marginBottom: bosluk.s,
  },
  // 44 pt asgari dokunma hedefi. Satirlar yuvarlak: basili hali zemin
  // renginin koyulasmasi (turuncuZemin), opaklik degil.
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.l,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.kart,
  },
  satirBasili: { backgroundColor: renk.turuncuZemin },
  yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yikici: { color: renk.yikici },
  pasif: { color: renk.metinSoluk },
  vazgec: { color: renk.metinIkincil },
  ayirac: { height: StyleSheet.hairlineWidth, backgroundColor: renk.cizgi, marginVertical: bosluk.xs },
})
