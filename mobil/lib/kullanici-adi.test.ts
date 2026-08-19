import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

const mockRpc = supabase.rpc as jest.Mock

import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiniNormallestir,
  kullaniciAdiGecerliMi,
  kullaniciAdiMusaitMi,
  kullaniciAdiniDegistir,
} from './kullanici-adi'

describe('kullaniciAdiniNormallestir', () => {
  it('bastaki ve sondaki bosluklari atar', () => {
    expect(kullaniciAdiniNormallestir('  orcun  ')).toBe('orcun')
  })

  it('buyuk harfleri kucultur', () => {
    expect(kullaniciAdiniNormallestir('Orcun.Ozdemir')).toBe('orcun.ozdemir')
  })
})

describe('kullaniciAdiGecerliMi', () => {
  it('kucuk harf, rakam, nokta ve alt cizgiyi kabul eder', () => {
    expect(kullaniciAdiGecerliMi('orcun.ozdemir_16')).toBe(true)
  })

  it('3 karakterden kisayi reddeder', () => {
    expect(kullaniciAdiGecerliMi('or')).toBe(false)
  })

  it('20 karakterden uzunu reddeder', () => {
    expect(kullaniciAdiGecerliMi('a'.repeat(21))).toBe(false)
  })

  it('tam 3 karakterlik adi kabul eder', () => {
    expect(kullaniciAdiGecerliMi('abc')).toBe(true)
  })

  it('tam 20 karakterlik adi kabul eder', () => {
    expect(kullaniciAdiGecerliMi('a'.repeat(20))).toBe(true)
  })

  it('buyuk harfi reddeder', () => {
    expect(kullaniciAdiGecerliMi('Orcun')).toBe(false)
  })

  it('bosluk ve tire gibi karakterleri reddeder', () => {
    expect(kullaniciAdiGecerliMi('orcun ozdemir')).toBe(false)
    expect(kullaniciAdiGecerliMi('orcun-ozdemir')).toBe(false)
  })

  it('kural metni kullaniciya kurali aciklar', () => {
    expect(KULLANICI_ADI_KURALI).toContain('3-20')
  })
})

describe('kullaniciAdiMusaitMi', () => {
  beforeEach(() => mockRpc.mockReset())

  it('RPC true donerse true doner', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    await expect(kullaniciAdiMusaitMi('orcun')).resolves.toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_musait_mi', { p_ad: 'orcun' })
  })

  it('adi normallestirerek gonderir', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    await kullaniciAdiMusaitMi('  Orcun  ')
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_musait_mi', { p_ad: 'orcun' })
  })

  it('RPC hata dondururse hatayi firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })
    await expect(kullaniciAdiMusaitMi('orcun')).rejects.toThrow('Kimlik dogrulamasi gerekli')
  })
})

describe('kullaniciAdiniDegistir', () => {
  beforeEach(() => mockRpc.mockReset())

  it("normallestirilmis adi RPC'ye gonderir", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    await kullaniciAdiniDegistir(' Orcun.Ozdemir ')
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_degistir', {
      p_yeni_ad: 'orcun.ozdemir',
    })
  })

  it('sunucudan gelen 30 gun mesajini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: 12 gun' },
    })
    await expect(kullaniciAdiniDegistir('yeniad')).rejects.toThrow('Kalan sure: 12 gun')
  })

  it('ham kisit ihlali (23505) yerine anlasilir mesaj firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "profiller_kullanici_adi_benzersiz"',
      },
    })
    await expect(kullaniciAdiniDegistir('yeniad')).rejects.toThrow(
      'Bu kullanici adi alinmis, baska bir tane dene.'
    )
  })

  it('ham check kisiti ihlali (23514) yerine kural metnini firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: {
        code: '23514',
        message: 'new row for relation "profiller" violates check constraint "profiller_kullanici_adi_bicim"',
      },
    })
    await expect(kullaniciAdiniDegistir('yeniad')).rejects.toThrow(KULLANICI_ADI_KURALI)
  })
})
