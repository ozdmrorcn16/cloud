import { yakinMekanlariGetir } from './mekan'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

describe('yakinMekanlariGetir', () => {
  it('konum ve arama metnini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'mekan-1',
          ad: 'Sahil Kafe',
          tur: 'kafe',
          adres: null,
          osm_id: 123,
          konum: 'POINT(28.979 41.015)',
        },
      ],
      error: null,
    })

    const sonuc = await yakinMekanlariGetir(41.015, 28.979, 'kafe')

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar', {
      p_lat: 41.015,
      p_lng: 28.979,
      p_arama: 'kafe',
    })
    expect(sonuc).toEqual([
      {
        id: 'mekan-1',
        ad: 'Sahil Kafe',
        tur: 'kafe',
        adres: null,
        osmId: 123,
        konum: { lat: 41.015, lng: 28.979 },
      },
    ])
  })

  it('hata donerse firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'sunucu hatasi' } })
    await expect(yakinMekanlariGetir(41.015, 28.979)).rejects.toThrow('sunucu hatasi')
  })
})
