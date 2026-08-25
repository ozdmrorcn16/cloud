import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import CheckInGorunurluguEkrani from '../../../src/app/profil/check-in-gorunurlugu'
import AniGorunurluguEkrani from '../../../src/app/profil/ani-gorunurlugu'
import {
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
  aniGorunurlugunuAyarla,
} from '../../../lib/ayarlar'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanBulunurluguGetir: jest.fn(),
  varsayilanBulunurluguAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
  ;(varsayilanBulunurluguAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
})

describe('CheckInGorunurluguEkrani', () => {
  it('mevcut secimi isaretli gosterir', async () => {
    await render(<CheckInGorunurluguEkrani />)

    const satir = await screen.findByLabelText('Herkese açık')
    expect(satir.props.accessibilityState.selected).toBe(true)
  })

  it('secim degisince kaydeder', async () => {
    await render(<CheckInGorunurluguEkrani />)

    await fireEvent.press(await screen.findByText('Gizli'))

    await waitFor(() => expect(varsayilanBulunurluguAyarla).toHaveBeenCalledWith('gizli'))
  })

  it('kaydetme basarisiz olursa secim eski haline doner', async () => {
    ;(varsayilanBulunurluguAyarla as jest.Mock).mockRejectedValue(
      new Error('Sunucuya ulasilamadi')
    )

    await render(<CheckInGorunurluguEkrani />)
    await fireEvent.press(await screen.findByText('Gizli'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByLabelText('Herkese açık').props.accessibilityState.selected).toBe(true)
    )
  })
})

describe('AniGorunurluguEkrani', () => {
  it('acilista hicbir secenek secili degil', async () => {
    await render(<AniGorunurluguEkrani />)

    // Bu bir tercih degil toplu eylem: sunucudan okunan bir baslangic
    // degeri yok, dolayisiyla hicbir sey secili gorunmemeli.
    const satir = await screen.findByLabelText('Herkes görsün')
    expect(satir.props.accessibilityState.selected).toBe(false)
  })

  it('anilari sadece takipcilere acar', async () => {
    await render(<AniGorunurluguEkrani />)

    await fireEvent.press(await screen.findByText('Sadece takipçilerim görsün'))

    await waitFor(() => expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('takipcilerim'))
  })

  it('anilari kimseye kapatinca kaydeder ve secili gosterir', async () => {
    await render(<AniGorunurluguEkrani />)

    await fireEvent.press(await screen.findByText('Kimse görmesin'))

    await waitFor(() => expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('kimse'))
    await waitFor(() =>
      expect(screen.getByLabelText('Kimse görmesin').props.accessibilityState.selected).toBe(true)
    )
  })

  it('kaydetme basarisiz olursa secili gosterimi geri alir', async () => {
    ;(aniGorunurlugunuAyarla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<AniGorunurluguEkrani />)
    await fireEvent.press(await screen.findByText('Kimse görmesin'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByLabelText('Kimse görmesin').props.accessibilityState.selected).toBe(
        false
      )
    )
  })
})
