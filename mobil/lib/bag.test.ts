import { supabase } from './supabase'
import {
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIstegiGonder,
  sohbetIsteginiYanitla,
  sohbetIsteginiGeriCek,
  bagDurumunuGetir,
} from './bag'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'ben' } } }) },
  },
}))

const mockRpc = supabase.rpc as jest.Mock

// bagDurumunuGetir'in .from(...).select(...).eq(...).eq(...).maybeSingle()
// zincirini taklit eden yardimci. Fix round 1'de eklenen testler bunu
// paylasiyor, boylece her testte ayni zinciri elle kurmak gerekmiyor.
function zincirOlustur(maybeSingle: jest.Mock) {
  return {
    select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }),
  }
}

// Kolon-sutun cagrilarini sirayla kaydeden zincir. Hangi .eq() cagrisinin
// hangi kolon/deger ciftiyle yapildigini dogrulamak icin: bir kolon takasi
// (ornegin takip_eden_id/takip_edilen_id ters yazilmasi) burada yakalanir.
function izleyenZincirOlustur(maybeSingle: jest.Mock, kayit: Array<[string, unknown]>) {
  return {
    select: () => ({
      eq: (kolon1: string, deger1: unknown) => {
        kayit.push([kolon1, deger1])
        return {
          eq: (kolon2: string, deger2: unknown) => {
            kayit.push([kolon2, deger2])
            return { maybeSingle }
          },
        }
      },
    }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('takipIstegiGonder', () => {
  it('RPC-yi dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIstegiGonder('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('takip_istegi_gonder', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Bugunluk istek sinirina ulastin' } })
    await expect(takipIstegiGonder('kisi-1')).rejects.toThrow('Bugunluk istek sinirina ulastin')
  })
})

describe('takipIsteginiYanitla', () => {
  it('kabul degerini gecirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIsteginiYanitla('kisi-1', false)
    expect(mockRpc).toHaveBeenCalledWith('takip_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: false,
    })
  })

  it('kabul: true kolunu dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takipIsteginiYanitla('kisi-1', true)
    expect(mockRpc).toHaveBeenCalledWith('takip_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: true,
    })
  })
})

// takipciyiCikar (eskiden 'takipciyi_cikar' RPC-sini cagiriyordu) kaldirildi.
// Kabul artik iki yonu de yazdigi icin ('takip edilen' ve 'takip eden' ayni
// anda 'kabul' oluyor), bagi koparmanin tek yolu takibiBirak - o da sunucu
// tarafinda iki satiri birden siliyor. Ayri bir "takipciyi cikar" cagrisina
// artik gerek yok.
describe('takibiBirak', () => {
  it('RPC-yi cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await takibiBirak('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('takibi_birak', { p_kullanici_id: 'kisi-1' })
  })
})

describe('sohbetIstegiGonder', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIstegiGonder('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegi_gonder', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Istegin zaten gonderilmis' } })
    await expect(sohbetIstegiGonder('kisi-1')).rejects.toThrow('Istegin zaten gonderilmis')
  })
})

describe('sohbetIsteginiYanitla', () => {
  it('kabul: false kolunu dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIsteginiYanitla('kisi-1', false)
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: false,
    })
  })

  it('kabul: true kolunu dogru parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIsteginiYanitla('kisi-1', true)
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegini_yanitla', {
      p_kullanici_id: 'kisi-1',
      p_kabul: true,
    })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Yanitlanacak istek bulunamadi' } })
    await expect(sohbetIsteginiYanitla('kisi-1', true)).rejects.toThrow(
      'Yanitlanacak istek bulunamadi'
    )
  })
})

