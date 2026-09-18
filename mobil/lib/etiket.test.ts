import { etiketleriGetir } from './etiket'
import { supabase } from './supabase'
import { profilOzetleriniGetir } from './akis'

jest.mock('./supabase', () => ({ supabase: { from: jest.fn() } }))
jest.mock('./akis', () => ({ profilOzetleriniGetir: jest.fn() }))

/**
 * ETIKET OKUMA (2026-09-18 gece). `check_in_etiketleri.kullanici_id`
 * auth.users'a bagli, profiller'e DEGIL: PostgREST'in `profiller(ad)`
 * gomusu "relationship not found" veriyordu ve akis bu hatayi yuttugu
 * icin etiketler HIC gorunmuyordu (kullanicinin bildirimi). Simdi
 * etiket satirlari duz cekiliyor, profiller RPC'den.
 */
describe('etiketleriGetir', () => {
  it('bos listede sunucuya gitmez', async () => {
    await expect(etiketleriGetir([])).resolves.toEqual({})
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('profil GOMMEZ; satirlari duz cekip profilleri RPC ozetinden baglar', async () => {
    const select = jest.fn().mockReturnValue({
      in: () => ({
        eq: () =>
          Promise.resolve({
            data: [
              { check_in_id: 'ci-1', kullanici_id: 'k-1' },
              { check_in_id: 'ci-1', kullanici_id: 'k-2' },
              { check_in_id: 'ci-2', kullanici_id: 'k-1' },
            ],
            error: null,
          }),
      }),
    })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })
    ;(profilOzetleriniGetir as jest.Mock).mockResolvedValue({
      'k-1': { rumuz: 'deniz', ad: 'Deniz', avatarUrl: 'https://x/deniz.jpg' },
    })

    const sonuc = await etiketleriGetir(['ci-1', 'ci-2'])

    // Gomulu profil YOK - o yol sunucuda hic calismiyordu.
    expect(select.mock.calls[0][0]).not.toContain('profiller')
    // Ayni kisi iki check-in'de olsa da profil BIR kez isteniyor.
    expect(profilOzetleriniGetir).toHaveBeenCalledWith(['k-1', 'k-2'])
    expect(sonuc['ci-1']).toEqual([
      { kullaniciId: 'k-1', ad: 'Deniz', kullaniciAdi: 'deniz', avatarUrl: 'https://x/deniz.jpg' },
      { kullaniciId: 'k-2', ad: null, kullaniciAdi: null, avatarUrl: null },
    ])
    expect(sonuc['ci-2']).toEqual([{ kullaniciId: 'k-1', ad: 'Deniz', kullaniciAdi: 'deniz', avatarUrl: 'https://x/deniz.jpg' }])
  })

  it('profil ozeti okunamazsa etiketler yine doner (adsiz, avatarsiz)', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: () => ({
        in: () => ({
          eq: () => Promise.resolve({ data: [{ check_in_id: 'ci-1', kullanici_id: 'k-1' }], error: null }),
        }),
      }),
    })
    ;(profilOzetleriniGetir as jest.Mock).mockRejectedValue(new Error('ag'))

    const sonuc = await etiketleriGetir(['ci-1'])
    expect(sonuc['ci-1']).toEqual([{ kullaniciId: 'k-1', ad: null, kullaniciAdi: null, avatarUrl: null }])
  })
})
