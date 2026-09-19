import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from '../../../src/app/profil/ayarlar'
import { profilGizliGetir } from '../../../lib/ayarlar'
import { bildirimJetonunuSil } from '../../../lib/bildirim'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/ayarlar', () => ({
  profilGizliGetir: jest.fn(),
}))
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

const sahteCikis = supabase.auth.signOut as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  ;(profilGizliGetir as jest.Mock).mockResolvedValue(false)
  ;(bildirimJetonunuSil as jest.Mock).mockResolvedValue(undefined)
  sahteCikis.mockResolvedValue(undefined)
})

/**
 * AYARLAR BIR HUB (kullanicinin referans gorselleri 2026-09-18/19).
 * Dort bolum, sirayla: Hesabin / Gizlilik ve etkilesim / Uygulama /
 * Hesap islemleri. Her satir kendi ekranina gider; tek yerinde eylem
 * "Cikis yap".
 */
describe('AyarlarEkrani', () => {
  it('dort bolum ve satirlari referans sirasinda', async () => {
    await render(<AyarlarEkrani />)
    await screen.findByText('Hesap ve güvenlik')
    const agac = JSON.stringify(screen.toJSON())
    const sira = [
      'Hesap ve güvenlik',
      '"Gizlilik"',
      'Konum ve check-in',
      '"Bildirimler"',
      '"Uygulama"',
      '"Görünüm"',
      'Yardım merkezi',
      'Slooin hakkında',
      'Hesap işlemleri',
      'Hesap yönetimi',
      'Çıkış yap',
    ].map((m) => agac.indexOf(m))
    expect(sira[0]).toBeGreaterThan(-1)
    for (let i = 1; i < sira.length; i++) expect(sira[i]).toBeGreaterThan(sira[i - 1])
  })

  it('hub satirlari kendi ekranlarina gider', async () => {
    await render(<AyarlarEkrani />)
    await fireEvent.press(await screen.findByText('Hesap ve güvenlik'))
    await fireEvent.press(screen.getByText('Gizlilik'))
    await fireEvent.press(screen.getByText('Konum ve check-in'))
    await fireEvent.press(screen.getByText('Bildirimler'))
    await fireEvent.press(screen.getByText('Görünüm'))
    await fireEvent.press(screen.getByText('Yardım merkezi'))
    await fireEvent.press(screen.getByText('Slooin hakkında'))
    await fireEvent.press(screen.getByText('Hesap yönetimi'))
    expect(mockRouterPush.mock.calls.map((c) => c[0])).toEqual([
      '/profil/hesap-guvenlik',
      '/profil/gizlilik-ayarlari',
      '/profil/konum-checkin',
      '/profil/bildirim-ayarlari',
      '/profil/gorunum',
      '/profil/yardim',
      '/profil/hakkinda',
      '/profil/hesap-yonetimi',
    ])
  })

  it('Gizlilik satiri profil gorunurlugunun mevcut degerini gosterir', async () => {
    ;(profilGizliGetir as jest.Mock).mockResolvedValue(true)
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('Sadece arkadaşlar')).toBeTruthy()
  })

  /*
   * TASINANLAR HUB'DA YOK: dondurma, silme ve "Verilerimi indir" Hesap
   * yonetimi ekraninda; "Gizlilik metni" Slooin hakkinda ekraninda;
   * eski anahtarlar Gizlilik ekraninda. Iddialar tersine cevrildi ki
   * sessizce geri gelirlerse test kirilsin.
   */
  it('tasinan satirlar hub-da ARTIK YOK', async () => {
    await render(<AyarlarEkrani />)
    await screen.findByText('Hesap ve güvenlik')
    for (const m of [
      'Hesabımı dondur',
      'Hesabımı sil',
      'Verilerimi indir',
      'Gizlilik metni',
      'Engellenenler',
      'Profilim gizli',
      'Kullanıcı adı',
      'Profili düzenle',
      'Yeni check-in’lerim',
    ]) {
      expect(screen.queryByText(m)).toBeNull()
    }
    expect(mockRouterPush).not.toHaveBeenCalledWith('/profil/kullanici-adi')
  })

  it('yukleme hatasi mesaj gosterir', async () => {
    ;(profilGizliGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))
    await render(<AyarlarEkrani />)
    expect(await screen.findByText('ağ hatası')).toBeTruthy()
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
    await fireEvent.press(await screen.findByText('Çıkış yap'))
    // Satira basmak HEMEN cikarmaz, once sorar (2026-09-19).
    expect(sira).toEqual([])
    expect(await screen.findByText('Çıkış yapılsın mı?')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    await waitFor(() => expect(sira).toEqual(['jeton', 'cikis']))
  })

  it('cikis onayinda vazgecince oturum acik kalir', async () => {
    await render(<AyarlarEkrani />)
    await fireEvent.press(await screen.findByText('Çıkış yap'))
    await fireEvent.press(await screen.findByText('Vazgeç'))

    await waitFor(() => expect(screen.queryByText('Çıkış yapılsın mı?')).toBeNull())
    expect(sahteCikis).not.toHaveBeenCalled()
    expect(bildirimJetonunuSil).not.toHaveBeenCalled()
  })
})
