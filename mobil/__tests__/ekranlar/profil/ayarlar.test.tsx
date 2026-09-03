import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from '../../../src/app/profil/ayarlar'
import {
  varsayilanBulunurluguGetir,
  aramadaGorunsunGetir,
  profilGizliGetir,
  aramadaGorunsunAyarla,
  kullaniciAdiDurumunuGetir,
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
  ;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
    kullaniciAdi: 'orcun',
    sonrakiDegisimTarihi: null,
  })
  ;(bildirimJetonunuSil as jest.Mock).mockResolvedValue(undefined)
  sahteDondur.mockResolvedValue(undefined)
  sahteCikis.mockResolvedValue(undefined)
})

describe('AyarlarEkrani', () => {
  it('kullanici adini satirin degeri olarak gosterir', async () => {
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('orcun')).toBeTruthy()
  })

  it('check-in gorunurlugunun mevcut degerini satirda gosterir', async () => {
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('Herkese açık')).toBeTruthy()
  })

  it('kullanici adi satiri kendi ekranina goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Kullanıcı adı'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/kullanici-adi')
  })

  it('check-in gorunurlugu satiri kendi ekranina goturur', async () => {
    await render(<AyarlarEkrani />)
    fireEvent.press(await screen.findByText('Yeni check-in’lerim'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/check-in-gorunurlugu')
  })

  it('Profilini duzenle ve Gecmis anilarim satirlari ARTIK YOK', async () => {
    // Kullanicinin karari 2026-08-30. Profil duzenleme artik profil
    // bandindaki dugmede; ani gorunurlugu menuden kaldirildi.
    await render(<AyarlarEkrani />)

    expect(await screen.findByText('Kullanıcı adı')).toBeTruthy()
    expect(screen.queryByText('Profilini düzenle')).toBeNull()
    expect(screen.queryByText('Geçmiş anılarım')).toBeNull()
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

  it('Profili duzenle satiri GERI GELDI ve duzenleme ekranini aciyor', async () => {
    // 2026-08-30'da kaldirilmisti cunku ayni islem profil bandindaki
    // butondaydi. 2026-09-03'te o buton kalkinca satir geri kondu:
    // aksi halde /profil/duzenle ekranina hicbir yerden gidilemezdi.
    await render(<AyarlarEkrani />)

    await fireEvent.press(await screen.findByText('Profili düzenle'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil/duzenle')
  })
})
