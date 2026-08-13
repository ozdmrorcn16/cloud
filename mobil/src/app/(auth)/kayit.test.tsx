import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KayitEkrani from './kayit'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signUp: jest.fn() } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

describe('KayitEkrani', () => {
  it('gecersiz telefon numarasinda hata gosterir', async () => {
    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '123')
    await fireEvent.changeText(screen.getByPlaceholderText('Sifre'), 'sifre1234')
    await fireEvent.press(screen.getByText('Kayit ol'))
    await waitFor(() => {
      expect(screen.getByText('Gecerli bir telefon numarasi gir')).toBeTruthy()
    })
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('gecerli bilgilerle signUp cagirir ve dogrulama ekranina yonlendirir', async () => {
    ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: {}, error: null })
    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '5551234567')
    await fireEvent.changeText(screen.getByPlaceholderText('Sifre'), 'sifre1234')
    await fireEvent.press(screen.getByText('Kayit ol'))
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        phone: '+905551234567',
        password: 'sifre1234',
      })
    })
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?telefon=%2B905551234567')
  })
})
