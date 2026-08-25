import { Image, type ImageStyle, type StyleProp } from 'react-native'

/**
 * Slooin KELIME MARKASI - "slooin" yazisi.
 *
 * Kullanicinin karari (2026-08-25). Yazinin icinde urunun uc unsuru
 * gizli: ikinci "o" bir KONUSMA BALONU, "i"nin noktasi bir KONUM
 * IGNESI. Yani marka adi tek basina uygulamayi anlatiyor.
 *
 * NEREDE KULLANILIR: ekran basliklarinda, giris ekraninda, tanitim
 * gorsellerinde - yani genislik olan yerlerde.
 *
 * NEREDE KULLANILMAZ: uygulama simgesi. En/boy orani 3.3; kare bir
 * ikona sigdirilirsa yuksekligi %30'da kalir ve okunmaz. Simge icin
 * `MarkaIsareti` (konum ignesi) kullanilir. Bu ayrim standarttir -
 * Instagram'in giris ekraninda da kamera ISARETI durur, "Instagram"
 * yazisi ayri bir varliktir.
 */
export function MarkaYazisi({
  genislik = 180,
  style,
}: {
  genislik?: number
  style?: StyleProp<ImageStyle>
}) {
  // Oran sabit: kaynak gorselden olculdu (900x268).
  const yukseklik = Math.round((genislik * 268) / 900)
  return (
    <Image
      source={require('../../assets/images/marka-yazisi.png')}
      style={[{ width: genislik, height: yukseklik }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Slooin"
    />
  )
}
