import { render } from '@testing-library/react-native'
import GizlilikEkrani, { BOLUMLER } from '../../src/app/gizlilik'

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

// Yapisal emniyet (duzeltme turu 1): yukaridaki uc test yalnizca birer
// regex ariyor - bir bolum yanlislikla silinse bile suite yesil
// kalirdi. Bu testler BOLUMLER dizisinin sekli hakkinda.
it('yedi bolumun hepsi mevcut, hicbiri bos degil', () => {
  expect(BOLUMLER).toHaveLength(7)
  for (const bolum of BOLUMLER) {
    expect(bolum.baslik.length).toBeGreaterThan(0)
    expect(bolum.paragraflar.length).toBeGreaterThan(0)
  }
})

it('mekan aramasinin konumu sundugu ama saklamadigi acikca yazar (duzeltme turu 1: Critical)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/GONDERILIR\. Bu konum SAKLANMAZ/)).toBeTruthy()
})

it('gizli check-in de mekan sayacina dahil oldugunu yazar (duzeltme turu 1: Important 1)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/sayacina .* dahil olursun/i)).toBeTruthy()
})

it('hakkinda acilan sikayette kimlik baginin kopmadigini yazar (duzeltme turu 1: Important 3)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/hakkinda acilan sikayetlerde ise kimlik bagi KOPMAZ/)).toBeTruthy()
})

it('bildirimde gonderenin adinin da gittigini yazar (duzeltme turu 1: Important 4)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/tetikleyen kisinin adi buradan gecer/)).toBeTruthy()
})

it('check-in aniya donusunce koordinatin silindigini yazar, kalici saklanir demez (duzeltme turu 2: N1)', async () => {
  const { getByText, queryByText } = await render(<GizlilikEkrani />)
  expect(
    getByText(/aniya donusur, ve bu donusumde koordinat SILINIR/)
  ).toBeTruthy()
  // Turu 1'in yanlis beyani ("konumun KALICI olarak saklanir") artik
  // hicbir paragrafta gecmemeli.
  expect(queryByText(/konumun KALICI olarak saklanir/)).toBeNull()
})

it('mekan eklerken de cihaz konumunun kullanildigini yazar (duzeltme turu 2: Kismi 4)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/Yeni bir mekan eklerken/)).toBeTruthy()
})

it('otomatik silme kurallarinin birden fazla oldugunu yazar (duzeltme turu 2: Kismi 3)', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/birden fazla/)).toBeTruthy()
  expect(getByText(/2 gunden eski satirlar her gun otomatik silinir/)).toBeTruthy()
})
