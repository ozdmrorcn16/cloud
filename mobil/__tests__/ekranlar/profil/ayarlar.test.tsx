import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from '../../../src/app/profil/ayarlar'
import {
  varsayilanBulunurluguGetir,
  aramadaGorunsunGetir,
  profilGizliGetir,
  etiketOnayiGerekliGetir,
  aramadaGorunsunAyarla,
} from '../../../lib/ayarlar'
import { hesabiDondur } from '../../../lib/hesap'
import { bildirimJetonunuSil } from '../../../lib/bildirim'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanBulunurluguGetir: jest.fn(),
  aramadaGorunsunGetir: jest.fn(),
  profilGizliGetir: jest.fn(),
  profilGizliAyarla: jest.fn(),
  aramadaGorunsunAyarla: jest.fn(),
  kullaniciAdiDurumunuGetir: jest.fn(),
  etiketOnayiGerekliGetir: jest.fn(),
  etiketOnayiGerekliAyarla: jest.fn(),
}))

jest.mock('../../../lib/veri-disa-aktar', () => ({
  verilerimiDisaAktar: jest.fn(),
}))
jest.mock('../../../lib/hesap', () => ({ hesabiDondur: jest.fn() }))
jest.mock('../../../lib/bildirim', () => ({ bildirimJetonunuSil: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

const sahteDondur = hesabiDondur as jest.Mock
const sahteCikis = supabase.auth.signOut as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanBulunurluguGetir as jest.Mock).mockResolvedValue('herkese_acik')
  ;(aramadaGorunsunGetir as jest.Mock).mockResolvedValue(true)
  ;(profilGizliGetir as jest.Mock).mockResolvedValue(false)
    ;(etiketOnayiGerekliGetir as jest.Mock).mockResolvedValue(false)
  ;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(bildirimJetonunuSil as jest.Mock).mockResolvedValue(undefined)
  sahteDondur.mockResolvedValue(undefined)
  sahteCikis.mockResolvedValue(undefined)
})

