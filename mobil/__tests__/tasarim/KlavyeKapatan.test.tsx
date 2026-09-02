import { Keyboard, Text } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { KlavyeKapatan } from '../../src/tasarim/KlavyeKapatan'

/**
 * Kullanicinin bildirdigi kusur (2026-09-02): "Bu ekranda bos herhangi
 * bir yere basinca klavye kapanmiyor."
 *
 * iOS'ta klavyeyi kapatmanin baska yolu yok - Android'deki geri tusu
 * gibi bir kacis yolu bulunmuyor. Klavye acikken ekranin alt yarisi
 * gorunmediginden kullanici formun devamini goremiyor.
 */
describe('KlavyeKapatan', () => {
  it('bos alana basinca klavyeyi kapatir', async () => {
    const kapat = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {})

    await render(
      <KlavyeKapatan testID="sayfa">
        <Text>icerik</Text>
      </KlavyeKapatan>
    )
    await fireEvent.press(screen.getByTestId('sayfa'))

    expect(kapat).toHaveBeenCalled()
  })

  /**
   * Ekran okuyucu icin GORUNMEZ olmali: butun sayfayi saran bir dugme,
   * sesli okuyucuda "dugme, icerik..." diye tek bir dev oge olarak
   * okunurdu ve icindeki gercek dugmeler kaybolurdu.
   */
  it('ekran okuyucuya dugme olarak gorunmez', async () => {
    await render(
      <KlavyeKapatan testID="sayfa">
        <Text>icerik</Text>
      </KlavyeKapatan>
    )

    const sarmalayici = screen.getByTestId('sayfa')
    expect(sarmalayici.props.accessible).toBe(false)
    expect(sarmalayici.props.accessibilityRole).toBeUndefined()
  })
})
