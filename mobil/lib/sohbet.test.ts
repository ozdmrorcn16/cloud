import { supabase } from './supabase'
import {
  mesajGonder,
  konusmalarimiGetir,
  mesajlariGetir,
  konusmayiOkunduIsaretle,
  konusmayiGizle,
  mesajlaraAbonelOl,
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
} from './sohbet'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}))

const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('mesajGonder', () => {
  it('RPC-yi dogru ad ve parametrelerle cagirir', async () => {
    mockRpc.mockResolvedValue({ data: 'konusma-1', error: null })
    const id = await mesajGonder('kisi-1', 'merhaba')
    expect(mockRpc).toHaveBeenCalledWith('mesaj_gonder', {
      p_kullanici_id: 'kisi-1',
      p_metin: 'merhaba',
    })
    expect(id).toBe('konusma-1')
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Bu kisiye su an mesaj gonderemezsin' },
    })
    await expect(mesajGonder('kisi-1', 'merhaba')).rejects.toThrow(
      'Bu kişiye şu an mesaj gönderemezsin.'
    )
  })
})

describe('konusmalarimiGetir', () => {
  it('RPC-yi dogru ad ve parametrelerle cagirir, satirlari camelCase-e cevirir', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          konusma_id: 'konusma-1',
          kisi_id: 'kisi-1',
          kullanici_adi: 'orcun',
          ad: 'Orcun Ozdemir',
          son_mesaj: 'merhaba',
          son_mesaj_zamani: '2026-08-20T10:00:00Z',
          okunmamis: 2,
          yazilabilir_mi: true,
        },
      ],
      error: null,
    })

    await expect(konusmalarimiGetir()).resolves.toEqual([
      {
        konusmaId: 'konusma-1',
        kisiId: 'kisi-1',
        kullaniciAdi: 'orcun',
        ad: 'Orcun Ozdemir',
        sonMesaj: 'merhaba',
        sonMesajZamani: '2026-08-20T10:00:00Z',
        okunmamis: 2,
        yazilabilirMi: true,
      },
    ])
    expect(mockRpc).toHaveBeenCalledWith('konusmalarim', {})
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })
    await expect(konusmalarimiGetir()).rejects.toThrow('giriş yapmış olman gerekiyor')
  })
})

describe('mesajlariGetir', () => {
  it('RPC-yi dogru ad ve parametrelerle cagirir, satirlari camelCase-e cevirir', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'm1',
          gonderen_id: 'kisi-1',
          metin: 'merhaba',
          olusturuldu: '2026-08-20T10:00:00Z',
        },
      ],
      error: null,
    })

    await expect(mesajlariGetir('konusma-1', '2026-08-20T11:00:00Z', 20)).resolves.toEqual([
      {
        id: 'm1',
        gonderenId: 'kisi-1',
        metin: 'merhaba',
        olusturuldu: '2026-08-20T10:00:00Z',
      },
    ])
    expect(mockRpc).toHaveBeenCalledWith('mesajlari_getir', {
      p_konusma_id: 'konusma-1',
      p_once: '2026-08-20T11:00:00Z',
      p_limit: 20,
    })
  })

  it('once ve limit verilmezse null ve varsayilan gecer', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await mesajlariGetir('konusma-1')
    expect(mockRpc).toHaveBeenCalledWith('mesajlari_getir', {
      p_konusma_id: 'konusma-1',
      p_once: null,
      p_limit: 50,
    })
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Konusma bulunamadi' } })
    await expect(mesajlariGetir('konusma-1')).rejects.toThrow('Konuşma bulunamadı.')
  })
})

describe('konusmayiOkunduIsaretle', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await konusmayiOkunduIsaretle('konusma-1')
    expect(mockRpc).toHaveBeenCalledWith('konusmayi_okundu_isaretle', {
      p_konusma_id: 'konusma-1',
    })
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Konusma bulunamadi' } })
    await expect(konusmayiOkunduIsaretle('konusma-1')).rejects.toThrow('Konuşma bulunamadı.')
  })
})

