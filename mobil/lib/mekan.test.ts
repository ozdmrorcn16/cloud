import { yakinMekanlariGetir, mekanEkle } from './mekan'
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

describe('mekanEkle', () => {
  it('ad, tur, konum ve cihaz konumunu rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        id: 'mekan-yeni',
        ad: 'Yeni Kafe',
        tur: 'kafe',
        adres: null,
        osm_id: null,
        konum: 'POINT(28.98 41.02)',
      },
      error: null,
    })

    const sonuc = await mekanEkle(
      'Yeni Kafe',
      'kafe',
      { lat: 41.02, lng: 28.98 },
      { lat: 41.0201, lng: 28.9801 }
    )

    expect(supabase.rpc).toHaveBeenCalledWith('mekan_ekle', {
      p_ad: 'Yeni Kafe',
      p_tur: 'kafe',
      p_lat: 41.02,
      p_lng: 28.98,
      p_cihaz_lat: 41.0201,
      p_cihaz_lng: 28.9801,
      p_adres: null,
    })
    expect(sonuc.id).toBe('mekan-yeni')
  })

  it('cihaz mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana yakin olmalisin (~200 m icinde)' },
    })
    await expect(
      mekanEkle('Uzak Kafe', 'kafe', { lat: 41.02, lng: 28.98 }, { lat: 42, lng: 30 })
    ).rejects.toThrow('Mekana yakin olmalisin')
  })
})
