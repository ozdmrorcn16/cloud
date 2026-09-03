import { render, waitFor, act } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import KokLayout from '../../src/app/_layout'
import { useOturum } from '../../lib/oturum'
import { bildirimleriBaslat, bildirimeDokunmaDinle } from '../../lib/bildirim'

// Ilk acilis ekrani cihazda BIR KEZ gosteriliyor. Varsayilan olarak
// "gosterildi" kabul ediliyor; ilk acilis senaryosu ayrica test
// ediliyor.
const mockRouterReplace = jest.fn()
const mockRouterPush = jest.fn()
let mockSegments: string[] = []
const mockDinleyiciyiKaldir = jest.fn()

jest.mock('expo-router', () => {
  // Slot gorunur bir oge ciziyor ki "yanlis ekran bir an gorundu mu"
  // sorusu test edilebilsin.
  const React = require('react')
  const { View } = require('react-native')
  return {
    Slot: () => React.createElement(View, { testID: 'ekran-icerigi' }),
    useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
    useSegments: () => mockSegments,
  }
})

jest.mock('../../lib/oturum', () => ({
  OturumSaglayici: ({ children }: { children: ReactNode }) => children,
  useOturum: jest.fn(),
}))

jest.mock('../../lib/bildirim', () => ({
  bildirimleriBaslat: jest.fn().mockResolvedValue(undefined),
  bildirimeDokunmaDinle: jest.fn(() => mockDinleyiciyiKaldir),
}))

const mockBaslat = bildirimleriBaslat as jest.Mock
const mockDokunmaDinle = bildirimeDokunmaDinle as jest.Mock

describe('YonlendirmeKontrolu (kok layout yonlendirme mantigi)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 2026-08-30'da yasanan hata: yonlendirme yalnizca bir useEffect'te
  // yapiliyordu, efekt render'dan SONRA calistigi icin oturumu olmayan
  // biri uygulamayi actiginda bir an ANA SAYFA ciziliyordu (en ustunde
  // kucuk kelime markasiyla) ve ancak sonra karsilamaya geciliyordu.
  it('yonlendirme beklerken mevcut ekrani HIC cizmez', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['bazi-ekran']

    const { queryByTestId } = await render(<KokLayout />)

    expect(queryByTestId('ekran-icerigi')).toBeNull()
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/karsilama')
    })
  })

  it('dogru ekrandayken icerigi cizer', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['(auth)', 'karsilama']

    const { queryByTestId } = await render(<KokLayout />)

    expect(queryByTestId('ekran-icerigi')).not.toBeNull()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('oturum durumu yuklenirken hicbir ekran cizmez', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: true,
    })
    mockSegments = ['bazi-ekran']

    const { queryByTestId } = await render(<KokLayout />)

    expect(queryByTestId('ekran-icerigi')).toBeNull()
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('oturum yokken ve (auth) grubunda degilken /karsilama yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['bazi-ekran']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/karsilama')
    })
  })

  it('oturum var, profilVarMi false ve profil-olustur ekraninda degilken /profil-olustur yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: false,
      yukleniyor: false,
    })
    mockSegments = ['(tabs)']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/profil-olustur')
    })
  })

  it('oturum var, profilVarMi true ve (auth) grubundayken / yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      yukleniyor: false,
    })
    mockSegments = ['(auth)']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/')
    })
  })

  it('oturum var, profilVarMi true ve profil-olustur ekranindayken / yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      yukleniyor: false,
    })
    mockSegments = ['profil-olustur']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/')
    })
  })

  it('profilVarMi null iken (henuz kontrol edilmedi) hicbir yonlendirme yapmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['(tabs)']

    await render(<KokLayout />)

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('yukleniyor true iken hicbir yonlendirme yapmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: true,
    })
    mockSegments = ['bazi-ekran']

    await render(<KokLayout />)

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('oturum ve profil hazir iken bildirimleri baslatir ve dokunma dinleyicisi kurar', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      yukleniyor: false,
    })
    mockSegments = ['(tabs)']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockBaslat).toHaveBeenCalledWith('kullanici-1')
    })
    expect(mockDokunmaDinle).toHaveBeenCalled()
  })

  it('oturum yokken bildirimleri baslatmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['(auth)']

    await render(<KokLayout />)

    expect(mockBaslat).not.toHaveBeenCalled()
    expect(mockDokunmaDinle).not.toHaveBeenCalled()
  })

  it('oturum var ama profil yokken bildirimleri baslatmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: false,
      yukleniyor: false,
    })
    mockSegments = ['profil-olustur']

    await render(<KokLayout />)

    expect(mockBaslat).not.toHaveBeenCalled()
    expect(mockDokunmaDinle).not.toHaveBeenCalled()
  })

  it('unmount olunca dokunma dinleyicisini kaldirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      yukleniyor: false,
    })
    mockSegments = ['(tabs)']

    const { unmount } = await render(<KokLayout />)
    await waitFor(() => {
      expect(mockDokunmaDinle).toHaveBeenCalled()
    })
    expect(mockDinleyiciyiKaldir).not.toHaveBeenCalled()

    // unmount pasif effect temizligini flush etsin diye act icinde.
    await act(async () => {
      unmount()
    })

    expect(mockDinleyiciyiKaldir).toHaveBeenCalled()
  })
})

