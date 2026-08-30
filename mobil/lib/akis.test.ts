import { akisiGetir } from './akis'
import { supabase } from './supabase'
import { takipcilerimiGetir } from './bag-listeleri'
import { checkInFotografiUrl } from './fotograf-url'

jest.mock('./supabase', () => ({
  supabase: { from: jest.fn(), auth: { getUser: jest.fn() } },
}))
jest.mock('./bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
jest.mock('./fotograf-url', () => ({ checkInFotografiUrl: jest.fn() }))
// Etiketler ayri bir sorgudan geliyor; akisin kendi donusumunu test
// ederken o sorgu mock'lanıyor.
jest.mock('./etiket', () => ({ etiketleriGetir: jest.fn().mockResolvedValue({}) }))

function satir(ustune: Record<string, unknown> = {}) {
  return {
    id: 'checkin-1',
    kullanici_id: 'kullanici-2',
    kullanici_adi: 'Ada',
    mekan_id: 'mekan-1',
    not_metni: 'guzel bir aksam',
    fotograf: null,
    olusturma_zamani: '2026-08-25T10:00:00Z',
    konum: null,
    mekanlar: { ad: 'Sahil Kafe', semt: 'Nilüfer' },
    ...ustune,
  }
}

function zinciriKur(satirlar: unknown[]) {
  const limit = jest.fn().mockResolvedValue({ data: satirlar, error: null })
  const order = jest.fn().mockReturnValue({ limit })
  const inFn = jest.fn().mockReturnValue({ order })
  const select = jest.fn().mockReturnValue({ in: inFn })
  ;(supabase.from as jest.Mock).mockReturnValue({ select })
  return { inFn, order, limit }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: 'kullanici-1' } },
  })
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(checkInFotografiUrl as jest.Mock).mockResolvedValue(null)
})

describe('akisiGetir', () => {
  it('kendi kimligini ve baglarin kimliklerini birlikte sorar', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'kullanici-2', kullaniciAdi: 'ada', ad: 'Ada' },
      { id: 'kullanici-3', kullaniciAdi: 'berk', ad: 'Berk' },
    ])
    const { inFn } = zinciriKur([])

    await akisiGetir()

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(inFn).toHaveBeenCalledWith('kullanici_id', [
      'kullanici-1',
      'kullanici-2',
      'kullanici-3',
    ])
  })

  it('en yeniden eskiye siralar ve adet sinirini gecirir', async () => {
    const { order, limit } = zinciriKur([])

    await akisiGetir(12)

    expect(order).toHaveBeenCalledWith('olusturma_zamani', { ascending: false })
    expect(limit).toHaveBeenCalledWith(12)
  })

  it('satiri akis ogesine cevirir', async () => {
    zinciriKur([satir()])

    const [oge] = await akisiGetir()

    expect(oge).toEqual({
      id: 'checkin-1',
      kullaniciId: 'kullanici-2',
      kullaniciAdi: 'Ada',
      mekanId: 'mekan-1',
      mekanAdi: 'Sahil Kafe',
      mekanSemti: 'Nilüfer',
      avatarUrl: null,
      rumuz: null,
      notMetni: 'guzel bir aksam',
      fotografUrl: null,
      olusturmaZamani: '2026-08-25T10:00:00Z',
      canliMi: false,
      benimMi: false,
      etiketler: [],
    })
  })

  it('konum doluysa oge canli sayilir', async () => {
    zinciriKur([satir({ konum: 'POINT(28.979 41.015)' })])
    const [oge] = await akisiGetir()
    expect(oge.canliMi).toBe(true)
  })

  it('kendi satirini benimMi ile isaretler', async () => {
    zinciriKur([satir({ kullanici_id: 'kullanici-1' })])
    const [oge] = await akisiGetir()
    expect(oge.benimMi).toBe(true)
  })

  it('fotografli satirin adresini imzalar', async () => {
    ;(checkInFotografiUrl as jest.Mock).mockResolvedValue('https://imzali/foto.jpg')
    zinciriKur([satir({ fotograf: 'kullanici-2/1.jpg' })])

    const [oge] = await akisiGetir()

    expect(checkInFotografiUrl).toHaveBeenCalledWith('kullanici-2/1.jpg')
    expect(oge.fotografUrl).toBe('https://imzali/foto.jpg')
  })

  it('mekan satiri okunamazsa oge adsiz da olsa listede kalir', async () => {
    zinciriKur([satir({ mekanlar: null })])
    const [oge] = await akisiGetir()
    expect(oge.mekanAdi).toBe('')
  })

  it('sunucu hatasini firlatir', async () => {
    const limit = jest.fn().mockResolvedValue({ data: null, error: { message: 'yetkisiz' } })
    const order = jest.fn().mockReturnValue({ limit })
    const inFn = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ in: inFn })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    await expect(akisiGetir()).rejects.toThrow('yetkisiz')
  })

  it('oturum yoksa hata firlatir', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } })
    await expect(akisiGetir()).rejects.toThrow('Oturum bulunamadı')
  })
})
