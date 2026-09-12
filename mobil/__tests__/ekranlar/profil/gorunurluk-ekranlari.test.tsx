import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AniGorunurluguEkrani from '../../../src/app/profil/ani-gorunurlugu'
import {
  aniGorunurlugunuAyarla,
} from '../../../lib/ayarlar'

jest.mock('../../../lib/ayarlar', () => ({
  aniGorunurlugunuAyarla: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
})

// `CheckInGorunurluguEkrani` testleri KALDIRILDI: ekran 2026-09-12'de
// silindi (ayarlardaki tek girisi kullanicinin istegiyle kalkti).
// Ayarlar testi satirin YOK oldugunu ayrica kilitliyor.

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
