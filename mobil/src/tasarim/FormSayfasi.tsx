import type { ReactNode } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'

/**
 * FORM SAYFASI - girdi iceren, kaydirmasiz tasarlanmis ekranlarin
 * cihaza uyan sarmalayicisi (cihaz uyumu turu, 2026-09-19).
 *
 * Uc isi var, ucu de "hangi telefon" sorusuna cevap:
 *
 * 1. KLAVYE: iOS'ta klavye acilinca pencere KUCULMEZ, alttaki girdi ve
 *    dugme klavyenin altinda kalir. `KeyboardAvoidingView` (padding)
 *    icerigi klavye kadar yukari iter. Android'de pencere zaten
 *    yeniden boyutlanir (`softwareKeyboardLayoutMode` resize), orada
 *    davranis verilmiyor - ikisini birden vermek Android'de cift pay
 *    demek.
 * 2. KUCUK EKRAN: 390x844'te "kaydirmadan sigan" bir dizilim iPhone SE
 *    (375x667) ya da kucuk Android'de (360x720) sigmaz. Icerik
 *    `flexGrow: 1` ile yerlesimini korur - yer varsa eskisi gibi
 *    durur, yer yoksa ScrollView kaydirir. Sabit yukseklikli bir kok
 *    View'da ise alt taraf sessizce ekranin disinda kalirdi.
 * 3. BOS ALANA DOKUNMAK KLAVYEYI KAPATIR (KlavyeKapatan'in kurali,
 *    2026-09-02) ve kaydirma da kapatir (`on-drag`); girdiden dugmeye
 *    tek dokunusla gecilir (`handled`).
 *
 * `style` kok icin, `icerikStili` kaydirma icerigi icin (padding ve
 * flex duzeni buraya).
 */
export function FormSayfasi({
  children,
  style,
  icerikStili,
  testID,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  icerikStili?: StyleProp<ViewStyle>
  testID?: string
}) {
  return (
    <KeyboardAvoidingView
      style={[stiller.kok, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={stiller.kok}
        contentContainerStyle={[stiller.icerik, icerikStili]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bounces={false}
        testID={testID}
      >
        <Pressable style={stiller.icerik} onPress={Keyboard.dismiss} accessible={false}>
          {children}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1 },
  icerik: { flexGrow: 1 },
})
