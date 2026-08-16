import { checkInYap, checkIndenAyril, suAnBurdakileriGetir, mekanAnilariniGetir, kendiAnilariniGetir, aniyiSil } from './checkin'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
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
        gizli_mi: false,
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
      p_gizli_mi: false,
    })
    expect(sonuc).toEqual({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      notMetni: 'guzel bir yer',
      fotograf: 'kullanici-1/123.jpg',
      olusturmaZamani: '2026-08-14T10:00:00Z',
      bitisZamani: '2026-08-14T14:00:00Z',
      canliMi: true,
      gizliMi: false,
    })
  })

  it('mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana cok uzaksin (~500 m icinde olmalisin)' },
    })
    await expect(checkInYap('mekan-1', { lat: 41.5, lng: 29.5 })).rejects.toThrow('Mekana cok uzaksin')
  })

  it('gizli check-in bayragini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        id: 'checkin-1',
        mekan_id: 'mekan-1',
        kullanici_id: 'kullanici-1',
        kullanici_adi: 'Ada',
        not_metni: null,
        fotograf: null,
        olusturma_zamani: '2026-08-16T10:00:00Z',
        bitis_zamani: '2026-08-16T14:00:00Z',
        konum: 'POINT(28.979 41.015)',
        gizli_mi: true,
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', { lat: 41.015, lng: 28.979 }, undefined, undefined, true)

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: null,
      p_fotograf: null,
      p_gizli_mi: true,
    })
    expect(sonuc.gizliMi).toBe(true)
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

describe('suAnBurdakileriGetir', () => {
  it('mekana gore filtreler ve yalnizca canli satirlari ister', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-1', mekan_id: 'mekan-1', kullanici_id: 'kullanici-2', not_metni: null, fotograf: null,
          olusturma_zamani: '2026-08-14T10:00:00Z', bitis_zamani: '2026-08-14T14:00:00Z',
          konum: 'POINT(28.979 41.015)', kullanici_adi: 'Ada', gizli_mi: false,
        },
      ],
      error: null,
    })
    const mockNot = jest.fn().mockReturnValue({ eq: mockEq })
    const mockSelect = jest.fn().mockReturnValue({ not: mockNot })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect })

    const sonuc = await suAnBurdakileriGetir('mekan-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].kullaniciAdi).toBe('Ada')
    expect(sonuc[0].kullaniciId).toBe('kullanici-2')
    expect(sonuc[0].canliMi).toBe(true)
    expect(sonuc[0].gizliMi).toBe(false)
  })
})

describe('mekanAnilariniGetir', () => {
  it('mekana gore filtreler ve yalnizca aniya donusmus satirlari ister', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-2', mekan_id: 'mekan-1', kullanici_id: 'kullanici-3', not_metni: 'guzel', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, kullanici_adi: 'Berk', gizli_mi: true,
        },
      ],
      error: null,
    })
    const mockIs = jest.fn().mockReturnValue({ eq: mockEq })
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect })

    const sonuc = await mekanAnilariniGetir('mekan-1')

    expect(sonuc[0].kullaniciAdi).toBe('Berk')
    expect(sonuc[0].canliMi).toBe(false)
    expect(sonuc[0].gizliMi).toBe(true)
  })
})

describe('kendiAnilariniGetir', () => {
  it('yalnizca kendi aniya donusmus check-inlerini mekan bilgisiyle getirir', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-3', mekan_id: 'mekan-1', not_metni: 'harika', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, gizli_mi: false, mekanlar: { ad: 'Sahil Kafe', konum: 'POINT(28.979 41.015)' },
        },
      ],
      error: null,
    })
    const is_ = jest.fn().mockReturnValue({ order })
    const eq = jest.fn().mockReturnValue({ is: is_ })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await kendiAnilariniGetir('kullanici-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].mekanAdi).toBe('Sahil Kafe')
    expect(sonuc[0].mekanKonumu).toEqual({ lat: 41.015, lng: 28.979 })
    expect(sonuc[0].gizliMi).toBe(false)
  })
})

describe('aniyiSil', () => {
  it('check-in id sine gore satiri siler', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const del = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ delete: del })

    await aniyiSil('checkin-3')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'checkin-3')
  })
})
