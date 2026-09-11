import { verilerimiDisaAktar } from './veri-disa-aktar'
import { supabase } from './supabase'
import { profilFotografiUrl } from './fotograf-url'

jest.mock('./supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}))
jest.mock('./fotograf-url', () => ({ profilFotografiUrl: jest.fn() }))

const yukle = jest.fn()
const imzala = jest.fn()
const listele = jest.fn()
const kaldir = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: { id: 'kisi-1' } },
  })
  ;(supabase.rpc as jest.Mock).mockResolvedValue({
    data: { surum: 1, profil: { fotograflar: ['kisi-1/a.jpg'] }, check_inler: [] },
    error: null,
  })
  ;(profilFotografiUrl as jest.Mock).mockResolvedValue('https://imzali/a.jpg')
  yukle.mockResolvedValue({ error: null })
  imzala.mockResolvedValue({ data: { signedUrl: 'https://imzali/dosya.json' }, error: null })
  listele.mockResolvedValue({ data: [{ name: 'eski.json' }], error: null })
  kaldir.mockResolvedValue({ error: null })
  ;(supabase.storage.from as jest.Mock).mockReturnValue({
    upload: yukle,
    createSignedUrl: imzala,
    list: listele,
    remove: kaldir,
  })
})

/**
 * ERISIM HAKKI (KVKK m.11, 2026-09-11).
 *
 * Dosyanin ICERIGI sunucuda belirleniyor ve orada canli olarak
 * olculuyor (`araclar/veri-disa-aktarim-canli-test.py`) - jest
 * Supabase'i mock'ladigi icin bu dosya yalnizca ISTEMCI YOLUNU
 * kilitliyor: fotograf baglantisi, eski dosyanin silinmesi, imzali
 * adresin dondurulmesi.
 */
describe('verilerimiDisaAktar', () => {
  it('sunucudan veriyi aliyor ve imzali adres donduruyor', async () => {
    const adres = await verilerimiDisaAktar()

    expect(supabase.rpc).toHaveBeenCalledWith('verilerimi_disa_aktar')
    expect(adres).toBe('https://imzali/dosya.json')
  })

  /*
   * FOTOGRAF DOSYAYA GOMULMUYOR, baglanti veriliyor: gomulu bir gorsel
   * dosyayi megabaytlara cikarirdi.
   */
  it('fotograf yollarini imzali baglantiya ceviriyor', async () => {
    await verilerimiDisaAktar()

    expect(profilFotografiUrl).toHaveBeenCalledWith('kisi-1/a.jpg')

    // YUKLENEN ICERIGIN KENDISI okunuyor. Yalnizca `profilFotografiUrl`
    // cagrildi mi diye bakmak VAKUMDA gecerdi - donen adresin dosyaya
    // gercekten yazildigini olcmez.
    const govde = yukle.mock.calls[0][1] as Blob
    const yazilan = JSON.parse(await govde.text())
    expect(yazilan.profil.fotograflar).toEqual(['https://imzali/a.jpg'])
  })

  /*
   * BAGLANTI URETILEMEZSE YOL OLDUGU GIBI KALIYOR: kisi en azindan
   * neyin var oldugunu goruyor. Fotograf yuzunden butun disa aktarimi
   * patlatmak orantisiz olurdu.
   */
  it('fotograf baglantisi uretilemezse yol korunuyor', async () => {
    ;(profilFotografiUrl as jest.Mock).mockResolvedValue(null)

    await verilerimiDisaAktar()

    const govde = yukle.mock.calls[0][1] as Blob
    const yazilan = JSON.parse(await govde.text())
    expect(yazilan.profil.fotograflar).toEqual(['kisi-1/a.jpg'])
  })

  /*
   * ONCEKI DOSYA SILINIYOR: kisi basina en fazla BIR disa aktarim
   * kalmali. Icinde butun gecmis varken eski dosyanin kovada beklemesi
   * kabul edilemez - ayni desen profil fotografinda da var.
   */
  it('yuklemeden ONCE eski dosyalari siliyor', async () => {
    await verilerimiDisaAktar()

    expect(listele).toHaveBeenCalledWith('kisi-1')
    expect(kaldir).toHaveBeenCalledWith(['kisi-1/eski.json'])
    // Sira onemli: silme yuklemeden once cagrilmali.
    expect(kaldir.mock.invocationCallOrder[0]).toBeLessThan(yukle.mock.invocationCallOrder[0])
  })

  it('dosya kisinin KENDI klasorune yaziliyor', async () => {
    await verilerimiDisaAktar()

    const yol = yukle.mock.calls[0][0] as string
    expect(yol.startsWith('kisi-1/')).toBe(true)
  })

  it('sunucu hatasini duzgun Turkce metinle firlatiyor', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kimlik dogrulamasi gerekli' },
    })

    await expect(verilerimiDisaAktar()).rejects.toThrow(
      'Bu işlem için giriş yapmış olman gerekiyor.'
    )
  })

  /*
   * TEMIZLIK BASARISIZ OLSA BILE disa aktarim SURUYOR: eski dosya 24
   * saatlik budama isiyle zaten erisilemez hale geliyor ve kisiyi
   * verisinden mahrum birakmak icin sebep degil.
   */
  it('eski dosya silinemese bile disa aktarim devam ediyor', async () => {
    listele.mockRejectedValue(new Error('liste alinamadi'))

    await expect(verilerimiDisaAktar()).resolves.toBe('https://imzali/dosya.json')
  })

  it('imza uretilemezse anlasilir bir hata veriyor', async () => {
    imzala.mockResolvedValue({ data: null, error: { message: 'olmadi' } })

    await expect(verilerimiDisaAktar()).rejects.toThrow('bağlantı oluşturulamadı')
  })
})