describe('bagDurumunuGetir', () => {
  // Sirasi bagDurumunuGetir'in kendi sorgu sirasiyla eslesmeli: takip,
  // sohbet, gelenTakip, gelenSohbet (bkz. lib/bag.ts).
  function dortSorguyuKur(sonuclar: {
    durum: string | null
    error: { message: string } | null
  }[]) {
    const maybeler = sonuclar.map((s) =>
      jest.fn().mockResolvedValue({
        data: s.durum === null ? null : { durum: s.durum },
        error: s.error,
      })
    )
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(maybeler[0]))
      .mockReturnValueOnce(zincirOlustur(maybeler[1]))
      .mockReturnValueOnce(zincirOlustur(maybeler[2]))
      .mockReturnValueOnce(zincirOlustur(maybeler[3]))
    return maybeler
  }

  it('dort tablo sorgusundan durumlari birlestirir', async () => {
    dortSorguyuKur([
      { durum: 'kabul', error: null },
      { durum: null, error: null },
      { durum: 'beklemede', error: null },
      { durum: null, error: null },
    ])

    await expect(bagDurumunuGetir('kisi-1')).resolves.toEqual({
      takip: 'kabul',
      sohbet: 'yok',
      gelenTakip: 'beklemede',
      gelenSohbet: 'yok',
    })
  })

  it("'beklemede' durumunu dort tablo icin de dogru okur", async () => {
    dortSorguyuKur([
      { durum: 'beklemede', error: null },
      { durum: 'beklemede', error: null },
      { durum: 'beklemede', error: null },
      { durum: 'beklemede', error: null },
    ])

    await expect(bagDurumunuGetir('kisi-1')).resolves.toEqual({
      takip: 'beklemede',
      sohbet: 'beklemede',
      gelenTakip: 'beklemede',
      gelenSohbet: 'beklemede',
    })
  })

  it('takip sorgusu hata dondurunce firlatir', async () => {
    dortSorguyuKur([
      { durum: null, error: { message: 'takipler sorgu hatasi' } },
      { durum: null, error: null },
      { durum: null, error: null },
      { durum: null, error: null },
    ])

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('takipler sorgu hatasi')
  })

  it('sohbet sorgusu hata dondurunce firlatir', async () => {
    dortSorguyuKur([
      { durum: null, error: null },
      { durum: null, error: { message: 'sohbet_istekleri sorgu hatasi' } },
      { durum: null, error: null },
      { durum: null, error: null },
    ])

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('sohbet_istekleri sorgu hatasi')
  })

  it('gelen takip sorgusu hata dondurunce firlatir', async () => {
    dortSorguyuKur([
      { durum: null, error: null },
      { durum: null, error: null },
      { durum: null, error: { message: 'gelen takip sorgu hatasi' } },
      { durum: null, error: null },
    ])

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('gelen takip sorgu hatasi')
  })

  it('gelen sohbet sorgusu hata dondurunce firlatir', async () => {
    dortSorguyuKur([
      { durum: null, error: null },
      { durum: null, error: null },
      { durum: null, error: null },
      { durum: null, error: { message: 'gelen sohbet sorgu hatasi' } },
    ])

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('gelen sohbet sorgu hatasi')
  })

  it("oturum yoksa 'Oturum bulunamadı' firlatir", async () => {
    ;(supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } })

    await expect(bagDurumunuGetir('kisi-1')).rejects.toThrow('Oturum bulunamadı')
  })

  // Bu testler asil riski hedef alir: gelenTakip/gelenSohbet giden sorgunun
  // ayna gorunumu degil, ters yon. Sutunlar (takip_eden_id/takip_edilen_id,
  // gonderen_id/alan_id) yer degistirirse burada yakalanmali.
  it('takip sorgusu dogru yonde sorgulanir: ben takip_eden, o takip_edilen', async () => {
    const kayit: Array<[string, unknown]> = []
    const maybe = jest.fn().mockResolvedValue({ data: null, error: null })
    ;(supabase.from as jest.Mock).mockReturnValueOnce(izleyenZincirOlustur(maybe, kayit))
    ;(supabase.from as jest.Mock).mockReturnValue(zincirOlustur(jest.fn().mockResolvedValue({ data: null, error: null })))

    await bagDurumunuGetir('kisi-1')

    expect(kayit).toEqual([
      ['takip_eden_id', 'ben'],
      ['takip_edilen_id', 'kisi-1'],
    ])
  })

  it('sohbet sorgusu dogru yonde sorgulanir: ben gonderen, o alan', async () => {
    const kayit: Array<[string, unknown]> = []
    const bosMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    const izlenenMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(izleyenZincirOlustur(izlenenMaybe, kayit))
      .mockReturnValue(zincirOlustur(bosMaybe))

    await bagDurumunuGetir('kisi-1')

    expect(kayit).toEqual([
      ['gonderen_id', 'ben'],
      ['alan_id', 'kisi-1'],
    ])
  })

  it('gelen takip sorgusu ters yonde sorgulanir: o takip_eden, ben takip_edilen', async () => {
    const kayit: Array<[string, unknown]> = []
    const bosMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    const izlenenMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(izleyenZincirOlustur(izlenenMaybe, kayit))
      .mockReturnValue(zincirOlustur(bosMaybe))

    await bagDurumunuGetir('kisi-1')

    expect(kayit).toEqual([
      ['takip_eden_id', 'kisi-1'],
      ['takip_edilen_id', 'ben'],
    ])
  })

  it('gelen sohbet sorgusu ters yonde sorgulanir: o gonderen, ben alan', async () => {
    const kayit: Array<[string, unknown]> = []
    const bosMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    const izlenenMaybe = jest.fn().mockResolvedValue({ data: null, error: null })
    ;(supabase.from as jest.Mock)
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(zincirOlustur(bosMaybe))
      .mockReturnValueOnce(izleyenZincirOlustur(izlenenMaybe, kayit))

    await bagDurumunuGetir('kisi-1')

    expect(kayit).toEqual([
      ['gonderen_id', 'kisi-1'],
      ['alan_id', 'ben'],
    ])
  })
})

describe('sohbetIsteginiGeriCek', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await sohbetIsteginiGeriCek('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('sohbet_istegini_geri_cek', { p_kullanici_id: 'kisi-1' })
  })

  it('sunucu hatasini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Geri cekilecek istek bulunamadi' } })
    await expect(sohbetIsteginiGeriCek('kisi-1')).rejects.toThrow(
      'Geri cekilecek istek bulunamadi'
    )
  })
})
