import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import BildirimlerEkrani from '../../src/app/bildirimler'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { takipIsteginiYanitla } from '../../lib/bag'
import { bekleyenEtiketleriGetir, etiketiYanitla } from '../../lib/etiket'
import { avatarlariGetir } from '../../lib/akis'
import { etkilesimBildirimleriniGetir } from '../../lib/etkilesim'
import { ANAHTAR, onbellekYaz } from '../../lib/onbellek'

jest.mock('../../lib/bag-listeleri', () => ({ gelenIstekleriGetir: jest.fn() }))
jest.mock('../../lib/bag', () => ({ takipIsteginiYanitla: jest.fn() }))
jest.mock('../../lib/etiket', () => ({
  bekleyenEtiketleriGetir: jest.fn(),
  etiketiYanitla: jest.fn(),
}))
jest.mock('../../lib/akis', () => ({ avatarlariGetir: jest.fn() }))
jest.mock('../../lib/etkilesim', () => ({ etkilesimBildirimleriniGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

const ETIKET = {
  checkInId: 'checkin-1',
  mekanAdi: 'Kahve Durağı',
  etiketleyenId: 'kullanici-2',
  etiketleyenAd: 'Ada',
  etiketleyenKullaniciAdi: 'ada',
  olusturuldu: '2026-08-29T09:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
  ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([])
  ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)
  ;(etiketiYanitla as jest.Mock).mockResolvedValue(undefined)
  ;(avatarlariGetir as jest.Mock).mockResolvedValue({})
  ;(etkilesimBildirimleriniGetir as jest.Mock).mockResolvedValue([])
})

describe('BildirimlerEkrani - performans (2026-09-22)', () => {
  /**
   * Kullanicinin bildirimi: "bildirimler birazcik yine yavas sanki."
   * Olculen iki sebep: (a) ekran `Slot` yuzunden her donuste sifirdan
   * kuruluyordu, (b) istek listesi ve etkilesimler avatarlarini ZATEN
   * tasirken ekran hepsini bir kez daha soruyordu (ucuncu bir
   * `akis_profilleri` turu).
   */
  it('ELDEKI AVATARLAR yeniden sorulmuyor: hepsi listelerden geliyorsa istek YOK', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'kullanici-2', ad: 'Ada', kullaniciAdi: 'ada', avatarUrl: 'https://imzali/ada.jpg' }],
      sohbet: [],
    })
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([])

    await render(<BildirimlerEkrani />)

    expect(await screen.findByText(/Ada/)).toBeTruthy()
    expect(avatarlariGetir).not.toHaveBeenCalled()
  })

  it('YALNIZCA EKSIK avatarlar sorulur (etiketleyen listede yoksa)', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({ takip: [], sohbet: [] })
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)

    await waitFor(() => expect(avatarlariGetir).toHaveBeenCalledWith(['kullanici-2']))
  })

  it('ONBELLEK: eldeki bildirimler ANINDA cizilir, ag cevabi beklenmez', async () => {
    onbellekYaz(ANAHTAR.bildirimler, {
      takipIstekleri: [{ id: 'kullanici-9', ad: 'Deniz', kullaniciAdi: 'deniz', avatarUrl: null }],
      etiketler: [],
      etkilesimler: [],
      avatarlar: {},
    })
    // Ag CEVAP VERMIYOR: yine de liste dolu gorunmeli.
    ;(gelenIstekleriGetir as jest.Mock).mockReturnValue(new Promise(() => {}))

    await render(<BildirimlerEkrani />)

    expect(screen.getByText(/Deniz/)).toBeTruthy()
  })
})

