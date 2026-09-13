import { render, fireEvent, screen, waitFor } from '@testing-library/react-native'
import HesabiSilEkrani from '../../../src/app/profil/hesabi-sil'
import { hesabiSil } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'
import { saglayiciylaGirisYap } from '../../../lib/sosyal-giris'

/*
 * HESAP SILME E-POSTA ONAY KODUYLA (kullanicinin karari 2026-09-13).
 *
 * Onceki testler parola alanini olcuyordu; iddialar silinmedi, TERSINE
 * cevrildi: parola alani ARTIK YOK, kod gonderilmeden sil dugmesi
 * gorunmuyor, kod dogrulanmadan `hesabiSil` cagrilmiyor.
 */
jest.mock('../../../lib/hesap', () => ({ hesabiSil: jest.fn() }))
jest.mock('../../../lib/kod-gonderim', () => ({ gonderimKaydet: jest.fn() }))
jest.mock('../../../lib/sosyal-giris', () => ({
  saglayiciylaGirisYap: jest.fn(),
  SaglayiciHazirDegil: class extends Error {},
  Vazgecildi: class extends Error {},
}))

const mockGetUser = jest.fn()
const mockSignInWithOtp = jest.fn()
const mockVerifyOtp = jest.fn()
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
      getUser: (...a: unknown[]) => mockGetUser(...a),
      signInWithOtp: (...a: unknown[]) => mockSignInWithOtp(...a),
      verifyOtp: (...a: unknown[]) => mockVerifyOtp(...a),
    },
  },
}))

const sahteSil = hesabiSil as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { email: 'ali@ornek.com', app_metadata: { providers: ['email'] } } },
  })
  mockSignInWithOtp.mockResolvedValue({ error: null })
  mockVerifyOtp.mockResolvedValue({ data: { session: {} }, error: null })
})

it('bilgilendirme metinleri ve dondurma alternatifi ekranda', async () => {
  await render(<HesabiSilEkrani />)
  expect(
    screen.getByText('Bu işlem geri alınamaz. Yeniden gelmek istersen sıfırdan hesap açman gerekir.')
  ).toBeTruthy()
  expect(screen.getByText('Ne silinir?')).toBeTruthy()
  expect(screen.getByText('Ne kalır?')).toBeTruthy()
  expect(screen.getByText('Bunun yerine hesabımı dondur')).toBeTruthy()
})

it('PAROLA ALANI YOK; sil dugmesi kod gonderilmeden gorunmuyor', async () => {
  await render(<HesabiSilEkrani />)
  await screen.findByText(/ali@ornek\.com adresine 6 haneli/)
  expect(screen.queryByPlaceholderText('parolan')).toBeNull()
  expect(screen.queryByText('Hesabımı kalıcı olarak sil')).toBeNull()
  expect(screen.getByText('Onay kodu gönder')).toBeTruthy()
  expect(sahteSil).not.toHaveBeenCalled()
})

it('kod gonder: kullanicinin KENDI e-postasina, hesap acmadan (shouldCreateUser false)', async () => {
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Onay kodu gönder'))

  await waitFor(() =>
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'ali@ornek.com',
      options: { shouldCreateUser: false },
    })
  )
  expect(await screen.findByText(/Onay kodu ali@ornek\.com adresine gönderildi/)).toBeTruthy()
  expect(screen.getByText('Hesabımı kalıcı olarak sil')).toBeTruthy()
})

it('eksik kodla silme CAGRILMAZ', async () => {
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Onay kodu gönder'))
  await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '123')
  await fireEvent.press(screen.getByText('Hesabımı kalıcı olarak sil'))

  expect(screen.getByText('6 haneli kodun tamamını gir.')).toBeTruthy()
  expect(mockVerifyOtp).not.toHaveBeenCalled()
  expect(sahteSil).not.toHaveBeenCalled()
})

it('dogru kod: once verifyOtp, sonra hesabiSil PAROLASIZ, sonra cikis', async () => {
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Onay kodu gönder'))
  await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '123456')
  await fireEvent.press(screen.getByText('Hesabımı kalıcı olarak sil'))

  await waitFor(() =>
    expect(mockVerifyOtp).toHaveBeenCalledWith({ email: 'ali@ornek.com', token: '123456', type: 'email' })
  )
  await waitFor(() => expect(sahteSil).toHaveBeenCalledWith())
  expect(supabase.auth.signOut).toHaveBeenCalled()
})

it('kod yanlissa hata gorunur ve hesabiSil cagrilmaz', async () => {
  mockVerifyOtp.mockResolvedValueOnce({ data: {}, error: new Error('Kod gecersiz') })
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Onay kodu gönder'))
  await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '000000')
  await fireEvent.press(screen.getByText('Hesabımı kalıcı olarak sil'))

  expect(await screen.findByText('Kod gecersiz')).toBeTruthy()
  expect(sahteSil).not.toHaveBeenCalled()
})

it('sunucu silmeyi reddederse hata ekranda gorunur', async () => {
  sahteSil.mockRejectedValueOnce(new Error('Giris taze degil'))
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Onay kodu gönder'))
  await fireEvent.changeText(await screen.findByTestId('dogrulama-kodu'), '123456')
  await fireEvent.press(screen.getByText('Hesabımı kalıcı olarak sil'))

  expect(await screen.findByText('Giris taze degil')).toBeTruthy()
})

it('Google ile acilmis hesapta "Google ile onayla" var; basinca saglayiciyla dogrulayip siler', async () => {
  mockGetUser.mockResolvedValue({
    data: { user: { email: 'x@gmail.com', app_metadata: { providers: ['google'] } } },
  })
  ;(saglayiciylaGirisYap as jest.Mock).mockResolvedValue(undefined)
  await render(<HesabiSilEkrani />)
  await fireEvent.press(await screen.findByText('Google ile onayla'))

  await waitFor(() => expect(saglayiciylaGirisYap).toHaveBeenCalledWith('google'))
  await waitFor(() => expect(sahteSil).toHaveBeenCalledWith())
})

it('e-postayla acilmis hesapta saglayici dugmesi YOK', async () => {
  await render(<HesabiSilEkrani />)
  await screen.findByText('Onay kodu gönder')
  expect(screen.queryByText('Google ile onayla')).toBeNull()
  expect(screen.queryByText('Apple ile onayla')).toBeNull()
})
