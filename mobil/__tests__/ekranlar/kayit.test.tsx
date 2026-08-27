import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KayitEkrani from '../../src/app/(auth)/kayit'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signInWithOtp: jest.fn() }, rpc: jest.fn() },
}))

const mockRouterPush = jest.fn()
const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: mockRouterReplace }),
}))

const TELEFON = 'Telefon numarası'

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({ data: {}, error: null })
  // Varsayilan: numara kayitli DEGIL, yani kayit akisi devam ediyor.
  ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: false, error: null })
})

describe('KayitEkrani', () => {
  it('YALNIZCA telefon soruyor - sifre alani yok', async () => {
    await render(<KayitEkrani />)

    expect(screen.getByPlaceholderText('05XX XXX XX XX')).toBeTruthy()
    // Kayit ucе bolundu: sifre bir sonraki adimda aliniyor.
    expect(screen.queryByPlaceholderText('En az 8 karakter')).toBeNull()
  })

  it('numarayi e.164 bicimine cevirip kod gonderir ve dogrulamaya gecer', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() =>
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+905551234567' })
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?telefon=%2B905551234567')
  })

  it('gecersiz numarada sunucuya hic gitmez', async () => {
    await render(<KayitEkrani />)

    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '123')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(await screen.findByText('Geçerli bir telefon numarası gir.')).toBeTruthy()
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('sunucu hatasini gosterir ve dogrulamaya gecmez', async () => {
    ;(supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'SMS gonderilemedi' },
    })

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(await screen.findByText('SMS gonderilemedi')).toBeTruthy()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('numara zaten kayitliysa SMS HIC gonderilmez', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: true, error: null })

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    expect(
      await screen.findByText('Bu numarada zaten bir hesap var. Şifrenle giriş yapabilirsin.')
    ).toBeTruthy()
    // Asil kazanc bu: bosuna SMS gitmiyor.
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('kontrol cevap veremezse eski akisa duesuyor - kod yine gonderiliyor', async () => {
    // Sunucudaki saatlik tavan asildiginda ya da ag koptugunda boyle
    // oluyor. Mesru kullanici ekranda kilitlenmemeli; "zaten kayitli"
    // kontrolu dogrulama ekranindaki son kapida yapiliyor.
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Cok fazla deneme yapildi' },
    })

    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() =>
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+905551234567' })
    )
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?telefon=%2B905551234567')
  })

  it('kontrol E.164 bicimindeki numarayla cagriliyor', async () => {
    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('05XX XXX XX XX'), '05551234567')
    await fireEvent.press(screen.getByText('Kodu gönder'))

    await waitFor(() =>
      expect(supabase.rpc).toHaveBeenCalledWith('telefon_kayitli_mi', {
        p_telefon: '+905551234567',
        // Hiz sinirinin dar katmani icin cihaz kimligi de gidiyor.
        p_cihaz: expect.anything(),
      })
    )
  })

  it('giris baglantisi giris ekranina goturur', async () => {
    await render(<KayitEkrani />)
    await fireEvent.press(screen.getByText('Giriş yap'))
    expect(mockRouterReplace).toHaveBeenCalledWith('/giris')
  })
})

// TELEFON etiketi ekranda da var; testte yalnizca yer tutucu
// kullaniliyor cunku etiket ve yer tutucu ayni anda gorunuyor.
void TELEFON
