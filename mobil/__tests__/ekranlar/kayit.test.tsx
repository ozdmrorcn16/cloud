import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KayitEkrani from '../../src/app/(auth)/kayit'
import { supabase } from '../../lib/supabase'
import { epostaKayitliMi } from '../../lib/eposta-kayit'
import { saglayiciylaGirisYap, SaglayiciHazirDegil, Vazgecildi } from '../../lib/sosyal-giris'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithOtp: jest.fn() }, rpc: jest.fn() },
}))
jest.mock('../../lib/eposta-kayit', () => ({ epostaKayitliMi: jest.fn() }))
// Saglayici akisi GERCEGIYLE kullaniliyor (saglayicilar, hata
// siniflari); yalnizca disariya cikan cagri mock'lu.
jest.mock('../../lib/sosyal-giris', () => ({
  ...jest.requireActual('../../lib/sosyal-giris'),
  saglayiciylaGirisYap: jest.fn(),
}))
jest.mock('../../lib/kod-gonderim', () => ({ gonderimKaydet: jest.fn() }))

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace, back: mockRouterBack }),
}))

const KUTU = 'ornek@eposta.com'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
  ;(epostaKayitliMi as jest.Mock).mockResolvedValue(false)
})

/**
 * KAYIT ARTIK E-POSTA ILE (kullanicinin karari 2026-09-01).
 *
 * Sebep pratikti: Turkiye'de A2P SMS icin operatorler vergi
 * mukellefiyeti ve KEP uzerinden belge istiyor; kullanicinin sirketi
 * yok. E-posta ucretsiz ve sirket gerektirmiyor.
 *
 * Duzen kullanicinin verdigi referansa gore: ustte ORTALANMIS marka
 * ISARETI (kelime markasi degil), altinda baslik, e-posta kutusu,
 * turuncu "Devam", ayrac ve saglayici dugmeleri.
 */
