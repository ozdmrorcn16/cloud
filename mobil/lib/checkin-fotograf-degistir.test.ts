import { checkInFotograflariniDegistir } from './checkin-fotograf-degistir'
import { supabase } from './supabase'
import { checkinFotograflariniYukle } from './checkin-fotograf-yukle'
import { checkInFotografiUrlleri } from './fotograf-url'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn(), getSession: jest.fn() },
    storage: { from: jest.fn() },
  },
}))
jest.mock('./checkin-fotograf-yukle', () => ({ checkinFotograflariniYukle: jest.fn() }))
jest.mock('./fotograf-url', () => ({ checkInFotografiUrlleri: jest.fn() }))

const remove = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'kullanici-1' } } })
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'kullanici-1' } } } })
  ;(supabase.storage.from as jest.Mock).mockReturnValue({ remove })
  remove.mockResolvedValue({ data: [], error: null })
  // Gercek yukleyici gibi: yollari hem dondurur hem `kismi` listesine iter.
  ;(checkinFotograflariniYukle as jest.Mock).mockImplementation(async (_uid: string, uriler: string[], kismi?: string[]) => {
    const yollar = uriler.map((_u, i) => `kullanici-1/yeni-${i}.jpg`)
    yollar.forEach((y) => kismi?.push(y))
    return yollar
  })
  ;(checkInFotografiUrlleri as jest.Mock).mockImplementation(async (yollar: string[]) => yollar.map((y) => `https://imzali/${y}`))
})

describe('checkInFotograflariniDegistir (coklu fotograf, 2026-09-21)', () => {
  it('yeni dosyalari yukler, kalan + yeni diziyi RPC ile yazar, kaldirilanlari siler, yol + imzali adres dondurur', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: ['kullanici-1/eski-2.jpg'], error: null })

    const sonuc = await checkInFotograflariniDegistir('checkin-1', {
      kalanYollar: ['kullanici-1/eski-1.jpg'],
      yeniUriler: ['file:///a.jpg', 'file:///b.jpg'],
    })

    expect(checkinFotograflariniYukle).toHaveBeenCalledWith('kullanici-1', ['file:///a.jpg', 'file:///b.jpg'], expect.any(Array))
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_fotograflarini_guncelle', {
      p_check_in_id: 'checkin-1',
      p_fotograflar: ['kullanici-1/eski-1.jpg', 'kullanici-1/yeni-0.jpg', 'kullanici-1/yeni-1.jpg'],
    })
    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(remove).toHaveBeenCalledWith(['kullanici-1/eski-2.jpg'])
    expect(sonuc.yollar).toEqual(['kullanici-1/eski-1.jpg', 'kullanici-1/yeni-0.jpg', 'kullanici-1/yeni-1.jpg'])
    expect(sonuc.urller).toEqual([
      'https://imzali/kullanici-1/eski-1.jpg',
      'https://imzali/kullanici-1/yeni-0.jpg',
      'https://imzali/kullanici-1/yeni-1.jpg',
    ])
  })

  it('yalnizca kaldirma: yukleme yok, RPC kalanlarla cagrilir, kaldirilanlar silinir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: ['kullanici-1/eski-1.jpg', 'kullanici-1/eski-3.jpg'], error: null })

    const sonuc = await checkInFotograflariniDegistir('checkin-1', {
      kalanYollar: ['kullanici-1/eski-2.jpg'],
      yeniUriler: [],
    })

    expect(checkinFotograflariniYukle).not.toHaveBeenCalled()
    expect(supabase.auth.getUser).not.toHaveBeenCalled()
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_fotograflarini_guncelle', {
      p_check_in_id: 'checkin-1',
      p_fotograflar: ['kullanici-1/eski-2.jpg'],
    })
    expect(remove).toHaveBeenCalledWith(['kullanici-1/eski-1.jpg', 'kullanici-1/eski-3.jpg'])
    expect(sonuc.yollar).toEqual(['kullanici-1/eski-2.jpg'])
  })

  it('hepsi kaldirilinca bos dizi gider ve bos adres listesi doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: ['kullanici-1/eski-1.jpg'], error: null })
    const sonuc = await checkInFotograflariniDegistir('checkin-1', { kalanYollar: [], yeniUriler: [] })
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_fotograflarini_guncelle', { p_check_in_id: 'checkin-1', p_fotograflar: [] })
    expect(sonuc).toEqual({ yollar: [], urller: [] })
  })

  it('kaldirilan yoksa (RPC bos dizi) silme cagrisi yapilmaz', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })
    await checkInFotograflariniDegistir('checkin-1', { kalanYollar: ['kullanici-1/eski-1.jpg'], yeniUriler: ['file:///a.jpg'] })
    expect(remove).not.toHaveBeenCalled()
  })

  it('RPC reddederse yeni yuklenen dosyalar geri silinir ve hata firlatilir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'En fazla 5 fotograf eklenebilir' } })

    await expect(
      checkInFotograflariniDegistir('checkin-1', { kalanYollar: [], yeniUriler: ['file:///a.jpg', 'file:///b.jpg'] })
    ).rejects.toThrow()

    expect(remove).toHaveBeenCalledWith(['kullanici-1/yeni-0.jpg', 'kullanici-1/yeni-1.jpg'])
  })

  it('yukleme yarida kirilirsa o ana kadar yuklenenler geri silinir, RPC hic cagrilmaz', async () => {
    ;(checkinFotograflariniYukle as jest.Mock).mockImplementation(async (_uid: string, _uriler: string[], kismi?: string[]) => {
      kismi?.push('kullanici-1/yeni-0.jpg')
      throw new Error('ag koptu')
    })

    await expect(
      checkInFotograflariniDegistir('checkin-1', { kalanYollar: [], yeniUriler: ['file:///a.jpg', 'file:///b.jpg'] })
    ).rejects.toThrow('ag koptu')

    expect(remove).toHaveBeenCalledWith(['kullanici-1/yeni-0.jpg'])
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('kaldirilanlarin silinmesi basarisiz olsa da islem basarili sayilir (satir zaten guncel)', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: ['kullanici-1/eski-1.jpg'], error: null })
    remove.mockRejectedValueOnce(new Error('ag'))
    await expect(checkInFotograflariniDegistir('checkin-1', { kalanYollar: [], yeniUriler: [] })).resolves.toEqual({ yollar: [], urller: [] })
  })
})
