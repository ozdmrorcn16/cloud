import { render, screen, fireEvent } from '@testing-library/react-native'
import AnaSayfa from '../../src/app/index'
import { akisiGetir } from '../../lib/akis'
import type { AkisOgesi } from '../../lib/akis'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { checkIniSil } from '../../lib/checkin'

jest.mock('../../lib/akis', () => ({ akisiGetir: jest.fn() }))
jest.mock('../../lib/sohbet', () => ({ konusmalarimiGetir: jest.fn() }))
jest.mock('../../lib/checkin', () => ({ checkIniSil: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('../../lib/kisi-ara', () => ({ kisiAra: jest.fn() }))
jest.mock('../../lib/fotograf-url', () => ({
  profilFotografiUrl: jest.fn().mockResolvedValue('https://imzali/kisi.jpg'),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

function oge(ustune: Partial<AkisOgesi> = {}): AkisOgesi {
  return {
    id: 'checkin-1',
    kullaniciId: 'kullanici-2',
    kullaniciAdi: 'Ada',
    mekanId: 'mekan-1',
    mekanSemti: 'Nilüfer',
    avatarUrl: null,
    mekanAdi: 'Sahil Kafe',
    notMetni: 'guzel bir aksam',
    fotografUrl: null,
    olusturmaZamani: new Date().toISOString(),
    canliMi: false,
    benimMi: false,
    etiketler: [],
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(akisiGetir as jest.Mock).mockResolvedValue([])
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
})

describe('AnaSayfa', () => {
  it('akistaki check-ini kisi ve mekan adiyla gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
  })

  it('fotografli check-in fotografiyla gelir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ fotografUrl: 'https://imzali/1.jpg' })])

    await render(<AnaSayfa />)

    expect(await screen.findByTestId('akis-fotografi')).toBeTruthy()
  })

  it('profil fotografi varsa serit isaretinde o gorunur', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ avatarUrl: 'https://imzali/avatar.jpg' }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByTestId('akis-avatari')).toBeTruthy()
  })

  it('fotograf yoksa ADIN bas harfi gorunur - kullanici adinin degil', async () => {
    // Kullanicinin karari 2026-08-28. `kullaniciAdi` alani adi tasiyor
    // (check_inler'de denormalize duran ad, karar #18); bas harf de
    // ondan aliniyor.
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ avatarUrl: null, kullaniciAdi: 'Deniz' }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByText('D')).toBeTruthy()
    expect(screen.queryByTestId('akis-avatari')).toBeNull()
  })

  it('canli check-in "su an burada" rozetiyle gosterilir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ canliMi: true })])

    await render(<AnaSayfa />)

    expect(await screen.findByText('şu an burada')).toBeTruthy()
  })

  it('kendi check-ini de akista gorunur', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ id: 'checkin-2', kullaniciId: 'kullanici-1', kullaniciAdi: 'Ben', benimMi: true }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ben')).toBeTruthy()
  })

  it('kendi satirinda kisiye basinca kendi profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ kullaniciAdi: 'Ben', benimMi: true })])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ben'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil')
  })

  it('baskasinin satirinda kisiye basinca onun profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('mekan adina basinca mekan sayfasini acar', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('arama sutununa yazilinca akis yerine KISI sonuclari cikar', async () => {
    // Kullanicinin istegi 2026-08-28: markanin altindaki sutundan
    // kullanici adi ya da isimle kisi aranabiliyor.
    const { kisiAra } = require('../../lib/kisi-ara')
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k-9', kullaniciAdi: 'denizy', ad: 'Deniz Yılmaz', fotograf: 'k-9/a.jpg' },
    ])
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    await fireEvent.changeText(
      screen.getByPlaceholderText('Kullanıcı adı ya da isim ara'),
      'deniz'
    )

    expect(await screen.findByText('denizy')).toBeTruthy()
    expect(await screen.findByText('Deniz Yılmaz')).toBeTruthy()
    // Akis ekrandan cekiliyor: arama sonucu onun YERINE geliyor.
    expect(screen.queryByText('Sahil Kafe')).toBeNull()
  })

  it('akis bosken kesfetmeye yonlendirir', async () => {
    await render(<AnaSayfa />)

    expect(await screen.findByText('Akışın henüz boş')).toBeTruthy()
    fireEvent.press(screen.getByText('Mekanları keşfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('akis yuklenemezse hata mesaji gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))

    await render(<AnaSayfa />)

    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })

  it('BASKASININ check-in\'inde silme dugmesi YOK', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: false })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    expect(screen.queryByLabelText('Sil')).toBeNull()
  })

  it('kendi check-in\'inde silme ONAY ISTIYOR, tek dokunusla silmiyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Sil'))

    // Onay satiri acildi; silme HENUZ yapilmadi.
    expect(screen.getByText('Bu check-in kalıcı olarak silinsin mi?')).toBeTruthy()
    expect(checkIniSil).not.toHaveBeenCalled()
  })

  it('onaylanınca siler ve akistan kaldirir', async () => {
    ;(checkIniSil as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Sil'))
    await fireEvent.press(screen.getByText('Sil'))

    expect(checkIniSil).toHaveBeenCalledWith('checkin-1')
    // Satir tek yerde duruyor; akistan kalkmasi profilden de
    // kalktigi anlamina geliyor.
    expect(await screen.findByText('Akışın henüz boş')).toBeTruthy()
  })

  it('vazgecince silmiyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Sil'))
    await fireEvent.press(screen.getByText('Vazgeç'))

    expect(checkIniSil).not.toHaveBeenCalled()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
  })
})
