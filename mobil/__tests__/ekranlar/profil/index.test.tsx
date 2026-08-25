import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilEkrani from '../../../src/app/profil/index'
import { kendiProfilimiGetir } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'

jest.mock('../../../lib/profil', () => ({ kendiProfilimiGetir: jest.fn() }))
jest.mock('../../../lib/fotograf-url', () => ({ profilFotografiUrl: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({
  kullanicininAnilariniGetir: jest.fn(),
  aktifCheckInimiGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

function ani(ustune: Record<string, unknown> = {}) {
  return {
    id: 'ani-1',
    mekanId: 'mekan-1',
    mekanAdi: 'Sahil Kafe',
    mekanKonumu: { lat: 41, lng: 29 },
    notMetni: 'harika bir aksamdi',
    fotograf: null,
    olusturmaZamani: '2026-08-20T10:00:00Z',
    bitisZamani: '2026-08-20T14:00:00Z',
    canliMi: false,
    bulunurluk: 'herkese_acik',
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
    id: 'kullanici-1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    biyografi: 'İzmir',
    fotograflar: [],
  })
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(profilFotografiUrl as jest.Mock).mockResolvedValue(null)
})

describe('ProfilEkrani', () => {
  it('kullanici adini, adi ve biyografiyi gosterir', async () => {
    await render(<ProfilEkrani />)

    expect(await screen.findByText('@orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('İzmir')).toBeTruthy()
  })

  it('fotografi olmayanda bas harfi gosterir', async () => {
    await render(<ProfilEkrani />)
    expect(await screen.findByText('O')).toBeTruthy()
    expect(screen.queryByTestId('profil-fotografi')).toBeNull()
  })

  it('ani ve bag sayilarini gosterir', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani(), ani({ id: 'ani-2' })])
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([{ id: 'k2' }])

    await render(<ProfilEkrani />)

    expect(await screen.findByText('2')).toBeTruthy()
    expect(screen.getByText('Anı')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('Bağ')).toBeTruthy()
  })

  it('canli check-in varsa mekan adiyla serit gosterir', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'checkin-9',
      mekanId: 'mekan-2',
      mekanAdi: 'Kordon',
      notMetni: null,
      fotograf: null,
      olusturmaZamani: '2026-08-25T10:00:00Z',
      bitisZamani: '2026-08-25T14:00:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })

    await render(<ProfilEkrani />)

    expect(await screen.findByText('Şu an buradasın')).toBeTruthy()
    expect(screen.getByText('Kordon')).toBeTruthy()
  })

  it('canli check-in yoksa check-in yapmaya yonlendirir', async () => {
    await render(<ProfilEkrani />)

    expect(await screen.findByText('Şu an bir yerde değilsin')).toBeTruthy()
    fireEvent.press(screen.getByText('Bir yere check-in yap'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('ayril basilinca check-inden cikar ve serit kaybolur', async () => {
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue({
      id: 'checkin-9',
      mekanId: 'mekan-2',
      mekanAdi: 'Kordon',
      notMetni: null,
      fotograf: null,
      olusturmaZamani: '2026-08-25T10:00:00Z',
      bitisZamani: '2026-08-25T14:00:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })
    ;(checkIndenAyril as jest.Mock).mockResolvedValue(undefined)

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Ayrıl'))

    await waitFor(() => expect(checkIndenAyril).toHaveBeenCalledWith('checkin-9'))
    // Ayrildiktan sonra ekran yeniden cekiliyor: artik canli check-in yok.
    ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
    await waitFor(() => expect(aktifCheckInimiGetir).toHaveBeenCalledTimes(2))
  })

  it('anilar bosken yon veren bir metin gosterir', async () => {
    await render(<ProfilEkrani />)
    expect(await screen.findByText('Henüz bir anın yok')).toBeTruthy()
  })

  it('ani satirina basilinca mekan sayfasini acar', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('ayarlar dugmesi ayarlar ekranini acar', async () => {
    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByLabelText('Ayarlar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  it('profil satiri yoksa profil olusturmaya yonlendirir', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue(null)

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Profilini oluştur'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil-olustur')
  })
})
