import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KayitEkrani from '../../src/app/(auth)/kayit'
import { supabase } from '../../lib/supabase'
import { GIZLILIK_METNI_SURUMU } from '../../lib/kvkk'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signUp: jest.fn() } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

const TELEFON = '05XX XXX XX XX'
const SIFRE = 'En az 8 karakter'
const TEKRAR = 'Aynı şifreyi bir kez daha'
const AYDINLATMA = 'Gizlilik metnini okudum ve kabul ediyorum'
const KONUM_RIZASI = 'Konum verimin işlenmesine açık rıza veriyorum'

/** Gecerli bir kayit formunu doldurur; onaylar cagirana birakilir. */
async function formuDoldur(sifre = 'sifre1234', tekrar = 'sifre1234') {
  await fireEvent.changeText(screen.getByPlaceholderText(TELEFON), '5551234567')
  await fireEvent.changeText(screen.getByPlaceholderText(SIFRE), sifre)
  await fireEvent.changeText(screen.getByPlaceholderText(TEKRAR), tekrar)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({ data: {}, error: null })
})

describe('KayitEkrani', () => {
  it('gecersiz telefon numarasinda hata gosterir', async () => {
    await render(<KayitEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText(TELEFON), '123')
    await fireEvent.changeText(screen.getByPlaceholderText(SIFRE), 'sifre1234')
    await fireEvent.changeText(screen.getByPlaceholderText(TEKRAR), 'sifre1234')
    await fireEvent.press(screen.getByLabelText(AYDINLATMA))
    await fireEvent.press(screen.getByText('Hesap oluştur'))

    await waitFor(() => {
      expect(screen.getByText('Geçerli bir telefon numarası gir.')).toBeTruthy()
    })
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('sifreler ayni degilse kayit olmaz', async () => {
    await render(<KayitEkrani />)
    await formuDoldur('sifre1234', 'baskasifre')
    await fireEvent.press(screen.getByLabelText(AYDINLATMA))
    await fireEvent.press(screen.getByText('Hesap oluştur'))

    await waitFor(() => {
      expect(screen.getByText('Şifreler aynı değil. İkisini de kontrol et.')).toBeTruthy()
    })
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('sifre uyusmazligini yazarken soyler', async () => {
    await render(<KayitEkrani />)
    await formuDoldur('sifre1234', 'sifre12')
    // Gonderilmeden once uyariyor: hatayi butona basinca ogrenmek gec.
    expect(screen.getByText('Şifreler henüz aynı değil.')).toBeTruthy()
  })

  // KVKK: aydinlatma onayi olmadan hesap acilamaz.
  it('aydinlatma onayi verilmeden kayit olmaz', async () => {
    await render(<KayitEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByText('Hesap oluştur'))

    await waitFor(() => {
      expect(
        screen.getByText('Devam etmek için gizlilik metnini kabul etmen gerekiyor.')
      ).toBeTruthy()
    })
    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  // KVKK: acik riza OZGUR IRADEYLE verilmeli, hizmetin on kosulu
  // yapilamaz. Bu yuzden konum rizasi olmadan da hesap acilabilmeli.
  it('konum rizasi verilmeden de hesap acilir ve riza false gider', async () => {
    await render(<KayitEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByLabelText(AYDINLATMA))
    await fireEvent.press(screen.getByText('Hesap oluştur'))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        phone: '+905551234567',
        password: 'sifre1234',
        options: {
          data: {
            aydinlatma_onayi: true,
            konum_rizasi: false,
            gizlilik_metni_surumu: GIZLILIK_METNI_SURUMU,
            dil: 'tr',
          },
        },
      })
    })
  })

  it('onaylar ve dil tercihi signUp metadatasina gider', async () => {
    await render(<KayitEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByLabelText(AYDINLATMA))
    await fireEvent.press(screen.getByLabelText(KONUM_RIZASI))
    await fireEvent.press(screen.getByText('Hesap oluştur'))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            data: expect.objectContaining({
              aydinlatma_onayi: true,
              konum_rizasi: true,
              // Surum olmadan "neye onay verdi" sorusu geriye donuk
              // cevaplanamaz; metadata bunu tasimak zorunda.
              gizlilik_metni_surumu: GIZLILIK_METNI_SURUMU,
            }),
          },
        })
      )
    })
    expect(mockRouterPush).toHaveBeenCalledWith('/dogrula?telefon=%2B905551234567')
  })
})
