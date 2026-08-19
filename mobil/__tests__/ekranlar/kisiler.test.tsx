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
})
