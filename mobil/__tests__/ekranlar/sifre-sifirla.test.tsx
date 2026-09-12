import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import SifreSifirlaEkrani from '../../src/app/(auth)/sifre-sifirla'
import { supabase } from '../../lib/supabase'
import { epostaKayitliMi } from '../../lib/eposta-kayit'
import { gonderimDurumu, gonderimKaydet } from '../../lib/kod-gonderim'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signInWithOtp: jest.fn(), verifyOtp: jest.fn(), updateUser: jest.fn() },
  },
}))
jest.mock('../../lib/eposta-kayit', () => ({ epostaKayitliMi: jest.fn() }))
// Sabitler GERCEK kalsin (BEKLEME_SANIYE); yalnizca depo cagrilari mock.
jest.mock('../../lib/kod-gonderim', () => ({
  ...jest.requireActual('../../lib/kod-gonderim'),
  gonderimDurumu: jest.fn(),
  gonderimKaydet: jest.fn(),
}))

const mockRouterReplace = jest.fn()
const mockRouterBack = jest.fn()
let mockParams: { eposta?: string } = {}
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, back: mockRouterBack, canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}))

const EPOSTA = 'ornek@eposta.com'
const KOD_ETIKETI = 'Doğrulama kodu'

/** Ilk asamayi gecip kod asamasina getirir. */
async function kodAsamasinaGel() {
  await render(<SifreSifirlaEkrani />)
  await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), EPOSTA)
  await fireEvent.press(screen.getByText('Kodu gönder'))
  await waitFor(() => expect(screen.getByText('Kodu gir')).toBeTruthy())
}

/** Kod asamasini de gecip yeni sifre asamasina getirir. */
async function sifreAsamasinaGel() {
  await kodAsamasinaGel()
  ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
  await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '123456')
  await waitFor(() => expect(screen.getByText('Yeni şifreni belirle')).toBeTruthy())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockParams = {}
  ;(gonderimDurumu as jest.Mock).mockResolvedValue({ kalanSaniye: 0, kalanHak: 4 })
  ;(gonderimKaydet as jest.Mock).mockResolvedValue(undefined)
  ;(epostaKayitliMi as jest.Mock).mockResolvedValue(true)
  ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
})

describe('SifreSifirlaEkrani - e-posta asamasi', () => {
  it('kodu signInWithOtp ile ve HESAP ACMADAN gonderir, kod asamasina gecer', async () => {
    await kodAsamasinaGel()

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: EPOSTA,
      options: { shouldCreateUser: false },
    })
    expect(gonderimKaydet).toHaveBeenCalledWith(EPOSTA)
    expect(screen.getByText(`${EPOSTA} adresine 6 haneli bir kod gönderdik.`)).toBeTruthy()
  })

  it('giris ekranindan gelen e-postayi alana ONCEDEN yazar', async () => {
    mockParams = { eposta: EPOSTA }
    await render(<SifreSifirlaEkrani />)
    expect(screen.getByPlaceholderText('E-posta adresi').props.value).toBe(EPOSTA)
  })

  it('bicimi bozuk adreste posta atmadan hata verir', async () => {
    await render(<SifreSifirlaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), 'bozuk')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(screen.getByText('Geçerli bir e-posta adresi gir.')).toBeTruthy()
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  // BOSA IS YAPTIRMA: hesap yoksa kod hic gonderilmiyor, sebep hemen
  // soyleniyor. Kayit ekrani "bu adreste hesap var" dedigi icin burada
  // "yok" demek yeni bir sizinti acmiyor.
  it('adres kayitli degilse kod GONDERMEZ ve "hesap bulunamadı" der', async () => {
    ;(epostaKayitliMi as jest.Mock).mockResolvedValue(false)
    await render(<SifreSifirlaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), EPOSTA)
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() => {
      expect(screen.getByText('Bu e-posta adresiyle bir hesap bulunamadı.')).toBeTruthy()
    })
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  // Kontrol cevap vermezse (tavan, ag) karar sunucuya birakiliyor:
  // `otp_disabled` = "bu adreste hesap yok".
  it('kontrol cevap vermezse sunucunun otp_disabled cevabini "hesap bulunamadı" diye gosterir', async () => {
    ;(epostaKayitliMi as jest.Mock).mockResolvedValue(null)
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { code: 'otp_disabled', message: 'Signups not allowed for otp' },
    })
    await render(<SifreSifirlaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), EPOSTA)
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() => {
      expect(screen.getByText('Bu e-posta adresiyle bir hesap bulunamadı.')).toBeTruthy()
    })
    expect(screen.queryByText('Kodu gir')).toBeNull()
  })

  // Ayni adrese az once kod gitmisse (kisi geri donup yeniden basti)
  // ikinci posta atilmiyor; eldeki kod gecerli, sayacla kod ekranina
  // donuluyor.
  it('geri sayim surerken yeniden posta ATMAZ, dogrudan kod asamasina gecer', async () => {
    ;(gonderimDurumu as jest.Mock).mockResolvedValue({ kalanSaniye: 37, kalanHak: 3 })
    await render(<SifreSifirlaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), EPOSTA)
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() => expect(screen.getByText('Kodu gir')).toBeTruthy())
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
    expect(screen.getByText('37 sn sonra tekrar gönderebilirsin')).toBeTruthy()
  })
})

