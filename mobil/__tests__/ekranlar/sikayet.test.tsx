import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import SikayetEkrani from '../../src/app/sikayet'
import * as ImagePicker from 'expo-image-picker'
import { sikayetGonder, sikayetFotografYukle } from '../../lib/sikayet'
import { engelle } from '../../lib/engelleme'

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}))
jest.mock('../../lib/profil', () => ({ kendiKullaniciIdim: jest.fn().mockResolvedValue('kullanici-1') }))
jest.mock('../../lib/sikayet', () => ({
  sikayetGonder: jest.fn(),
  sikayetFotografYukle: jest.fn(),
  SIKAYET_SEBEPLERI: [
    { anahtar: 'taciz', etiket: 'Taciz veya rahatsız etme' },
    { anahtar: 'spam', etiket: 'Spam veya reklam' },
  ],
}))
jest.mock('../../lib/engelleme', () => ({ engelle: jest.fn() }))

const mockRouterBack = jest.fn()
// Hedef turu testler arasinda degisiyor: baglam bildirimi yalnizca
// mesaj sikayetinde cikmali (karar 76).
let mockAramaParametreleri: { hedefTur: string; hedefId: string; kullaniciId?: string } = {
  hedefTur: 'kullanici',
  hedefId: 'kullanici-2',
}
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => mockAramaParametreleri,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockAramaParametreleri = { hedefTur: 'kullanici', hedefId: 'kullanici-2' }
})

/**
 * SIKAYET AKISI - kullanicinin referans gorseli (2026-09-18). Iki ekran:
 * 01 sikayet olustur, 02 gonderim sonrasi (engelleme kartiyla).
 */

/**
 * Menu satirina basar ve menunun KAPANMASINI bekler. SecimPenceresi
 * (2026-09-20) eylemi menu agactan kalktiktan sonra kosuyor; sonucu
 * hemen aramak yarisir.
 */
async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  // Eylem menu kalktiktan 80 ms sonra kosuyor (SecimPenceresi).
  await act(() => new Promise<void>((r) => setTimeout(r, 120)))
}

