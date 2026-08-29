import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { renk, yazi, olcek, yuvarlak } from './tema'

/**
 * YUVARLAK PROFIL FOTOGRAFI.
 *
 * Fotografi olmayan kisi icin bas harf: bos bir daire satiri eksik
 * gosteriyor. Harf ADDAN aliniyor, ad yoksa kullanici adindan.
 *
 * Bildirim satirlari icin cikarildi (2026-08-30); ayni desen
 * `KisiSatiri` icinde de var, oraya dokunulmadi.
 */
export function Avatar({
  fotografUrl,
  ad,
  kullaniciAdi,
  cap = 44,
  testID,
}: {
  fotografUrl: string | null
  ad: string | null | undefined
  kullaniciAdi: string
  cap?: number
  testID?: string
}) {
  const boyut = { width: cap, height: cap, borderRadius: yuvarlak.hap }

  if (fotografUrl) {
    return (
      <Image
        testID={testID}
        source={{ uri: fotografUrl }}
        style={boyut}
        contentFit="cover"
        transition={120}
      />
    )
  }

  return (
    <View style={[boyut, stiller.fotografYok]}>
      <Text style={[stiller.basHarf, { fontSize: Math.round(cap * 0.43) }]}>
        {(ad || kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase('tr-TR')}
      </Text>
    </View>
  )
}

const stiller = StyleSheet.create({
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
})
