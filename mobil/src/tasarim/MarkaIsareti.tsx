import { Image, type ImageStyle, type StyleProp } from 'react-native'

/**
 * Slooin marka isareti - ZEMINE GORE UYARLANIR.
 *
 * Kullanicinin ikinci logo takimindaki S isareti (2026-08-25). Iki
 * varyant var ve zemin turune gore secilir:
 *
 *   zemin="acik"  -> TURUNCU isaret (sayfa zemini #FAF7F3 gibi acik
 *                    yuzeyler icin)
 *   zemin="koyu"  -> BEYAZ isaret (turuncu ya da koyu yuzeyler icin)
 *
 * Ikisi de `araclar/simge-uret.py` tarafindan ayni kaynaktan
 * uretiliyor: isaretin silueti renk cozumlemesiyle cikariliyor, yani
 * kenarlardaki ara tonlar ve S'in katlandigi yerdeki golge korunuyor.
 *
 * Uygulama simgesinin kendisi (ana ekranda gorunen) logonun ORIJINAL
 * hali: gradyanli kiremit uzerinde beyaz isaret. O dosya `icon.png`.
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
