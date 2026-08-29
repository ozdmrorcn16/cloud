import { baskasininProfiliniGetir, kendiProfilimiGetir, profilFotografiniKaldir } from './profil'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('baskasininProfiliniGetir', () => {
  it('profil bulunursa alanlarini doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ id: 'kullanici-2', kullanici_adi: 'ada123', ad: 'Ada', biyografi: 'merhaba', fotograflar: ['a.jpg'] }],
      error: null,
    })

    const sonuc = await baskasininProfiliniGetir('kullanici-2')

    expect(supabase.rpc).toHaveBeenCalledWith('baskasinin_profili', {
      p_kullanici_id: 'kullanici-2',
    })
    expect(sonuc).toEqual({
      id: 'kullanici-2',
      kullaniciAdi: 'ada123',
      ad: 'Ada',
      biyografi: 'merhaba',
      fotograflar: ['a.jpg'],
    })
  })

  it('bos sonuc gelirse null doner (yok ya da engellenmis)', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })
    expect(await baskasininProfiliniGetir('kullanici-3')).toBeNull()
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kimlik dogrulamasi gerekli' },
    })
    await expect(baskasininProfiliniGetir('kullanici-2')).rejects.toThrow(
      'giriş yapmış olman gerekiyor'
    )
  })
})

describe('kendiProfilimiGetir', () => {
  function oturumuKur(kullaniciId: string | null) {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: kullaniciId ? { id: kullaniciId } : null },
    })
  }

  function satiriKur(satir: unknown, hata: { message: string } | null = null) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: satir, error: hata })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })
    return { eq }
  }

  it('kendi satirini profiller tablosundan okur', async () => {
    oturumuKur('kullanici-1')
    const { eq } = satiriKur({
      id: 'kullanici-1',
      kullanici_adi: 'orcun',
      ad: 'Orcun',
      biyografi: 'merhaba',
      fotograflar: ['a.jpg'],
    })

    const sonuc = await kendiProfilimiGetir()

    expect(supabase.from).toHaveBeenCalledWith('profiller')
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
    expect(sonuc).toEqual({
      id: 'kullanici-1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun',
      biyografi: 'merhaba',
      fotograflar: ['a.jpg'],
    })
  })

  it('profil satiri yoksa null doner', async () => {
    oturumuKur('kullanici-1')
    satiriKur(null)
    expect(await kendiProfilimiGetir()).toBeNull()
  })

  it('oturum yoksa hata firlatir', async () => {
    oturumuKur(null)
    await expect(kendiProfilimiGetir()).rejects.toThrow('Oturum bulunamadı')
  })
})

describe('profilFotografiniKaldir', () => {
  it('profil satirini bosaltir, sonra klasordeki her dosyayi siler', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'kullanici-1' } } })
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn(() => ({ eq }))
    ;(supabase.from as jest.Mock).mockReturnValue({ update })
    const list = jest.fn().mockResolvedValue({ data: [{ name: '1.jpg' }, { name: '2.jpg' }], error: null })
    const remove = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ list, remove })

    await profilFotografiniKaldir()

    expect(update).toHaveBeenCalledWith({ fotograflar: [] })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
    expect(list).toHaveBeenCalledWith('kullanici-1')
    expect(remove).toHaveBeenCalledWith(['kullanici-1/1.jpg', 'kullanici-1/2.jpg'])
  })

  it('satir guncellenemezse hata firlatir ve dosyaya dokunmaz', async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'kullanici-1' } } })
    const eq = jest.fn().mockResolvedValue({ error: { message: 'izin yok' } })
    ;(supabase.from as jest.Mock).mockReturnValue({ update: jest.fn(() => ({ eq })) })
    const list = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ list, remove: jest.fn() })

    await expect(profilFotografiniKaldir()).rejects.toThrow()
    expect(list).not.toHaveBeenCalled()
  })
})
