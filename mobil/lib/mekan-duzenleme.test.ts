import { duzenlemeTalebiGonder } from './mekan-duzenleme'
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
