import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from '../../../src/app/profil/ayarlar'
import {
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  kullaniciAdiDurumunuGetir,
} from '../../../lib/ayarlar'
import { kullaniciAdiniDegistir } from '../../../lib/kullanici-adi'
import { hesabiDondur } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanBulunurluguGetir: jest.fn(),
  varsayilanBulunurluguAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
  aramadaGorunsunGetir: jest.fn(),
  aramadaGorunsunAyarla: jest.fn(),
  kullaniciAdiDurumunuGetir: jest.fn(),
}))

jest.mock('../../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../../lib/kullanici-adi'),
  kullaniciAdiniDegistir: jest.fn(),
}))

jest.mock('../../../lib/hesap', () => ({
  hesabiDondur: jest.fn(),
}))

jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

const sahteDondur = hesabiDondur as jest.Mock
const sahteCikis = supabase.auth.signOut as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
  ;(varsayilanBulunurluguAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aramadaGorunsunGetir as jest.Mock).mockResolvedValue(true)
  ;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
    kullaniciAdi: 'orcun',
    sonrakiDegisimTarihi: null,
  })
  sahteDondur.mockResolvedValue(undefined)
  sahteCikis.mockResolvedValue(undefined)
})

describe('AyarlarEkrani', () => {
  it('varsayilan bulunurlugu degistirir', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())
    await fireEvent.press(screen.getByText('Sadece takipçilerim'))
    await waitFor(() =>
      expect(varsayilanBulunurluguAyarla).toHaveBeenCalledWith('takipcilerim')
    )
  })

  it('anilari sadece takipcilere acar', async () => {
    await render(<AyarlarEkrani />)
    await fireEvent.press(screen.getByText('Sadece takipçilerim görsün'))
    await waitFor(() =>
      expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('takipcilerim')
    )
  })

  it('secili varsayilan bulunurluk cipinin metni okunabilir kontrastta (beyaz)', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    // beforeEach varsayilan_bulunurluk = 'herkese_acik' donuyor, yani
    // secili olan cip 'Herkese acik'.
    const seciliCip = await screen.findByLabelText('Varsayılan bulunurluk: herkese_acik, seçili')
    expect(seciliCip).toHaveStyle({ backgroundColor: '#111' })
    expect(screen.getByText('Herkese açık')).toHaveStyle({ color: '#fff' })
  })

  it('ani gorunurlugu secimi tikladiktan sonra secili olarak gosterilir', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    // Baslangicta hicbir ani-gorunurlugu cipi secili degil (bu bir
    // sunucu tercihi degil, toplu bir eylem - bkz. bilesen yorumu).
    expect(screen.queryByLabelText(/Anı görünürlüğü: .*, seçili/)).toBeNull()

    await fireEvent.press(screen.getByText('Kimse görmesin'))
    await waitFor(() =>
      expect(screen.getByLabelText('Anı görünürlüğü: kimse, seçili')).toBeTruthy()
    )
    expect(screen.getByText('Kimse görmesin')).toHaveStyle({ color: '#fff' })
  })

  it('ani gorunurlugu kaydetme basarisiz olursa secili gosterimi geri alir', async () => {
    ;(aniGorunurlugunuAyarla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByText('Kimse görmesin'))

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
    expect(screen.queryByLabelText(/Anı görünürlüğü: .*, seçili/)).toBeNull()
  })

  it('anilari kimseye kapatinca kaydeder', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())
    await fireEvent.press(screen.getByText('Kimse görmesin'))
    await waitFor(() => {
      expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('kimse')
    })
  })

  it('yukleme hatasi mesaj gosterir', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AyarlarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Oturum bulunamadi')).toBeTruthy()
    })
  })

  it('kaydetme basarisiz olursa hata gosterir', async () => {
    ;(varsayilanBulunurluguAyarla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    await fireEvent.press(screen.getByText('Sadece takipçilerim'))

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
  })

  it('kullanici adini degistirir', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockResolvedValue(undefined)

    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanıcı adı'), 'yeniad')
    await fireEvent.press(screen.getByText('Kullanıcı adını değiştir'))

    await waitFor(() => expect(kullaniciAdiniDegistir).toHaveBeenCalledWith('yeniad'))
    expect(await screen.findByText('Kullanıcı adın güncellendi.')).toBeTruthy()
  })

  it('sunucudan gelen 30 gun hatasini gosterir', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockRejectedValue(
      new Error('Kullanıcı adıni 30 gunde bir degistirebilirsin. Kalan sure: 12 gun')
    )

    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanıcı adı'), 'yeniad')
    await fireEvent.press(screen.getByText('Kullanıcı adını değiştir'))

    expect(await screen.findByText(/Kalan sure: 12 gun/)).toBeTruthy()
  })

  it('aramada gorunurlugu kapatir', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())
    await fireEvent(screen.getByLabelText('Aramada görünürlük'), 'valueChange', false)

    await waitFor(() => expect(aramadaGorunsunAyarla).toHaveBeenCalledWith(false))
  })

  it('mevcut kullanici adini gosterir', async () => {
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('Kullanıcı adın: @orcun')).toBeTruthy()
  })

  it('ani gorunurlugu bolumunde gizli check-in istisnasini aciklayan bir not gosterir', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanBulunurluguGetir).toHaveBeenCalled())

    expect(
      screen.getByText(
        "Bu secim butun anilarina uygulanir, ama gizli check-in'den donusen anilar bu ayardan etkilenmez ve kapali kalir."
      )
    ).toBeTruthy()
  })

  it('sonraki degisim tarihi gelecekteyse gosterir', async () => {
    const sonrakiTarih = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
      kullaniciAdi: 'orcun',
      sonrakiDegisimTarihi: sonrakiTarih,
    })

    await render(<AyarlarEkrani />)

    const gun = String(sonrakiTarih.getDate()).padStart(2, '0')
    const ay = String(sonrakiTarih.getMonth() + 1).padStart(2, '0')
    const yil = sonrakiTarih.getFullYear()
    expect(
      await screen.findByText(`Tekrar degistirebilecegin tarih: ${gun}.${ay}.${yil}`)
    ).toBeTruthy()
  })

  it('dondurma iki adimda calisir ve oturumu kapatir', async () => {
    const { getByText, queryByText } = await render(<AyarlarEkrani />)

    // Ilk dokunus yalnizca onay ister; hemen dondurmez.
    await fireEvent.press(getByText('Hesabımı dondur'))
    expect(sahteDondur).not.toHaveBeenCalled()
    expect(
      getByText(
        'Verilerin silinmez. Tekrar giris yaptiginda hesabin kendiliginden aktif olur.'
      )
    ).toBeTruthy()

    await fireEvent.press(getByText('Evet, dondur'))
    expect(sahteDondur).toHaveBeenCalled()
    expect(sahteCikis).toHaveBeenCalled()
    expect(queryByText('Evet, dondur')).toBeNull()

    // Sira onemli: once dondurulmeli, sonra cikis yapilmali. Ikisinin de
    // cagrildigini bilmek yeterli degil - siranin ters olmadigini da
    // dogrulamak gerekir.
    expect(sahteDondur.mock.invocationCallOrder[0]).toBeLessThan(
      sahteCikis.mock.invocationCallOrder[0]
    )
  })

  it('dondurma basarisiz olursa hata gosterir, cikis yapmaz ve onayi sifirlar', async () => {
    sahteDondur.mockRejectedValue(new Error('ag hatasi'))
    const { getByText, queryByText } = await render(<AyarlarEkrani />)

    await fireEvent.press(getByText('Hesabımı dondur'))
    await fireEvent.press(getByText('Evet, dondur'))

    expect(await screen.findByText('ag hatasi')).toBeTruthy()
    expect(sahteCikis).not.toHaveBeenCalled()
    expect(queryByText('Evet, dondur')).toBeNull()
    expect(getByText('Hesabımı dondur')).toBeTruthy()
  })

  it('vazgec basinca onay ekrani kapanir ve hicbir sey dondurulmez', async () => {
    const { getByText, queryByText } = await render(<AyarlarEkrani />)

    await fireEvent.press(getByText('Hesabımı dondur'))
    await fireEvent.press(getByText('Vazgeç'))

    expect(sahteDondur).not.toHaveBeenCalled()
    expect(queryByText('Evet, dondur')).toBeNull()
    expect(getByText('Hesabımı dondur')).toBeTruthy()
  })
})
