import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilOlusturEkrani from '../../src/app/profil-olustur'
import { supabase } from '../../lib/supabase'
import { kullaniciAdiMusaitMi } from '../../lib/kullanici-adi'

const mockInsert = jest.fn()

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../lib/kullanici-adi'),
  kullaniciAdiMusaitMi: jest.fn(),
}))

const mockRouterReplace = jest.fn()
const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
}))

/** Tarih tekerlegini acar ve "Tamam" ile varsayilan tarihi secer. */
async function dogumTarihiniSec() {
  await fireEvent.press(screen.getByLabelText('Doğum tarihin'))
  await fireEvent.press(screen.getByText('Tamam'))
}

/** Onay kutusu disindaki butun alanlari gecerli degerlerle doldurur. */
async function formuDoldur() {
  await fireEvent.changeText(screen.getByPlaceholderText('Adın ve soyadın'), 'Orçun Özdemir')
  await dogumTarihiniSec()
  await fireEvent.changeText(screen.getByPlaceholderText('kullaniciadi'), 'Orcun')
  await fireEvent.changeText(screen.getByPlaceholderText('En az 8 karakter'), 'sifre1234')
  await fireEvent.changeText(
    screen.getByPlaceholderText('Aynı şifreyi bir kez daha'),
    'sifre1234'
  )
}

describe('ProfilOlusturEkrani', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    ;(supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert })
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'kullanici-1' } },
    })
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(true)
  })

  it('sozlesme onaylanmadan hesap olusturmaz', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(
      await screen.findByText('Devam etmek için sözleşmeleri onaylaman gerekiyor.')
    ).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('onay isaretlenince sifreyi, onayi ve profili yazip ana ekrana gecer', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'sifre1234',
          data: expect.objectContaining({ aydinlatma_onayi: true, konum_rizasi: true }),
        })
      )
    })
    expect(supabase.from).toHaveBeenCalledWith('profiller')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ ad: 'Orçun Özdemir', kullanici_adi: 'orcun' })
    )
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('secilen dogum tarihini ISO bicimiyle kaydeder', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() => expect(mockInsert).toHaveBeenCalled())
    const yazilan = mockInsert.mock.calls[0][0]
    // Tekerlek 25 yil oncesinde 1 Ocak'ta aciliyor.
    expect(yazilan.dogum_tarihi).toBe(`${new Date().getFullYear() - 25}-01-01`)
  })

  it('dogum tarihi secilmeden hesap olusturmaz', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Adın ve soyadın'), 'Orçun Özdemir')
    await fireEvent.changeText(screen.getByPlaceholderText('kullaniciadi'), 'orcun')
    await fireEvent.changeText(screen.getByPlaceholderText('En az 8 karakter'), 'sifre1234')
    await fireEvent.changeText(
      screen.getByPlaceholderText('Aynı şifreyi bir kez daha'),
      'sifre1234'
    )
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Doğum tarihini seç.')).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('sifreler uyusmuyorsa hesap olusturmaz', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.changeText(
      screen.getByPlaceholderText('Aynı şifreyi bir kez daha'),
      'baskasifre'
    )
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(
      await screen.findByText('Şifreler aynı değil. İkisini de kontrol et.')
    ).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('kisa sifreyi reddeder', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.changeText(screen.getByPlaceholderText('En az 8 karakter'), 'kisa')
    await fireEvent.changeText(screen.getByPlaceholderText('Aynı şifreyi bir kez daha'), 'kisa')
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Şifre en az 8 karakter olmalı.')).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('bicime uymayan kullanici adinda kurali gosterir ve kaydetmez', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.changeText(screen.getByPlaceholderText('kullaniciadi'), 'or')
    await fireEvent.press(screen.getByLabelText('Sözleşmeleri kabul ediyorum'))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText(/3-20 karakter/)).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('alinmis kullanici adinda uyari gosterir', async () => {
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(false)

    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('kullaniciadi'), 'orcun')

    expect(
      await screen.findByText('Bu kullanıcı adı alınmış, başka bir tane dene.')
    ).toBeTruthy()
  })

  it('musait kullanici adinda musait yazisini gosterir', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('kullaniciadi'), 'orcun')

    expect(await screen.findByText('Bu kullanıcı adı müsait.')).toBeTruthy()
  })
})
