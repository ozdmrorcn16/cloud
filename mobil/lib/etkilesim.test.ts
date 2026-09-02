import { etkilesimOzetleriniGetir, begen, yorumlariGetir, YORUM_EN_FAZLA } from './etkilesim'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'ben' } } })
})

describe('etkilesimOzetleriniGetir', () => {
  /**
   * Akista satir basina ayri sorgu atmak otuz gidis-donus demekti;
   * ozetler TEK cagrida aliniyor (etiketlerdeki desenin aynisi).
   */
  it('butun idleri TEK cagrida sorar ve id-anahtarli sozluk doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        { check_in_id: 'c1', begeni: 3, yorum: 1, begendim: true },
        { check_in_id: 'c2', begeni: 0, yorum: 0, begendim: false },
      ],
      error: null,
    })

    const sonuc = await etkilesimOzetleriniGetir(['c1', 'c2'])

    expect(supabase.rpc).toHaveBeenCalledTimes(1)
    expect(supabase.rpc).toHaveBeenCalledWith('etkilesim_ozetleri', {
      p_check_in_ids: ['c1', 'c2'],
    })
    expect(sonuc.c1).toEqual({ begeni: 3, yorum: 1, begendim: true })
    expect(sonuc.c2.begendim).toBe(false)
  })

  it('bos listede sunucuya HIC gitmez', async () => {
    const sonuc = await etkilesimOzetleriniGetir([])

    expect(sonuc).toEqual({})
    expect(supabase.rpc).not.toHaveBeenCalled()
  })
})

describe('begen', () => {
  it('kendi kimligiyle satir ekler', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null })
    ;(supabase.from as jest.Mock).mockReturnValue({ insert })

    await begen('c1')

    expect(insert).toHaveBeenCalledWith({ check_in_id: 'c1', kullanici_id: 'ben' })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'reddedildi' } }),
    })

    await expect(begen('c1')).rejects.toThrow()
  })
})

describe('yorumlariGetir', () => {
  /**
   * RPC ile getiriliyor, dogrudan tablodan DEGIL: `profiller` uzerinde
   * "yalnizca kendi profilini oku" kurali var, yani istemci join ile
   * yazarin adini okuyamiyor. Ayni sinif hata Faz 2a'da yasandi.
   */
  it('RPC cagirir ve alan adlarini istemci bicimine cevirir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'y1',
          kullanici_id: 'k1',
          kullanici_adi: 'ayse',
          ad: 'Ayşe Y',
          metin: 'güzel yer',
          olusturuldu: '2026-09-02T10:00:00Z',
          silebilir_mi: true,
        },
      ],
      error: null,
    })

    const yorumlar = await yorumlariGetir('c1')

    expect(supabase.rpc).toHaveBeenCalledWith('yorumlari_getir', { p_check_in_id: 'c1' })
    expect(yorumlar[0]).toEqual({
      id: 'y1',
      kullaniciId: 'k1',
      kullaniciAdi: 'ayse',
      ad: 'Ayşe Y',
      metin: 'güzel yer',
      olusturuldu: '2026-09-02T10:00:00Z',
      silebilirMi: true,
    })
  })
})

describe('YORUM_EN_FAZLA', () => {
  /**
   * Sunucudaki `check (length(trim(metin)) between 1 and 500)` ile ayni
   * olmali. Ikisi ayrisirsa kullanici yazabildigi bir yorumu
   * gonderemez ve sebebini goremez.
   */
  it('sunucudaki sinirla ayni', () => {
    expect(YORUM_EN_FAZLA).toBe(500)
  })
})
