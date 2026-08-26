import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import GirisEkrani from '../../src/app/(auth)/giris'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

describe('GirisEkrani', () => {
  it('dogru bilgilerle signInWithPassword cagirir ve yonlendirir', async () => {
    ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: {}, error: null })
    await render(<GirisEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Telefon numarası'), '5551234567')
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'sifre1234')
    await fireEvent.press(screen.getByText('Giriş yap'))
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        phone: '+905551234567',
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
    await fireEvent.changeText(screen.getByPlaceholderText('Telefon numarası'), '5551234567')
    await fireEvent.changeText(screen.getByPlaceholderText('Şifre'), 'yanlissifre')
    await fireEvent.press(screen.getByText('Giriş yap'))
    await waitFor(() => {
      expect(screen.getByText('Telefon numarası ya da şifre hatalı.')).toBeTruthy()
    })
  })
})