describe('BildirimlerEkrani', () => {
  it('ETKILESIMLER (2026-09-22): begeni ve yorum satirlari; satir paylasimi, avatar kisiyi acar', async () => {
    ;(etkilesimBildirimleriniGetir as jest.Mock).mockResolvedValue([
      { id: 'yorum-y-1', tur: 'yorum', checkInId: 'c-1', aktorId: 'k-2', aktorAd: 'Mert', aktorKullaniciAdi: 'mert', avatarUrl: null, mekanAdi: 'Sahil Kafe', metin: 'harika bir yer', zaman: new Date().toISOString() },
      { id: 'begeni-c-1-k-1', tur: 'begeni', checkInId: 'c-1', aktorId: 'k-1', aktorAd: 'Ada', aktorKullaniciAdi: 'ada', avatarUrl: null, mekanAdi: 'Sahil Kafe', metin: null, zaman: new Date().toISOString() },
    ])
    await render(<BildirimlerEkrani />)
    expect(await screen.findByText('Etkileşimler')).toBeTruthy()
    expect(screen.getByText('mert')).toBeTruthy()
    expect(screen.getByText(/paylaşımına yorum yaptı/)).toBeTruthy()
    expect(screen.getByText('“harika bir yer”')).toBeTruthy()
    expect(screen.getByText(/paylaşımını beğendi/)).toBeTruthy()
    // Bos durum metni YOK.
    expect(screen.queryByText('Henüz bildirim yok')).toBeNull()

    await fireEvent.press(screen.getByTestId('etkilesim-begeni-c-1-k-1'))
    expect(mockRouterPush).toHaveBeenCalledWith('/paylasim/c-1')
    await fireEvent.press(screen.getByLabelText('ada'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k-1')
  })

  it('bekleyen bir sey yoksa yon veren bir metin gosterir', async () => {
    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('Yeni bir şey yok')).toBeTruthy()
  })

  it('gelen arkadaslik istegini gosterir ve kabul edince listeden kaldirir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'kullanici-3', kullaniciAdi: 'deniz', ad: 'Deniz' }],
      sohbet: [],
    })

    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('Deniz seninle arkadaş olmak istiyor.')).toBeTruthy()

    await fireEvent.press(screen.getByText('Kabul et'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('kullanici-3', true))
    await waitFor(() =>
      expect(screen.queryByText('Deniz seninle arkadaş olmak istiyor.')).toBeNull()
    )
  })

  it('bekleyen etiketi mekan adiyla gosterir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)

    expect(
      await screen.findByText('Ada Kahve Durağı check-in’inde seni etiketlemek istiyor.')
    ).toBeTruthy()
  })

  it('etiketi ONAYLAYINCA sunucuya onay gonderir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)
    await fireEvent.press(await screen.findByText('Onayla'))

    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('checkin-1', true))
  })

  it('etiketi REDDEDINCE sunucuya red gonderir ve satir kalkar', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])

    await render(<BildirimlerEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(etiketiYanitla).toHaveBeenCalledWith('checkin-1', false))
    await waitFor(() => expect(screen.queryByText('Onayla')).toBeNull())
  })

  it('etiketleyenin profil fotografini satirin basinda gosterir', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({
      'kullanici-2': 'https://ornek/ada.jpg',
    })

    await render(<BildirimlerEkrani />)

    const avatar = await screen.findByTestId('bildirim-avatar')
    expect(avatar.props.source).toEqual([{ uri: 'https://ornek/ada.jpg' }])
    expect(avatarlariGetir).toHaveBeenCalledWith(['kullanici-2'])
  })

  it('fotografi olmayan kisi icin adinin bas harfini gosterir', async () => {
    ;(gelenIstekleriGetir as jest.Mock).mockResolvedValue({
      takip: [{ id: 'kullanici-3', kullaniciAdi: 'deniz', ad: 'Deniz' }],
      sohbet: [],
    })

    await render(<BildirimlerEkrani />)

    expect(await screen.findByText('D')).toBeTruthy()
    // Bas harf gorunumu de ayni testID'yi tasiyor (2026-09-14); "resim
    // cizilmedi"nin olcusu source'un olmamasi.
    expect(screen.getByTestId('bildirim-avatar').props.source).toBeUndefined()
  })

  it('avatar okunamazsa bildirimler yine gorunur', async () => {
    ;(bekleyenEtiketleriGetir as jest.Mock).mockResolvedValue([ETIKET])
    ;(avatarlariGetir as jest.Mock).mockRejectedValue(new Error('ag yok'))

    await render(<BildirimlerEkrani />)

    expect(
      await screen.findByText('Ada Kahve Durağı check-in’inde seni etiketlemek istiyor.')
    ).toBeTruthy()
  })
})
