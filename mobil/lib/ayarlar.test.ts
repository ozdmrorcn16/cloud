import {
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
  kullaniciAdiDurumunuGetir,
} from './ayarlar'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
    from: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('varsayilanBulunurluguGetir', () => {
  it('profilden varsayilan_bulunurluk degerini okur', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { varsayilan_bulunurluk: 'gizli' }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await varsayilanBulunurluguGetir()).toBe('gizli')
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })
})

describe('varsayilanBulunurluguAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await varsayilanBulunurluguAyarla('gizli')

    expect(update).toHaveBeenCalledWith({ varsayilan_bulunurluk: 'gizli' })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})

describe('aniGorunurlugunuAyarla', () => {
  it('kullanicinin butun check-in satirlarini gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aniGorunurlugunuAyarla('kimse')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(update).toHaveBeenCalledWith({ gorunurluk: 'kimse' })
    expect(eq).toHaveBeenCalledWith('kullanici_id', 'kullanici-1')
  })
})

describe('aramadaGorunsunGetir', () => {
  it('profilden aramada_gorunsun degerini okur', async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { aramada_gorunsun: false }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })

  it('satir yoksa varsayilan olarak gorunur kabul eder', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(true)
  })
})

describe('aramadaGorunsunAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aramadaGorunsunAyarla(false)

    expect(update).toHaveBeenCalledWith({ aramada_gorunsun: false })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})

describe('kullaniciAdiDurumunuGetir', () => {
  it('hic degistirilmemis adin gelecek degisim tarihi null doner', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { kullanici_adi: 'orcun', kullanici_adi_degistirildi: null },
      error: null,
    })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    const durum = await kullaniciAdiDurumunuGetir()

    expect(durum.kullaniciAdi).toBe('orcun')
    expect(durum.sonrakiDegisimTarihi).toBeNull()
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })

  it('degistirilmis adin sonraki degisim tarihini 30 gun sonrasina hesaplar', async () => {
    const degisimTarihi = '2026-08-01T00:00:00.000Z'
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { kullanici_adi: 'orcun', kullanici_adi_degistirildi: degisimTarihi },
      error: null,
    })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    const durum = await kullaniciAdiDurumunuGetir()

    expect(durum.sonrakiDegisimTarihi).toEqual(
      new Date(new Date(degisimTarihi).getTime() + 30 * 24 * 60 * 60 * 1000)
    )
  })

  it('hata donerse firlatir', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Sunucuya ulasilamadi' } })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    await expect(kullaniciAdiDurumunuGetir()).rejects.toThrow('Sunucuya ulasilamadi')
  })
})
