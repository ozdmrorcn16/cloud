import { profilFotografiUrl, profilFotograflariUrl } from './fotograf-url'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}))

describe('profilFotografiUrl', () => {
  it('imzali URL doner', async () => {
    const createSignedUrlMock = jest
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://ornek/imzali.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock })

    const sonuc = await profilFotografiUrl('kullanici-1/123.jpg')

    expect(supabase.storage.from).toHaveBeenCalledWith('profil-fotograflari')
    expect(createSignedUrlMock).toHaveBeenCalledWith('kullanici-1/123.jpg', 60 * 60)
    expect(sonuc).toBe('https://ornek/imzali.jpg')
  })

  it('hata halinde null doner', async () => {
    const createSignedUrlMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'yetkisiz' } })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock })

    const sonuc = await profilFotografiUrl('kullanici-2/456.jpg')

    expect(sonuc).toBeNull()
  })
})

describe('profilFotograflariUrl', () => {
  it('coklu surumde basarisiz olan atlanir', async () => {
    const createSignedUrlMock = jest
      .fn()
      .mockResolvedValueOnce({ data: { signedUrl: 'https://ornek/1.jpg' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'yetkisiz' } })
      .mockResolvedValueOnce({ data: { signedUrl: 'https://ornek/3.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrl: createSignedUrlMock })

    const sonuc = await profilFotograflariUrl(['a.jpg', 'b.jpg', 'c.jpg'])

    expect(sonuc).toEqual(['https://ornek/1.jpg', 'https://ornek/3.jpg'])
  })

  it('bos liste bos dizi doner', async () => {
    const sonuc = await profilFotograflariUrl([])

    expect(sonuc).toEqual([])
  })
})
