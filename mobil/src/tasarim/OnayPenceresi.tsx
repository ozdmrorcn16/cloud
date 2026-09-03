import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * Geri alinamayan islemler icin ortak onay penceresi.
 *
 * Kullanicinin istegi (2026-09-02): silmeye basinca ekranin ortasinda
 * kisa bir bilgilendirme ve Sil / Vazgec dugmeleri cikmali. Onceki
 * tasarim onayi kartin ICINDE aciyordu - kart uzunsa onay satiri
 * ekranin disinda kalabiliyordu ve "sil"e bastigini saniyorsun ama
 * hicbir sey olmuyordu.
 *
 * `Alert.alert` DEGIL, kendi Modal'imiz. Sebep: uygulama web'de de
 * calisiyor (slooin.expo.app) ve React Native Web'de Alert sessizce
 * hicbir sey yapmiyor - silme orada tamamen kirilirdi. Ustelik kendi
 * penceremiz uc platformda ayni gorunuyor ve test edilebiliyor.
 */
export function OnayPenceresi({
  acikMi,
  baslik,
  aciklama,
  eylemEtiketi,
  yikici = true,
  onOnay,
  onVazgec,
}: {
  acikMi: boolean
  baslik: string
  /** Istege bagli: her onay uzun bir gerekce istemiyor. */
  aciklama?: string
  eylemEtiketi: string
  /** Yikici eylem kirmizi; degilse turuncu (birincil eylem rengi). */
  yikici?: boolean
  onOnay: () => void
  onVazgec: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()

  if (!acikMi) return null

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // Android'in donanim geri tusu de vazgecmek demek.
      onRequestClose={onVazgec}
    >
      {/* Zemine dokunmak vazgecmek - iOS'ta alistirilmis davranis. */}
      <Pressable style={stiller.zemin} testID="onay-zemini" onPress={onVazgec}>
        {/* Pencerenin KENDISINE dokunmak kapatmamali: metni okumak icin
            dokunan kullanici islemi iptal etmis olmasin. Bos onPress,
            dokunusu zemine gecirmemek icin. */}
        <Pressable
          style={stiller.pencere}
          testID="onay-penceresi"
          onPress={() => {}}
          accessibilityViewIsModal
        >
          <View style={stiller.metinAlani}>
            <Text style={stiller.baslik} accessibilityRole="header">
              {baslik}
            </Text>
            {aciklama ? <Text style={stiller.aciklama}>{aciklama}</Text> : null}
          </View>

          <View style={stiller.ayirac} />
          <Pressable
            style={stiller.dugme}
            testID="onay-eylemi"
            onPress={onOnay}
            accessibilityRole="button"
          >
            <Text style={[stiller.dugmeYazi, yikici ? stiller.yikici : stiller.birincil]}>
              {eylemEtiketi}
            </Text>
          </Pressable>

          <View style={stiller.ayirac} />
          <Pressable
            style={stiller.dugme}
            onPress={onVazgec}
            accessibilityRole="button"
          >
            <Text style={[stiller.dugmeYazi, stiller.vazgec]}>{t('ortak.vazgec')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  zemin: {
    flex: 1,
    // Karartma %40'ta yeterince geri itmiyordu: alt gezinme cubugu
    // beyaz ve parlak oldugu icin altinda kalmasina ragmen tiklanabilir
    // GORUNUYORDU. (Olculdu: modal portali zIndex 9999 ile en ustte,
    // yani islevsel bir sorun yoktu - yalnizca gorsel.)
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
  metinAlani: { padding: bosluk.xl, gap: bosluk.s },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    letterSpacing: -0.3,
    color: renk.metin,
    textAlign: 'center',
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
  ayirac: { height: StyleSheet.hairlineWidth, backgroundColor: renk.cizgi },
  // 44 pt asgari dokunma hedefi.
  dugme: { paddingVertical: bosluk.l, alignItems: 'center', justifyContent: 'center' },
  dugmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
  yikici: { color: renk.yikici },
  birincil: { color: renk.turuncu },
  vazgec: { color: renk.metinIkincil },
})
