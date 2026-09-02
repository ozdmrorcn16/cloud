import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import GirisEkrani from '../../src/app/(auth)/giris'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}))

const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
let mockGeriGidilebilir = true
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, back: mockRouterBack, canGoBack: () => mockGeriGidilebilir }),
}))

describe('GirisEkrani', () => {
  // Mock'lar test ARASINDA sifirlanmali: aksi halde bir onceki testin
  // `back()` cagrisi sonrakinde de sayiliyor ve "cagrilmadi" iddiasi
  // sahte basarisiz oluyor (bu bir kez yasandi).
  beforeEach(() => {
    jest.clearAllMocks()
    mockGeriGidilebilir = true
  })

  it('dogru bilgilerle signInWithPassword cagirir ve yonlendirir', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: {}, error: null })
    await render(<GirisEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), 'ornek@eposta.com')
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'sifre1234')
    await fireEvent.press(screen.getByText('Giriş yap'))
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'ornek@eposta.com',
        password: 'sifre1234',
      })
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('yanlis sifrede hata gosterir', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    await render(<GirisEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), 'ornek@eposta.com')
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'yanlissifre')
    await fireEvent.press(screen.getByText('Giriş yap'))
    await waitFor(() => {
      expect(screen.getByText('Telefon numarası ya da şifre hatalı.')).toBeTruthy()
    })
  })

  /**
   * GERI DONME (kullanicinin istegi 2026-09-02): karsilama ekranindan
   * buraya gelen kisi fikrini degistirebilmeli; tek cikis yolu
   * uygulamayi kapatmak olmamali.
   */
  it('geri dugmesi onceki ekrana doner', async () => {
    await render(<GirisEkrani />)

    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(mockRouterBack).toHaveBeenCalled()
  })

  /**
   * `router.back()` TEK BASINA YETMIYOR: karsilama ekrani bu ekrana
   * `replace` ile geciyor, yani gecmiste geri donulecek sayfa KALMIYOR
   * ve back() sessizce hicbir sey yapmiyor. Kullanicinin bildirdigi
   * kusur buydu - dugme vardi ama islevi yoktu.
   */
  it('gecmis yoksa karsilamaya doner', async () => {
    mockGeriGidilebilir = false

    await render(<GirisEkrani />)
    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(mockRouterBack).not.toHaveBeenCalled()
    expect(mockRouterReplace).toHaveBeenCalledWith('/karsilama')
  })
})