describe('SikayetEkrani - 01 sikayet olustur', () => {
  it('referanstaki metinler: baslik, kahraman, alt baslik, ek aciklama, ipucu, dugme', async () => {
    await render(<SikayetEkrani />)
    expect(screen.getByText('Şikâyet et')).toBeTruthy()
    expect(screen.getByText('Bize ne olduğunu anlat')).toBeTruthy()
    expect(screen.getByText('Bu hesabı neden şikâyet ediyorsun?')).toBeTruthy()
    expect(screen.getByText('Ek açıklama')).toBeTruthy()
    expect(screen.getByText('İsteğe bağlı')).toBeTruthy()
    expect(screen.getByPlaceholderText('Durumu kısaca açıklayabilirsin.')).toBeTruthy()
    expect(screen.getByText('Paylaştığın bilgiler değerlendirmemize yardımcı olur.')).toBeTruthy()
    expect(screen.getByText('Şikâyeti gönder')).toBeTruthy()
  })

  it('sebep secip gonderince sikayeti iletir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Taciz veya rahatsız etme'))
    await fireEvent.changeText(screen.getByPlaceholderText('Durumu kısaca açıklayabilirsin.'), 'detay')
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))

    await waitFor(() => {
      expect(sikayetGonder).toHaveBeenCalledWith('kullanici', 'kullanici-2', 'taciz', 'detay', null)
    })
    expect(sikayetFotografYukle).not.toHaveBeenCalled()
  })

  // FOTOGRAF (kullanicinin istegi 2026-09-19): istege bagli; secilirse
  // Gonder'de once kovaya yuklenir, yolu sikayetle gider.
  it('galeriden fotograf secip gonderince once yukler, yolu sikayetle iletir', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///kanit.jpg' }],
    })
    ;(sikayetFotografYukle as jest.Mock).mockResolvedValue('kullanici-1/123.jpg')
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    expect(screen.queryByTestId('sikayet-foto-onizleme')).toBeNull()
    await fireEvent.press(screen.getByTestId('sikayet-foto-ekle'))
    await menudenSec('foto-galeri')
    expect(await screen.findByTestId('sikayet-foto-onizleme')).toBeTruthy()
    expect(screen.getByText('Fotoğrafı değiştir')).toBeTruthy()

    await fireEvent.press(screen.getByText('Taciz veya rahatsız etme'))
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))

    await waitFor(() => {
      expect(sikayetFotografYukle).toHaveBeenCalledWith('kullanici-1', 'file:///kanit.jpg')
      expect(sikayetGonder).toHaveBeenCalledWith('kullanici', 'kullanici-2', 'taciz', undefined, 'kullanici-1/123.jpg')
    })
  })

  it('fotografi kaldirinca yuklenmez', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///kanit.jpg' }],
    })
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByTestId('sikayet-foto-ekle'))
    await menudenSec('foto-galeri')
    await fireEvent.press(await screen.findByTestId('sikayet-foto-kaldir'))
    expect(screen.queryByTestId('sikayet-foto-onizleme')).toBeNull()

    await fireEvent.press(screen.getByText('Taciz veya rahatsız etme'))
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))
    await waitFor(() => expect(sikayetGonder).toHaveBeenCalled())
    expect(sikayetFotografYukle).not.toHaveBeenCalled()
  })

  it('fotograf yuklenemezse sikayet GONDERILMEZ ve hata gorunur', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///kanit.jpg' }],
    })
    ;(sikayetFotografYukle as jest.Mock).mockRejectedValue(new Error('kova'))

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByTestId('sikayet-foto-ekle'))
    await menudenSec('foto-galeri')
    await fireEvent.press(screen.getByText('Taciz veya rahatsız etme'))
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))

    expect(await screen.findByText('Fotoğraf yüklenemedi, tekrar dene.')).toBeTruthy()
    expect(sikayetGonder).not.toHaveBeenCalled()
  })

  it('ek aciklamada karakter siniri ve sayac YOK (kullanicinin karari 2026-09-19)', async () => {
    await render(<SikayetEkrani />)
    expect(screen.queryByTestId('aciklama-sayaci')).toBeNull()
    expect(screen.getByTestId('aciklama-girdisi').props.maxLength).toBeUndefined()
    const uzun = 'a'.repeat(2000)
    await fireEvent.changeText(screen.getByTestId('aciklama-girdisi'), uzun)
    expect(screen.getByTestId('aciklama-girdisi').props.value).toBe(uzun)
  })

  it('secili sebep radyo durumunu tasir, digerleri tasimaz', async () => {
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    expect(screen.getByTestId('sebep-spam').props.accessibilityState.selected).toBe(true)
    expect(screen.getByTestId('sebep-taciz').props.accessibilityState.selected).toBe(false)
  })

  it('sebep secilmeden gonderilemez', async () => {
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))

    await waitFor(() => {
      expect(screen.getByText('Bir sebep seç')).toBeTruthy()
    })
    expect(sikayetGonder).not.toHaveBeenCalled()
  })

  // Karar 76: baglam bildirimi. Kademe 1 incelemesi sikayet edenin kendi
  // konusmasindan da mesaj tasidigi icin bu bildirilmeli.
  it('mesaj sikayetinde baglam bildirimini ve mesaj alt basligini gosterir', async () => {
    mockAramaParametreleri = { hedefTur: 'mesaj', hedefId: 'mesaj-1', kullaniciId: 'kullanici-2' }

    await render(<SikayetEkrani />)

    expect(screen.getByText(/çevresindeki mesajlar/i)).toBeTruthy()
    expect(screen.getByText('Bu mesajı neden şikâyet ediyorsun?')).toBeTruthy()
  })

  it('hikaye sikayetinde hikaye alt basligi; engelleme icin kullaniciId tasinir', async () => {
    // Hikaye akisi 2026-09-22: izleyicideki uc nokta -> Sikayet et.
    mockAramaParametreleri = { hedefTur: 'hikaye', hedefId: 'hikaye-1', kullaniciId: 'kullanici-2' }
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)

    expect(screen.getByText('Bu hikâyeyi neden şikâyet ediyorsun?')).toBeTruthy()
    expect(screen.queryByText(/çevresindeki mesajlar/i)).toBeNull()
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))
    await screen.findByText('Şikâyetin alındı')
    expect(sikayetGonder).toHaveBeenCalledWith('hikaye', 'hikaye-1', 'spam', undefined, null)
  })

  it('kullanici sikayetinde baglam bildirimi gosterilmez', async () => {
    await render(<SikayetEkrani />)

    expect(screen.queryByText(/çevresindeki mesajlar/i)).toBeNull()
  })
})

