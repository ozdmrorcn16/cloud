import { sikayetGonder, SIKAYET_SEBEPLERI } from './sikayet'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sikayetGonder', () => {
  it('hedef ve sebebi rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    await sikayetGonder('kullanici', 'kullanici-2', 'taciz', 'surekli mesaj atiyor')

    expect(supabase.rpc).toHaveBeenCalledWith('sikayet_gonder', {
      p_hedef_tur: 'kullanici',
      p_hedef_id: 'kullanici-2',
      p_sebep: 'taciz',
      p_aciklama: 'surekli mesaj atiyor',
    })
  })

  it('aciklama verilmezse null gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    await sikayetGonder('check_in', 'checkin-1', 'uygunsuz_icerik')

    expect(supabase.rpc).toHaveBeenCalledWith('sikayet_gonder', {
      p_hedef_tur: 'check_in',
      p_hedef_id: 'checkin-1',
      p_sebep: 'uygunsuz_icerik',
      p_aciklama: null,
    })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kendini sikayet edemezsin' },
    })
    await expect(sikayetGonder('kullanici', 'kendim', 'taciz')).rejects.toThrow(
      'Kendini sikayet edemezsin'
    )
  })
})

describe('SIKAYET_SEBEPLERI', () => {
  it('her sebebin bir anahtari ve Turkce etiketi var', () => {
    expect(SIKAYET_SEBEPLERI.length).toBeGreaterThan(0)
    for (const sebep of SIKAYET_SEBEPLERI) {
      expect(typeof sebep.anahtar).toBe('string')
      expect(typeof sebep.etiket).toBe('string')
      expect(sebep.etiket.length).toBeGreaterThan(0)
    }
  })
})
