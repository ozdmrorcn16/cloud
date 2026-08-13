import { render, screen, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'
import { OturumSaglayici, useOturum } from './oturum'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(),
  },
}))

function TestBileseni() {
  const { oturum, profilVarMi, yukleniyor } = useOturum()
  if (yukleniyor) return <Text>yukleniyor</Text>
  if (!oturum) return <Text>oturum-yok</Text>
  return <Text>{profilVarMi ? 'profil-var' : 'profil-yok'}</Text>
}

describe('OturumSaglayici', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('oturum varsa profilin var olup olmadigini kontrol eder', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'kullanici-1' } } },
    })
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'kullanici-1' } }),
        }),
      }),
    })
    await render(
      <OturumSaglayici>
        <TestBileseni />
      </OturumSaglayici>
    )
    await waitFor(() => {
      expect(screen.getByText('profil-var')).toBeTruthy()
    })
  })

  it('oturum yoksa profil sorgusu yapmaz', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } })
    await render(
      <OturumSaglayici>
        <TestBileseni />
      </OturumSaglayici>
    )
    await waitFor(() => {
      expect(screen.getByText('oturum-yok')).toBeTruthy()
    })
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
