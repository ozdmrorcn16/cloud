import { Image, type ImageStyle, type StyleProp } from 'react-native'

/**
 * Slooin KELIME MARKASI - "slooin" yazisi.
 *
 * Kullanicinin ikinci logo takimi (2026-08-25): koyu, yumusak koseli
 * harfler ve "i"nin noktasi yerinde duran TURUNCU KONUM IGNESI. Yani
 * marka adi tek basina uygulamanin ne yaptigini soyluyor.
 *
 * Varlik `araclar/kelime-markasi-uret.py` ile uretiliyor: kaynaktaki
 * beyaz zemin renk cozumlemesiyle saydama ceviriliyor, cunku
 * uygulamanin zemini sicak beyaz ve beyaz zeminli bir PNG orada
 * gorunur bir kutu birakiyor.
 *
 * NEREDE KULLANILIR: ekran basliklarinda, giris ekraninda, tanitim
 * gorsellerinde - yani genislik olan yerlerde.
 *
 * NEREDE KULLANILMAZ: uygulama simgesi. En/boy orani 3.4; kare bir
 * ikona sigdirilirsa yuksekligi %30'da kalir ve okunmaz. Simge icin
 * isaret (S) kullanilir. Bu ayrim standarttir - Instagram'in giris
 * ekraninda da kamera ISARETI durur, "Instagram" yazisi ayri bir
 * varliktir.
 */
export function MarkaYazisi({
  genislik = 180,
  style,
}: {
  genislik?: number
  style?: StyleProp<ImageStyle>
}) {
  // Oran sabit: kaynak gorselden olculdu (1200x348). Gorsel degisirse
  // bu sabit de degismeli, yoksa yazi ezilir. Uretim:
  // `python araclar/kelime-markasi-uret.py` orani ekrana basiyor.
  const yukseklik = Math.round((genislik * 348) / 1200)
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
