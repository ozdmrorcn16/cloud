import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import HesapGuvenlikEkrani from '../../../src/app/profil/hesap-guvenlik'
import EpostaDegistirEkrani from '../../../src/app/profil/eposta-degistir'
import SifreDegistirEkrani from '../../../src/app/profil/sifre-degistir'
import OturumlarEkrani from '../../../src/app/profil/oturumlar'
import {
  mevcutEposta,
  oturumlarimiGetir,
  oturumuKapat,
  digerCihazlardanCik,
  mevcutAdreseKodGonder,
  mevcutAdresiDogrula,
  yeniAdreseKodGonder,
  yeniAdresiDogrula,
  sifreDegistir,
  cihazAdi,
  epostaMaskele,
} from '../../../lib/hesap-guvenlik'

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), back: jest.fn() },
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    require('react').useEffect(effect, [])
  },
}))

jest.mock('../../../lib/hesap-guvenlik', () => {
  const gercek = jest.requireActual('../../../lib/hesap-guvenlik')
  return {
    ...gercek,
    mevcutEposta: jest.fn(),
    oturumlarimiGetir: jest.fn(),
    oturumuKapat: jest.fn(),
    digerCihazlardanCik: jest.fn(),
    mevcutAdreseKodGonder: jest.fn(),
    mevcutAdresiDogrula: jest.fn(),
    yeniAdreseKodGonder: jest.fn(),
    yeniAdresiDogrula: jest.fn(),
    sifreDegistir: jest.fn(),
  }
})

const IPHONE = {
  id: 'a1',
  olusturuldu: '2026-09-18T10:00:00Z',
  sonEtkinlik: new Date().toISOString(),
  cihaz: 'Slooin/13 CFNetwork/1498 Darwin/23.0.0 iPhone',
  ip: '1.2.3.4',
  buCihaz: true,
}
const MAC = {
  id: 'b2',
  olusturuldu: '2026-09-17T10:00:00Z',
  sonEtkinlik: new Date().toISOString(),
  cihaz: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605 Version/17 Safari/605',
  ip: '5.6.7.8',
  buCihaz: false,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mevcutEposta as jest.Mock).mockResolvedValue('orcun@example.com')
  ;(oturumlarimiGetir as jest.Mock).mockResolvedValue([IPHONE, MAC])
  ;(oturumuKapat as jest.Mock).mockResolvedValue(undefined)
  ;(digerCihazlardanCik as jest.Mock).mockResolvedValue(undefined)
  ;(mevcutAdreseKodGonder as jest.Mock).mockResolvedValue(undefined)
  ;(mevcutAdresiDogrula as jest.Mock).mockResolvedValue(undefined)
  ;(yeniAdreseKodGonder as jest.Mock).mockResolvedValue(undefined)
  ;(yeniAdresiDogrula as jest.Mock).mockResolvedValue(undefined)
  ;(sifreDegistir as jest.Mock).mockResolvedValue(undefined)
})

/** HESAP VE GUVENLIK (referans 2026-09-18): iki bolum + koruma karti. */
describe('HesapGuvenlikEkrani', () => {
  it('maskeli e-posta, cihaz sayisi ve uc yonlendirme', async () => {
    await render(<HesapGuvenlikEkrani />)
    expect(await screen.findByText('or•••@example.com')).toBeTruthy()
    await waitFor(() => expect(screen.getByTestId('cihaz-sayisi').props.children).toContain('2'))
    expect(screen.getByText('Hesabını koru')).toBeTruthy()
    await fireEvent.press(screen.getByText('E-posta adresi'))
    await fireEvent.press(screen.getByText('Şifreyi değiştir'))
    await fireEvent.press(screen.getByTestId('acik-oturumlar'))
    expect(mockRouterPush.mock.calls.map((c) => c[0])).toEqual([
      '/profil/eposta-degistir',
      '/profil/sifre-degistir',
      '/profil/oturumlar',
    ])
  })

  it('epostaMaskele: ilk iki harf + noktalar + alan adi', () => {
    expect(epostaMaskele('orcun@example.com')).toBe('or•••@example.com')
    expect(epostaMaskele('a@b.co')).toBe('a•••@b.co')
  })
})

