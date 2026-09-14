import { duzenlemeTalebiGonder, mekanFotografiUrlleri } from './mekan-duzenleme'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn(), storage: { from: jest.fn() } },
}))

/**
 * TALEP GONDERME SOZLESMESI.
 *
 * Ekran testi bu fonksiyonu MOCK'luyor, yani RPC'ye hangi parametrenin
 * gittigini orada hicbir sey olcmuyor. Eksik bir parametre sessizce
 * `undefined` gider ve sunucu varsayilanina duesuer - ayni sinif tuzak
 * 2026-09-02'de `NOT_EN_FAZLA` ile yasandi. Bu dosya sozlesmenin
 * kendisini kilitliyor.
 */
describe('duzenlemeTalebiGonder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: 'talep-1', error: null })
  })

  it('kapandi bildirimini p_kapali olarak gonderiyor', async () => {
    await duzenlemeTalebiGonder('mekan-1', { kapali: true })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'mekan_duzenleme_talebi_gonder',
      expect.objectContaining({ p_mekan_id: 'mekan-1', p_kapali: true })
    )
  })

  /*
   * BILDIRIM VERILMEDIGINDE `false` GIDIYOR, `undefined` DEGIL: RPC
   * parametresi `undefined` gonderildiginde PostgREST onu hic yollamiyor
   * ve sunucu varsayilanina duesuyor. Bugun ikisi de false ama bu bir
   * rastlanti; sozlesme acik olsun.
   */
  it('bildirim yoksa p_kapali false gidiyor', async () => {
    await duzenlemeTalebiGonder('mekan-1', { ad: 'Yeni Ad' })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'mekan_duzenleme_talebi_gonder',
      expect.objectContaining({ p_ad: 'Yeni Ad', p_kapali: false })
    )
  })

  it('sunucu hatasini duzgun Turkce metinle firlatiyor', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Bu mekan zaten kapali olarak isaretli' },
    })

    await expect(duzenlemeTalebiGonder('mekan-1', { kapali: true })).rejects.toThrow(
      'Bu mekân zaten kapalı olarak işaretli.'
    )
  })
})

/**
 * Yakin mekanlar listesi icin toplu imzali adres (2026-09-14): tek
 * istek, imzalanamayan yol sonucta yer almaz.
 */
describe('mekanFotografiUrlleri', () => {
  it('bos listede kovaya gitmez', async () => {
    ;(supabase.storage.from as jest.Mock).mockClear()
    expect(await mekanFotografiUrlleri([])).toEqual({})
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('yollari tek istekte imzalar, hatali olani atlar', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({
      data: [
        { path: 'a/1.jpg', signedUrl: 'https://imzali/a1', error: null },
        { path: 'b/2.jpg', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls })

    const sonuc = await mekanFotografiUrlleri(['a/1.jpg', 'b/2.jpg'])

    expect(supabase.storage.from).toHaveBeenCalledWith('mekan-fotograflari')
    expect(createSignedUrls).toHaveBeenCalledWith(['a/1.jpg', 'b/2.jpg'], 3600)
    expect(sonuc).toEqual({ 'a/1.jpg': 'https://imzali/a1' })
  })

  it('kova hata donerse bos sonuc, hata firlatmaz', async () => {
    ;(supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrls: jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } }),
    })
    expect(await mekanFotografiUrlleri(['a/1.jpg'])).toEqual({})
  })
})
