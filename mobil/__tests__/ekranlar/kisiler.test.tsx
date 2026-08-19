import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KisilerEkrani from '../../src/app/kisiler'
import { kisiAra } from '../../lib/kisi-ara'

jest.mock('../../lib/kisi-ara', () => ({ kisiAra: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://ornek/foto.jpg' } }) }),
    },
  },
}))

describe('KisilerEkrani', () => {
  beforeEach(() => {
    ;(kisiAra as jest.Mock).mockReset()
    mockRouterPush.mockReset()
  })

  it('sonuclari kullanici adi ve isimle listeler', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'orc')

    expect(await screen.findByText('orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('iki karakterden kisa metinde uyari gosterir', async () => {
    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'o')

    expect(await screen.findByText('En az 2 karakter yaz.')).toBeTruthy()
    expect(kisiAra).not.toHaveBeenCalled()
  })

  it('sonuc yoksa bilgilendirir', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'zzz')

    expect(await screen.findByText('Kimse bulunamadi.')).toBeTruthy()
  })

  it('sonuca basinca profile gider', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'orc')
    await fireEvent.press(await screen.findByText('orcun'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k1'))
  })

  it('gec donen eski arama, yeni aramanin sonuclarinin uzerine yazmaz', async () => {
    let ilkiCoz: (deger: unknown) => void = () => {}
    const ilkSoz = new Promise((coz) => { ilkiCoz = coz })

    ;(kisiAra as jest.Mock)
      .mockImplementationOnce(() => ilkSoz)
      .mockResolvedValueOnce([
        { id: 'k2', kullaniciAdi: 'ikinci', ad: 'Ikinci Kisi', fotograf: null },
      ])

    await render(<KisilerEkrani />)
    const kutu = screen.getByPlaceholderText('Kullanici adi ya da isim')

    // Bilerek await edilmiyor: handler henuz cozulmemis bir soze bagli
    // kaldigi surece, `await fireEvent.changeText(...)`'in kullandigi
    // act() sarmalayicisi o soz cozulene kadar sonsuza kadar bekliyor.
    // Bu yuzden olaylari ates edip sonucu findByText/waitFor ile bekliyoruz.
    fireEvent.changeText(kutu, 'ilk')
    fireEvent.changeText(kutu, 'ikinci')

    expect(await screen.findByText('ikinci')).toBeTruthy()

    // Simdi eski istek geri donuyor; ekrani degistirmemeli.
    ilkiCoz([{ id: 'k1', kullaniciAdi: 'birinci', ad: 'Birinci Kisi', fotograf: null }])

    await waitFor(() => {
      expect(screen.queryByText('birinci')).toBeNull()
      expect(screen.getByText('ikinci')).toBeTruthy()
    })
  })
})
