import type { ReactNode } from 'react'
import { Keyboard, Pressable, type StyleProp, type ViewStyle } from 'react-native'

/**
 * Bos alana basinca klavyeyi kapatan sarmalayici.
 *
 * Kullanicinin bildirdigi kusur (2026-09-02): "Bu ekranda bos herhangi
 * bir yere basinca klavye kapanmiyor." iOS'ta klavyeyi kapatmanin baska
 * bir yolu yok - Android'deki geri tusu gibi bir kacis bulunmuyor -
 * yani klavye acilinca ekranin alt yarisi erisilemez hale geliyor ve
 * kullanici formun devamini goremiyor.
 *
 * Neden `Pressable` ve neden butun sayfayi sariyor: dokunusu yakalamak
 * icin en dista bir basilabilir alan gerekiyor. Icteki dugmeler ve
 * girdiler kendi dokunuslarini kendileri yakaladigi icin bu sarmalayici
 * onlari engellemiyor; yalnizca HICBIR SEYIN olmadigi yerlere basildiginda
 * devreye giriyor.
 *
 * `accessible={false}` SART: aksi halde ekran okuyucu butun sayfayi tek
 * bir dev dugme gibi okur ve icindeki gercek dugmeler kaybolur.
 */
export function KlavyeKapatan({
  children,
  style,
  testID,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  return (
    <Pressable style={style} onPress={Keyboard.dismiss} accessible={false} testID={testID}>
      {children}
    </Pressable>
  )
}
