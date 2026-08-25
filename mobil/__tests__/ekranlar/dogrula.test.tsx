import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import DogrulaEkrani from '../../src/app/(auth)/dogrula'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { verifyOtp: jest.fn(), signUp: jest.fn(), resend: jest.fn() } },
}))

const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, back: mockRouterBack }),
  useLocalSearchParams: () => ({ telefon: '+905551234567' }),
}))

const KOD_ETIKETI = 'Doğrulama kodu'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('DogrulaEkrani', () => {
  it('alti hane girilince KENDILIGINDEN dogrular ve sifre adimina gecer', async () => {
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })

    await render(<DogrulaEkrani />)
    // Kullanicinin ayrica dugmeye basmasi gerekmiyor.
    await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '123456')

    await waitFor(() => {
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+905551234567',
        token: '123456',
        type: 'sms',
      })
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/sifre-belirle')
  })

  it('rakam olmayan karakterleri atar', async () => {
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })

    await render(<DogrulaEkrani />)
    // SMS'ten yapistirilan metin bosluk ya da tire tasiyabiliyor.
    await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '12 34-56')

    await waitFor(() =>
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith(
        expect.objectContaining({ token: '123456' })
      )
    )
  })

  it('yanlis kodda hata gosterir ve yonlendirmez', async () => {
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Token has expired or is invalid' },
    })

    await render(<DogrulaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '000000')

    expect(await screen.findByText('Token has expired or is invalid')).toBeTruthy()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('kod eksikken dugmeye basilirsa sunucuya gitmez', async () => {
    await render(<DogrulaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '123')
    await fireEvent.press(screen.getByText('Doğrula'))

    expect(await screen.findByText('Kodu eksiksiz gir.')).toBeTruthy()
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled()
  })

  it('acilista tekrar gonderme kapali ve geri sayim gosteriliyor', async () => {
    await render(<DogrulaEkrani />)

    expect(await screen.findByText('60 sn sonra tekrar gönderebilirsin')).toBeTruthy()
    expect(screen.queryByText('Tekrar gönder')).toBeNull()
  })

  it('geri dugmesi onceki ekrana doner', async () => {
    await render(<DogrulaEkrani />)
    await fireEvent.press(screen.getByLabelText('Geri'))
    expect(mockRouterBack).toHaveBeenCalled()
  })
})
