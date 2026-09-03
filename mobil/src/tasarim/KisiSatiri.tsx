import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * KISI ARAMA SONUCU SATIRI.
 *
 * Duzen Instagram'in arama sonucundan alindi (kullanicinin gonderdigi
 * referans, 2026-08-28): solda yuvarlak kucuk fotograf, saginda ustte
 * KULLANICI ADI kalin, altinda ad soyad soluk.
 *
 * Fotografi olmayan kisi icin bas harf: bos bir daire birakmak satiri
 * eksik gosteriyor. Harf ADDAN aliniyor, ad yoksa kullanici adindan.
 *
 * Ayni satir iki yerde kullaniliyor - `kisiler` ekrani ve ana
 * sayfadaki arama - bu yuzden bilesen olarak duruyor.
 */

export type KisiSatirVerisi = {
  id: string
  kullaniciAdi: string
  ad: string
  fotografUrl: string | null
}

export function KisiSatiri({
  kisi,
  onSec,
}: {
  kisi: KisiSatirVerisi
  onSec: (kisi: KisiSatirVerisi) => void
}) {
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      style={stiller.satir}
      onPress={() => onSec(kisi)}
      accessibilityRole="button"
      accessibilityLabel={`${kisi.kullaniciAdi}, ${kisi.ad}`}
    >
      {kisi.fotografUrl ? (
        <Image
          testID="kisi-fotografi"
          source={{ uri: kisi.fotografUrl }}
          style={stiller.fotograf}
          contentFit="cover"
          transition={120}
        />
      ) : (
        <View style={[stiller.fotograf, stiller.fotografYok]}>
          <Text style={stiller.basHarf}>
            {(kisi.ad || kisi.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')}
          </Text>
        </View>
      )}

      <View style={stiller.orta}>
        <Text style={stiller.kullaniciAdi} numberOfLines={1}>
          {kisi.kullaniciAdi}
        </Text>
        <Text style={stiller.ad} numberOfLines={1}>
          {kisi.ad}
        </Text>
      </View>
    </Pressable>
  )
}

const CAP = 44

const stilleriYap = (renk: Renk) => StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
  },
  fotograf: { width: CAP, height: CAP, borderRadius: yuvarlak.hap },
  fotografYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.turuncu,
  },
  orta: { flex: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ad: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
})
