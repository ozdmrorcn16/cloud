import { render, screen, fireEvent } from '@testing-library/react-native'
import KarsilamaEkrani from '../../src/app/(auth)/karsilama'

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))

beforeEach(() => jest.clearAllMocks())

/**
 * ACILIS EKRANI - kullanicinin 2026-09-08'de gonderdigi referans
 * gorsele gore yeniden yazildi. Testler referansin PARCALARINI
 * kilitliyor: vaat cumlesi, harita sahnesi, dort tanitim karti, iki
 * eylem ve ODbL atfi.
 */
describe('KarsilamaEkrani', () => {
  it('vaat cumlesini iki parca halinde gosterir (vurgu ayri)', async () => {
    await render(<KarsilamaEkrani />)

    expect(await screen.findByText(/Yakınında kim var,/)).toBeTruthy()
    expect(screen.getByText('keşfet.')).toBeTruthy()
    expect(
      screen.getByText(
        'Check-in yap, yeni insanlarla tanış.\nYakınındaki popüler yerleri keşfet.'
      )
    ).toBeTruthy()
  })

  it('dort tanitim kartini basligi ve aciklamasiyla gosterir', async () => {
    await render(<KarsilamaEkrani />)

    for (const [baslik, aciklama] of [
      ['Check-in Yap', 'Bulunduğun mekanda görün'],
      ['Yakınında kimler var', 'Aynı yerdeki insanları keşfet'],
      ['Sohbet Et', 'Yeni insanlarla tanış'],
      ['Popüler yerleri keşfet', 'Şehrindeki trend mekanları gör'],
    ]) {
      expect(await screen.findByText(baslik)).toBeTruthy()
      expect(screen.getByText(aciklama)).toBeTruthy()
    }
  })

  it('sahnede mekan turleri, kisi sayilari ve ozet serit gorunur', async () => {
    await render(<KarsilamaEkrani />)

    expect(await screen.findByText('Kafe')).toBeTruthy()
    expect(screen.getByText('Restoran')).toBeTruthy()
    expect(screen.getByText('Bar')).toBeTruthy()
    // "Etkinlik" ETIKETI YOK (kullanicinin istegi 2026-09-08):
    // uygulamada oyle bir tur bulunmuyor ve tanitim ekraninin olmayan
    // bir ozelligi ima etmesi yanlis beyan olur. Igne duruyor, yalnizca
    // etiketi cizilmiyor - "5 kişi" rozeti bunu kanitliyor.
    expect(screen.queryByText('Etkinlik')).toBeNull()
    expect(screen.getByText('5 kişi')).toBeTruthy()
    expect(screen.getByText('8 kişi')).toBeTruthy()
    // Serit, ignelerdeki sayilarin toplamini asan bir sayi soyluyor:
    // haritada gorunmeyen kucuk igneler de sayiliyor.
    expect(screen.getByText('Yakınında 24 kişi dışarıda')).toBeTruthy()
  })

  it('"Hesap oluştur" kayit ekranina goturur', async () => {
    await render(<KarsilamaEkrani />)

    fireEvent.press(await screen.findByText('Hesap oluştur'))

    expect(mockReplace).toHaveBeenCalledWith('/kayit')
  })

  it('"Giriş yap" giris ekranina goturur', async () => {
    await render(<KarsilamaEkrani />)

    fireEvent.press(await screen.findByText('Giriş yap'))

    expect(mockReplace).toHaveBeenCalledWith('/giris')
  })

  /**
   * ODbL: sahnedeki harita OpenStreetMap verisinden turetilmis bir
   * eser, atif HUKUKEN sart. Test onu kilitliyor - sessizce
   * kaldirilirsa lisans ihlali olur.
   */
  it('OpenStreetMap atfi ekranda duruyor', async () => {
    await render(<KarsilamaEkrani />)

    expect(await screen.findByText('Harita verisi © OpenStreetMap katkıcıları')).toBeTruthy()
  })
})
