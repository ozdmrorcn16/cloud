import { fotografYukle } from './fotograf-yukle'
import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'

jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}))
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64icerik'),
  EncodingType: { Base64: 'base64' },
}))

describe('fotografYukle', () => {
  it('dosyayi kullanici klasorune yukler ve path doner', async () => {
    const uploadMock = jest.fn().mockResolvedValue({ data: { path: 'kullanici-1/123.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload: uploadMock })

    const sonuc = await fotografYukle('kullanici-1', 'file:///gecici/foto.jpg')

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith('file:///gecici/foto.jpg', {
      encoding: 'base64',
    })
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^kullanici-1\/\d+\.jpg$/),
      expect.anything(),
      { contentType: 'image/jpeg' }
    )
    expect(sonuc).toBe('kullanici-1/123.jpg')
  })
})
