import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnaEkran from '../../src/app/index'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn().mockResolvedValue({ error: null }) } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

describe('AnaEkran', () => {
  beforeEach(() => {
    mockRouterPush.mockClear()
  })

  it('cikis yap butonuna basinca signOut cagirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Cikis yap'))
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('mekanlara git butonuna basinca /mekanlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Mekanlari kesfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('anilarim butonuna basinca /profil/anilar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Anilarim'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/anilar')
  })

  it('ayarlar butonuna basinca /profil/ayarlar rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Gizlilik ayarlari'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  it('kisi ara butonuna basinca /kisiler rotasina yonlendirir', async () => {
    await render(<AnaEkran />)
    await fireEvent.press(screen.getByText('Kisi ara'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kisiler')
  })
})
