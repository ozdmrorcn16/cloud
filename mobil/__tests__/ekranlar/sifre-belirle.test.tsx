import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import SifreBelirleEkrani from '../../src/app/(auth)/sifre-belirle'
import { supabase } from '../../lib/supabase'
import { GIZLILIK_METNI_SURUMU } from '../../lib/kvkk'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { updateUser: jest.fn() } },
}))

const mockRouterReplace = jest.fn()
const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
    push: mockRouterPush,
    back: mockRouterBack,
  }),
}))

const SIFRE = 'En az 8 karakter'
const TEKRAR = 'Aynı şifreyi bir kez daha'
const ONAY = 'Koşulları kabul ediyorum'

async function doldur(sifre = 'sifre1234', tekrar = 'sifre1234') {
  await fireEvent.changeText(screen.getByPlaceholderText(SIFRE), sifre)
  await fireEvent.changeText(screen.getByPlaceholderText(TEKRAR), tekrar)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ data: {}, error: null })
})

describe('SifreBelirleEkrani', () => {
  it('sifreyi ve onay metadatasini kaydedip profil olusturmaya gecer', async () => {
    await render(<SifreBelirleEkrani />)
    await doldur()
    await fireEvent.press(screen.getByLabelText(ONAY))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'sifre1234',
        data: {
          // Tek kutu, iki onay turu: kvkk.ts'teki kural.
          aydinlatma_onayi: true,
          konum_rizasi: true,
          gizlilik_metni_surumu: GIZLILIK_METNI_SURUMU,
          dil: 'tr',
        },
      })
    )
    expect(mockRouterReplace).toHaveBeenCalledWith('/profil-olustur')
  })

  it('kisa sifrede sunucuya gitmez', async () => {
    await render(<SifreBelirleEkrani />)
    await doldur('kisa', 'kisa')
    await fireEvent.press(screen.getByLabelText(ONAY))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Şifre en az 8 karakter olmalı.')).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('sifreler farkliysa sunucuya gitmez', async () => {
    await render(<SifreBelirleEkrani />)
    await doldur('sifre1234', 'baskasifre')
    await fireEvent.press(screen.getByLabelText(ONAY))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Şifreler aynı değil. İkisini de kontrol et.')).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('onay verilmeden hesap olusturulmaz', async () => {
    await render(<SifreBelirleEkrani />)
    await doldur()
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(
      await screen.findByText('Devam etmek için koşulları kabul etmen gerekiyor.')
    ).toBeTruthy()
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
  })

  it('sifre uyusmazligini yazarken soyler', async () => {
    await render(<SifreBelirleEkrani />)
    await doldur('sifre1234', 'sifre12')

    expect(await screen.findByText('Şifreler henüz aynı değil.')).toBeTruthy()
  })

  it('sunucu hatasini gosterir ve yonlendirmez', async () => {
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: {},
      error: { message: 'Oturum bulunamadı' },
    })

    await render(<SifreBelirleEkrani />)
    await doldur()
    await fireEvent.press(screen.getByLabelText(ONAY))
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Oturum bulunamadı')).toBeTruthy()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('gizlilik metni baglantisi metne goturur', async () => {
    await render(<SifreBelirleEkrani />)
    await fireEvent.press(screen.getByText('Metni oku'))
    expect(mockRouterPush).toHaveBeenCalledWith('/gizlilik')
  })
})
