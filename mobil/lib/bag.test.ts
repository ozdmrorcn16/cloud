import { supabase } from './supabase'
import {
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  bagDurumunuGetir,
} from './bag'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'ben' } } }) },
  },
}))

const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('takipIstegiGonder', () => {
  it('RPC-yi dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIstegiGonder('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('takip_istegi_gonder', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Bugunluk istek sinirina ulastin' } })
    await expect(takipIstegiGonder('kisi-1')).rejects.toThrow('Bugunluk istek sinirina ulastin')
  })
})

describe('takipIsteginiYanitla', () => {
  it('kabul degerini gecirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIsteginiYanitla('kisi-1', false)
    expect(mockRpc).toHaveBeenCalledWith('takip_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: false,
    })
  })
})

describe('takibiBirak', () => {
  it('RPC-yi cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takibiBirak('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('takibi_birak', { p_kullanici_id: 'kisi-1' })
  })
})

describe('bagDurumunuGetir', () => {
  it('iki tablodan durumlari birlestirir', async () => {
    const takipMaybe = jest.fn().mockResolvedValue({ data: { durum: 'kabul' }, error: null })
    const sohbetMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    const zincir = (maybeSingle: jest.Mock) => ({
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
    })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincir(takipMaybe))
      .mockReturnValueOnce(zincir(sohbetMaybe))

    await expect(bagDurumunuGetir('kisi-1')).resolves.toEqual({
      takip: 'kabul',
      sohbet: 'yok',
    })
  })
})
