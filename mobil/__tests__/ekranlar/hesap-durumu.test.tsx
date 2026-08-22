import { render } from '@testing-library/react-native'
import HesapDurumuEkrani from '../../src/app/hesap-durumu'

const sahteOturum: {
  hesapDurumu: null | {
    durum: 'askida' | 'yasakli' | 'dondurulmus'
    askiBitisi: string | null
    gerekce: string
  }
} = { hesapDurumu: null }

jest.mock('../../lib/oturum', () => ({
  useOturum: () => sahteOturum,
}))

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

it('askida hesap icin sebep ve bitis tarihi gosterir', async () => {
  sahteOturum.hesapDurumu = {
    durum: 'askida',
    askiBitisi: '2026-09-01T12:00:00Z',
    gerekce: 'Taciz bildirimleri',
  }
  const { getByText } = await render(<HesapDurumuEkrani />)
  expect(getByText('Hesabin askiya alindi')).toBeTruthy()
  expect(getByText(/Taciz bildirimleri/)).toBeTruthy()
})

it('yasakli hesap icin bitis tarihi gostermez', async () => {
  sahteOturum.hesapDurumu = {
    durum: 'yasakli',
    askiBitisi: null,
    gerekce: 'Tekrarlanan ihlal',
  }
  const { getByText, queryByText } = await render(<HesapDurumuEkrani />)
  expect(getByText('Hesabin kalici olarak kapatildi')).toBeTruthy()
  expect(queryByText(/Bitis/)).toBeNull()
})
