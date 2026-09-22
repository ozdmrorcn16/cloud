import { YORUM_EN_FAZLA } from './etkilesim'
import { checkInYap, checkIndenAyril, suAnBurdakileriGetir, mekanlardaBulunanlariGetir, kullanicininAnilariniGetir, aktifCheckInimiGetir, checkIniSil, NOT_EN_FAZLA } from './checkin'
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
        fotograflar: ['kullanici-1/123.jpg', 'kullanici-1/124.jpg'],
        fotograf: 'kullanici-1/123.jpg',
        olusturma_zamani: '2026-08-14T10:00:00Z',
        bitis_zamani: '2026-08-14T14:00:00Z',
        konum: 'POINT(28.979 41.015)',
        bulunurluk: 'herkese_acik',
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', 41.015, 28.979, 'guzel bir yer', ['kullanici-1/123.jpg', 'kullanici-1/124.jpg'])

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: 'guzel bir yer',
      // COKLU FOTOGRAF (2026-09-21): dizi gider, tekil alan null.
      p_fotograf: null,
      p_fotograflar: ['kullanici-1/123.jpg', 'kullanici-1/124.jpg'],
      p_bulunurluk: 'herkese_acik',
      p_ifade: null,
    })
    expect(sonuc).toEqual({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      notMetni: 'guzel bir yer',
      ifade: null,
      fotograflar: ['kullanici-1/123.jpg', 'kullanici-1/124.jpg'],
      olusturmaZamani: '2026-08-14T10:00:00Z',
      bitisZamani: '2026-08-14T14:00:00Z',
      canliMi: true,
      bulunurluk: 'herkese_acik',
    })
  })

  it('mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana cok uzaksin (~1 km icinde olmalisin)' },
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
      p_fotograflar: [],
      p_bulunurluk: 'gizli',
      p_ifade: null,
    })
    expect(sonuc.bulunurluk).toBe('gizli')
  })

  it('bulunurluk degerini RPC-ye gecirir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: { id: 'ci-1' }, error: null })
    await checkInYap('mekan-1', 39, 35, null, [], 'takipcilerim')
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

describe('kullanicininAnilariniGetir', () => {
  it('kendi check-inlerini mekan bilgisiyle getirir - CANLI OLANLAR DA DAHIL', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-3', mekan_id: 'mekan-1', not_metni: 'harika', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, bulunurluk: 'herkese_acik', mekanlar: { ad: 'Sahil Kafe', semt: 'Nilüfer', konum: 'POINT(28.979 41.015)' },
        },
        {
          // CANLI check-in: konum dolu. Onceden `.is('konum', null)`
          // filtresi bunu eliyordu ve yeni check-in profilde 30 dakika
          // gorunmuyordu (kullanicinin bildirdigi eksik, 2026-08-29).
          id: 'checkin-4', mekan_id: 'mekan-2', not_metni: null, fotograf: null,
          olusturma_zamani: '2026-08-29T10:00:00Z', bitis_zamani: '2026-08-29T10:30:00Z',
          konum: 'POINT(28.9 41.0)', bulunurluk: 'herkese_acik',
          mekanlar: { ad: 'Kent Meydanı', semt: 'Osmangazi', konum: 'POINT(28.9 41.0)' },
        },
      ],
      error: null,
    })
    const eq = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await kullanicininAnilariniGetir('kullanici-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].mekanAdi).toBe('Sahil Kafe')
    expect(sonuc[0].mekanSemti).toBe('Nilüfer')
    expect(sonuc[0].mekanKonumu).toEqual({ lat: 41.015, lng: 28.979 })
    expect(sonuc[0].bulunurluk).toBe('herkese_acik')
    // Canli olan da listede ve canliMi ile isaretli.
    expect(sonuc).toHaveLength(2)
    expect(sonuc[1].mekanAdi).toBe('Kent Meydanı')
    expect(sonuc[1].canliMi).toBe(true)
  })

  it('IFADEYI de seciyor ve tasiyor - profil kartinda ana sayfayla ayni gorunsun (2026-09-21)', async () => {
    // Kullanicinin bildirimi: ifade ana sayfada gorunuyor, profilde
    // gorunmuyordu. Sebep: bu sorgunun select listesinde `ifade` yoktu;
    // ana sayfa akisi (lib/akis.ts) seciyordu. Uc ekranda ortak kart,
    // uc sorgu da ayni alanlari tasimali.
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-5', mekan_id: 'mekan-1', not_metni: null, ifade: 'kahve', fotograf: null,
          olusturma_zamani: '2026-09-21T10:00:00Z', bitis_zamani: '2026-09-21T11:00:00Z',
          konum: null, bulunurluk: 'herkese_acik',
          mekanlar: { ad: 'Sahil Kafe', semt: 'Nilüfer', konum: 'POINT(28.979 41.015)' },
        },
      ],
      error: null,
    })
    const eq = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await kullanicininAnilariniGetir('kullanici-1')

    expect(select.mock.calls[0][0]).toContain(' ifade,')
    expect(sonuc[0].ifade).toBe('kahve')
  })
})

