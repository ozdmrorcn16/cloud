import {
  engelle,
  engeliKaldir,
  engellediklerimiGetir,
  engellediklerimiListele,
} from './engelleme'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('engelle', () => {
  it('kullanici id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await engelle('kullanici-2')
    expect(supabase.rpc).toHaveBeenCalledWith('engelle', { p_kullanici_id: 'kullanici-2' })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kendini engelleyemezsin' },
    })
    await expect(engelle('kendim')).rejects.toThrow('Kendini engelleyemezsin')
  })
})

describe('engeliKaldir', () => {
  it('kullanici id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await engeliKaldir('kullanici-2')
    expect(supabase.rpc).toHaveBeenCalledWith('engeli_kaldir', { p_kullanici_id: 'kullanici-2' })
  })
})

describe('engellediklerimiGetir', () => {
  it('engellenen kullanici id lerini doner', async () => {
    const select = jest.fn().mockResolvedValue({
      data: [{ engellenen_id: 'kullanici-2' }, { engellenen_id: 'kullanici-3' }],
      error: null,
    })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    const sonuc = await engellediklerimiGetir()

    expect(supabase.from).toHaveBeenCalledWith('engellemeler')
    expect(sonuc).toEqual(['kullanici-2', 'kullanici-3'])
  })
})

describe('engellediklerimiListele', () => {
  it('rpc sonucunu istemci bicimine cevirir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { id: 'k2', kullanici_adi: 'ada123', ad: 'Ada', engellendi: '2026-08-20T10:00:00Z' },
      ],
      error: null,
    })

    const sonuc = await engellediklerimiListele()

    expect(supabase.rpc).toHaveBeenCalledWith('engellediklerim')
    expect(sonuc).toEqual([
      { id: 'k2', kullaniciAdi: 'ada123', ad: 'Ada', engellendi: '2026-08-20T10:00:00Z' },
    ])
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kimlik dogrulamasi gerekli' },
    })
    await expect(engellediklerimiListele()).rejects.toThrow('giriş yapmış olman gerekiyor')
  })
})
