import { profilFotografiUrl, profilFotograflariUrl, checkInFotografiUrlHaritasi, checkInFotografiUrlleri } from './fotograf-url'
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

describe('checkInFotografiUrlHaritasi / checkInFotografiUrlleri (coklu fotograf, 2026-09-21)', () => {
  it('TEK createSignedUrls cagrisi; tekrar eden yol bir kez gider; hatali satir haritaya girmez', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({
      data: [
        { path: 'u/1.jpg', signedUrl: 'https://imzali/1.jpg', error: null },
        { path: 'u/2.jpg', signedUrl: null, error: 'Object not found' },
        { path: 'u/3.jpg', signedUrl: 'https://imzali/3.jpg', error: null },
      ],
      error: null,
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls })

    const harita = await checkInFotografiUrlHaritasi(['u/1.jpg', 'u/2.jpg', 'u/1.jpg', 'u/3.jpg'])

    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(createSignedUrls).toHaveBeenCalledTimes(1)
    expect(createSignedUrls).toHaveBeenCalledWith(['u/1.jpg', 'u/2.jpg', 'u/3.jpg'], 60 * 60)
    expect(harita).toEqual({ 'u/1.jpg': 'https://imzali/1.jpg', 'u/3.jpg': 'https://imzali/3.jpg' })
  })

  it('checkInFotografiUrlleri sirayi korur, imzalanamayani atlar', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({
      data: [
        { path: 'u/a.jpg', signedUrl: 'https://imzali/a.jpg', error: null },
        { path: 'u/b.jpg', signedUrl: null, error: 'x' },
        { path: 'u/c.jpg', signedUrl: 'https://imzali/c.jpg', error: null },
      ],
      error: null,
    })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls })

    expect(await checkInFotografiUrlleri(['u/a.jpg', 'u/b.jpg', 'u/c.jpg'])).toEqual([
      'https://imzali/a.jpg', 'https://imzali/c.jpg',
    ])
  })

  it('bos liste icin istek atilmaz', async () => {
    const createSignedUrls = jest.fn()
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls })
    expect(await checkInFotografiUrlHaritasi([])).toEqual({})
    expect(createSignedUrls).not.toHaveBeenCalled()
  })

  it('istek hata verirse bos harita (cagiran fotografsiz cizer)', async () => {
    const createSignedUrls = jest.fn().mockResolvedValue({ data: null, error: { message: 'yetkisiz' } })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ createSignedUrls })
    expect(await checkInFotografiUrlHaritasi(['u/1.jpg'])).toEqual({})
  })
})
