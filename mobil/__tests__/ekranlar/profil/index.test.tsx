import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilEkrani from '../../../src/app/profil/index'
import { kendiProfilimiGetir, profilFotografiniKaldir } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'

jest.mock('../../../lib/profil', () => ({
  kendiProfilimiGetir: jest.fn(),
  profilFotografiniDegistir: jest.fn(),
  profilFotografiniKaldir: jest.fn(),
}))
const mockGaleriAc = jest.fn()
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...a: unknown[]) => mockGaleriAc(...a),
  MediaTypeOptions: { Images: 'Images' },
}))
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
    mekanSemti: 'Nilüfer',
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

    // Baslikta @ isareti VAR (kullanicinin istegi 2026-08-30). Bir gun
    // once kaldirilmisti; yeni istek onun yerine gecti.
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
    // Uc sayi var: iki ani AYNI mekanda oldugu icin Yer 1, arkadas da 1.
    expect(screen.getByText('Yer')).toBeTruthy()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('Arkadaşlarım')).toBeTruthy()
  })

  it('Yerler sekmesi en cok gidilen mekani kac kez gidildigiyle listeler', async () => {
    // Kullanicinin secimi 2026-08-29. Sunucuda yeni sorgu yok; ayni
    // anilardan gruplaniyor.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani(),
      ani({ id: 'ani-2' }),
      ani({ id: 'ani-3', mekanId: 'mekan-2', mekanAdi: 'Kent Meydanı' }),
    ])

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('Yerler'))

    expect(await screen.findByText('2 kez')).toBeTruthy()
    expect(screen.getByText('1 kez')).toBeTruthy()
    expect(screen.getByText('Kent Meydanı')).toBeTruthy()
  })

  it('Profili duzenle dugmesi duzenleme ekranina goturur', async () => {
    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('Profili düzenle'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/duzenle')
  })

  it('canli check-in ANILAR LISTESINDE rozetiyle gorunur, ayri serit YOK', async () => {
    // Kullanicinin karari 2026-08-29: profildeki "Şu an buradasın"
    // seridi kaldirildi; canli check-in yalnizca ani akisinda,
    // "şu an burada" rozetiyle gorunuyor.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      // Rozet 30 dakikalik canlilik penceresine bagli (karar 2026-08-29);
      // kayit yeni olmali.
      ani({
        id: 'ani-canli',
        mekanAdi: 'Kordon',
        canliMi: true,
        olusturmaZamani: new Date().toISOString(),
      }),
    ])

    await render(<ProfilEkrani />)

    expect(await screen.findByText('şu an burada')).toBeTruthy()
    expect(screen.getByText('Kordon')).toBeTruthy()
    // Eski serit ve eylemleri artik profilde DEGIL.
    expect(screen.queryByText('Şu an buradasın')).toBeNull()
    expect(screen.queryByText('Ayrıl')).toBeNull()
  })

  it('canli check-in yoksa profilde HICBIR serit ya da kart cizilmiyor', async () => {
    // "Su an bir yerde degilsin" karti kaldirildi (kullanicinin karari
    // 2026-08-27). Check-in'e giris artik alt cubugun ortasindaki
    // turuncu dugmede; profilde ikinci bir cagri gerekmiyor.
    await render(<ProfilEkrani />)
    await screen.findByText('Anılar')

    expect(screen.queryByText('Şu an bir yerde değilsin')).toBeNull()
    expect(screen.queryByText('Bir yere check-in yap')).toBeNull()
    expect(screen.queryByText('Şu an buradasın')).toBeNull()
  })

  it('anilar bosken yon veren bir metin gosterir', async () => {
    await render(<ProfilEkrani />)
    expect(await screen.findByText('Henüz bir anın yok')).toBeTruthy()
  })

  it('ani satirina basilinca check-in ekranini acar', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-1')
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

  describe('profil fotografi (kullanicinin istegi 2026-08-30)', () => {
    beforeEach(() => {
      ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
        id: 'kullanici-1',
        kullaniciAdi: 'orcun',
        ad: 'Orcun Ozdemir',
        biyografi: null,
        fotograflar: ['kullanici-1/1.jpg'],
      })
      ;(profilFotografiUrl as jest.Mock).mockResolvedValue('https://ornek/foto.jpg')
      mockGaleriAc.mockResolvedValue({ canceled: true })
      ;(profilFotografiniKaldir as jest.Mock).mockResolvedValue(undefined)
    })

    it('yalnizca + rozeti galeriyi acar; fotografa basmak acmaz', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')

      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      expect(mockGaleriAc).not.toHaveBeenCalled()

      await fireEvent.press(screen.getByLabelText('Profil fotoğrafı ekle'))
      expect(mockGaleriAc).toHaveBeenCalledTimes(1)
    })

    it('fotografa basinca buyuk gorunum acilir, Kapat ile kapanir', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')

      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      expect(screen.getByTestId('profil-fotografi-buyuk')).toBeTruthy()
      expect(screen.getByText('Fotoğrafı kaldır')).toBeTruthy()

      await fireEvent.press(screen.getByLabelText('Kapat'))
      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
    })

    it('kaldirma iki adimli: onaylayinca sunucuya gider ve profil yenilenir', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))

      await fireEvent.press(screen.getByText('Fotoğrafı kaldır'))
      expect(profilFotografiniKaldir).not.toHaveBeenCalled()
      expect(screen.getByText('Fotoğrafın kaldırılsın mı?')).toBeTruthy()

      await fireEvent.press(screen.getAllByText('Fotoğrafı kaldır')[0])
      await waitFor(() => expect(profilFotografiniKaldir).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(kendiProfilimiGetir).toHaveBeenCalledTimes(2))
      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
    })

    it('Vazgec onayi geri alir, fotograf kaldirilmaz', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      await fireEvent.press(screen.getByText('Fotoğrafı kaldır'))

      await fireEvent.press(screen.getByText('Vazgeç'))

      expect(screen.queryByText('Fotoğrafın kaldırılsın mı?')).toBeNull()
      expect(profilFotografiniKaldir).not.toHaveBeenCalled()
    })
  })
})
