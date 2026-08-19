import { supabase } from './supabase'
import {
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  takipciyiCikar,
  sohbetIstegiGonder,
  sohbetIsteginiYanitla,
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

// bagDurumunuGetir'in .from(...).select(...).eq(...).eq(...).maybeSingle()
// zincirini taklit eden yardimci. Fix round 1'de eklenen testler bunu
// paylasiyor, boylece her testte ayni zinciri elle kurmak gerekmiyor.
function zincirOlustur(maybeSingle: jest.Mock) {
  return {
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
  }
}

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

  it('kabul: true kolunu dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIsteginiYanitla('kisi-1', true)
    expect(mockRpc).toHaveBeenCalledWith('takip_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: true,
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

describe('takipciyiCikar', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipciyiCikar('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('takipciyi_cikar', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Yetkisiz islem' } })
    await expect(takipciyiCikar('kisi-1')).rejects.toThrow('Yetkisiz islem')
  })
})

describe('sohbetIstegiGonder', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIstegiGonder('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegi_gonder', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Istegin zaten gonderilmis' } })
    await expect(sohbetIstegiGonder('kisi-1')).rejects.toThrow('Istegin zaten gonderilmis')
  })
})

describe('sohbetIsteginiYanitla', () => {
  it('kabul: false kolunu dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIsteginiYanitla('kisi-1', false)
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: false,
    })
  })

  it('kabul: true kolunu dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIsteginiYanitla('kisi-1', true)
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: true,
    })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Yanitlanacak istek bulunamadi' } })
    await expect(sohbetIsteginiYanitla('kisi-1', true)).rejects.toThrow(
      'Yanitlanacak istek bulunamadi'
    )
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

  it("'beklemede' durumunu iki tablo icin de dogru okur", async () => {
    const takipMaybe = jest.fn().mockResolvedValue({ data: { durum: 'beklemede' }, error: null })
    const sohbetMaybe = jest.fn().mockResolvedValue({ data: { durum: 'beklemede' }, error: null })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(takipMaybe))
      .mockReturnValueOnce(zincirOlustur(sohbetMaybe))

    await expect(bagDurumunuGetir('kisi-1')).resolves.toEqual({
      takip: 'beklemede',
      sohbet: 'beklemede',
    })
  })

  it('takip sorgusu hata dondurunce firlatir', async () => {
    const takipMaybe = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'takipler sorgu hatasi' } })
    ;(supabase.from as jest.Mock).mockReturnValueOnce(zincirOlustur(takipMaybe))

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('takipler sorgu hatasi')
  })

  it('sohbet sorgusu hata dondurunce firlatir', async () => {
    const takipMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    const sohbetMaybe = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'sohbet_istekleri sorgu hatasi' } })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(takipMaybe))
      .mockReturnValueOnce(zincirOlustur(sohbetMaybe))

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('sohbet_istekleri sorgu hatasi')
  })

  it("oturum yoksa 'Oturum bulunamadi' firlatir", async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } })

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('Oturum bulunamadi')
  })
})
