import { fotografYukle } from './fotograf-yukle'
import { supabase } from './supabase'

// Dosya okuma SDK 54+ `File` API'siyle: eski readAsStringAsync gercek
// cihazda kirmizi uyariyla patliyordu ve profil fotografi eklenemiyordu
// (TestFlight'taki ilk deneme, 2026-08-30). Ayrinti lib/dosya-oku.ts.
const mockArrayBuffer = jest.fn()
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: mockArrayBuffer })),
}))

const mockUpload = jest.fn()
jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn(() => ({ upload: mockUpload })) } },
}))

const BAYTLAR = new Uint8Array([1, 2, 3]).buffer

beforeEach(() => {
  jest.clearAllMocks()
  mockArrayBuffer.mockResolvedValue(BAYTLAR)
  mockUpload.mockResolvedValue({ data: { path: 'kullanici-1/123.jpg' }, error: null })
})

describe('fotografYukle', () => {
  it('dosyayi File API ile okuyup kullanici klasorune ham baytlarla yukler, path doner', async () => {
    const sonuc = await fotografYukle('kullanici-1', 'file:///gecici/foto.jpg')

    const { File } = jest.requireMock('expo-file-system')
    expect(File).toHaveBeenCalledWith('file:///gecici/foto.jpg')
    expect(supabase.storage.from).toHaveBeenCalledWith('profil-fotograflari')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^kullanici-1\/\d+\.jpg$/),
      BAYTLAR,
      { contentType: 'image/jpeg' }
    )
    expect(sonuc).toBe('kullanici-1/123.jpg')
  })

  it('yukleme hatasini oldugu gibi firlatir', async () => {
    mockUpload.mockResolvedValue({ data: null, error: new Error('Kova yok') })

    await expect(fotografYukle('kullanici-1', 'file:///gecici/foto.jpg')).rejects.toThrow('Kova yok')
  })
})
