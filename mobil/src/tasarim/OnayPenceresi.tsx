import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useDil } from '../../lib/dil'
import { bosluk, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { useModalHareketi } from './hareket'

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
 *
 * HAREKET (2026-09-20): Modal'in kendi `fade`i yerine `useModalHareketi`:
 * zemin solar, pencere %97'den 1'e olceklenip belirir (200 ms guclu
 * ease-out); kapanis 150 ms tersi. Pencere ORTADA kalir - modallar
 * tetikleyiciden buyumez (Kowalski). Yalnizca opacity + transform.
 */
export function OnayPenceresi({
  acikMi,
  baslik,
  aciklama,
  eylemEtiketi,
  yikici = true,
  tekDugme = false,
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
  /**
   * BILGI KIPI (2026-09-20): secim yok, yalnizca "Tamam" - "Vazgec"
   * satiri cizilmez. Ayni pencere, ayri bir bilesen yazilmadi.
   */
  tekDugme?: boolean
  onOnay: () => void
  onVazgec: () => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const { gorunur, ilerleme } = useModalHareketi(acikMi)

  if (!gorunur) return null

  const olcekDegeri = ilerleme.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] })

  return (
    <Modal
      visible
      transparent
      animationType="none"
      // Android'in donanim geri tusu de vazgecmek demek.
      onRequestClose={onVazgec}
    >
      <Animated.View style={[stiller.zeminRenk, { opacity: ilerleme }]} pointerEvents="none" />
      {/* Zemine dokunmak vazgecmek - iOS'ta alistirilmis davranis. */}
      <Pressable style={stiller.zemin} testID="onay-zemini" onPress={onVazgec}>
        {/* Pencerenin KENDISINE dokunmak kapatmamali: metni okumak icin
            dokunan kullanici islemi iptal etmis olmasin. Bos onPress,
            dokunusu zemine gecirmemek icin. */}
        <Animated.View style={[stiller.pencere, { opacity: ilerleme, transform: [{ scale: olcekDegeri }] }]}>
        <Pressable
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

          {!tekDugme && (
            <>
              <View style={stiller.ayirac} />
              <Pressable
                style={stiller.dugme}
                onPress={onVazgec}
                accessibilityRole="button"
              >
                <Text style={[stiller.dugmeYazi, stiller.vazgec]}>{t('ortak.vazgec')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Karartma ayri bir katman: opakligi animasyonla degisiyor, dokunma
  // hedefi (zemin) ise saydam ve hep tam boy.
  zeminRenk: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    // Karartma %40'ta yeterince geri itmiyordu: alt gezinme cubugu
    // beyaz ve parlak oldugu icin altinda kalmasina ragmen tiklanabilir
    // GORUNUYORDU. (Olculdu: modal portali zIndex 9999 ile en ustte,
    // yani islevsel bir sorun yoktu - yalnizca gorsel.)
    backgroundColor: 'rgba(23, 19, 15, 0.55)',
  },
  zemin: {
    flex: 1,
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
  birincil: { color: renk.turuncuYazi },
  vazgec: { color: renk.metinIkincil },
})
