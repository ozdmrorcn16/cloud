import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanDuzenleEkrani from '../../../src/app/mekanlar/duzenle/[mekanId]'
import { mekaniGetir } from '../../../lib/mekan'
import {
  duzenlemeTalebiGonder,
  mekanFotografiYukle,
  bekleyenTalebimVarMi,
} from '../../../lib/mekan-duzenleme'

/*
 * fireEvent cagrilari AWAIT ediliyor. Bu ortamda (React 19 + RNTL) bir
 * `setState` ayni turda ekrana yansimiyor; beklemeden basilan dugme
 * ESKI kapanisi calistiriyor ve "degisiklik yok" dali isliyordu -
 * olcuIdu (girilen deger 'Sahil Kahve' iken alan hala 'Sahil Kafe'
 * gorunuyordu).
 */
jest.mock('../../../lib/mekan', () => ({
  ...jest.requireActual('../../../lib/mekan'),
  mekaniGetir: jest.fn(),
}))
jest.mock('../../../lib/mekan-duzenleme', () => ({
  ...jest.requireActual('../../../lib/mekan-duzenleme'),
  duzenlemeTalebiGonder: jest.fn(),
  mekanFotografiYukle: jest.fn(),
  bekleyenTalebimVarMi: jest.fn(),
}))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kisi-1' } } }) } },
}))

const mockGeri = jest.fn()
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
  useRouter: () => ({ back: mockGeri, push: jest.fn() }),
}))

const mockKamera = jest.fn()
const mockGaleri = jest.fn()
const mockGaleriIzni = jest.fn()
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: (...a: unknown[]) => mockKamera(...a),
  requestMediaLibraryPermissionsAsync: (...a: unknown[]) => mockGaleriIzni(...a),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: (...a: unknown[]) => mockGaleri(...a),
}))

const MEKAN = {
  id: 'mekan-1',
  ad: 'Sahil Kafe',
  tur: 'Kafe',
  semt: 'Nilüfer',
  il: 'Bursa',
  kaynak: 'foursquare',
  adres: 'Eski Cadde 5',
  osmId: null,
  konum: { lat: 40.2, lng: 28.9 },
  kapakFotograf: null,
  mahalle: null,
  kapali: false,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mekaniGetir as jest.Mock).mockResolvedValue(MEKAN)
  ;(bekleyenTalebimVarMi as jest.Mock).mockResolvedValue(false)
  ;(duzenlemeTalebiGonder as jest.Mock).mockResolvedValue('talep-1')
  mockGaleri.mockResolvedValue({ canceled: false, assets: [{ uri: 'file://foto.jpg' }] })
  mockGaleriIzni.mockResolvedValue({ granted: true })
  mockKamera.mockResolvedValue({ granted: true })
  // Secici, kaynak penceresi kapandiktan SONRA aciliyor (iOS modal
  // yarisi); testte o gecikmeyi ilerletmek icin sahte zamanlayici yok -
  // gercek zamanli bekleniyor.
})

