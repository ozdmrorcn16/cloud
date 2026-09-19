import type { ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

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

export function SecimPenceresi({
  acikMi,
  secimler,
  onKapat,
}: {
  acikMi: boolean
  secimler: Secim[]
  onKapat: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()

  if (!acikMi) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKapat}>
      <Pressable style={stiller.zemin} testID="secim-zemini" onPress={onKapat}>
        <Pressable
          style={stiller.pencere}
          testID="secim-penceresi"
          onPress={() => {}}
          accessibilityViewIsModal
        >
          {secimler.map((secim, sira) => (
            <View key={secim.testID ?? secim.etiket}>
              {sira > 0 && <View style={stiller.ayirac} />}
              <Pressable
                style={stiller.satir}
                testID={secim.testID}
                onPress={secim.onSec}
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
            </View>
          ))}

          <View style={stiller.ayirac} />
          <Pressable style={stiller.satir} onPress={onKapat} accessibilityRole="button">
            <Text style={[stiller.yazi, stiller.vazgec]}>{t('ortak.vazgec')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  zemin: {
    flex: 1,
    backgroundColor: 'rgba(23, 19, 15, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: bosluk.xl,
  },
  pencere: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    overflow: 'hidden',
  },
  // 44 pt asgari dokunma hedefi.
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.l,
    paddingHorizontal: bosluk.sayfa,
  },
  yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yikici: { color: renk.yikici },
  pasif: { color: renk.metinSoluk },
  vazgec: { color: renk.metinIkincil },
  ayirac: { height: StyleSheet.hairlineWidth, backgroundColor: renk.cizgi },
})
