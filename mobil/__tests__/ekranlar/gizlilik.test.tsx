import { render } from '@testing-library/react-native'
import GizlilikEkrani from '../../src/app/gizlilik'

it('moderasyonun mesaj okuyabilecegini acikca yazar', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(
    getByText(/moderasyon .* mesaj iceriklerini okuyabilir/i)
  ).toBeTruthy()
})

it('yurt disina aktarimi belirtir', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/Almanya/)).toBeTruthy()
})

it('silme ve dondurma haklarini belirtir', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/hesabini dondurabilir/i)).toBeTruthy()
  expect(getByText(/kalici olarak silebilirsin/i)).toBeTruthy()
})
