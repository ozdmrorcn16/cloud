import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import GirisEkrani from './giris'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/supabase', () => ({
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
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '5551234567')
    await fireEvent.changeText(screen.getByPlaceholderText('Sifre'), 'sifre1234')
    await fireEvent.press(screen.getByText('Giris yap'))
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
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '5551234567')
    await fireEvent.changeText(screen.getByPlaceholderText('Sifre'), 'yanlissifre')
    await fireEvent.press(screen.getByText('Giris yap'))
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeTruthy()
    })
  })
})
