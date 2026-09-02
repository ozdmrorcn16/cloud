import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, renk, yazi, yuvarlak } from './tema'

/**
 * KENDI PAYLASIMININ SECENEK MENUSU.
 *
 * Kullanicinin karari (2026-09-02): "duzenle ucnokta olsun silmeyide uc
 * noktanin icine ekle". Yani baslik satirinda TEK ikon var (uc nokta) ve
 * hem duzenleme hem silme onun icinden geciyor.
 *
 * Onceki hal baslikta yalnizca cop kutusuydu. Iki kazanci var: baslik
 * satiri kalabaliklasmadan yeni bir islem eklenebiliyor, ve SILME BIR
 * ADIM GERIYE gidiyor - geri alinamayan bir islem icin dogrusu bu.
 * Silme yine de tek dokunusla olmuyor: menuden sonra onay penceresi
 * aciliyor.
 *
 * `Alert.alert` DEGIL, kendi Modal'imiz - React Native Web'de Alert
 * sessizce hicbir sey yapmiyor ve uygulama web'de de calisiyor
 * (bkz. OnayPenceresi'ndeki ayni gerekce).
 */

const YIKICI = '#C0392B'

/** Baslik satirindaki uc nokta. */
export function UcNoktaIkonu() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={5} cy={12} r={1.7} fill={renk.metinSoluk} />
      <Circle cx={12} cy={12} r={1.7} fill={renk.metinSoluk} />
      <Circle cx={19} cy={12} r={1.7} fill={renk.metinSoluk} />
    </Svg>
  )
}

function KalemIkonu() {
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

function CopIkonu() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12"
        stroke={YIKICI}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function PaylasimMenusu({
  acikMi,
  onDuzenle,
  onSil,
  onKapat,
}: {
  acikMi: boolean
  /** Verilmezse "Düzenle" satiri hic cizilmez. */
  onDuzenle?: () => void
  /** Verilmezse "Sil" satiri hic cizilmez. */
  onSil?: () => void
  onKapat: () => void
}) {
  const { t } = useDil()

  if (!acikMi) return null

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onKapat}>
      <Pressable style={stiller.zemin} testID="menu-zemini" onPress={onKapat}>
        <Pressable
          style={stiller.pencere}
          testID="paylasim-menusu"
          onPress={() => {}}
          accessibilityViewIsModal
        >
          {onDuzenle && (
            <Pressable
              style={stiller.satir}
              testID="menu-duzenle"
              onPress={onDuzenle}
              accessibilityRole="button"
            >
              <KalemIkonu />
              <Text style={stiller.yazi}>{t('anaSayfa.duzenle')}</Text>
            </Pressable>
          )}

          {onDuzenle && onSil && <View style={stiller.ayirac} />}

          {onSil && (
            <Pressable
              style={stiller.satir}
              testID="menu-sil"
              onPress={onSil}
              accessibilityRole="button"
            >
              <CopIkonu />
              <Text style={[stiller.yazi, stiller.yikici]}>{t('ortak.sil')}</Text>
            </Pressable>
          )}

          <View style={stiller.ayirac} />
          <Pressable style={stiller.satir} onPress={onKapat} accessibilityRole="button">
            <Text style={[stiller.yazi, stiller.vazgec]}>{t('ortak.vazgec')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const stiller = StyleSheet.create({
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
    paddingHorizontal: bosluk.xl,
  },
  yazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yikici: { color: YIKICI },
  vazgec: { color: renk.metinIkincil },
  ayirac: { height: StyleSheet.hairlineWidth, backgroundColor: renk.cizgi },
})
