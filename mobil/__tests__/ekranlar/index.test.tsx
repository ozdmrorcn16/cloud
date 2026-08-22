import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import AnaEkran from '../../src/app/index'
import { supabase } from '../../lib/supabase'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { bildirimJetonunuSil } from '../../lib/bildirim'

// Cikis akisinin sirasini (once jeton sil, sonra signOut) ayirt edici
// olarak dogrulamak icin ortak cagri-sirasi dizisi.
const mockCagriSirasi: string[] = []

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(async () => {
        mockCagriSirasi.push('signOut')
        return { error: null }
      }),
    },
  },
}))

jest.mock('../../lib/bag-listeleri', () => ({
  gelenIstekleriGetir: jest.fn(),
}))

jest.mock('../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
}))

jest.mock('../../lib/bildirim', () => ({
  bildirimJetonunuSil: jest.fn(async () => {
    mockCagriSirasi.push('jetonSil')
  }),
}))

const mockRouterPush = jest.fn()
// useFocusEffect'i gercek useEffect gibi (mount'ta bir kez) davranacak
// sekilde taklit ediyoruz, ayrica sonuncu geri cagirmayi testlerin
// "yeniden odaklanma" simule edebilmesi icin disariya biriktiriyoruz.
let mockOdakGeriCagirmalari: (() => void)[] = []
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    mockOdakGeriCagirmalari.push(effect)
    require('react').useEffect(effect, [])
  },
}))

describe('AnaEkran', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOdakGeriCagirmalari = []
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    mockCagriSirasi.length = 0
  })

  it('cikis yap butonuna basinca signOut cagirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Çıkış yap'))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('cikista jeton_sil signOut-tan ONCE cagrilir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Çıkış yap'))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
    expect(bildirimJetonunuSil).toHaveBeenCalled()
    expect(mockCagriSirasi).toEqual(['jetonSil', 'signOut'])
  })

  it('mekanlara git butonuna basinca /mekanlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Mekanları keşfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('anilarim butonuna basinca /profil/anilar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Anılarım'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/anilar')
  })

  it('ayarlar butonuna basinca /profil/ayarlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Gizlilik ayarları'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  it('kisi ara butonuna basinca /kisiler rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Kişi ara'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kisiler')
  })

  it('baglar butonuna basinca /baglar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Bağlar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/baglar')
  })

  it('mesajlar butonuna basinca /mesajlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Mesajlar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mesajlar')
  })

  it('okunmamis mesaj yokken Mesajlar butonunun yaninda sayi gosterilmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      { konusmaId: 'k1', kisiId: 'u1', kullaniciAdi: 'orcun', ad: 'Orcun O', sonMesaj: null,
        sonMesajZamani: null, okunmamis: 0, yazilabilirMi: true },
    ])
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(konusmalarimiGetir).toHaveBeenCalled()
    })
    expect(screen.getByText('Mesajlar')).toBeTruthy()
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('okunmamis mesaj varsa Mesajlar butonunun yaninda toplam gosterilir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      { konusmaId: 'k1', kisiId: 'u1', kullaniciAdi: 'orcun', ad: 'Orcun O', sonMesaj: null,
        sonMesajZamani: null, okunmamis: 2, yazilabilirMi: true },
      { konusmaId: 'k2', kisiId: 'u2', kullaniciAdi: 'ayse', ad: 'Ayse A', sonMesaj: null,
        sonMesajZamani: null, okunmamis: 5, yazilabilirMi: true },
    ])
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(screen.getByText('7')).toBeTruthy()
    })
  })

  it('konusmalarimiGetir reddedilirse ekran yine cizilir ve sayi gorunmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(konusmalarimiGetir).toHaveBeenCalled()
    })
    expect(screen.getByText('Mesajlar')).toBeTruthy()
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bekleyen istek yokken Bağlar butonunun yaninda sayi gosterilmez', async () => {
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(gelenIstekleriGetir).toHaveBeenCalled()
    })
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bekleyen istek varsa Bağlar butonunun yaninda takip ve sohbet toplami gosterilir', async () => {
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

  it('bekleyen istek sorgusu basarisiz olursa Bağlar metni yine de gorunur', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AnaEkran />)
    await waitFor(() => {
      expect(gelenIstekleriGetir).toHaveBeenCalled()
    })
    expect(screen.getByText('Bağlar')).toBeTruthy()
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('ekrana yeniden odaklaninca sayaci tekrar ceker (useFocusEffect, tek seferlik useEffect degil)', async () => {
    await render(<AnaEkran />)
    await waitFor(() => expect(gelenIstekleriGetir).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(/^\d+$/)).toBeNull()

    // /baglar ekranindan istekler kabul edilip geri donulmus gibi:
    // sayi degisti VE ekran yeniden odaklandi. useEffect (deps: [])
    // olsaydi bu ikinci cagriyi hic yapmazdi - rozet bayat kalirdi
    // (final inceleme Madde 9).
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    await act(async () => {
      mockOdakGeriCagirmalari.forEach((geriCagirma) => geriCagirma())
    })

    await waitFor(() => expect(gelenIstekleriGetir).toHaveBeenCalledTimes(2))
    expect(screen.getByText('1')).toBeTruthy()
  })
})
