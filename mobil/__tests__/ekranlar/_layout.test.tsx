import { render, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import KokLayout from '../../src/app/_layout'
import { useOturum } from '../../lib/oturum'

const mockRouterReplace = jest.fn()
let mockSegments: string[] = []

jest.mock('expo-router', () => ({
  Slot: () => null,
  useRouter: () => ({ replace: mockRouterReplace }),
  useSegments: () => mockSegments,
}))

jest.mock('../../lib/oturum', () => ({
  OturumSaglayici: ({ children }: { children: ReactNode }) => children,
  useOturum: jest.fn(),
}))

jest.mock('../../lib/bildirim', () => ({
  bildirimleriBaslat: jest.fn().mockResolvedValue(undefined),
  bildirimeDokunmaDinle: jest.fn(() => () => {}),
}))

describe('YonlendirmeKontrolu (kok layout yonlendirme mantigi)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('oturum yokken ve (auth) grubunda degilken /giris yonlendirir', async () => {
    ;(useOturum as jest.Mock).mockReturnValue({
      oturum: null,
      profilVarMi: null,
      yukleniyor: false,
    })
    mockSegments = ['bazi-ekran']

    await render(<KokLayout />)

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/giris')
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
})
