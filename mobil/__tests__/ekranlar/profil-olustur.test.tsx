import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilOlusturEkrani from '../../src/app/profil-olustur'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
    from: jest.fn(() => ({ insert: jest.fn().mockResolvedValue({ error: null }) })),
  },
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

describe('ProfilOlusturEkrani', () => {
  it('18 yas altinda dogum tarihinde hata gosterir', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Adin'), 'Ada')
    await fireEvent.changeText(screen.getByPlaceholderText('YYYY-AA-GG'), '2015-01-01')
    await fireEvent.press(screen.getByText('Devam et'))
    await waitFor(() => {
      expect(screen.getByText('Uygulamayi kullanmak icin 18 yasinda olmalisin')).toBeTruthy()
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('gecerli bilgilerle profil olusturur ve ana ekrana yonlendirir', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Adin'), 'Ada')
    await fireEvent.changeText(screen.getByPlaceholderText('YYYY-AA-GG'), '2000-01-01')
    await fireEvent.changeText(screen.getByPlaceholderText('Kisa bir tanitim yaz'), 'Merhaba!')
    await fireEvent.press(screen.getByText('Devam et'))
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiller')
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })
})
