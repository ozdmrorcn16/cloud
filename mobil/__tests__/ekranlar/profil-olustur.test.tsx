import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilOlusturEkrani from '../../src/app/profil-olustur'
import { supabase } from '../../lib/supabase'
import { kullaniciAdiMusaitMi } from '../../lib/kullanici-adi'

const mockInsert = jest.fn()

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}))

jest.mock('../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../lib/kullanici-adi'),
  kullaniciAdiMusaitMi: jest.fn(),
}))

const mockRouterReplace = jest.fn()
const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
}))

/** Tarih tekerlegini acar ve "Tamam" ile varsayilan tarihi secer. */
async function dogumTarihiniSec() {
  await fireEvent.press(screen.getByLabelText('Doğum tarihin'))
  await fireEvent.press(screen.getByText('Tamam'))
}

/**
 * EKRAN UC ADIMLI (kullanicinin secimi 2026-09-04): once ad ve dogum
 * tarihi, sonra kullanici adi, sonra sifre. Yardimcilar akisi adim adim
 * yuruttugu icin testler "hangi alan hangi adimda" bilgisini tekrar
 * etmiyor.
 */
async function adim1(adDegeri = 'Orçun Özdemir') {
  await fireEvent.changeText(screen.getByPlaceholderText('Örn. Deniz Yılmaz'), adDegeri)
  await dogumTarihiniSec()
  await fireEvent.press(screen.getByText('Devam'))
}

async function adim2(kullaniciAdi = 'Orcun') {
  await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı'), kullaniciAdi)
  await fireEvent.press(screen.getByText('Devam'))
}

async function adim3(sifre = 'sifre1234', tekrar = sifre) {
  await fireEvent.changeText(screen.getByPlaceholderText('En az 8 karakter'), sifre)
  await fireEvent.changeText(screen.getByPlaceholderText('Aynı şifreyi bir kez daha'), tekrar)
}

/** Uc adimi da gecerli degerlerle doldurur; son adimda bekletir. */
async function formuDoldur() {
  await adim1()
  await adim2()
  await adim3()
}

