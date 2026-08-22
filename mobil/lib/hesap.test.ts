import { hesapDurumunuGetir, hesabiDondur, hesabiGeriAc } from './hesap'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}))

const sahteSupabase = supabase as unknown as {
  from: jest.Mock
  rpc: jest.Mock
  auth: { getUser: jest.Mock }
}

function zinciriKur(sonuc: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(sonuc)
  const eq = jest.fn(() => ({ maybeSingle }))
  const select = jest.fn(() => ({ eq }))
  sahteSupabase.from.mockReturnValue({ select })
  return { select, eq, maybeSingle }
}

beforeEach(() => {
  jest.clearAllMocks()
  sahteSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'kullanici-1' } },
    error: null,
  })
})

describe('hesapDurumunuGetir', () => {
  it('satir yoksa null doner', async () => {
    zinciriKur({ data: null, error: null })
    await expect(hesapDurumunuGetir()).resolves.toBeNull()
  })

  it('satir varsa alanlari cevirir', async () => {
    zinciriKur({
      data: {
        durum: 'askida',
        aski_bitisi: '2026-09-01T00:00:00Z',
        gerekce: 'taciz',
      },
      error: null,
    })
    await expect(hesapDurumunuGetir()).resolves.toEqual({
      durum: 'askida',
      askiBitisi: '2026-09-01T00:00:00Z',
      gerekce: 'taciz',
    })
  })

  it('hata gelirse firlatir', async () => {
    zinciriKur({ data: null, error: { message: 'kopuk' } })
    await expect(hesapDurumunuGetir()).rejects.toThrow('kopuk')
  })

  it('oturum yoksa firlatir (hesap sorunsuz ile karistirilmamali)', async () => {
    sahteSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(hesapDurumunuGetir()).rejects.toThrow('Oturum bulunamadi')
  })
})

describe('hesabiDondur', () => {
  it('RPC cagirir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: null })
    await hesabiDondur('mola')
    expect(sahteSupabase.rpc).toHaveBeenCalledWith('hesabimi_dondur', {
      p_gerekce: 'mola',
    })
  })

  it('hata gelirse firlatir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: { message: 'olmadi' } })
    await expect(hesabiDondur()).rejects.toThrow('olmadi')
  })

  it('gerekce verilmezse RPC-ye null gonderir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: null })
    await hesabiDondur()
    expect(sahteSupabase.rpc).toHaveBeenCalledWith('hesabimi_dondur', {
      p_gerekce: null,
    })
  })
})

describe('hesabiGeriAc', () => {
  it('RPC sonucunu doner', async () => {
    sahteSupabase.rpc.mockResolvedValue({ data: true, error: null })
    await expect(hesabiGeriAc()).resolves.toBe(true)
  })

  it('hata gelirse sessizce false doner', async () => {
    // Bu cagri her oturum acilisinda yapiliyor; ag hatasi girisi
    // engellememeli.
    sahteSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'ag' } })
    await expect(hesabiGeriAc()).resolves.toBe(false)
  })

  it('hata yokken data false ise false doner (gercekten geri acilmadi)', async () => {
    sahteSupabase.rpc.mockResolvedValue({ data: false, error: null })
    await expect(hesabiGeriAc()).resolves.toBe(false)
  })
})