/**
 * E-POSTA DEGISTIR: form -> mevcut adrese kod -> yeni adrese kod -> bitti.
 * Yeni adres dogrulanana kadar giris adresi degismez (Supabase de
 * boyle calisiyor).
 */
describe('EpostaDegistirEkrani', () => {
  it('gecersiz ve ayni adres erken hata; posta gitmez', async () => {
    await render(<EpostaDegistirEkrani />)
    await screen.findByText('or•••@example.com')
    await fireEvent.changeText(screen.getByTestId('yeni-eposta'), 'bozuk')
    await fireEvent.press(screen.getByTestId('devam-et'))
    expect(await screen.findByText('Geçerli bir e-posta adresi yaz.')).toBeTruthy()
    await fireEvent.changeText(screen.getByTestId('yeni-eposta'), 'ORCUN@example.com')
    await fireEvent.press(screen.getByTestId('devam-et'))
    expect(await screen.findByText('Bu zaten mevcut adresin.')).toBeTruthy()
    expect(mevcutAdreseKodGonder).not.toHaveBeenCalled()
  })

  it('uc asama sirayla: mevcut kod, yeni kod, bitti', async () => {
    await render(<EpostaDegistirEkrani />)
    await screen.findByText('or•••@example.com')
    await fireEvent.changeText(screen.getByTestId('yeni-eposta'), 'yeni@example.com')
    await fireEvent.press(screen.getByTestId('devam-et'))
    await waitFor(() => expect(mevcutAdreseKodGonder).toHaveBeenCalledWith('orcun@example.com'))

    await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '123')
    await fireEvent.press(screen.getByTestId('dogrula'))
    expect(await screen.findByText('6 haneli kodu yaz.')).toBeTruthy()
    expect(mevcutAdresiDogrula).not.toHaveBeenCalled()

    await fireEvent.changeText(screen.getByTestId('dogrulama-kodu'), '123456')
    await fireEvent.press(screen.getByTestId('dogrula'))
    await waitFor(() => expect(mevcutAdresiDogrula).toHaveBeenCalledWith('orcun@example.com', '123456'))
    await waitFor(() => expect(yeniAdreseKodGonder).toHaveBeenCalledWith('yeni@example.com'))

    await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '654321')
    await fireEvent.press(screen.getByTestId('dogrula'))
    await waitFor(() => expect(yeniAdresiDogrula).toHaveBeenCalledWith('yeni@example.com', '654321'))
    expect(await screen.findByTestId('eposta-degisti')).toBeTruthy()
  })
})

