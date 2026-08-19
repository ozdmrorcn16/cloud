import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import SikayetEkrani from '../../src/app/sikayet'
import { sikayetGonder } from '../../lib/sikayet'

jest.mock('../../lib/sikayet', () => ({
  sikayetGonder: jest.fn(),
  SIKAYET_SEBEPLERI: [
    { anahtar: 'taciz', etiket: 'Taciz veya rahatsiz etme' },
    { anahtar: 'spam', etiket: 'Spam veya reklam' },
  ],
}))

const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => ({ hedefTur: 'kullanici', hedefId: 'kullanici-2' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SikayetEkrani', () => {
  it('sebep secip gonderince sikayeti iletir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Taciz veya rahatsiz etme'))
    await fireEvent.changeText(screen.getByPlaceholderText('Eklemek istedigin bir sey var mi?'), 'detay')
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(sikayetGonder).toHaveBeenCalledWith('kullanici', 'kullanici-2', 'taciz', 'detay')
    })
  })

  it('sebep secilmeden gonderilemez', async () => {
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(screen.getByText('Bir sebep sec')).toBeTruthy()
    })
    expect(sikayetGonder).not.toHaveBeenCalled()
  })

  it('gonderdikten sonra teyit gosterir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(screen.getByText('Sikayetin alindi')).toBeTruthy()
    })
  })
})
