import { akisiGetir } from './akis'
import { supabase } from './supabase'
import { takipcilerimiGetir } from './bag-listeleri'
import { checkInFotografiUrlHaritasi } from './fotograf-url'

jest.mock('./supabase', () => ({
  supabase: { from: jest.fn(), auth: { getUser: jest.fn() } },
}))
jest.mock('./bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
jest.mock('./fotograf-url', () => ({ checkInFotografiUrlHaritasi: jest.fn().mockResolvedValue({}) }))
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
    fotograflar: [],
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
  ;(checkInFotografiUrlHaritasi as jest.Mock).mockResolvedValue({})
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
      ifade: null,
      fotograflar: [],
      fotografUrller: [],
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

  it('COKLU FOTOGRAF (2026-09-21): butun satirlarin yollari TEK imza cagrisiyla, sira korunur, imzalanamayan atlanir', async () => {
    ;(checkInFotografiUrlHaritasi as jest.Mock).mockResolvedValue({
      'kullanici-2/1.jpg': 'https://imzali/1.jpg',
      'kullanici-2/3.jpg': 'https://imzali/3.jpg',
      'kullanici-3/9.jpg': 'https://imzali/9.jpg',
    })
    zinciriKur([
      satir({ fotograflar: ['kullanici-2/1.jpg', 'kullanici-2/2.jpg', 'kullanici-2/3.jpg'] }),
      satir({ id: 'checkin-2', kullanici_id: 'kullanici-3', fotograflar: ['kullanici-3/9.jpg'] }),
    ])

    const ogeler = await akisiGetir()

    expect(checkInFotografiUrlHaritasi).toHaveBeenCalledTimes(1)
    expect(checkInFotografiUrlHaritasi).toHaveBeenCalledWith([
      'kullanici-2/1.jpg', 'kullanici-2/2.jpg', 'kullanici-2/3.jpg', 'kullanici-3/9.jpg',
    ])
    expect(ogeler[0].fotograflar).toEqual(['kullanici-2/1.jpg', 'kullanici-2/2.jpg', 'kullanici-2/3.jpg'])
    expect(ogeler[0].fotografUrller).toEqual(['https://imzali/1.jpg', 'https://imzali/3.jpg'])
    expect(ogeler[1].fotografUrller).toEqual(['https://imzali/9.jpg'])
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

/**
 * SAYFALAMA.
 *
 * Imlec OFFSET degil ZAMAN. Sebep olculebilir bir hata: `range` ile
 * sayfalarken iki sayfa arasinda yeni bir check-in eklenirse pencere
 * bir satir kayar; ayni kayit iki kez gelir ya da bir kayit hic
 * gelmez. Zaman imleci sabit bir noktadan geriye bakiyor.
 */
describe('akisiGetir sayfalama', () => {
  function imlecliZincir(satirlar: unknown[]) {
    const limit = jest.fn().mockResolvedValue({ data: satirlar, error: null })
    const order = jest.fn().mockReturnValue({ limit })
    const lt = jest.fn().mockReturnValue({ order })
    const inFn = jest.fn().mockReturnValue({ order, lt })
    const select = jest.fn().mockReturnValue({ in: inFn })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })
    return { lt, limit }
  }

  it('imlec verilince yalnizca ondan ESKI kayitlari ister', async () => {
    const { lt, limit } = imlecliZincir([])

    await akisiGetir(30, '2026-09-05T10:00:00Z')

    expect(lt).toHaveBeenCalledWith('olusturma_zamani', '2026-09-05T10:00:00Z')
    expect(limit).toHaveBeenCalledWith(30)
  })

  it('imlec yokken zaman suzgeci UYGULANMIYOR (ilk sayfa)', async () => {
    const { lt } = imlecliZincir([])

    await akisiGetir(30)

    expect(lt).not.toHaveBeenCalled()
  })
})
