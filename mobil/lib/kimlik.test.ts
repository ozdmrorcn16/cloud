import { kullaniciKimligi, kimligiZorunluOku, kimlikOnbelleginiSifirla } from './kimlik'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { auth: { getSession: jest.fn(), getUser: jest.fn() } },
}))

/**
 * KIMLIK YERELDEN (2026-09-22 performans turu).
 *
 * Olculen sorun: `auth.getUser()` her cagrida SUNUCUYA gidiyordu ve
 * ana sayfa cizimi basina dort kez cagriliyordu. Buradaki iddialar
 * (a) aga degil yerel oturuma bakildigini, (b) arka arkaya gelen
 * cagrilarin tek istege bindigini kilitliyor.
 */

const oturum = (id: string | null) => ({
  data: { session: id ? { user: { id } } : null },
})

beforeEach(() => {
  jest.clearAllMocks()
  kimlikOnbelleginiSifirla()
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue(oturum('kullanici-1'))
})

describe('kullaniciKimligi', () => {
  it('kimligi YEREL oturumdan okur; getUser (ag) HIC cagrilmaz', async () => {
    expect(await kullaniciKimligi()).toBe('kullanici-1')
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
    expect(supabase.auth.getUser).not.toHaveBeenCalled()
  })

  it('oturum yoksa null doner', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue(oturum(null))
    expect(await kullaniciKimligi()).toBeNull()
  })

  it('arka arkaya gelen cagrilar TEK istege biner', async () => {
    const [a, b, c] = await Promise.all([kullaniciKimligi(), kullaniciKimligi(), kullaniciKimligi()])
    expect([a, b, c]).toEqual(['kullanici-1', 'kullanici-1', 'kullanici-1'])
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
  })

  it('kisa sure icindeki ikinci cagri onbellekten gelir', async () => {
    await kullaniciKimligi()
    await kullaniciKimligi()
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
  })

  it('onbellek sifirlaninca yeniden okunur (cikis/giris)', async () => {
    await kullaniciKimligi()
    kimlikOnbelleginiSifirla()
    await kullaniciKimligi()
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
  })
})

describe('kimligiZorunluOku', () => {
  it('kimlik varsa dondurur', async () => {
    expect(await kimligiZorunluOku()).toBe('kullanici-1')
  })

  it('oturum yoksa cagiranin metniyle hata firlatir', async () => {
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue(oturum(null))
    await expect(kimligiZorunluOku()).rejects.toThrow('Oturum bulunamadı')
    await expect(kimligiZorunluOku('Oturum bulunamadi')).rejects.toThrow('Oturum bulunamadi')
  })
})
