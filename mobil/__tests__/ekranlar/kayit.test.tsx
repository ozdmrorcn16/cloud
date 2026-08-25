import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KayitEkrani from '../../src/app/(auth)/kayit'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithOtp: jest.fn() } },
}))

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}))

const TELEFON = 'Telefon numarası'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
})

describe('KayitEkrani', () => {
  it('YALNIZCA telefon soruyor - sifre alani yok', async () => {
    await render(<KayitEkrani />)

    expect(screen.getByPlaceholderText('05XX XXX XX XX')).toBeTruthy()
    // Kayit ucе bolundu: sifre bir sonraki adimda aliniyor.
    expect(screen.queryByPlaceholderText('En az 8 karakter')).toBeNull()
  })

  it('numarayi e.164 bicimine cevirip kod gonderir ve dogrulamaya gecer', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() =>
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+905551234567' })
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?telefon=%2B905551234567')
  })

  it('gecersiz numarada sunucuya hic gitmez', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '123')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(await screen.findByText('Geçerli bir telefon numarası gir.')).toBeTruthy()
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('sunucu hatasini gosterir ve dogrulamaya gecmez', async () => {
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'SMS gonderilemedi' },
    })

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(await screen.findByText('SMS gonderilemedi')).toBeTruthy()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('giris baglantisi giris ekranina goturur', async () => {
    await render(<KayitEkrani />)
    await fireEvent.press(screen.getByText('Giriş yap'))
    expect(mockRouterReplace).toHaveBeenCalledWith('/giris')
  })
})

// TELEFON etiketi ekranda da var; testte yalnizca yer tutucu
// kullaniliyor cunku etiket ve yer tutucu ayni anda gorunuyor.
void TELEFON
