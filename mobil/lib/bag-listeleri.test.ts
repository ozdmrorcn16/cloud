import { supabase } from './supabase'
import {
  gelenIstekleriGetir,
  gidenIstekleriGetir,
  takipcilerimiGetir,
} from './bag-listeleri'

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'ben' } } }) },
  },
}))

const mockRpc = supabase.rpc as jest.Mock

function tabloDondur(satirlar: unknown[]) {
  const eq2 = jest.fn().mockResolvedValue({ data: satirlar, error: null })
  return { select: () => ({ eq: () => ({ eq: eq2 }) }) }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('gelenIstekleriGetir', () => {
  it('kimlikleri okuyup adlari RPC ile cozer', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k1' }]))
      .mockReturnValueOnce(tabloDondur([]))
    mockRpc.mockResolvedValue({
      data: [{ id: 'k1', kullanici_adi: 'orcun', ad: 'Orcun O' }],
      error: null,
    })

    await expect(gelenIstekleriGetir()).resolves.toEqual({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O' }],
      sohbet: [],
    })
    expect(mockRpc).toHaveBeenCalledWith('bag_kisileri', { p_kimlikler: ['k1'] })
  })

  it('hic kimlik yoksa RPC-ye hic gitmez', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([]))
      .mockReturnValueOnce(tabloDondur([]))

    await expect(gelenIstekleriGetir()).resolves.toEqual({ takip: [], sohbet: [] })
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('gidenIstekleriGetir', () => {
  it('kimlikleri okuyup adlari RPC ile cozer', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([{ takip_edilen_id: 'k4' }]))
      .mockReturnValueOnce(tabloDondur([]))
    mockRpc.mockResolvedValue({
      data: [{ id: 'k4', kullanici_adi: 'mert', ad: 'Mert D' }],
      error: null,
    })

    await expect(gidenIstekleriGetir()).resolves.toEqual({
      takip: [{ id: 'k4', kullaniciAdi: 'mert', ad: 'Mert D' }],
      sohbet: [],
    })
    expect(mockRpc).toHaveBeenCalledWith('bag_kisileri', { p_kimlikler: ['k4'] })
  })

  it('hic kimlik yoksa RPC-ye hic gitmez', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([]))
      .mockReturnValueOnce(tabloDondur([]))

    await expect(gidenIstekleriGetir()).resolves.toEqual({ takip: [], sohbet: [] })
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('takipcilerimiGetir', () => {
  it('kabul edilmis takipcileri doner', async () => {
    ;(supabase.from as jest.Mock).mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k2' }]))
    mockRpc.mockResolvedValue({
      data: [{ id: 'k2', kullanici_adi: 'ayse', ad: 'Ayse Y' }],
      error: null,
    })

    await expect(takipcilerimiGetir()).resolves.toEqual([
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Y' },
    ])
  })

  it('RPC hatasini firlatir', async () => {
    ;(supabase.from as jest.Mock).mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k3' }]))
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })

    await expect(takipcilerimiGetir()).rejects.toThrow('giriş yapmış olman gerekiyor')
  })
})