/** SIFREYI DEGISTIR: 12 karakter, eslesme, mevcut sifre kontrolu. */
describe('SifreDegistirEkrani', () => {
  it('kisa ve eslesmeyen sifre erken hata verir', async () => {
    await render(<SifreDegistirEkrani />)
    await fireEvent.changeText(screen.getByTestId('mevcut-sifre'), 'eskisifre1')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre'), 'kisa')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre-tekrar'), 'kisa')
    await fireEvent.press(screen.getByTestId('sifreyi-guncelle'))
    expect(await screen.findByText(/En az 12 karakter/)).toBeTruthy()
    await fireEvent.changeText(screen.getByTestId('yeni-sifre'), 'yeterinceuzun12')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre-tekrar'), 'yeterinceuzun13')
    await fireEvent.press(screen.getByTestId('sifreyi-guncelle'))
    expect(await screen.findByText('Yeni şifreler birbiriyle aynı değil.')).toBeTruthy()
    expect(sifreDegistir).not.toHaveBeenCalled()
  })

  it('dogru girdide degistirir; mevcut sifre yanlissa soyler', async () => {
    await render(<SifreDegistirEkrani />)
    await waitFor(() => expect(mevcutEposta).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByTestId('mevcut-sifre'), 'eskisifre1')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre'), 'yeterinceuzun12')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre-tekrar'), 'yeterinceuzun12')
    await fireEvent.press(screen.getByTestId('sifreyi-guncelle'))
    await waitFor(() => expect(sifreDegistir).toHaveBeenCalledWith('orcun@example.com', 'eskisifre1', 'yeterinceuzun12'))
    expect(await screen.findByText(/Şifren güncellendi/)).toBeTruthy()

    ;(sifreDegistir as jest.Mock).mockRejectedValue(new Error('MEVCUT_SIFRE_YANLIS'))
    await fireEvent.changeText(screen.getByTestId('mevcut-sifre'), 'yanlis')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre'), 'yeterinceuzun12')
    await fireEvent.changeText(screen.getByTestId('yeni-sifre-tekrar'), 'yeterinceuzun12')
    await fireEvent.press(screen.getByTestId('sifreyi-guncelle'))
    expect(await screen.findByText('Mevcut şifren yanlış.')).toBeTruthy()
  })

  it('Sifremi unuttum sifirlama ekranina e-postayla gider', async () => {
    await render(<SifreDegistirEkrani />)
    await waitFor(() => expect(mevcutEposta).toHaveBeenCalled())
    await fireEvent.press(screen.getByTestId('sifremi-unuttum'))
    expect(mockRouterPush).toHaveBeenCalledWith(expect.stringContaining('/sifre-sifirla'))
  })
})

/** ACIK OTURUMLAR (referans): bu cihaz rozeti, digerinde Kapat (onayli). */
describe('OturumlarEkrani', () => {
  it('cihaz adlari okunur, bu cihazda rozet, digerinde Kapat', async () => {
    await render(<OturumlarEkrani />)
    expect(await screen.findByText('iPhone · Slooin')).toBeTruthy()
    expect(screen.getByText('Safari · Mac')).toBeTruthy()
    expect(screen.getByTestId('bu-cihaz')).toBeTruthy()
    expect(screen.queryByTestId('oturumu-kapat-a1')).toBeNull()
    expect(screen.getByTestId('oturumu-kapat-b2')).toBeTruthy()
    expect(screen.getByText('Şu anda kullanılıyor')).toBeTruthy()
  })

  it('Kapat onay ister; onayda RPC ve satir duser', async () => {
    await render(<OturumlarEkrani />)
    await fireEvent.press(await screen.findByTestId('oturumu-kapat-b2'))
    expect(oturumuKapat).not.toHaveBeenCalled()
    // Pencerenin eylem dugmesi de "Kapat": satirdaki degil sonuncusu.
    const kapatlar = await screen.findAllByText('Kapat')
    await fireEvent.press(kapatlar[kapatlar.length - 1])
    await waitFor(() => expect(oturumuKapat).toHaveBeenCalledWith('b2'))
    await waitFor(() => expect(screen.queryByText('Safari · Mac')).toBeNull())
  })

  it('Diger oturumlardan cikis onayli; bu cihaz kalir', async () => {
    await render(<OturumlarEkrani />)
    await fireEvent.press(await screen.findByTestId('digerlerinden-cik'))
    const cikislar = await screen.findAllByText('Diğer oturumlardan çıkış yap')
    await fireEvent.press(cikislar[cikislar.length - 1])
    await waitFor(() => expect(digerCihazlardanCik).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('Safari · Mac')).toBeNull())
    expect(screen.getByText('iPhone · Slooin')).toBeTruthy()
  })

  it('cihazAdi: uygulama ve tarayici user-agentlari', () => {
    expect(cihazAdi(IPHONE.cihaz, 'Bilinmeyen')).toBe('iPhone · Slooin')
    expect(cihazAdi(MAC.cihaz, 'Bilinmeyen')).toBe('Safari · Mac')
    expect(cihazAdi(null, 'Bilinmeyen')).toBe('Bilinmeyen')
  })
})