describe('SifreSifirlaEkrani - kod asamasi', () => {
  it('alti hane girilince KENDILIGINDEN dogrular ve yeni sifre asamasina gecer', async () => {
    await sifreAsamasinaGel()

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: EPOSTA,
      token: '123456',
      type: 'email',
    })
    // Oturum acildi ama HENUZ yonlendirme yok: sifre yazilmadan
    // uygulamaya girilmiyor.
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('yanlis kodda hata gosterir ve asamada kalir', async () => {
    await kodAsamasinaGel()
    ;(supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
    })
    await fireEvent.changeText(screen.getByPlaceholderText(KOD_ETIKETI), '000000')

    await waitFor(() => {
      expect(screen.getByText('Kod geçersiz ya da süresi dolmuş. Yeni bir kod iste.')).toBeTruthy()
    })
    expect(screen.getByText('Kodu gir')).toBeTruthy()
  })

  it('geri oku e-posta asamasina DONER, ekrandan cikmaz', async () => {
    await kodAsamasinaGel()
    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(screen.getByText('Şifreni sıfırla')).toBeTruthy()
    expect(mockRouterBack).not.toHaveBeenCalled()
  })

  // Gonderimden sonra sayac BEKLEME_SANIYE'den basliyor; "Tekrar gönder"
  // ancak sayac bitince gorunuyor. Sayacin kendisi kod-gonderim
  // testlerinde olculuyor; burada yalnizca kapinin kapali oldugu.
  it('gonderimden hemen sonra "Tekrar gönder" KAPALI, sayac gorunuyor', async () => {
    await kodAsamasinaGel()
    expect(screen.queryByText('Tekrar gönder')).toBeNull()
    expect(screen.getByText('60 sn sonra tekrar gönderebilirsin')).toBeTruthy()
  })

  it('hak kalmamissa kod asamasina hic gecmez', async () => {
    ;(gonderimDurumu as jest.Mock).mockResolvedValue({ kalanSaniye: 0, kalanHak: 0 })
    await render(<SifreSifirlaEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('E-posta adresi'), EPOSTA)
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() => {
      expect(
        screen.getByText('Bu adres için çok fazla kod istendi. Bir saat sonra tekrar deneyebilirsin.')
      ).toBeTruthy()
    })
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })
})

describe('SifreSifirlaEkrani - yeni sifre asamasi', () => {
  it('kisa sifreyi sunucuya gondermeden reddeder', async () => {
    await sifreAsamasinaGel()
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (en az 8 karakter)'), 'kisa')
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (tekrar)'), 'kisa')
    await fireEvent.press(screen.getByText('Şifreyi kaydet'))

    expect(screen.getByText('Şifre en az 8 karakter olmalı.')).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('sifreler tutmuyorsa sunucuya gondermeden reddeder', async () => {
    await sifreAsamasinaGel()
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (en az 8 karakter)'), 'yenisifre1')
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (tekrar)'), 'yenisifre2')
    await fireEvent.press(screen.getByText('Şifreyi kaydet'))

    expect(screen.getByText('Şifreler birbirini tutmuyor.')).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('gecerli sifreyi updateUser ile yazar ve uygulamaya yonlendirir', async () => {
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ data: {}, error: null })
    await sifreAsamasinaGel()
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (en az 8 karakter)'), 'yenisifre1')
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (tekrar)'), 'yenisifre1')
    await fireEvent.press(screen.getByText('Şifreyi kaydet'))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'yenisifre1' })
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('sunucu reddederse hatayi gosterir, yonlendirmez', async () => {
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: {},
      error: { code: 'same_password', message: 'New password should be different from the old password.' },
    })
    await sifreAsamasinaGel()
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (en az 8 karakter)'), 'yenisifre1')
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni şifre (tekrar)'), 'yenisifre1')
    await fireEvent.press(screen.getByText('Şifreyi kaydet'))

    await waitFor(() => {
      expect(screen.getByText('Yeni şifren eskisinden farklı olmalı.')).toBeTruthy()
    })
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  // Oturum acildi, kod harcandi: geri gidilecek anlamli bir yer yok.
  it('yeni sifre asamasinda geri oku YOK', async () => {
    await sifreAsamasinaGel()
    expect(screen.queryByLabelText('Geri')).toBeNull()
  })
})