describe('ProfilOlusturEkrani', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    ;(supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert })
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'kullanici-1' } },
    })
    ;(supabase.auth.updateUser as jest.Mock).mockResolvedValue({ error: null })
    ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(true)
  })

  /**
   * ONAY KUTUSU KALDIRILDI (kullanicinin karari 2026-09-01): kabul
   * kayit ekranindaki "Devam"a basmakla veriliyor, bu ekranda ayrica
   * sorulmuyor.
   *
   * KAYIT KAYBOLMUYOR: metadata yine `aydinlatma_onayi` ve
   * `konum_rizasi` tasiyor, yani kvkk_onaylari tablosundaki ispat
   * kaydi yerinde duruyor. Bu test tam olarak onu kilitliyor - kutu
   * gitti ama kayit gitmedi.
   */
  it('onay kutusu YOK ama onay kaydi metadatada duruyor', async () => {
    await render(<ProfilOlusturEkrani />)

    expect(screen.queryByLabelText('Sözleşmeleri kabul ediyorum')).toBeNull()

    await formuDoldur()
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ aydinlatma_onayi: true, konum_rizasi: true }),
        })
      )
    )
  })

  it('onay isaretlenince sifreyi, onayi ve profili yazip ana ekrana gecer', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'sifre1234',
          data: expect.objectContaining({ aydinlatma_onayi: true, konum_rizasi: true }),
        })
      )
    })
    expect(supabase.from).toHaveBeenCalledWith('profiller')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ ad: 'Orçun Özdemir', kullanici_adi: 'orcun' })
    )
    expect(mockRouterReplace).toHaveBeenCalledWith('/')
  })

  it('secilen dogum tarihini ISO bicimiyle kaydeder', async () => {
    await render(<ProfilOlusturEkrani />)
    await formuDoldur()
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    await waitFor(() => expect(mockInsert).toHaveBeenCalled())
    const yazilan = mockInsert.mock.calls[0][0]
    // Tekerlek 25 yil oncesinde 1 Ocak'ta aciliyor.
    expect(yazilan.dogum_tarihi).toBe(`${new Date().getFullYear() - 25}-01-01`)
  })

  it('dogum tarihi secilmeden ILK ADIMDAN gecilemiyor', async () => {
    await render(<ProfilOlusturEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Örn. Deniz Yılmaz'), 'Orçun Özdemir')
    await fireEvent.press(screen.getByText('Devam'))

    expect(await screen.findByText('Doğum tarihini seç.')).toBeTruthy()
    // Ikinci adima gecilmedi: kullanici adi alani hala yok.
    expect(screen.queryByPlaceholderText('Kullanıcı adı')).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('sifreler uyusmuyorsa hesap olusturmaz', async () => {
    await render(<ProfilOlusturEkrani />)
    await adim1()
    await adim2()
    await adim3('sifre1234', 'baskasifre')
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(
      await screen.findByText('Şifreler aynı değil. İkisini de kontrol et.')
    ).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('kisa sifreyi reddeder', async () => {
    await render(<ProfilOlusturEkrani />)
    await adim1()
    await adim2()
    await adim3('kisa')
    await fireEvent.press(screen.getByText('Hesabı oluştur'))

    expect(await screen.findByText('Şifre en az 8 karakter olmalı.')).toBeTruthy()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('bicime uymayan kullanici adinda IKINCI ADIMDAN gecilemiyor', async () => {
    await render(<ProfilOlusturEkrani />)
    await adim1()
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı'), 'or')
    await fireEvent.press(screen.getByText('Devam'))

    expect(await screen.findByText(/3-20 karakter/)).toBeTruthy()
    // Ucuncu adima gecilmedi: sifre alani hala yok.
    expect(screen.queryByPlaceholderText('En az 8 karakter')).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('alinmis kullanici adinda uyari gosterir', async () => {
    ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(false)

    await render(<ProfilOlusturEkrani />)
    await adim1()
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı'), 'orcun')

    expect(
      await screen.findByText('Bu kullanıcı adı alınmış, başka bir tane dene.')
    ).toBeTruthy()
  })

  it('musait kullanici adinda musait yazisini gosterir', async () => {
    await render(<ProfilOlusturEkrani />)
    await adim1()
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı'), 'orcun')

    expect(await screen.findByText('Bu kullanıcı adı müsait.')).toBeTruthy()
  })

  it('ILK ADIMDA yalnizca ad ve dogum soruluyor', async () => {
    // Uc adima bolunmenin asil kazanci: her ekranda tek is var.
    await render(<ProfilOlusturEkrani />)

    expect(screen.getByPlaceholderText('Örn. Deniz Yılmaz')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Kullanıcı adı')).toBeNull()
    expect(screen.queryByPlaceholderText('En az 8 karakter')).toBeNull()
    expect(screen.getByText('Adım 1 / 3')).toBeTruthy()
  })

  it('18 YAS KURALI ONCEDEN yaziyor, hata beklemeden', async () => {
    // Onceden kural yalnizca hata metnindeydi: 18'inden kucuk biri
    // butun formu doldurup en sonda ogreniyordu.
    await render(<ProfilOlusturEkrani />)

    expect(screen.getByText('Slooin 18 yaş ve üzeri içindir.')).toBeTruthy()
  })

  it('adimlar arasinda GERI bir onceki adima doner, oturumu KAPATMAZ', async () => {
    await render(<ProfilOlusturEkrani />)
    await adim1()
    expect(screen.getByText('Adım 2 / 3')).toBeTruthy()

    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(screen.getByText('Adım 1 / 3')).toBeTruthy()
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
    // Girilen ad kayboldu mu? Kaybolmamali.
    expect(screen.getByDisplayValue('Orçun Özdemir')).toBeTruthy()
  })

  it('ILK ADIMDA geri tusu OTURUMU KAPATIP acilis ekranina doner', async () => {
    await render(<ProfilOlusturEkrani />)

    await fireEvent.press(screen.getByLabelText('Geri'))

    // Cikis sart: profili olmayan acik bir oturum, kok yonlendirme
    // kontrolu tarafindan aninda bu ekrana geri gonderilir.
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/karsilama')
  })
})
