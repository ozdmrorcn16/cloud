import { checkInYap, checkIndenAyril, suAnBurdakileriGetir, mekanAnilariniGetir, kullanicininAnilariniGetir, aktifCheckInimiGetir, checkIniSil } from './checkin'
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
        bulunurluk: 'herkese_acik',
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', 41.015, 28.979, 'guzel bir yer', 'kullanici-1/123.jpg')

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: 'guzel bir yer',
      p_fotograf: 'kullanici-1/123.jpg',
      p_bulunurluk: 'herkese_acik',
    })
    expect(sonuc).toEqual({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      notMetni: 'guzel bir yer',
      fotograf: 'kullanici-1/123.jpg',
      olusturmaZamani: '2026-08-14T10:00:00Z',
      bitisZamani: '2026-08-14T14:00:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })
  })

  it('mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana cok uzaksin (~500 m icinde olmalisin)' },
    })
    await expect(checkInYap('mekan-1', 41.5, 29.5)).rejects.toThrow('Mekana çok uzaksın')
  })

  it('gizli bulunurluk degerini rpc parametresi olarak gonderir', async () => {
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
        bulunurluk: 'gizli',
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', 41.015, 28.979, undefined, undefined, 'gizli')

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: null,
      p_fotograf: null,
      p_bulunurluk: 'gizli',
    })
    expect(sonuc.bulunurluk).toBe('gizli')
  })

  it('bulunurluk degerini RPC-ye gecirir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: { id: 'ci-1' }, error: null })
    await checkInYap('mekan-1', 39, 35, null, null, 'takipcilerim')
    expect(supabase.rpc).toHaveBeenCalledWith(
      'check_in_yap',
      expect.objectContaining({ p_bulunurluk: 'takipcilerim' })
    )
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
          konum: 'POINT(28.979 41.015)', kullanici_adi: 'Ada', bulunurluk: 'herkese_acik',
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
    expect(sonuc[0].bulunurluk).toBe('herkese_acik')
  })
})

describe('mekanAnilariniGetir', () => {
  it('mekana gore filtreler ve yalnizca aniya donusmus satirlari ister', async () => {
    const mockEq = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-2', mekan_id: 'mekan-1', kullanici_id: 'kullanici-3', not_metni: 'guzel', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, kullanici_adi: 'Berk', bulunurluk: 'gizli',
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
    expect(sonuc[0].bulunurluk).toBe('gizli')
  })
})

describe('kullanicininAnilariniGetir', () => {
  it('yalnizca kendi aniya donusmus check-inlerini mekan bilgisiyle getirir', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-3', mekan_id: 'mekan-1', not_metni: 'harika', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, bulunurluk: 'herkese_acik', mekanlar: { ad: 'Sahil Kafe', konum: 'POINT(28.979 41.015)' },
        },
      ],
      error: null,
    })
    const is_ = jest.fn().mockReturnValue({ order })
    const eq = jest.fn().mockReturnValue({ is: is_ })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await kullanicininAnilariniGetir('kullanici-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].mekanAdi).toBe('Sahil Kafe')
    expect(sonuc[0].mekanKonumu).toEqual({ lat: 41.015, lng: 28.979 })
    expect(sonuc[0].bulunurluk).toBe('herkese_acik')
  })
})

describe('aktifCheckInimiGetir', () => {
  function oturumuKur(kullaniciId: string | null) {
    ;(supabase as unknown as { auth: unknown }).auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: kullaniciId ? { id: kullaniciId } : null } }),
    }
  }

  function zinciriKur(satirlar: unknown[]) {
    const limit = jest.fn().mockResolvedValue({ data: satirlar, error: null })
    const order = jest.fn().mockReturnValue({ limit })
    const not = jest.fn().mockReturnValue({ order })
    const eq = jest.fn().mockReturnValue({ not })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })
    return { eq, not }
  }

  it('canli check-in varsa mekan adiyla birlikte doner', async () => {
    oturumuKur('kullanici-1')
    const { eq, not } = zinciriKur([
      {
        id: 'checkin-9', mekan_id: 'mekan-2', not_metni: null, fotograf: null,
        olusturma_zamani: '2026-08-25T10:00:00Z', bitis_zamani: '2026-08-25T14:00:00Z',
        konum: 'POINT(28.979 41.015)', bulunurluk: 'herkese_acik',
        mekanlar: { ad: 'Sahil Kafe' },
      },
    ])

    const sonuc = await aktifCheckInimiGetir()

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(eq).toHaveBeenCalledWith('kullanici_id', 'kullanici-1')
    // Canlilik tek olcute bagli: konum sutunu dolu mu.
    expect(not).toHaveBeenCalledWith('konum', 'is', null)
    expect(sonuc).toMatchObject({ id: 'checkin-9', mekanAdi: 'Sahil Kafe', canliMi: true })
  })

  it('canli check-in yoksa null doner', async () => {
    oturumuKur('kullanici-1')
    zinciriKur([])
    expect(await aktifCheckInimiGetir()).toBeNull()
  })

  it('oturum yoksa hata firlatir', async () => {
    oturumuKur(null)
    await expect(aktifCheckInimiGetir()).rejects.toThrow('Oturum bulunamadı')
  })
})

describe('checkIniSil', () => {
  it('check-in id sine gore satiri siler', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const del = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ delete: del })

    await checkIniSil('checkin-3')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'checkin-3')
  })
})