describe('YonlendirmeKontrolu (hesapDurumu kolu)', () => {
  const sahteHesapDurumu = {
    durum: 'askida' as const,
    askiBitisi: null,
    gerekce: 'test',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('hesapDurumu dolu ve hesap-durumu ekraninda degilken /hesap-durumu yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      hesapDurumu: sahteHesapDurumu,
      yukleniyor: false,
    })
    mockSegments = []

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/hesap-durumu')
    })
  })

  it('hesapDurumu dolu ve zaten hesap-durumu ekranindayken hicbir yonlendirme yapmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      hesapDurumu: sahteHesapDurumu,
      yukleniyor: false,
    })
    mockSegments = ['hesap-durumu']

    await render(<KokLayout />)

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  it('hesapDurumu dolu, profilVarMi false ve hesap-durumu ekranindayken hicbir yonlendirme yapmaz', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: false,
      hesapDurumu: sahteHesapDurumu,
      yukleniyor: false,
    })
    mockSegments = ['hesap-durumu']

    await render(<KokLayout />)

    expect(mockRouterReplace).not.toHaveBeenCalled()
  })

  // D1 duzeltmesi (2026-08-22): baslikta "aski kalkinca" ifadesi
  // teknik olarak yanlisti - satirin kendisi silinmiyor, budama
  // cron'u onu 90 gun sonra siler. hesapDurumunuGetir suresi dolmus
  // bir askiyi lib/hesap.ts'teki sunucu-taraf filtresiyle (`.or(...)`,
  // hesap_aktif_mi ile ayni kural) sorgudan DUSURUYOR; bu yuzden
  // istemcide gorulen deger null oluyor, satir yok olmuyor. Davranis
  // ayni kaliyor (hesapDurumu gercekten null geliyor), yalnizca bu
  // aciklama yanlisti.
  it('hesapDurumu null olunca (suresi dolmus aski sorgu filtresiyle dusunce) hesap-durumu ekranindan / yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'kullanici-1' } },
      profilVarMi: true,
      hesapDurumu: null,
      yukleniyor: false,
    })
    mockSegments = ['hesap-durumu']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/')
    })
  })

  it('daha once acmis olsa bile hesapsiz kullaniciyi yine karsilamaya yonlendirir', async () => {
    // Kullanicinin karari (2026-08-25): karsilama her acilista gorunur,
    // hesap olusturulana kadar. Cihazda "gosterildi" isareti YOK.
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['bazi-ekran']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/karsilama')
    })
  })
})

// -------------------------------------------------------------------- //
// UST GUVENLI ALAN SERIDI (kullanicinin istegi 2026-09-03)
//
// "Rengi yukari kadar devam ettir, sonsuz dursun." Durum cubugunun
// ardindaki serit EKRANIN degil KOK DUZENIN icinde (paddingTop:
// insets.top), o yuzden profil ekranindaki gecisin ilk rengini buranin
// boyamasi gerekiyor. Aksi halde renk yukarida bicak gibi kesiliyor.
// -------------------------------------------------------------------- //

function duzStil(oge: { props: { style?: unknown } }): Record<string, unknown> {
  const parcalar = [oge.props.style].flat(Infinity).filter(Boolean)
  return Object.assign({}, ...(parcalar as Record<string, unknown>[]))
}

describe('Ust guvenli alan seridi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: { user: { id: 'k1' } },
      yukleniyor: false,
      profilVarMi: true,
      hesapDurumu: null,
    })
  })

  it('PROFIL ekraninda seftali', async () => {
    mockSegments = ['profil']
    const ekran = await render(<KokLayout />)
    expect(duzStil(await ekran.findByTestId('ust-serit')).backgroundColor).toBe('#FFE6D2')
  })

  it('BASKA ekranlarda beyaz kaliyor', async () => {
    mockSegments = ['mesajlar']
    const ekran = await render(<KokLayout />)
    expect(duzStil(await ekran.findByTestId('ust-serit')).backgroundColor).toBe('#FFFFFF')
  })

  it('PROFIL ALT ekranlarinda beyaz kaliyor (ayarlar, duzenle...)', async () => {
    mockSegments = ['profil', 'ayarlar']
    const ekran = await render(<KokLayout />)
    expect(duzStil(await ekran.findByTestId('ust-serit')).backgroundColor).toBe('#FFFFFF')
  })
})