describe('SikayetEkrani - 02 gonderim sonrasi', () => {
  async function gonderVeBekle() {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    await fireEvent.press(screen.getByText('Şikâyeti gönder'))
    await screen.findByText('Şikâyetin alındı')
  }

  it('teyit ekrani: rozet, baslik, tesekkur, engelleme karti, Tamam', async () => {
    await gonderVeBekle()
    expect(screen.getByTestId('sikayet-alindi-ikonu')).toBeTruthy()
    expect(
      screen.getByText('Bize bildirdiğin için teşekkürler.\nŞikâyetin incelenmek üzere iletildi.')
    ).toBeTruthy()
    expect(screen.getByText('Bu hesabı engellemek ister misin?')).toBeTruthy()
    expect(
      screen.getByText('Sana mesaj göndermesini ve seninle etkileşime geçmesini engelleyebilirsin.')
    ).toBeTruthy()
    expect(screen.getByText('Hesabı engelle')).toBeTruthy()
    expect(screen.getByText('Tamam')).toBeTruthy()
  })

  it('Tamam ve sag ustteki x geri doner', async () => {
    await gonderVeBekle()
    await fireEvent.press(screen.getByTestId('sikayet-tamam'))
    await fireEvent.press(screen.getByTestId('sikayet-kapat'))
    expect(mockRouterBack).toHaveBeenCalledTimes(2)
  })

  it('"Hesabı engelle" onaydan gecer; onaylaninca engeller, dugme "Hesap engellendi" olur', async () => {
    ;(engelle as jest.Mock).mockResolvedValue(undefined)
    await gonderVeBekle()

    await fireEvent.press(screen.getByTestId('hesabi-engelle'))
    expect(engelle).not.toHaveBeenCalled()
    await fireEvent.press(await screen.findByText('Evet, engelle'))

    await waitFor(() => expect(engelle).toHaveBeenCalledWith('kullanici-2'))
    expect(await screen.findByText('Hesap engellendi')).toBeTruthy()
  })

  it('mesaj sikayetinde engelleme karti gonderen kisiyi hedefler', async () => {
    mockAramaParametreleri = { hedefTur: 'mesaj', hedefId: 'mesaj-1', kullaniciId: 'kullanici-9' }
    ;(engelle as jest.Mock).mockResolvedValue(undefined)
    await gonderVeBekle()

    await fireEvent.press(screen.getByTestId('hesabi-engelle'))
    await fireEvent.press(await screen.findByText('Evet, engelle'))
    await waitFor(() => expect(engelle).toHaveBeenCalledWith('kullanici-9'))
  })

  it('engellenecek hesap bilinmiyorsa kart cizilmez', async () => {
    mockAramaParametreleri = { hedefTur: 'mesaj', hedefId: 'mesaj-1' }
    await gonderVeBekle()
    expect(screen.queryByTestId('engelleme-karti')).toBeNull()
  })
})
