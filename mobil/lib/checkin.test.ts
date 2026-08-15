import { checkInYap, checkIndenAyril } from './checkin'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

describe('checkInYap', () => {
  it('mekan, konum, not ve fotografi rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        id: 'checkin-1',
        mekan_id: 'mekan-1',
        not_metni: 'guzel bir yer',
        fotograf: 'kullanici-1/123.jpg',
        olusturma_zamani: '2026-08-14T10:00:00Z',
        bitis_zamani: '2026-08-14T14:00:00Z',
        konum: 'POINT(28.979 41.015)',
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', { lat: 41.015, lng: 28.979 }, 'guzel bir yer', 'kullanici-1/123.jpg')

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: 'guzel bir yer',
      p_fotograf: 'kullanici-1/123.jpg',
    })
    expect(sonuc).toEqual({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      notMetni: 'guzel bir yer',
      fotograf: 'kullanici-1/123.jpg',
      olusturmaZamani: '2026-08-14T10:00:00Z',
      bitisZamani: '2026-08-14T14:00:00Z',
      canliMi: true,
    })
  })

  it('mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana cok uzaksin (~500 m icinde olmalisin)' },
    })
    await expect(checkInYap('mekan-1', { lat: 41.5, lng: 29.5 })).rejects.toThrow('Mekana cok uzaksin')
  })
})

describe('checkIndenAyril', () => {
  it('check-in id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await checkIndenAyril('checkin-1')
    expect(supabase.rpc).toHaveBeenCalledWith('check_inden_ayril', {
      p_check_in_id: 'checkin-1',
    })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'yetkisiz' } })
    await expect(checkIndenAyril('checkin-1')).rejects.toThrow('yetkisiz')
  })
})