describe('konusmayiGizle', () => {
  it('RPC-yi dogru ad ve parametreyle cagirir', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await konusmayiGizle('konusma-1')
    expect(mockRpc).toHaveBeenCalledWith('konusmayi_gizle', { p_konusma_id: 'konusma-1' })
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'Konusma bulunamadi' } })
    await expect(konusmayiGizle('konusma-1')).rejects.toThrow('Konuşma bulunamadı.')
  })
})

describe('mesajlaraAbonelOl', () => {
  it('dogru kanala ve filtreye abone olur, gelen olayi camelCase-e cevirir', () => {
    let kayitliGeriCagri: ((olay: unknown) => void) | undefined
    type KanalNesnesiTipi = {
      on: jest.Mock
      subscribe: jest.Mock
    }
    const kanalNesnesi: KanalNesnesiTipi = {
      on: jest.fn((olayAdi: string, ayarlar: unknown, geriCagri: (olay: unknown) => void) => {
        kayitliGeriCagri = geriCagri
        return kanalNesnesi
      }),
      subscribe: jest.fn(() => kanalNesnesi),
    }
    ;(supabase.channel as jest.Mock).mockReturnValue(kanalNesnesi)

    const geldi = jest.fn()
    const abonelikCiktikSonra = mesajlaraAbonelOl('konusma-1', geldi)

    expect(supabase.channel).toHaveBeenCalledWith('mesajlar:konusma-1')
    expect(kanalNesnesi.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mesajlar',
        filter: 'konusma_id=eq.konusma-1',
      },
      expect.any(Function)
    )
    expect(kanalNesnesi.subscribe).toHaveBeenCalled()

    kayitliGeriCagri?.({
      new: {
        id: 'm1',
        gonderen_id: 'kisi-1',
        metin: 'merhaba',
        olusturuldu: '2026-08-20T10:00:00Z',
      },
    })
    expect(geldi).toHaveBeenCalledWith({
      id: 'm1',
      gonderenId: 'kisi-1',
      metin: 'merhaba',
      olusturuldu: '2026-08-20T10:00:00Z',
    })

    abonelikCiktikSonra()
    expect(supabase.removeChannel).toHaveBeenCalledWith(kanalNesnesi)
  })
})

/**
 * MESAJ ISTEKLERI (kullanicinin karari 2026-09-01): arkadasin olmayan
 * kisilerden gelen mesajlar Mesajlar kutusuna DUSMEZ, ayri bir Istekler
 * bolumunde bekler. Okumak kabul etmez; kabul ya cevap yazmakla ya da
 * Kabul dugmesiyle olur. Red istegi siler.
 */
describe('mesaj istekleri', () => {
  it('bana gelen istekleri getirir ve alanlari cozer', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          gonderen_id: 'kisi-1',
          kullanici_adi: 'deniz',
          ad: 'Deniz',
          konusma_id: 'konusma-1',
          son_mesaj: 'Merhaba, seni parkta gördüm',
          son_mesaj_zamani: '2026-09-01T10:00:00Z',
        },
      ],
      error: null,
    })

    const sonuc = await mesajIsteklerimiGetir()

    expect(mockRpc).toHaveBeenCalledWith('mesaj_isteklerim', {})
    expect(sonuc).toEqual([
      {
        gonderenId: 'kisi-1',
        kullaniciAdi: 'deniz',
        ad: 'Deniz',
        konusmaId: 'konusma-1',
        sonMesaj: 'Merhaba, seni parkta gördüm',
        sonMesajZamani: '2026-09-01T10:00:00Z',
      },
    ])
  })

  it('istegi kabul eder', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    await mesajIsteginiKabulEt('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('mesaj_istegini_kabul_et', {
      p_gonderen_id: 'kisi-1',
    })
  })

  it('istegi reddeder', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    await mesajIsteginiReddet('kisi-1')
    expect(mockRpc).toHaveBeenCalledWith('mesaj_istegini_reddet', {
      p_gonderen_id: 'kisi-1',
    })
  })

  it('sunucu hatasini Turkce metne cevirip firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Bu istek bulunamadi' } })
    await expect(mesajIsteginiReddet('kisi-1')).rejects.toThrow('Bu istek bulunamadi')
  })
})
