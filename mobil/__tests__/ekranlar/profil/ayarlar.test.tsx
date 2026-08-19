import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from '../../../src/app/profil/ayarlar'
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
} from '../../../lib/ayarlar'
import { kullaniciAdiniDegistir } from '../../../lib/kullanici-adi'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanGizliyiGetir: jest.fn(),
  varsayilanGizliyiAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
  aramadaGorunsunGetir: jest.fn(),
  aramadaGorunsunAyarla: jest.fn(),
}))

jest.mock('../../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../../lib/kullanici-adi'),
  kullaniciAdiniDegistir: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanGizliyiGetir as jest.Mock).mockResolvedValue(false)
  ;(varsayilanGizliyiAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aramadaGorunsunGetir as jest.Mock).mockResolvedValue(true)
  ;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
})

describe('AyarlarEkrani', () => {
  it('varsayilan gizlilik anahtarini acinca kaydeder', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent(screen.getByLabelText('Varsayilan gizli check-in'), 'valueChange', true)
    await waitFor(() => {
      expect(varsayilanGizliyiAyarla).toHaveBeenCalledWith(true)
    })
  })

  it('anilari kimseye kapatinca kaydeder', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent.press(screen.getByText('Kimse gormesin'))
    await waitFor(() => {
      expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('kimse')
    })
  })

  it('yukleme hatasi mesaj gosterir', async () => {
    ;(varsayilanGizliyiGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AyarlarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Oturum bulunamadi')).toBeTruthy()
    })
  })

  it('kaydetme basarisiz olursa anahtari eski degerine geri alir', async () => {
    ;(varsayilanGizliyiAyarla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())

    await fireEvent(screen.getByLabelText('Varsayilan gizli check-in'), 'valueChange', true)

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
    expect(screen.getByLabelText('Varsayilan gizli check-in').props.value).toBe(false)
  })

  it('kullanici adini degistirir', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockResolvedValue(undefined)

    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanici adi'), 'yeniad')
    await fireEvent.press(screen.getByText('Kullanici adini degistir'))

    await waitFor(() => expect(kullaniciAdiniDegistir).toHaveBeenCalledWith('yeniad'))
    expect(await screen.findByText('Kullanici adin guncellendi.')).toBeTruthy()
  })

  it('sunucudan gelen 30 gun hatasini gosterir', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockRejectedValue(
      new Error('Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: 12 gun')
    )

    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanici adi'), 'yeniad')
    await fireEvent.press(screen.getByText('Kullanici adini degistir'))

    expect(await screen.findByText(/Kalan sure: 12 gun/)).toBeTruthy()
  })

  it('aramada gorunurlugu kapatir', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent(screen.getByLabelText('Aramada gorunurluk'), 'valueChange', false)

    await waitFor(() => expect(aramadaGorunsunAyarla).toHaveBeenCalledWith(false))
  })
})