describe('AyarlarEkrani', () => {
  /*
   * KULLANICI ADI SATIRI KALDIRILDI (kullanicinin istegi 2026-09-11).
   * Iddia silinmedi TERSINE cevrildi: satir sessizce geri gelirse bu
   * test kirilir. Islev kaybolmuyor - kullanici adi ayni gun profil
   * duzenleme ekranina SATIR ICI tasindi.
   */
  it('kullanici adi satiri ARTIK YOK', async () => {
    await render(<AyarlarEkrani />)

    await screen.findByText('Gizlilik metni')
    expect(screen.queryByText('Kullanıcı adı')).toBeNull()
  })

  it('check-in gorunurlugunun mevcut degerini satirda gosterir', async () => {
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('Herkese açık')).toBeTruthy()
  })

  /*
   * `/profil/kullanici-adi` EKRANI SILINDI. Tek girisi ayarlardaki
   * satirdi; satir kalkinca ekran oksuz kalirdi (ayni karar
   * 2026-09-07'de `profil/anilar.tsx` icin de verilmisti). Bu test
   * artik hicbir yonlendirmenin o adrese GITMEDIGINI olcuyor.
   */
  it('hicbir satir silinmis kullanici adi ekranina gitmiyor', async () => {
    await render(<AyarlarEkrani />)

    fireEvent.press(await screen.findByText('Gizlilik metni'))
    expect(mockRouterPush).not.toHaveBeenCalledWith('/profil/kullanici-adi')
  })

  it('check-in gorunurlugu satiri kendi ekranina goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Yeni check-in’lerim'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/check-in-gorunurlugu')
  })

  /*
   * HESAP BOLUMU SADELESTI. "Gecmis anilarim" 2026-08-30'da,
   * "Profili duzenle" ve "Kullanici adi" 2026-09-11'de kalkti.
   * Bolumde artik yalnizca gizlilik metni, verilerimi indir ve
   * hesap islemleri var.
   *
   * Eski iddia BIR KEZ BAYATLAMISTI: metni "Profilini" diye ariyordu
   * ve satir "Profili düzenle" oldugu icin kurali hic olcmeden yesil
   * geciyordu. Bu yuzden asagidaki iddialar EKRANDA GERCEKTEN OLAN
   * bir satiri de bekliyor - yoksa "her sey yok" hali de gecerdi.
   */
  it('Hesap bolumunde duzenleme ve kullanici adi satirlari ARTIK YOK', async () => {
    await render(<AyarlarEkrani />)

    expect(await screen.findByText('Gizlilik metni')).toBeTruthy()
    expect(screen.queryByText('Geçmiş anılarım')).toBeNull()
    expect(screen.queryByText('Profili düzenle')).toBeNull()
    expect(screen.queryByText('Kullanıcı adı')).toBeNull()
  })

  it('engellenenler satiri listeye goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Engellenenler'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/engellenenler')
  })

  it('gizlilik metni satiri metne goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Gizlilik metni'))
    expect(mockRouterPush).toHaveBeenCalledWith('/gizlilik')
  })

  it('hesabi sil satiri silme ekranina goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Hesabımı sil'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/hesabi-sil')
  })

  it('aramada gorunurlugu kapatir', async () => {
    await render(<AyarlarEkrani />)
    fireEvent(await screen.findByLabelText('Aramada görünürlük'), 'valueChange', false)
    await waitFor(() => expect(aramadaGorunsunAyarla).toHaveBeenCalledWith(false))
  })

  it('aramada gorunurluk kaydedilemezse anahtar eski haline doner', async () => {
    ;(aramadaGorunsunAyarla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<AyarlarEkrani />)
    fireEvent(await screen.findByLabelText('Aramada görünürlük'), 'valueChange', false)

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByLabelText('Aramada görünürlük').props.value).toBe(true)
  })

  it('yukleme hatasi mesaj gosterir', async () => {
    ;(varsayilanBulunurluguGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })

  it('dondurma iki adimda calisir ve oturumu kapatir', async () => {
    await render(<AyarlarEkrani />)

    fireEvent.press(await screen.findByText('Hesabımı dondur'))
    expect(sahteDondur).not.toHaveBeenCalled()

    fireEvent.press(await screen.findByText('Evet, dondur'))

    await waitFor(() => expect(sahteDondur).toHaveBeenCalled())
    await waitFor(() => expect(sahteCikis).toHaveBeenCalled())
  })

  it('dondurma basarisiz olursa hata gosterir, cikis yapmaz ve onayi sifirlar', async () => {
    sahteDondur.mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Hesabımı dondur'))
    fireEvent.press(await screen.findByText('Evet, dondur'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(sahteCikis).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText('Evet, dondur')).toBeNull())
  })

  it('vazgec basinca onay kapanir ve hicbir sey dondurulmez', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Hesabımı dondur'))
    fireEvent.press(await screen.findByText('Vazgeç'))

    await waitFor(() => expect(screen.queryByText('Evet, dondur')).toBeNull())
    expect(sahteDondur).not.toHaveBeenCalled()
  })

  it('cikista once push jetonunu siler, sonra oturumu kapatir', async () => {
    const sira: string[] = []
    ;(bildirimJetonunuSil as jest.Mock).mockImplementation(async () => {
      sira.push('jeton')
    })
    sahteCikis.mockImplementation(async () => {
      sira.push('cikis')
      return { error: null }
    })

    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Çıkış yap'))

    await waitFor(() => expect(sira).toEqual(['jeton', 'cikis']))
  })

  /**
   * PROFIL GIZLILIGI (kullanicinin istegi 2026-09-02). Aciklama satiri
   * SART: "Profilim gizli" tek basina neyin gizlenecegini soylemiyor -
   * kullanici anahtari cevirmeden once ne olacagini bilmeli.
   */
  it('profil gizliligi anahtari ve aciklamasi gorunur', async () => {
    await render(<AyarlarEkrani />)

    expect(await screen.findByText('Profilim gizli')).toBeTruthy()
    expect(
      screen.getByText(/anıların ve check-in.lerin yalnızca arkadaşlarına görünür/)
    ).toBeTruthy()
  })

  /*
   * "Profili duzenle" satiri 2026-09-11'de kullanicinin istegiyle
   * KALDIRILDI. Kaldirmak bu kez guvenli: ayni islemin BASKA bir
   * girisi var - profil ekranindaki "Profili düzenle" butonu
   * (`src/app/profil/index.tsx`). Ayni kontrol 2026-09-03'te
   * ATLANMIS ve ekran bir sure ulasilamaz kalmisti; o yuzden
   * duzenleme ekranina gidebilmek AYRICA profil ekrani testinde
   * kilitli.
   */
  it('ayarlardan duzenleme ekranina yonlendirme YOK', async () => {
    await render(<AyarlarEkrani />)

    await fireEvent.press(await screen.findByText('Gizlilik metni'))

    expect(mockRouterPush).not.toHaveBeenCalledWith('/profil/duzenle')
  })
})

/**
 * VERILERIMI INDIR (KVKK m.11 erisim hakki, 2026-09-11).
 *
 * Dosyanin ICERIGI sunucuda belirleniyor ve orada canli olarak
 * olculuyor; buradaki testler ekranin davranisini kilitliyor.
 */
describe('AyarlarEkrani - verilerimi indir', () => {
  it('satira basinca imzali adres aciliyor', async () => {
    const { verilerimiDisaAktar } = require('../../../lib/veri-disa-aktar')
    ;(verilerimiDisaAktar as jest.Mock).mockResolvedValue('https://imzali/dosya.json')
    const ac = jest
      .spyOn(require('react-native').Linking, 'openURL')
      .mockResolvedValue(undefined as never)

    await render(<AyarlarEkrani />)
    await fireEvent.press(await screen.findByText('Verilerimi indir'))

    await waitFor(() => expect(ac).toHaveBeenCalledWith('https://imzali/dosya.json'))
    ac.mockRestore()
  })

  /*
   * HATA SATIRIN ALTINDA gosteriliyor, `Alert` ile DEGIL: Alert
   * react-native-web'de sessizce hicbir sey yapmiyor ve uygulama
   * tarayicidan da aciliyor (ayni gerekce OnayPenceresi'nde de var).
   */
  it('hazirlanamazsa sebebini satirin altinda soyluyor', async () => {
    const { verilerimiDisaAktar } = require('../../../lib/veri-disa-aktar')
    ;(verilerimiDisaAktar as jest.Mock).mockRejectedValue(new Error('olmadi'))

    await render(<AyarlarEkrani />)
    await fireEvent.press(await screen.findByText('Verilerimi indir'))

    expect(await screen.findByText('Veriler hazırlanamadı. Tekrar dene.')).toBeTruthy()
  })
})
