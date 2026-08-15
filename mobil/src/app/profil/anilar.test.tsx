import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import AnilarEkrani from './anilar'
import { kendiAnilariniGetir, aniyiSil } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/checkin', () => ({ kendiAnilariniGetir: jest.fn(), aniyiSil: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))
jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

beforeEach(() => {
  jest.clearAllMocks()
  ;(kendiAnilariniGetir as jest.Mock).mockResolvedValue([
    {
      id: 'checkin-3', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika', fotograf: null,
      olusturmaZamani: '2026-08-10T10:00:00Z', bitisZamani: '2026-08-10T14:00:00Z', canliMi: false,
      mekanKonumu: { lat: 41.015, lng: 28.979 },
    },
  ])
})

describe('AnilarEkrani', () => {
  it('anilari mekan adiyla listeler', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
  })

  it('bir aniya tiklayinca haritayi acar', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))
    expect(Linking.openURL).toHaveBeenCalledWith('https://maps.google.com/?q=41.015,28.979')
  })

  it('sil butonuna basinca aniyiSil cagirir ve listeden kaldirir', async () => {
    ;(aniyiSil as jest.Mock).mockResolvedValue(undefined)
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sil'))
    await waitFor(() => {
      expect(aniyiSil).toHaveBeenCalledWith('checkin-3')
    })
  })

  it('anilar yuklenemezse hata mesaji gosterir', async () => {
    ;(kendiAnilariniGetir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await render(<AnilarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })
})
