import { render, fireEvent } from '@testing-library/react-native'
import HesabiSilEkrani from '../../../src/app/profil/hesabi-sil'
import { hesabiSil } from '../../../lib/hesap'

jest.mock('../../../lib/hesap', () => ({
  hesabiSil: jest.fn(),
}))

jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

const sahteSil = hesabiSil as jest.Mock

beforeEach(() => jest.clearAllMocks())

it('dondurmayi alternatif olarak sunar', async () => {
  const { getByText } = await render(<HesabiSilEkrani />)
  expect(
    getByText(
      'Geri donusu yok. Yeniden gelmek istersen sifirdan hesap acman gerekir.'
    )
  ).toBeTruthy()
  expect(getByText('Bunun yerine hesabimi dondur')).toBeTruthy()
})

it('parola yazilmadan silme calismaz', async () => {
  const { getByText } = await render(<HesabiSilEkrani />)
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(sahteSil).not.toHaveBeenCalled()
  expect(getByText('Onaylamak icin parolani yaz.')).toBeTruthy()
})

it('dogru parolayla silme cagrilir', async () => {
  const { getByText, getByPlaceholderText } = await render(<HesabiSilEkrani />)
  await fireEvent.changeText(getByPlaceholderText('parolan'), 'dogruparola')
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(sahteSil).toHaveBeenCalledWith('dogruparola')
})

it('sunucu parolayi reddederse hata ekranda gorunur', async () => {
  sahteSil.mockRejectedValueOnce(new Error('Parola yanlis'))
  const { getByText, getByPlaceholderText } = await render(<HesabiSilEkrani />)
  await fireEvent.changeText(getByPlaceholderText('parolan'), 'yanlisparola')
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(getByText('Parola yanlis')).toBeTruthy()
})

// Duzeltme turu 1 (Minor, kod incelemesi): reddedilen bir denemeden
// sonra parola girdisi state'te kalmamali.
it('basarisiz denemeden sonra parola alani temizlenir', async () => {
  sahteSil.mockRejectedValueOnce(new Error('Parola yanlis'))
  const { getByText, getByPlaceholderText } = await render(<HesabiSilEkrani />)
  const girdi = getByPlaceholderText('parolan')
  await fireEvent.changeText(girdi, 'yanlisparola')
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(getByText('Parola yanlis')).toBeTruthy()
  expect(girdi.props.value).toBe('')
})
