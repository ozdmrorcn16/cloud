import { yakinMekanlariGetir, mekanEkle, yakinMekanlariYogunlukIleGetir, turuGosterilir } from './mekan'
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
        // Kaynakta semt %96.5 dolu ama null olabilir; sunucu alani hic
        // gondermezse de tip null'a dusuyor.
        semt: null,
        // Mahalle de ayni sekilde: sunucu gondermezse null.
        mahalle: null,
        // Sunucu 'kaynak' gondermezse dis kaynak varsayiliyor; boylece
        // tur GOSTERILMIYOR. Guvenli taraf bu: bilinmeyen kaynagin tur
        // verisine guvenilmez (karar 2026-08-24).
        kaynak: 'overture',
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

  it('mahalleyi cozer; sunucu gondermezse null kalir', async () => {
    // Mahalle `semt`in yerine gecmiyor, ONUN ALTINDA bir kademe:
    // semt ILCE tutuyor (Nilufer), mahalle daha hassas (Ertugrul).
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'mekan-1',
          ad: 'Alba',
          tur: 'Bisikletçi',
          semt: 'Nilüfer',
          mahalle: 'Ertuğrul',
          adres: null,
          osm_id: null,
          konum: 'POINT(28.9213 40.2106)',
        },
        {
          id: 'mekan-2',
          ad: 'Eski Kayit',
          tur: 'Kafe',
          semt: 'Kadıköy',
          adres: null,
          osm_id: null,
          konum: 'POINT(29.02 40.99)',
        },
      ],
      error: null,
    })

    const sonuc = await yakinMekanlariGetir(40.2106, 28.9213)

    expect(sonuc[0].mahalle).toBe('Ertuğrul')
    expect(sonuc[0].semt).toBe('Nilüfer')
    expect(sonuc[1].mahalle).toBeNull()
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
    ).rejects.toThrow('yaklaşık 200 metre')
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
      p_turler: null,
      p_limit: null,
    })
    expect(sonuc[0].kisiSayisi).toBe(8)
    expect(sonuc[0].konum).toEqual({ lat: 41.015, lng: 28.979 })
  })

  it('tur listesini ve limiti sunucuya gonderir', async () => {
    // Daraltma SUNUCUDA yapilmali. Istemcide yapildiginda sunucu en
    // yakin 50 kaydi tur ayrimi yapmadan donduruyordu ve kullanicinin
    // bolgesinde bunlarin yalnizca 3'u sosyal turdeydi; 500 m icindeki
    // 111 sosyal mekanin geri kalani ekrana hic gelmiyordu.
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })

    await yakinMekanlariYogunlukIleGetir(40.2106, 28.9213, 500, undefined, ['Kafe', 'Bar'], 100)

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar_yogunluk', {
      p_lat: 40.2106,
      p_lng: 28.9213,
      p_yaricap_metre: 500,
      p_arama: null,
      p_turler: ['Kafe', 'Bar'],
      p_limit: 100,
    })
  })

  it('tur ve limit verilmezse sunucu varsayilanlarina birakir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })

    await yakinMekanlariYogunlukIleGetir(41.015, 28.979, null, 'kafe')

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar_yogunluk', {
      p_lat: 41.015,
      p_lng: 28.979,
      p_yaricap_metre: null,
      p_arama: 'kafe',
      p_turler: null,
      p_limit: null,
    })
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


describe('turuGosterilir', () => {
  // KARAR (kullanici, 2026-08-24): dis kaynaktan gelen mekanlarda tur
  // GOSTERILMEZ. Alti denetim ajani ve 87 bin kayitlik duzeltmeden
  // sonra bile "Konak Restaurant" ile "Hünkar Konakları" gibi ayrimlar
  // isim kaliplariyla cozulemedi; dogrulugu garanti edilemeyen bir
  // alani gostermek yerine hic gostermemek tercih edildi.
  //
  // Bu test kurali kilitliyor: biri ileride turu tekrar her yerde
  // gostermeye kalkarsa burasi kirilir.
  it('kullanicinin ekledigi mekanda turu gosterir', () => {
    expect(turuGosterilir({ kaynak: 'kullanici' })).toBe(true)
  })

  it('dis kaynakli mekanda turu GIZLER', () => {
    expect(turuGosterilir({ kaynak: 'overture' })).toBe(false)
  })

  it('kaynak bilinmiyorsa turu GIZLER', () => {
    // Guvenli taraf: bilinmeyen kaynagin tur verisine guvenilmez.
    expect(turuGosterilir({})).toBe(false)
    expect(turuGosterilir({ kaynak: undefined })).toBe(false)
  })
})
