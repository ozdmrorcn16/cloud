import { Image, type ImageStyle, type StyleProp } from 'react-native'

/**
 * Slooin marka isareti - ZEMINE GORE UYARLANIR.
 *
 * Logo tek bir isarette uc sey soyluyor: konum ignesi, icindeki iki
 * insan ve konusma balonu. Yani "burada birileri var ve konusuyorlar".
 *
 * Kullanicinin karari (2026-08-25): "logoyu zemine göre uyarla arka
 * plan beyazsa ona göre zıttını turuncuysa ona göre zıttını görüncek
 * şekilde ayarla" ve "koyu olmasın daha açık mat renkler kullan".
 *
 * Bu yuzden iki varyant var ve zemin turune gore secilir:
 *
 *   zemin="acik"  -> igne TURUNCU, ikinci figur acik mat seftali
 *                    (sayfa zemini #FAF7F3 gibi acik yuzeyler)
 *   zemin="koyu"  -> igne BEYAZ, ikinci figur acik krem
 *                    (turuncu ya da koyu yuzeyler)
 *
 * Kaynak logodaki SIYAH figur hicbir varyantta siyah kalmiyor; iki
 * tonda da turuncuyla akraba, acik ve mat bir renge boyaniyor. Boylece
 * iki figur birbirinden ayrilirken palet tek kaliyor.
 *
 * Uygulama simgesinin kendisi (ana ekranda gorunen) logonun ORIJINAL
 * hali: turuncu zemin uzerinde beyaz + siyah. O dosya `icon.png`.
 */
export function MarkaIsareti({
  zemin = 'acik',
  boyut = 96,
  style,
}: {
  zemin?: 'acik' | 'koyu'
  boyut?: number
  style?: StyleProp<ImageStyle>
}) {
  return (
    <Image
      source={
        zemin === 'koyu'
          ? require('../../assets/images/marka-isareti-koyu.png')
          : require('../../assets/images/marka-isareti-acik.png')
      }
      style={[{ width: boyut, height: boyut }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Slooin"
    />
  )
}
