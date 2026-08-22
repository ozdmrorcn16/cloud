import { FunctionsHttpError } from '@supabase/supabase-js'
import { hesapDurumunuGetir, hesabiDondur, hesabiGeriAc, hesabiSil } from './hesap'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}))

const sahteSupabase = supabase as unknown as {
  from: jest.Mock
  rpc: jest.Mock
  auth: { getUser: jest.Mock }
  functions: { invoke: jest.Mock }
}

function zinciriKur(sonuc: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(sonuc)
  const or = jest.fn(() => ({ maybeSingle }))
  const eq = jest.fn(() => ({ or }))
  const select = jest.fn(() => ({ eq }))
  sahteSupabase.from.mockReturnValue({ select })
  return { select, eq, or, maybeSingle }
}

beforeEach(() => {
  jest.clearAllMocks()
  sahteSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'kullanici-1' } },
    error: null,
  })
})

describe('hesapDurumunuGetir', () => {
  it('satir yoksa null doner', async () => {
    zinciriKur({ data: null, error: null })
    await expect(hesapDurumunuGetir()).resolves.toBeNull()
  })

  it('satir varsa alanlari cevirir', async () => {
    zinciriKur({
      data: {
        durum: 'askida',
        aski_bitisi: '2026-09-01T00:00:00Z',
        gerekce: 'taciz',
      },
      error: null,
    })
    await expect(hesapDurumunuGetir()).resolves.toEqual({
      durum: 'askida',
      askiBitisi: '2026-09-01T00:00:00Z',
      gerekce: 'taciz',
    })
  })

  it('hata gelirse firlatir', async () => {
    zinciriKur({ data: null, error: { message: 'kopuk' } })
    await expect(hesapDurumunuGetir()).rejects.toThrow('kopuk')
  })

  // D1 duzeltmesi: suresi dolmus bir 'askida' satiri sunucudaki
  // hesap_aktif_mi'ye gore AKTIF sayilir. Bu filtre olmadan satir
  // sureye bakmadan donerdi ve kullaniciyi bitmis bir askiya 90 gun
  // (budama cron'una kadar) kilitlerdi. Karsilastirmayi sunucuda
  // yapmasi gerektigi icin, ne dondugunu degil DOGRU filtre metniyle
  // cagrildigini sinuyoruz - "suresi dolmus satir null'a duser mi"
  // sorusu sunucu tarafinda cevaplaniyor, birim testiyle sinanamaz.
  it('sunucu tarafi suresi-dolmus-aski filtresini uygular', async () => {
    const { or } = zinciriKur({ data: null, error: null })
    await hesapDurumunuGetir()
    expect(or).toHaveBeenCalledWith('durum.in.(yasakli,dondurulmus),aski_bitisi.gt.now')
  })

  it('oturum yoksa firlatir (hesap sorunsuz ile karistirilmamali)', async () => {
    sahteSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(hesapDurumunuGetir()).rejects.toThrow('Oturum bulunamadi')
  })
})

describe('hesabiDondur', () => {
  it('RPC cagirir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: null })
    await hesabiDondur('mola')
    expect(sahteSupabase.rpc).toHaveBeenCalledWith('hesabimi_dondur', {
      p_gerekce: 'mola',
    })
  })

  it('hata gelirse firlatir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: { message: 'olmadi' } })
    await expect(hesabiDondur()).rejects.toThrow('olmadi')
  })

  it('gerekce verilmezse RPC-ye null gonderir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: null })
    await hesabiDondur()
    expect(sahteSupabase.rpc).toHaveBeenCalledWith('hesabimi_dondur', {
      p_gerekce: null,
    })
  })
})

describe('hesabiGeriAc', () => {
  it('RPC sonucunu doner', async () => {
    sahteSupabase.rpc.mockResolvedValue({ data: true, error: null })
    await expect(hesabiGeriAc()).resolves.toBe(true)
  })

  it('hata gelirse sessizce false doner', async () => {
    // Bu cagri her oturum acilisinda yapiliyor; ag hatasi girisi
    // engellememeli.
    sahteSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'ag' } })
    await expect(hesabiGeriAc()).resolves.toBe(false)
  })

  it('hata yokken data false ise false doner (gercekten geri acilmadi)', async () => {
    sahteSupabase.rpc.mockResolvedValue({ data: false, error: null })
    await expect(hesabiGeriAc()).resolves.toBe(false)
  })
})

describe('hesabiSil', () => {
  it('uc noktayi parolayla cagirir', async () => {
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({ data: { silindi: true }, error: null }),
    } as never
    await hesabiSil('dogruparola')
    expect(
      (sahteSupabase as unknown as { functions: { invoke: jest.Mock } }).functions
        .invoke
    ).toHaveBeenCalledWith('hesap-sil', { body: { parola: 'dogruparola' } })
  })

  // Duzeltme turu 2 (N2, kod incelemesi): functions-js non-2xx'te
  // `data`yi HER ZAMAN null birakip `FunctionsHttpError` firlatiyor -
  // eski test bunu `{ data: { hata: ... }, error: {...} }` gibi
  // gerceklikte hic olmayan bir sekille kuruyordu ve gecmis
  // implementasyonun asil govdeyi hic okumadigini yakalayamamisti.
  // Gercek govde `error.context` (fetch Response) icinde durur.
  it('FunctionsHttpError govdesindeki hata metnini firlatir', async () => {
    const sahteYanit = { json: jest.fn().mockResolvedValue({ hata: 'Parola yanlis' }) }
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({
        data: null,
        error: new FunctionsHttpError(sahteYanit),
      }),
    } as never
    await expect(hesabiSil('yanlisparola')).rejects.toThrow('Parola yanlis')
  })

  it('govde JSON degilse Turkce genel mesaji firlatir', async () => {
    const sahteYanit = { json: jest.fn().mockRejectedValue(new Error('JSON degil')) }
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({
        data: null,
        error: new FunctionsHttpError(sahteYanit),
      }),
    } as never
    await expect(hesabiSil('parola')).rejects.toThrow(
      'Silme su anda tamamlanamadi, tekrar dene'
    )
  })

  it('FunctionsHttpError olmayan bir hatada da Turkce genel mesaji firlatir', async () => {
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch' },
      }),
    } as never
    await expect(hesabiSil('parola')).rejects.toThrow(
      'Silme su anda tamamlanamadi, tekrar dene'
    )
  })
})
