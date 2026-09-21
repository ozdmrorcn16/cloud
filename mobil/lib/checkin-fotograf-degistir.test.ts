import { checkInFotografiniDegistir } from './checkin-fotograf-degistir'
import { supabase } from './supabase'
import { checkinFotografYukle } from './checkin-fotograf-yukle'
import { checkInFotografiUrl } from './fotograf-url'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}))
jest.mock('./checkin-fotograf-yukle', () => ({ checkinFotografYukle: jest.fn() }))
jest.mock('./fotograf-url', () => ({ checkInFotografiUrl: jest.fn() }))

const remove = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'kullanici-1' } } })
  ;(supabase.storage.from as jest.Mock).mockReturnValue({ remove })
  remove.mockResolvedValue({ data: [], error: null })
  ;(checkinFotografYukle as jest.Mock).mockResolvedValue('kullanici-1/999.jpg')
  ;(checkInFotografiUrl as jest.Mock).mockResolvedValue('https://imzali/999.jpg')
})

describe('checkInFotografiniDegistir', () => {
  it('yeni fotografi yukler, RPC ile yolu yazar, eski dosyayi siler, imzali adresi dondurur', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'kullanici-1/111.jpg', error: null })

    const url = await checkInFotografiniDegistir('checkin-1', 'file:///yeni.jpg')

    expect(checkinFotografYukle).toHaveBeenCalledWith('kullanici-1', 'file:///yeni.jpg')
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_fotografini_guncelle', {
      p_check_in_id: 'checkin-1',
      p_fotograf: 'kullanici-1/999.jpg',
    })
    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(remove).toHaveBeenCalledWith(['kullanici-1/111.jpg'])
    expect(url).toBe('https://imzali/999.jpg')
  })

  it('KALDIR: yukleme yok, RPC null ile cagrilir, eski dosya silinir, null doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'kullanici-1/111.jpg', error: null })

    const url = await checkInFotografiniDegistir('checkin-1', null)

    expect(checkinFotografYukle).not.toHaveBeenCalled()
    expect(supabase.rpc).toHaveBeenCalledWith('check_in_fotografini_guncelle', {
      p_check_in_id: 'checkin-1',
      p_fotograf: null,
    })
    expect(remove).toHaveBeenCalledWith(['kullanici-1/111.jpg'])
    expect(url).toBeNull()
  })

  it('eski fotograf yoksa (RPC null dondurur) silme cagrisi yapilmaz', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    await checkInFotografiniDegistir('checkin-1', 'file:///yeni.jpg')

    expect(remove).not.toHaveBeenCalled()
  })

  it('RPC reddederse yeni yuklenen dosya geri silinir ve hata firlatilir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Bu paylasim bulunamadi' } })

    await expect(checkInFotografiniDegistir('checkin-1', 'file:///yeni.jpg')).rejects.toThrow()

    // Yetim dosya birakilmiyor.
    expect(remove).toHaveBeenCalledWith(['kullanici-1/999.jpg'])
  })

  it('eski dosyanin silinmesi basarisiz olsa da islem basarili sayilir (satir zaten guncel)', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'kullanici-1/111.jpg', error: null })
    remove.mockRejectedValueOnce(new Error('ag'))

    await expect(checkInFotografiniDegistir('checkin-1', null)).resolves.toBeNull()
  })
})
