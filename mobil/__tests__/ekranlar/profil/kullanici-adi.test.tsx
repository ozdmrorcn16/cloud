import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KullaniciAdiEkrani from '../../../src/app/profil/kullanici-adi'
import { kullaniciAdiDurumunuGetir } from '../../../lib/ayarlar'
import { kullaniciAdiniDegistir } from '../../../lib/kullanici-adi'

jest.mock('../../../lib/ayarlar', () => ({ kullaniciAdiDurumunuGetir: jest.fn() }))
jest.mock('../../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../../lib/kullanici-adi'),
  kullaniciAdiniDegistir: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
    kullaniciAdi: 'orcun',
    sonrakiDegisimTarihi: null,
  })
  ;(kullaniciAdiniDegistir as jest.Mock).mockResolvedValue(undefined)
})

describe('KullaniciAdiEkrani', () => {
  it('mevcut kullanici adini gosterir', async () => {
    await render(<KullaniciAdiEkrani />)
    expect(await screen.findByText('orcun')).toBeTruthy()
  })

  it('kullanici adini degistirir', async () => {
    await render(<KullaniciAdiEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanıcı adı'), 'yeni_ad')
    await fireEvent.press(screen.getByText('Kullanıcı adını değiştir'))

    await waitFor(() => expect(kullaniciAdiniDegistir).toHaveBeenCalledWith('yeni_ad'))
    expect(await screen.findByText('Kullanıcı adın güncellendi.')).toBeTruthy()
  })

  it('bicimi bozuk adi sunucuya hic gondermez', async () => {
    await render(<KullaniciAdiEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanıcı adı'), 'ab')
    await fireEvent.press(screen.getByText('Kullanıcı adını değiştir'))

    await waitFor(() => expect(kullaniciAdiniDegistir).not.toHaveBeenCalled())
  })

  it('sunucudan gelen 30 gun hatasini gosterir', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockRejectedValue(
      new Error('Kullanıcı adını 30 günde bir değiştirebilirsin')
    )

    await render(<KullaniciAdiEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanıcı adı'), 'yeni_ad')
    await fireEvent.press(screen.getByText('Kullanıcı adını değiştir'))

    expect(
      await screen.findByText('Kullanıcı adını 30 günde bir değiştirebilirsin')
    ).toBeTruthy()
  })

  it('sonraki degisim tarihi gelecekteyse gosterir', async () => {
    const gelecek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
      kullaniciAdi: 'orcun',
      sonrakiDegisimTarihi: gelecek,
    })

    await render(<KullaniciAdiEkrani />)

    const gun = String(gelecek.getDate()).padStart(2, '0')
    const ay = String(gelecek.getMonth() + 1).padStart(2, '0')
    expect(
      await screen.findByText(
        `Tekrar değiştirebileceğin tarih: ${gun}.${ay}.${gelecek.getFullYear()}`
      )
    ).toBeTruthy()
  })
})
