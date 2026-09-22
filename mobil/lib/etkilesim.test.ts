import { etkilesimOzetleriniGetir, begen, yorumlariGetir, YORUM_EN_FAZLA, begenenleriGetir, etkilesimBildirimleriniGetir } from './etkilesim'
import { profilOzetleriniGetir } from './akis'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: { getUser: jest.fn(), getSession: jest.fn() },
  },
}))
jest.mock('./akis', () => ({ profilOzetleriniGetir: jest.fn() }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'ben' } } })
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'ben' } } } })
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

/** Zincirleme sorgu mock'u: her metot kendini dondurur, sonda `sonuc` cozulur. */
function zincir(sonuc: unknown) {
  const z: Record<string, jest.Mock> = {}
  for (const m of ['select', 'eq', 'neq', 'order', 'limit']) {
    z[m] = jest.fn().mockImplementation(() => ({ ...z, then: (r: (v: unknown) => unknown) => Promise.resolve(sonuc).then(r) }))
  }
  return z
}

describe('begenenleriGetir (2026-09-22)', () => {
  it('begeniler satirlarini okur, profilleri TEK cagrida ozetler, ozeti gelmeyeni (engelli) atar', async () => {
    const z = zincir({ data: [{ kullanici_id: 'k-1' }, { kullanici_id: 'k-2' }, { kullanici_id: 'k-3' }], error: null })
    ;(supabase.from as jest.Mock).mockReturnValue(z)
    ;(profilOzetleriniGetir as jest.Mock).mockResolvedValue({
      'k-1': { rumuz: 'ada', ad: 'Ada', avatarUrl: 'https://x/1.jpg' },
      'k-3': { rumuz: 'mert', ad: 'Mert', avatarUrl: null },
    })

    const liste = await begenenleriGetir('checkin-1')

    expect(supabase.from).toHaveBeenCalledWith('begeniler')
    expect(z.eq).toHaveBeenCalledWith('check_in_id', 'checkin-1')
    expect(profilOzetleriniGetir).toHaveBeenCalledWith(['k-1', 'k-2', 'k-3'])
    expect(liste).toEqual([
      { id: 'k-1', ad: 'Ada', kullaniciAdi: 'ada', avatarUrl: 'https://x/1.jpg' },
      { id: 'k-3', ad: 'Mert', kullaniciAdi: 'mert', avatarUrl: null },
    ])
  })
})

describe('etkilesimBildirimleriniGetir (2026-09-22)', () => {
  it('kendi paylasimlarimdaki begeni + yorumlari birlestirir, yeniden eskiye siralar, kendi eylemimi sorguda eler', async () => {
    const begeniZ = zincir({
      data: [{ check_in_id: 'c-1', kullanici_id: 'k-1', olusturuldu: '2026-09-22T10:00:00Z', check_inler: { kullanici_id: 'ben', mekanlar: { ad: 'Sahil Kafe' } } }],
      error: null,
    })
    const yorumZ = zincir({
      data: [{ id: 'y-1', check_in_id: 'c-1', kullanici_id: 'k-2', metin: 'harika', olusturuldu: '2026-09-22T11:00:00Z', check_inler: { kullanici_id: 'ben', mekanlar: { ad: 'Sahil Kafe' } } }],
      error: null,
    })
    ;(supabase.from as jest.Mock).mockImplementation((tablo: string) => (tablo === 'begeniler' ? begeniZ : yorumZ))
    ;(profilOzetleriniGetir as jest.Mock).mockResolvedValue({
      'k-1': { rumuz: 'ada', ad: 'Ada', avatarUrl: null },
      'k-2': { rumuz: 'mert', ad: 'Mert', avatarUrl: 'https://x/2.jpg' },
    })

    const liste = await etkilesimBildirimleriniGetir()

    // Yalnizca sahibi oldugum paylasimlar, kendi eylemim haric.
    expect(begeniZ.eq).toHaveBeenCalledWith('check_inler.kullanici_id', 'ben')
    expect(begeniZ.neq).toHaveBeenCalledWith('kullanici_id', 'ben')
    expect(yorumZ.eq).toHaveBeenCalledWith('check_inler.kullanici_id', 'ben')
    expect(liste.map((s) => s.id)).toEqual(['yorum-y-1', 'begeni-c-1-k-1'])
    expect(liste[0]).toMatchObject({ tur: 'yorum', aktorKullaniciAdi: 'mert', mekanAdi: 'Sahil Kafe', metin: 'harika', checkInId: 'c-1' })
    expect(liste[1]).toMatchObject({ tur: 'begeni', aktorKullaniciAdi: 'ada', metin: null })
  })
})
