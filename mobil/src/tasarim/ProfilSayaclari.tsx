import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useDil } from '../../lib/dil'
import { bosluk, golge, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/**
 * PROFIL SAYAC SATIRI - Ani / Fotograf / Arkadas.
 *
 * Iki ekran da bunu kullaniyor: kendi profilin ve baskasinin profili
 * (kullanicinin istegi 2026-09-08: "su an kullanicinin profili nasilsa
 * aynisinin kapali halini gormeli"). Ayni satirin iki kopyasi olsaydi
 * biri degistiginde oteki geride kalirdi.
 *
 * KART ICINDE (kullanicinin karari 2026-09-10, referans gorselle).
 * 2026-09-08'de kutular KALDIRILMISTI ("etrafindaki kare sutunu
 * kaldir"); referans onlari geri getirdi - ama tek tek kutu degil,
 * ucunu birden saran TEK kart ve aralarinda ince ayiricilar.
 *
 * Kenarlik ve golge SART: sayfa zemini de kart da beyaz, ayrimi renk
 * tasiyamiyor (2026-08-27 kurali).
 *
 * SECIM RENKTE: secili olanin sayisi turuncu, etiketi koyu ve kalin.
 * Renk tek basina anlam tasimasin diye AGIRLIK da degisiyor. Etiket
 * rengi `metinIkincil` - `metinSoluk` olculdu ve acik modda 2,74:1,
 * koyu modda 4,06:1 veriyordu, yani ikisi de esigin altindaydi.
 *
 * `onSec` VERILMEZSE satir salt okunur olur: baskasinin profilinde
 * sayaclar bir bolum secmiyor, yalnizca sayiyi soyluyor.
 */

export type SayacAnahtari = 'anilar' | 'fotograflar' | 'arkadaslar'

const IKONLAR: Record<SayacAnahtari, number> = {
  anilar: require('../../assets/images/profil-ikon-ani.png'),
  fotograflar: require('../../assets/images/profil-ikon-fotograf.png'),
  arkadaslar: require('../../assets/images/profil-ikon-arkadas.png'),
}

export function ProfilSayaclari({
  sayilar,
  secili,
  onSec,
}: {
  sayilar: Record<SayacAnahtari, number>
  /** Acik olan bolum; verilmezse hicbiri vurgulanmaz. */
  secili?: SayacAnahtari
  onSec?: (anahtar: SayacAnahtari) => void
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()

  const kalemler: { anahtar: SayacAnahtari; etiket: string }[] = [
    { anahtar: 'anilar', etiket: t('profil.aniSayisi') },
    { anahtar: 'fotograflar', etiket: t('profil.fotografSayisi') },
    { anahtar: 'arkadaslar', etiket: t('profil.bagSayisi') },
  ]

  return (
    <View style={stiller.satir}>
      {kalemler.map((k, sira) => {
        const acik = secili === k.anahtar
        return (
          <Pressable
            key={k.anahtar}
            style={stiller.sayac}
            onPress={onSec ? () => onSec(k.anahtar) : undefined}
            // Basilamayan bir sayac dugme DEGIL: ekran okuyucu onu
            // dokunulabilir diye okumamali.
            accessibilityRole={onSec ? 'button' : undefined}
            accessibilityState={onSec ? { selected: acik } : undefined}
            accessibilityLabel={`${sayilar[k.anahtar]} ${k.etiket}`}
          >
            {/* AYIRICI, kabin degil SAYACIN cocugu: `gap` ile
                cizilseydi kenarlarda da bosluk kalirdi. Ilk sayacta
                cizilmiyor. */}
            {sira > 0 && <View style={stiller.ayirici} />}
            <Image source={IKONLAR[k.anahtar]} style={stiller.gorsel} resizeMode="contain" />
            <Text style={[stiller.sayi, acik && stiller.sayiSecili]}>{sayilar[k.anahtar]}</Text>
            <Text style={[stiller.etiket, acik && stiller.etiketSecili]}>{k.etiket}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    satir: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      backgroundColor: renk.yuzey,
      borderRadius: yuvarlak.kart,
      borderWidth: 1,
      borderColor: renk.cizgi,
      paddingVertical: bosluk.m,
      ...golge.kart,
    },
    sayac: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: bosluk.xs,
    },
    ayirici: {
      position: 'absolute',
      left: 0,
      top: 4,
      bottom: 4,
      width: 1,
      backgroundColor: renk.cizgi,
    },
    gorsel: { width: 30, height: 27, marginBottom: 3 },
    sayi: {
      fontFamily: yazi.ekranBasligi,
      fontSize: 20,
      color: renk.metin,
      letterSpacing: -0.4,
    },
    sayiSecili: { color: renk.turuncuYazi },
    etiket: {
      fontFamily: yazi.govde,
      fontSize: olcek.minik,
      color: renk.metinIkincil,
      marginTop: 1,
    },
    etiketSecili: { fontFamily: yazi.govdeKalin, color: renk.metin },
  })
