import { supabase } from './supabase'
import {
  gelenIstekleriGetir,
  gidenIstekleriGetir,
  takipcilerimiGetir,
} from './bag-listeleri'
import { avatarlariGetir, profilOzetleriniGetir } from './akis'

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'ben' } } }), getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'ben' } } } }) },
  },
}))

// KISILER TEK TURDA (2026-09-22): ad, kullanici adi ve avatar artik
// `profilOzetleriniGetir` (akis_profilleri) ile birlikte geliyor;
// onceki `bag_kisileri` + ayri avatar cagrisi kalkti. Ikisinin AYNI
// kumeyi verdigi canlida olculdu (yasakli/askida/dondurulmus/iki yonlu
// engelleme).
jest.mock('./akis', () => ({
  avatarlariGetir: jest.fn().mockResolvedValue({}),
  profilOzetleriniGetir: jest.fn(),
}))

const mockRpc = supabase.rpc as jest.Mock

function tabloDondur(satirlar: unknown[]) {
  const eq2 = jest.fn().mockResolvedValue({ data: satirlar, error: null })
  return { select: () => ({ eq: () => ({ eq: eq2 }) }) }
}

/** `profilOzetleriniGetir` sonucunu kimlik -> ozet haritasina cevirir. */
function ozetDondur(satirlar: { id: string; rumuz: string; ad: string }[]) {
  ;(profilOzetleriniGetir as jest.Mock).mockResolvedValue(
    Object.fromEntries(satirlar.map((s) => [s.id, { rumuz: s.rumuz, ad: s.ad, avatarUrl: null }]))
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(profilOzetleriniGetir as jest.Mock).mockResolvedValue({})
})

describe('gelenIstekleriGetir', () => {
  it('kimlikleri okuyup adlari RPC ile cozer', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k1' }]))
      .mockReturnValueOnce(tabloDondur([]))
    ozetDondur([{ id: 'k1', rumuz: 'orcun', ad: 'Orcun O' }])

    await expect(gelenIstekleriGetir()).resolves.toEqual({
      takip: [{ id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun O', avatarUrl: null }],
      sohbet: [],
    })
    // TEK cagri: takip + sohbet kimlikleri birlikte cozuluyor.
    expect(profilOzetleriniGetir).toHaveBeenCalledTimes(1)
    expect(profilOzetleriniGetir).toHaveBeenCalledWith(['k1'], { hatayiFirlat: true })
  })

  it('hic kimlik yoksa RPC-ye hic gitmez', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([]))
      .mockReturnValueOnce(tabloDondur([]))

    await expect(gelenIstekleriGetir()).resolves.toEqual({ takip: [], sohbet: [] })
    expect(profilOzetleriniGetir).not.toHaveBeenCalled()
  })
})

describe('gidenIstekleriGetir', () => {
  it('kimlikleri okuyup adlari RPC ile cozer', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([{ takip_edilen_id: 'k4' }]))
      .mockReturnValueOnce(tabloDondur([]))
    ozetDondur([{ id: 'k4', rumuz: 'mert', ad: 'Mert D' }])

    await expect(gidenIstekleriGetir()).resolves.toEqual({
      takip: [{ id: 'k4', kullaniciAdi: 'mert', ad: 'Mert D', avatarUrl: null }],
      sohbet: [],
    })
    expect(profilOzetleriniGetir).toHaveBeenCalledWith(['k4'], { hatayiFirlat: true })
  })

  it('hic kimlik yoksa RPC-ye hic gitmez', async () => {
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(tabloDondur([]))
      .mockReturnValueOnce(tabloDondur([]))

    await expect(gidenIstekleriGetir()).resolves.toEqual({ takip: [], sohbet: [] })
    expect(profilOzetleriniGetir).not.toHaveBeenCalled()
  })
})

describe('takipcilerimiGetir', () => {
  it('kabul edilmis takipcileri doner', async () => {
    ;(supabase.from as jest.Mock).mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k2' }]))
    ozetDondur([{ id: 'k2', rumuz: 'ayse', ad: 'Ayse Y' }])

    await expect(takipcilerimiGetir()).resolves.toEqual([
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Y', avatarUrl: null },
    ])
  })

  it('RPC hatasini firlatir', async () => {
    ;(supabase.from as jest.Mock).mockReturnValueOnce(tabloDondur([{ takip_eden_id: 'k3' }]))
    // Bag listesi ozetin KENDISI: hata YUTULMAZ, yoksa bos liste
    // "kimsen yok" diye okunur (hatayiFirlat).
    ;(profilOzetleriniGetir as jest.Mock).mockRejectedValue(
      new Error('Bu islem icin giriş yapmış olman gerekiyor')
    )

    await expect(takipcilerimiGetir()).rejects.toThrow('giriş yapmış olman gerekiyor')
  })
})
