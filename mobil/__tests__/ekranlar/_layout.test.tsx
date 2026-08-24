import { render, waitFor, act } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import KokLayout from '../../src/app/_layout'
import { useOturum } from '../../lib/oturum'
import { bildirimleriBaslat, bildirimeDokunmaDinle } from '../../lib/bildirim'

const mockRouterReplace = jest.fn()
const mockRouterPush = jest.fn()
let mockSegments: string[] = []
const mockDinleyiciyiKaldir = jest.fn()

jest.mock('expo-router', () => ({
  Slot: () => null,
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
  useSegments: () => mockSegments,
}))

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
})
