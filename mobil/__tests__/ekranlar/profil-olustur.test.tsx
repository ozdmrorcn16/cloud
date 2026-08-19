import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilOlusturEkrani from '../../src/app/profil-olustur'
import { supabase } from '../../lib/supabase'
import { kullaniciAdiMusaitMi } from '../../lib/kullanici-adi'

const mockInsert = jest.fn().mockResolvedValue({ error: null })

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
    from: jest.fn(() => ({ insert: mockInsert })),
  },
}))

jest.mock('../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../lib/kullanici-adi'),
  kullaniciAdiMusaitMi: jest.fn(),
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
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'Orcun')
    await fireEvent.changeText(screen.getByPlaceholderText('YYYY-AA-GG'), '2000-01-01')
    await fireEvent.changeText(screen.getByPlaceholderText('Kisa bir tanitim yaz'), 'Merhaba!')
    await fireEvent.press(screen.getByText('Devam et'))
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiller')
    })
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ kullanici_adi: 'orcun' })
    )
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('bicime uymayan kullanici adinda kurali gosterir ve kaydetmez', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Adin'), 'Orcun Ozdemir')
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'or')
    await fireEvent.changeText(screen.getByPlaceholderText('YYYY-AA-GG'), '1990-01-01')
    await fireEvent.press(screen.getByText('Devam et'))

    expect(await screen.findByText(/3-20 karakter/)).toBeTruthy()
  })

  it('alinmis kullanici adinda uyari gosterir', async () => {
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(false)

    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'orcun')

    expect(await screen.findByText('Bu kullanici adi alinmis, baska bir tane dene.')).toBeTruthy()
  })

  it('musait kullanici adinda musait yazisini gosterir', async () => {
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(true)

    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'orcun')

    expect(await screen.findByText('Bu kullanici adi musait.')).toBeTruthy()
  })
})
