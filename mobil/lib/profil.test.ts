import { baskasininProfiliniGetir } from './profil'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('baskasininProfiliniGetir', () => {
  it('profil bulunursa alanlarini doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ id: 'kullanici-2', ad: 'Ada', biyografi: 'merhaba', fotograflar: ['a.jpg'] }],
      error: null,
    })

    const sonuc = await baskasininProfiliniGetir('kullanici-2')

    expect(supabase.rpc).toHaveBeenCalledWith('baskasinin_profili', {
      p_kullanici_id: 'kullanici-2',
    })
    expect(sonuc).toEqual({
      id: 'kullanici-2',
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
      'Kimlik dogrulamasi gerekli'
    )
  })
})
