import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
} from './ayarlar'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
    from: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('varsayilanGizliyiGetir', () => {
  it('profilden varsayilan_gizli degerini okur', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { varsayilan_gizli: true }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await varsayilanGizliyiGetir()).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })
})

describe('varsayilanGizliyiAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await varsayilanGizliyiAyarla(true)

    expect(update).toHaveBeenCalledWith({ varsayilan_gizli: true })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})

describe('aniGorunurlugunuAyarla', () => {
  it('kullanicinin butun check-in satirlarini gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aniGorunurlugunuAyarla('kimse')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(update).toHaveBeenCalledWith({ gorunurluk: 'kimse' })
    expect(eq).toHaveBeenCalledWith('kullanici_id', 'kullanici-1')
  })
})

describe('aramadaGorunsunGetir', () => {
  it('profilden aramada_gorunsun degerini okur', async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { aramada_gorunsun: false }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })

  it('satir yoksa varsayilan olarak gorunur kabul eder', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(true)
  })
})

describe('aramadaGorunsunAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aramadaGorunsunAyarla(false)

    expect(update).toHaveBeenCalledWith({ aramada_gorunsun: false })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})
