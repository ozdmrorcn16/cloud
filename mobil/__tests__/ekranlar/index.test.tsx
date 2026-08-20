import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnaEkran from '../../src/app/index'
import { supabase } from '../../lib/supabase'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn().mockResolvedValue({ error: null }) } },
}))

jest.mock('../../lib/bag-listeleri', () => ({
  gelenIstekleriGetir: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

describe('AnaEkran', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
  })

  it('cikis yap butonuna basinca signOut cagirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Cikis yap'))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('mekanlara git butonuna basinca /mekanlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Mekanlari kesfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('anilarim butonuna basinca /profil/anilar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Anilarim'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/anilar')
  })

  it('ayarlar butonuna basinca /profil/ayarlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Gizlilik ayarlari'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  it('kisi ara butonuna basinca /kisiler rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Kisi ara'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kisiler')
  })

  it('baglar butonuna basinca /baglar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Baglar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/baglar')
  })

  it('bekleyen istek yokken Baglar butonunun yaninda sayi gosterilmez', async () => {
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(gelenIstekleriGetir).toHaveBeenCalled()
    })
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bekleyen istek varsa Baglar butonunun yaninda takip ve sohbet toplami gosterilir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [
        { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse A' },
        { id: 'k3', kullaniciAdi: 'veli', ad: 'Veli V' },
      ],
    })
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy()
    })
  })

  it('bekleyen istek sorgusu basarisiz olursa Baglar metni yine de gorunur', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(gelenIstekleriGetir).toHaveBeenCalled()
    })
    expect(screen.getByText('Baglar')).toBeTruthy()
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })
})