describe('KayitEkrani', () => {
  it('ustte ortalanmis marka ISARETI var', async () => {
    await render(<KayitEkrani />)
    expect(screen.getByTestId('marka-isareti')).toBeTruthy()
  })

  it('e-posta soruyor - telefon ve sifre alani yok', async () => {
    await render(<KayitEkrani />)

    expect(screen.getByText('E-postanı kullanarak başla')).toBeTruthy()
    expect(screen.getByPlaceholderText(KUTU)).toBeTruthy()
    expect(screen.queryByPlaceholderText('05XX XXX XX XX')).toBeNull()
    expect(screen.queryByPlaceholderText('En az 8 karakter')).toBeNull()
  })

  /**
   * Adres KUCUK HARFE cevrilerek gonderiliyor: Supabase oyle sakliyor,
   * istemci farkli gonderirse "kayitli mi" kontrolu yanlis cevap verir.
   */
  it('adresi kucuk harfe cevirip gonderir ve dogrulamaya gecer', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText(KUTU), '  Ornek@Eposta.COM ')
    await fireEvent.press(screen.getByText('Devam'))

    await waitFor(() =>
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'ornek@eposta.com' })
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?eposta=ornek%40eposta.com')
  })

  it('bicimi bozuk adres sunucuya HIC gitmez', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText(KUTU), 'ornek')
    await fireEvent.press(screen.getByText('Devam'))

    expect(await screen.findByText('Geçerli bir e-posta adresi gir.')).toBeTruthy()
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('sunucu hatasini gosterir ve dogrulamaya gecmez', async () => {
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Network request failed' },
    })

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(KUTU), 'ornek@eposta.com')
    await fireEvent.press(screen.getByText('Devam'))

    await waitFor(() => expect(mockRouterPush).not.toHaveBeenCalled())
  })

  /**
   * Bosa is yaptirilmiyor (kullanicinin ilkesi): adres zaten
   * kayitliysa dogrulama postasi HIC gonderilmiyor, hata ilk ekranda
   * veriliyor.
   */
  it('adres zaten kayitliysa posta HIC gonderilmez', async () => {
    ;(epostaKayitliMi as jest.Mock).mockResolvedValue(true)

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(KUTU), 'ornek@eposta.com')
    await fireEvent.press(screen.getByText('Devam'))

    expect(
      await screen.findByText(
        'Bu e-posta adresiyle zaten bir hesap var. Şifrenle giriş yapabilirsin.'
      )
    ).toBeTruthy()
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  /**
   * Kontrol CEVAP VEREMEZSE akis durmuyor: posta yine gonderiliyor ve
   * "zaten kayitli" kontrolu dogrulama ekranindaki son kapida
   * yapiliyor. Bu bir HIZLI YOL, zorunlu adim degil.
   */
  it('kontrol cevap veremezse eski akisa duesuyor - posta yine gonderilir', async () => {
    ;(epostaKayitliMi as jest.Mock).mockRejectedValue(new Error('ag hatasi'))

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(KUTU), 'ornek@eposta.com')
    await fireEvent.press(screen.getByText('Devam'))

    await waitFor(() =>
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'ornek@eposta.com' })
    )
  })

  /**
   * iOS'ta Apple ZORUNLU: App Store, baska bir sosyal giris
   * sunuluyorsa "Apple ile giris"in de bulunmasini sart kosuyor.
   * jest-expo iOS ontanimli kostugu icin bu test o yolu olcuyor.
   */
  it('iOS: hem Apple hem Google dugmesi var', async () => {
    await render(<KayitEkrani />)

    expect(screen.getByText('Apple ile devam et')).toBeTruthy()
    expect(screen.getByText('Google ile devam et')).toBeTruthy()
  })

  it('Apple dugmesi native Apple girisini baslatir ve basarida yonlendirir', async () => {
    ;(saglayiciylaGirisYap as jest.Mock).mockResolvedValue(undefined)

    await render(<KayitEkrani />)
    await fireEvent.press(screen.getByText('Apple ile devam et'))

    await waitFor(() => expect(saglayiciylaGirisYap).toHaveBeenCalledWith('apple'))
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  /**
   * VAZGECMEK HATA DEGIL: kullanici Apple'in sistem ekranini
   * kapattiginda ekranda kirmizi bir satir gormemeli.
   */
  it('kullanici vazgecerse hata GOSTERILMEZ', async () => {
    ;(saglayiciylaGirisYap as jest.Mock).mockRejectedValue(new Vazgecildi())

    await render(<KayitEkrani />)
    await fireEvent.press(screen.getByText('Apple ile devam et'))

    await waitFor(() => expect(saglayiciylaGirisYap).toHaveBeenCalled())
    expect(
      screen.queryByText(
        'Bu giriş yöntemi şu an kullanılamıyor. E-posta adresinle devam edebilirsin.'
      )
    ).toBeNull()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  /**
   * Saglayici Supabase panelinde acik degilse cagri hata donuyor.
   * Kullanici ne oldugunu anlamali ve CALISAN yola yonlendirilmeli -
   * kapali bir kapiya bakip beklememeli.
   */
  it('saglayici yapilandirilmamissa anlasilir hata gosterir', async () => {
    ;(saglayiciylaGirisYap as jest.Mock).mockRejectedValue(new SaglayiciHazirDegil('google'))

    await render(<KayitEkrani />)
    await fireEvent.press(screen.getByText('Google ile devam et'))

    expect(
      await screen.findByText(
        'Bu giriş yöntemi şu an kullanılamıyor. E-posta adresinle devam edebilirsin.'
      )
    ).toBeTruthy()
  })

  it('giris baglantisi giris ekranina goturur', async () => {
    await render(<KayitEkrani />)

    await fireEvent.press(screen.getByText('Giriş yap'))

    expect(mockRouterPush).toHaveBeenCalledWith('/giris')
  })

  /**
   * GERI DONME (kullanicinin istegi 2026-09-02): karsilama ekranindan
   * buraya gelen kisi fikrini degistirebilmeli; tek cikis yolu
   * uygulamayi kapatmak olmamali.
   */
  it('geri dugmesi onceki ekrana doner', async () => {
    await render(<KayitEkrani />)

    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(mockRouterBack).toHaveBeenCalled()
  })
})
