import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from './ayarlar'
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
} from '../../../lib/ayarlar'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanGizliyiGetir: jest.fn(),
  varsayilanGizliyiAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanGizliyiGetir as jest.Mock).mockResolvedValue(false)
  ;(varsayilanGizliyiAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
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
})
