import { ANAHTAR, onbellekOku, onbellekYaz, onbellekSil, onbellegiSifirla } from './onbellek'

jest.mock('./supabase', () => ({ supabase: { auth: {} } }))

/**
 * EKRAN VERISI ONBELLEGI (2026-09-22): "her sayfa her seferinde
 * yukleniyor" sikayetinin cozumu. Ekran `Slot` yuzunden unmount olsa da
 * modul duzeyindeki bu kutu hayatta kaliyor.
 */

beforeEach(() => onbellegiSifirla())

describe('onbellek', () => {
  it('yazilani aynen geri verir', () => {
    onbellekYaz(ANAHTAR.akis, [{ id: 'a' }])
    expect(onbellekOku<{ id: string }[]>(ANAHTAR.akis)).toEqual([{ id: 'a' }])
  })

  it('hic yazilmamis anahtar undefined doner - "bos liste" ile karistirilmamali', () => {
    expect(onbellekOku(ANAHTAR.akis)).toBeUndefined()
    // Bos liste YAZILMIS olmak, hic yuklenmemis olmaktan farkli: ekran
    // birincide "henuz paylasim yok", ikincide "yukleniyor" cizmeli.
    onbellekYaz(ANAHTAR.akis, [])
    expect(onbellekOku(ANAHTAR.akis)).toEqual([])
  })

  it('tek anahtar dusurulebilir', () => {
    onbellekYaz(ANAHTAR.gezinmeRozetleri, { mesaj: 2, bildirim: 1, zaman: 0 })
    onbellekSil(ANAHTAR.gezinmeRozetleri)
    expect(onbellekOku(ANAHTAR.gezinmeRozetleri)).toBeUndefined()
  })

  it('sifirlama HEPSINI dusurur (cikis: onceki hesabin verisi gorunemez)', () => {
    onbellekYaz(ANAHTAR.akis, [1])
    onbellekYaz(ANAHTAR.profil, { ad: 'Orçun' })
    onbellegiSifirla()
    expect(onbellekOku(ANAHTAR.akis)).toBeUndefined()
    expect(onbellekOku(ANAHTAR.profil)).toBeUndefined()
  })

  it('anahtarlar benzersiz - yazim hatasi sessiz bos onbellek demek', () => {
    const degerler = Object.values(ANAHTAR)
    expect(new Set(degerler).size).toBe(degerler.length)
  })
})