describe('aktifCheckInimiGetir', () => {
  function oturumuKur(kullaniciId: string | null) {
    const kullanici = kullaniciId ? { id: kullaniciId } : null
    ;(supabase as unknown as { auth: unknown }).auth = {
      getUser: jest.fn().mockResolvedValue({ data: { user: kullanici } }),
      // Kimlik artik YEREL oturumdan okunuyor (2026-09-22 performans turu).
      getSession: jest.fn().mockResolvedValue({ data: { session: kullanici ? { user: kullanici } : null } }),
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

describe('NOT_EN_FAZLA', () => {
  it('yorum siniriyla AYNI: iki serbest metin alani ayni tavani kullanir', () => {
    expect(NOT_EN_FAZLA).toBe(YORUM_EN_FAZLA)
  })

  it('500 karakter', () => {
    expect(NOT_EN_FAZLA).toBe(500)
  })
})

/**
 * Yakin mekanlar listesindeki avatar yigini (referans gorsel,
 * 2026-09-14). `suAnBurdakileriGetir` ile ayni kapi: tablo dogrudan,
 * satir guvenligi devrede.
 */
describe('mekanlardaBulunanlariGetir', () => {
  function tabloyuKur(satirlar: unknown[]) {
    const mockOrder = jest.fn().mockResolvedValue({ data: satirlar, error: null })
    const mockIn = jest.fn().mockReturnValue({ order: mockOrder })
    const mockNot = jest.fn().mockReturnValue({ in: mockIn })
    const mockSelect = jest.fn().mockReturnValue({ not: mockNot })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect })
    return { mockNot, mockIn }
  }

  it('bos listede sunucuya HIC gitmez', async () => {
    ;(supabase.from as jest.Mock) = jest.fn()
    expect(await mekanlardaBulunanlariGetir([])).toEqual({})
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('canli satirlari mekana gore gruplar, kisi basina tek, en fazla 3', async () => {
    const { mockNot, mockIn } = tabloyuKur([
      { mekan_id: 'm1', kullanici_id: 'k1', kullanici_adi: 'Ayşe', olusturma_zamani: '2026-09-14T10:04:00Z' },
      { mekan_id: 'm1', kullanici_id: 'k1', kullanici_adi: 'Ayşe', olusturma_zamani: '2026-09-14T10:03:00Z' },
      { mekan_id: 'm1', kullanici_id: 'k2', kullanici_adi: 'Can', olusturma_zamani: '2026-09-14T10:02:00Z' },
      { mekan_id: 'm1', kullanici_id: 'k3', kullanici_adi: null, olusturma_zamani: '2026-09-14T10:01:00Z' },
      { mekan_id: 'm1', kullanici_id: 'k4', kullanici_adi: 'Dört', olusturma_zamani: '2026-09-14T10:00:00Z' },
      { mekan_id: 'm2', kullanici_id: 'k9', kullanici_adi: 'Ece', olusturma_zamani: '2026-09-14T09:00:00Z' },
    ])

    const sonuc = await mekanlardaBulunanlariGetir(['m1', 'm2'])

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(mockNot).toHaveBeenCalledWith('konum', 'is', null)
    expect(mockIn).toHaveBeenCalledWith('mekan_id', ['m1', 'm2'])
    expect(sonuc.m1.map((k) => k.kullaniciId)).toEqual(['k1', 'k2', 'k3'])
    expect(sonuc.m1[0].kullaniciAdi).toBe('Ayşe')
    expect(sonuc.m2).toEqual([{ kullaniciId: 'k9', kullaniciAdi: 'Ece' }])
  })
})
