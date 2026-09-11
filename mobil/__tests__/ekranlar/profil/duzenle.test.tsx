import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilDuzenleEkrani from '../../../src/app/profil/duzenle'
import { kendiProfilimiGetir, profiliGuncelle } from '../../../lib/profil'

jest.mock('../../../lib/profil', () => ({
  kendiProfilimiGetir: jest.fn(),
  profiliGuncelle: jest.fn(),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}))

const PROFIL = {
  id: 'kullanici-1',
  kullaniciAdi: 'orcun',
  ad: 'Orcun Ozdemir',
  biyografi: 'merhaba',
  instagram: null,
  fotograflar: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue(PROFIL)
  ;(profiliGuncelle as jest.Mock).mockResolvedValue(undefined)
})

/**
 * INSTAGRAM ALANI (kullanicinin istegi 2026-09-11).
 *
 * BEYAN, DOGRULAMA DEGIL: Meta kisisel hesaplar icin OAuth yolunu
 * 2024-12-04'te kapatti. Testler alanin BICIM davranisini kilitliyor;
 * dogrulama diye bir sey yok.
 */
describe('ProfilDuzenleEkrani - Instagram', () => {
  it('mevcut degeri alana yaziyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({ ...PROFIL, instagram: 'orcun' })

    await render(<ProfilDuzenleEkrani />)

    expect(await screen.findByDisplayValue('orcun')).toBeTruthy()
  })

  /*
   * INSANLAR UC BICIMDE YAZIYOR (`orcun`, `@orcun`, yapistirilmis
   * adres) ve ucu de makul. Kaydederken hepsi ayni degere iniyor;
   * "yanlis yazdin" demek alanin tek isini (bir profile gitmek)
   * gereksiz yere zorlastirirdi.
   */
  it('yapistirilmis adresi sade kullanici adina indirip kaydediyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('Orcun Ozdemir')

    await fireEvent.changeText(
      screen.getByTestId('instagram-girdisi'),
      'https://www.instagram.com/Orcun.Ozdemir/'
    )
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() =>
      expect(profiliGuncelle).toHaveBeenCalledWith(
        expect.objectContaining({ instagram: 'orcun.ozdemir' })
      )
    )
  })

  it('alan bosaltilinca baglanti kaldiriliyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({ ...PROFIL, instagram: 'orcun' })

    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.changeText(screen.getByTestId('instagram-girdisi'), '')
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() =>
      expect(profiliGuncelle).toHaveBeenCalledWith(expect.objectContaining({ instagram: null }))
    )
  })

  /*
   * GECERSIZ AD SUNUCUYA HIC GITMIYOR. Sunucudaki kisit onu zaten
   * reddederdi ama kullanici ham bir kisit ihlali gorurdu; burada
   * sebebi yaziyor.
   */
  it('gecersiz kullanici adini gondermiyor, sebebini soyluyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('Orcun Ozdemir')

    await fireEvent.changeText(screen.getByTestId('instagram-girdisi'), '.orcun')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(profiliGuncelle).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'Instagram kullanıcı adı harf, rakam, nokta ve alt çizgiden oluşur; nokta ile başlayamaz ya da bitemez.'
      )
    ).toBeTruthy()
  })
})
