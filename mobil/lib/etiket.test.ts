import { etiketleriGetir, bekleyenEtiketleriGetir, etiketiYanitla } from './etiket'
import { supabase } from './supabase'
import { profilOzetleriniGetir } from './akis'

jest.mock('./supabase', () => ({ supabase: { from: jest.fn(), rpc: jest.fn() } }))
jest.mock('./kimlik', () => ({ kimligiZorunluOku: jest.fn().mockResolvedValue('ben') }))
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

/**
 * BEKLEYEN ETIKETLER TEK LISTE (2026-09-22): check-in ve hikaye ayni
 * listede, en yeniden eskiye. Karar gonderirken tur ayriliyor - hikaye
 * RPC'ye gider, check-in tabloya.
 */
describe('bekleyenEtiketleriGetir', () => {
  const satir = (ek: Record<string, unknown>) => ({
    mekan_adi: 'Hozee',
    etiketleyen_id: 'u1',
    etiketleyen_ad: 'Deniz',
    etiketleyen_kullanici_adi: 'deniz',
    ...ek,
  })

  it('iki kaynagi birlestirir ve en yeniden eskiye sirasi', async () => {
    ;(supabase.rpc as jest.Mock).mockImplementation((ad: string) =>
      Promise.resolve({
        data:
          ad === 'bekleyen_etiketlerim'
            ? [satir({ check_in_id: 'c-1', olusturuldu: '2026-09-20T10:00:00Z' })]
            : [satir({ hikaye_id: 'h-1', mekan_adi: null, olusturuldu: '2026-09-22T10:00:00Z' })],
        error: null,
      })
    )

    const liste = await bekleyenEtiketleriGetir()
    expect(liste.map((e) => [e.tur, e.id])).toEqual([
      ['hikaye', 'h-1'],
      ['checkin', 'c-1'],
    ])
    expect(liste[0].mekanAdi).toBeNull()
  })

  it('hikaye karari RPC ile gider, check-in karari tabloyla', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await etiketiYanitla('h-1', true, 'hikaye')
    expect(supabase.rpc).toHaveBeenCalledWith('hikaye_etiketini_yanitla', {
      p_hikaye_id: 'h-1',
      p_onay: true,
    })

    const eq2 = jest.fn().mockResolvedValue({ error: null })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const update = jest.fn().mockReturnValue({ eq: eq1 })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })
    await etiketiYanitla('c-1', false)
    expect(update).toHaveBeenCalledWith({ durum: 'reddedildi' })
  })
})
