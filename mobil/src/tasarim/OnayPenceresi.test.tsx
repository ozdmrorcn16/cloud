import { render, screen, fireEvent } from '@testing-library/react-native'
import { OnayPenceresi } from './OnayPenceresi'

/**
 * Geri alinamayan islemler icin ORTAK onay penceresi.
 *
 * Kullanicinin istegi (2026-09-02): silmeye basinca ekranin ortasinda
 * Sil / Vazgec dugmeli, kisa bir bilgilendirme tasiyan bir pencere
 * cikmali. Onceki tasarim onayi kartin ICINDE aciyordu; kullanici
 * Instagram'in gonderi silme penceresini ornek gosterdi.
 *
 * Kendi Modal'imiz kullaniliyor, `Alert.alert` DEGIL: uygulama web'de
 * de calisiyor (slooin.expo.app) ve React Native Web'de Alert sessizce
 * hicbir sey yapmaz - yani silme web'de tamamen kirilirdi.
 */
describe('OnayPenceresi', () => {
  const varsayilan = {
    acikMi: true,
    baslik: 'Check-in silinsin mi?',
    aciklama: 'Bu check-in kalıcı olarak silinir.',
    eylemEtiketi: 'Sil',
    onOnay: jest.fn(),
    onVazgec: jest.fn(),
  }

  beforeEach(() => jest.clearAllMocks())

  it('acikken baslik, aciklama ve iki dugmeyi gosterir', async () => {
    await render(<OnayPenceresi {...varsayilan} />)

    expect(screen.getByText('Check-in silinsin mi?')).toBeTruthy()
    expect(screen.getByText('Bu check-in kalıcı olarak silinir.')).toBeTruthy()
    expect(screen.getByText('Sil')).toBeTruthy()
    expect(screen.getByText('Vazgeç')).toBeTruthy()
  })

  it('kapaliyken hicbir sey cizmez', async () => {
    await render(<OnayPenceresi {...varsayilan} acikMi={false} />)

    expect(screen.queryByText('Check-in silinsin mi?')).toBeNull()
  })

  it('eylem dugmesi onOnay cagirir', async () => {
    await render(<OnayPenceresi {...varsayilan} />)

    fireEvent.press(screen.getByText('Sil'))

    expect(varsayilan.onOnay).toHaveBeenCalledTimes(1)
    expect(varsayilan.onVazgec).not.toHaveBeenCalled()
  })

  it('vazgec dugmesi onVazgec cagirir', async () => {
    await render(<OnayPenceresi {...varsayilan} />)

    fireEvent.press(screen.getByText('Vazgeç'))

    expect(varsayilan.onVazgec).toHaveBeenCalledTimes(1)
    expect(varsayilan.onOnay).not.toHaveBeenCalled()
  })

  /**
   * Zemine dokunmak vazgecmek demek - iOS'ta alistirilmis davranis.
   * Pencerenin KENDISINE dokunmak kapatmamali, yoksa metni okumak icin
   * dokunan kullanici islemi iptal etmis olur.
   */
  it('karartilmis zemine dokununca vazgecer', async () => {
    await render(<OnayPenceresi {...varsayilan} />)

    fireEvent.press(screen.getByTestId('onay-zemini'))

    expect(varsayilan.onVazgec).toHaveBeenCalledTimes(1)
  })

  it('pencerenin kendisine dokunmak kapatmaz', async () => {
    await render(<OnayPenceresi {...varsayilan} />)

    fireEvent.press(screen.getByTestId('onay-penceresi'))

    expect(varsayilan.onVazgec).not.toHaveBeenCalled()
  })

  /**
   * Aciklama istege bagli: her onay uzun bir gerekce istemiyor.
   */
  it('aciklama verilmezse yalnizca basligi gosterir', async () => {
    await render(<OnayPenceresi {...varsayilan} aciklama={undefined} />)

    expect(screen.getByText('Check-in silinsin mi?')).toBeTruthy()
    expect(screen.queryByText('Bu check-in kalıcı olarak silinir.')).toBeNull()
  })
})
