import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import BaglarEkrani from '../../src/app/baglar'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'
import { takibiBirak } from '../../lib/bag'
import { engelle } from '../../lib/engelleme'

jest.mock('../../lib/bag-listeleri', () => ({
  takipcilerimiGetir: jest.fn(),
}))

jest.mock('../../lib/bag', () => ({
  takibiBirak: jest.fn(),
}))

jest.mock('../../lib/engelleme', () => ({
  engelle: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
})

/**
 * ARKADASLAR EKRANI - kullanicinin karari (2026-09-01):
 * "Bu sayfadaki butun alt basliklari kaldir. Henuz arkadasi yoksa
 * 'Henuz arkadasin yok' yazisi, varsa arkadas listesi burada
 * gorunecek."
 *
 * Yani ekran TEK ISE indirildi: arkadas listesi. Gelen istekler,
 * sohbet istekleri ve giden istekler bolumleri kaldirildi - hepsi
 * baska ekranlarda zaten var (bkz. asagidaki "bolumler
 * GOSTERILMEZ" testinin yorumu).
 */
describe('BaglarEkrani', () => {
  it('arkadaslari listeler', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
      { id: 'k2', kullaniciAdi: 'mert', ad: 'Mert K' },
    ])

    await render(<BaglarEkrani />)

    expect(await screen.findByText('ayse')).toBeTruthy()
    expect(screen.getByText('Mert K')).toBeTruthy()
  })

  it('arkadas yoksa "Henüz arkadaşın yok" gosterir', async () => {
    await render(<BaglarEkrani />)

    expect(await screen.findByText('Henüz arkadaşın yok')).toBeTruthy()
  })

  /**
   * Bu test kullanicinin kararini KILITLIYOR: biri ileride istek
   * bolumlerini bu ekrana geri koyarsa burasi kirilir.
   *
   * Islev kaybi yok, cunku her biri baska bir ekranda duruyor:
   * gelen arkadaslik istekleri Bildirimler sekmesinde, gelen sohbet
   * istekleri ve giden isteklerin geri cekilmesi ise kisinin kendi
   * profilinde.
   */
  it('istek bolumleri ve alt basliklar GOSTERILMEZ', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])

    await render(<BaglarEkrani />)
    await screen.findByText('ayse')

    expect(screen.queryByText('Gelen istekler')).toBeNull()
    expect(screen.queryByText('Sohbet istekleri')).toBeNull()
    expect(screen.queryByText('Giden istekler')).toBeNull()
    expect(screen.queryByText('Arkadaşlarım')).toBeNull()
  })

  it('arkadasliktan cikarir', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaşlıktan çıkar'))

    expect(takibiBirak).toHaveBeenCalledWith('k1')
    await waitFor(() => expect(screen.queryByText('ayse')).toBeNull())
  })

  /**
   * Iyimser guncelleme YOK: satir yalnizca sunucu onayladiktan sonra
   * kalkiyor. Basarisiz bir cikarma, kisi listeden gitmis gibi yalan
   * soylememeli.
   */
  it('cikarma basarisiz olursa hata gosterir ve satiri listede birakir', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])
    ;(takibiBirak as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaşlıktan çıkar'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('ayse')).toBeTruthy()
  })

  it('engelle cagirir ve kisiyi listeden kaldirir', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])
    ;(engelle as jest.Mock).mockResolvedValue(undefined)

    await render(<BaglarEkrani />)
    await fireEvent.press(await screen.findByText('Engelle'))

    expect(engelle).toHaveBeenCalledWith('k1')
    await waitFor(() => expect(screen.queryByText('ayse')).toBeNull())
  })

  it('liste cekilemezse hata bandi gorunur', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<BaglarEkrani />)

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
  })
})