describe('MekanDuzenleEkrani', () => {
  /*
   * ALANLAR MEVCUT DEGERLE DOLU BASLIYOR: bos formla baslamak kisiye
   * adi bastan yazdirirdi.
   */
  it('mevcut bilgilerle doluyor', async () => {
    await render(<MekanDuzenleEkrani />)

    expect(await screen.findByDisplayValue('Sahil Kafe')).toBeTruthy()
    expect(screen.getByDisplayValue('Eski Cadde 5')).toBeTruthy()
  })

  /*
   * YALNIZCA DEGISEN ALAN GONDERILIYOR. Degismemis alanlari da
   * yollamak moderatorun onune "duzeltme" diye ayni degeri cikarirdi.
   */
  it('yalnizca DEGISEN alani gonderiyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.changeText(screen.getByTestId('duzenle-ad'), 'Sahil Kahve')
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    await waitFor(() =>
      expect(duzenlemeTalebiGonder).toHaveBeenCalledWith('mekan-1', {
        ad: 'Sahil Kahve',
        mahalle: null,
        adres: null,
        il: null,
        ilce: null,
        tur: null,
        fotograf: null,
        kapali: false,
      })
    )
  })

  /*
   * MAHALLE VE IL/ILCE (kullanicinin istegi 2026-09-09). Mahalle
   * adresin BASINDA; il ve ilce ayri bir satirda. Mekanin mevcut
   * ilcesi `semt` sutunundan geliyor - o adin icerigi 2026-08-31'den
   * beri ILCE.
   */
  it('mahalle, il ve ilce alanlari mevcut degerle dolu', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, mahalle: 'Alaaddinbey' })

    await render(<MekanDuzenleEkrani />)

    expect(await screen.findByDisplayValue('Alaaddinbey')).toBeTruthy()
    expect(screen.getByDisplayValue('Bursa')).toBeTruthy()
    expect(screen.getByDisplayValue('Nilüfer')).toBeTruthy()
  })

  it('mahalle ve ilce degisince ikisi de gonderiliyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.changeText(screen.getByTestId('duzenle-mahalle'), 'Alaaddinbey')
    await fireEvent.changeText(screen.getByTestId('duzenle-ilce'), 'Osmangazi')
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    await waitFor(() =>
      expect(duzenlemeTalebiGonder).toHaveBeenCalledWith(
        'mekan-1',
        expect.objectContaining({ mahalle: 'Alaaddinbey', ilce: 'Osmangazi' })
      )
    )
  })

  it('tur secilince o tur gonderiliyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.press(screen.getByText('Restoran'))
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    await waitFor(() =>
      expect(duzenlemeTalebiGonder).toHaveBeenCalledWith(
        'mekan-1',
        expect.objectContaining({ tur: 'Restoran' })
      )
    )
  })

  it('fotograf secilince ONCE yukleniyor, sonra yolu gonderiliyor', async () => {
    ;(mekanFotografiYukle as jest.Mock).mockResolvedValue('kisi-1/1.jpg')

    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.press(screen.getByTestId('fotograf-ekle'))
    await fireEvent.press(await screen.findByTestId('foto-galeri'))

    await waitFor(() => expect(screen.getByTestId('fotografi-kaldir')).toBeTruthy())
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    await waitFor(() =>
      expect(mekanFotografiYukle).toHaveBeenCalledWith('kisi-1', 'file://foto.jpg')
    )
    await waitFor(() =>
      expect(duzenlemeTalebiGonder).toHaveBeenCalledWith(
        'mekan-1',
        expect.objectContaining({ fotograf: 'kisi-1/1.jpg' })
      )
    )
  })

  /*
   * DEGISIKLIK YOKKEN dugme BASILABILIR kaliyor ve sebebini soyluyor;
   * tamamen devre disi birakmak kisiyi "neden calismiyor" sorusuyla
   * bas basa birakiyordu (ayni ders hesap olusturma ekraninda).
   */
  it('degisiklik yokken gondermiyor, sebebini soyluyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    expect(duzenlemeTalebiGonder).not.toHaveBeenCalled()
    expect(await screen.findByText('Önce bir bilgiyi değiştir.')).toBeTruthy()
  })

  it('gonderilince SONUC ekrani cikiyor, form kapaniyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.changeText(screen.getByTestId('duzenle-ad'), 'Yeni Ad')
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    expect(await screen.findByTestId('talep-gonderildi')).toBeTruthy()
    expect(screen.queryByTestId('duzenle-ad')).toBeNull()
  })

  /*
   * BEKLEYEN TALEP VARSA FORM HIC ACILMIYOR: sunucu ikincisini zaten
   * reddediyor; formu doldurtup sonunda hata gostermek "bosa is
   * yaptirma" kuralina aykiri.
   */
  it('bekleyen talep varsa form yerine bilgi gosteriyor', async () => {
    ;(bekleyenTalebimVarMi as jest.Mock).mockResolvedValue(true)

    await render(<MekanDuzenleEkrani />)

    expect(await screen.findByTestId('bekleyen-talep')).toBeTruthy()
    expect(screen.queryByTestId('duzenle-ad')).toBeNull()
  })

  /*
   * GALERI IZNI de acikca isteniyor. Onceden istenmiyordu ve izin
   * yokken `launchImageLibraryAsync` hicbir sey gostermeden donuyordu;
   * kullanici "galeriden sec diyince acilmiyor" diye bildirdi.
   */
  it('galeri izni reddedilirse uyari cikiyor ve galeri acilmiyor', async () => {
    mockGaleriIzni.mockResolvedValue({ granted: false })

    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.press(screen.getByTestId('fotograf-ekle'))
    await fireEvent.press(await screen.findByTestId('foto-galeri'))

    expect(
      await screen.findByText('Galeriden seçmek için fotoğraf izni gerekiyor.')
    ).toBeTruthy()
    expect(mockGaleri).not.toHaveBeenCalled()
  })

  /*
   * KAPANDI BILDIRIMI (2026-09-11). Kullanicinin sorusu "kapali,
   * gercekte olmayan yerler var, bunlari tespit etmek mumkun mu?" idi;
   * otomatik tespit olcuIerek elendi (Foursquare'in `date_closed`
   * alani indirmede filtrelenmis, `date_refreshed` ise zayif bir
   * sinyal) ve kaynak orada bulunan insan oldu.
   *
   * TEK BASINA GONDERILEBILIYOR: baska hicbir alan degismeden de
   * gecerli bir talep. Bu test onu kilitliyor - "en az bir alan" sarti
   * bu bayragi saymazsa dugme bosa basilir.
   */
  it('yalnizca kapandi isaretlenince talep gonderilebiliyor', async () => {
    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent(screen.getByTestId('kapali-anahtari'), 'valueChange', true)
    await fireEvent.press(screen.getByTestId('talebi-gonder'))

    await waitFor(() =>
      expect(duzenlemeTalebiGonder).toHaveBeenCalledWith(
        'mekan-1',
        expect.objectContaining({ kapali: true, ad: null })
      )
    )
  })

  /*
   * ZATEN KAPALI BIR MEKANDA ANAHTAR HIC CIZILMIYOR: sunucu ikinci
   * bildirimi reddediyor ("Bu mekan zaten kapali olarak isaretli"),
   * yani isaretletip sonunda hata gostermek "bosa is yaptirma"
   * kuralina aykiri olurdu.
   */
  it('mekan zaten kapaliysa anahtar yerine bilgi gosteriyor', async () => {
    ;(mekaniGetir as jest.Mock).mockResolvedValue({ ...MEKAN, kapali: true })

    await render(<MekanDuzenleEkrani />)

    expect(await screen.findByTestId('zaten-kapali')).toBeTruthy()
    expect(screen.queryByTestId('kapali-anahtari')).toBeNull()
  })

  it('kamera izni reddedilirse uyari cikiyor ve kamera acilmiyor', async () => {
    mockKamera.mockResolvedValue({ granted: false })

    await render(<MekanDuzenleEkrani />)
    await screen.findByDisplayValue('Sahil Kafe')

    await fireEvent.press(screen.getByTestId('fotograf-ekle'))
    await fireEvent.press(await screen.findByTestId('foto-kamera'))

    expect(
      await screen.findByText('Fotoğraf çekmek için kamera izni gerekiyor.')
    ).toBeTruthy()
  })
})
