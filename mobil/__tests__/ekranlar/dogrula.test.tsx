import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import DogrulaEkrani from '../../src/app/(auth)/dogrula'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { verifyOtp: jest.fn(), signUp: jest.fn() } },
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useLocalSearchParams: () => ({ telefon: '+905551234567' }),
}))

describe('DogrulaEkrani', () => {
  it('dogru kodla verifyOtp cagirir ve profil olusturmaya yonlendirir', async () => {
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
    await render(<DogrulaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Doğrulama kodu'), '123456')
    await fireEvent.press(screen.getByText('Dogrula'))
    await waitFor(() => {
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+905551234567',
        token: '123456',
        type: 'sms',
      })
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/profil-olustur')
  })

  it('yanlis kodda hata gosterir', async () => {
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Token has expired or is invalid' },
    })
    await render(<DogrulaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Doğrulama kodu'), '000000')
    await fireEvent.press(screen.getByText('Dogrula'))
    await waitFor(() => {
      expect(screen.getByText('Token has expired or is invalid')).toBeTruthy()
    })
  })
})
