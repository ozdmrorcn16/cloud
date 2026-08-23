import { yakinMekanlariGetir, mekanEkle, yakinMekanlariYogunlukIleGetir, kesfetIcinSuz } from './mekan'
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

describe('yakinMekanlariYogunlukIleGetir', () => {
  it('yaricapi ve aramayi rpc parametresi olarak gonderir, kisi sayisini cozer', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'mekan-1',
          ad: 'Sahil Kafe',
          tur: 'kafe',
          adres: null,
          osm_id: 123,
          konum: 'POINT(28.979 41.015)',
          kisi_sayisi: 8,
        },
      ],
      error: null,
    })

    const sonuc = await yakinMekanlariYogunlukIleGetir(41.015, 28.979, 5000, 'kafe')

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar_yogunluk', {
      p_lat: 41.015,
      p_lng: 28.979,
      p_yaricap_metre: 5000,
      p_arama: 'kafe',
    })
    expect(sonuc[0].kisiSayisi).toBe(8)
    expect(sonuc[0].konum).toEqual({ lat: 41.015, lng: 28.979 })
  })

  it('hata donerse firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'sunucu hatasi' },
    })
    await expect(yakinMekanlariYogunlukIleGetir(41.015, 28.979, 5000)).rejects.toThrow(
      'sunucu hatasi'
    )
  })
})

describe('kesfetIcinSuz', () => {
  const mekanlar = [
    { tur: 'Kafe' },
    { tur: 'Restoran' },
    { tur: 'Banka' },
    { tur: 'Telefoncu' },
    { tur: 'Park' },
  ]

  it('arama bosken yalnizca sosyal turleri birakir', () => {
    const sonuc = kesfetIcinSuz(mekanlar, false)
    expect(sonuc.map((m) => m.tur)).toEqual(['Kafe', 'Restoran', 'Park'])
  })

  it('arama varken BUTUN turleri geri verir', () => {
    // Kullanicinin karari: arama kapsamli olmali, kesfet secici.
    const sonuc = kesfetIcinSuz(mekanlar, true)
    expect(sonuc).toHaveLength(5)
    expect(sonuc.map((m) => m.tur)).toContain('Banka')
  })

  it('cevrede hic sosyal mekan yoksa eldekini gosterir, bos ekran degil', () => {
    // Kucuk yerlesimlerde liste tamamen bosalabilirdi.
    const yalnizcaSosyalOlmayan = [{ tur: 'Banka' }, { tur: 'Eczane' }]
    expect(kesfetIcinSuz(yalnizcaSosyalOlmayan, false)).toHaveLength(2)
  })
})
