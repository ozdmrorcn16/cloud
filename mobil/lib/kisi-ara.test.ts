import { supabase } from './supabase'
import { kisiAra } from './kisi-ara'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

const mockRpc = supabase.rpc as jest.Mock

describe('kisiAra', () => {
  beforeEach(() => mockRpc.mockReset())

  it('sunucu satirlarini istemci tipine cevirir', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'k1', kullanici_adi: 'orcun', ad: 'Orcun Ozdemir', fotograf: 'k1/a.jpg' },
        { id: 'k2', kullanici_adi: 'ayse', ad: 'Ayse Yilmaz', fotograf: null },
      ],
      error: null,
    })

    await expect(kisiAra('orc')).resolves.toEqual([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: 'k1/a.jpg' },
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Yilmaz', fotograf: null },
    ])
    expect(mockRpc).toHaveBeenCalledWith('kisi_ara', { p_metin: 'orc' })
  })

  it('iki karakterden kisa metinde sunucuya hic gitmez', async () => {
    await expect(kisiAra('o')).resolves.toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('bostan ibaret metinde sunucuya hic gitmez', async () => {
    await expect(kisiAra('   ')).resolves.toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('hata dondururse firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })
    await expect(kisiAra('orc')).rejects.toThrow('giriş yapmış olman gerekiyor')
  })
})
