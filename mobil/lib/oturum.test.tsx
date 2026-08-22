import { render, screen, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'
import { OturumSaglayici, useOturum } from './oturum'
import { supabase } from './supabase'
import { hesapDurumunuGetir, hesabiGeriAc } from './hesap'

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(),
  },
}))

jest.mock('./hesap', () => ({
  hesapDurumunuGetir: jest.fn(),
  hesabiGeriAc: jest.fn(),
}))

function TestBileseni() {
  const { oturum, profilVarMi, yukleniyor } = useOturum()
  if (yukleniyor) return <Text>yukleniyor</Text>
  if (!oturum) return <Text>oturum-yok</Text>
  return <Text>{profilVarMi ? 'profil-var' : 'profil-yok'}</Text>
}

function ProfilDurumuBileseni() {
  const { profilVarMi, yukleniyor } = useOturum()
  if (yukleniyor) return <Text>yukleniyor</Text>
  return <Text>{profilVarMi === null ? 'belirsiz' : profilVarMi ? 'profil-var' : 'profil-yok'}</Text>
}

function HesapDurumuTuketicisi() {
  const { hesapDurumu, yukleniyor } = useOturum()
  if (yukleniyor) return <Text>yukleniyor</Text>
  return <Text>durum:{hesapDurumu?.durum ?? 'yok'}</Text>
}

// Mevcut testlerdeki kurulumu tekrarlayan yardimci: gecerli bir oturum ve
// profil sorgusu kurup HesapDurumuTuketicisi'ni render eder, yukleniyor
// durumu bitene kadar bekler. yukleniyor bittiginde hesapDurumu zaten
// kesinlesmis olur, cunku saglayicida setYukleniyor(false) hesapDurumu
// cozulduktan sonra cagriliyor.
async function oturumluSaglayiciyiRenderEt() {
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
  const sonuc = await render(
    <OturumSaglayici>
      <HesapDurumuTuketicisi />
    </OturumSaglayici>
  )
  await waitFor(() => {
    expect(sonuc.queryByText('yukleniyor')).toBeNull()
  })
  return sonuc
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

  it('profil sorgusu hata donerse profilVarMi belirsiz (null) kalir, false olmaz', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'kullanici-1' } } },
    })
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: 'network error' } }),
        }),
      }),
    })
    await render(
      <OturumSaglayici>
        <ProfilDurumuBileseni />
      </OturumSaglayici>
    )
    await waitFor(() => {
      expect(screen.getByText('belirsiz')).toBeTruthy()
    })
  })

  it('oturum acilinca once geri acma denenir', async () => {
    const sahteGeriAc = hesabiGeriAc as jest.Mock
    const sahteDurum = hesapDurumunuGetir as jest.Mock
    sahteGeriAc.mockResolvedValue(true)
    sahteDurum.mockResolvedValue(null)

    await oturumluSaglayiciyiRenderEt()

    expect(sahteGeriAc).toHaveBeenCalled()
  })

  it('dondurulmus hesap otomatik acildigi icin durum bos kalir', async () => {
    const sahteGeriAc = hesabiGeriAc as jest.Mock
    const sahteDurum = hesapDurumunuGetir as jest.Mock
    sahteGeriAc.mockResolvedValue(true)
    sahteDurum.mockResolvedValue(null)

    const { getByText } = await oturumluSaglayiciyiRenderEt()

    expect(getByText('durum:yok')).toBeTruthy()
  })

  it('askidaki hesabin durumu context uzerinden gorunur', async () => {
    const sahteGeriAc = hesabiGeriAc as jest.Mock
    const sahteDurum = hesapDurumunuGetir as jest.Mock
    sahteGeriAc.mockResolvedValue(false)
    sahteDurum.mockResolvedValue({
      durum: 'askida',
      askiBitisi: '2026-09-01T00:00:00Z',
      gerekce: 'taciz',
    })

    const { getByText } = await oturumluSaglayiciyiRenderEt()

    expect(getByText('durum:askida')).toBeTruthy()
  })
})
