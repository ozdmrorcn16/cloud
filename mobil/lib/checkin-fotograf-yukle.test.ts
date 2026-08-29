import { checkinFotografYukle } from './checkin-fotograf-yukle'
import { supabase } from './supabase'

// Dosya okuma SDK 54+ `File` API'siyle (readAsStringAsync cihazda
// patliyordu, 2026-08-30); ayrinti lib/dosya-oku.ts icinde.
const mockArrayBuffer = jest.fn()
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: mockArrayBuffer })),
}))
jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}))

describe('checkinFotografYukle', () => {
  it('check-in-fotograflari bucketina kullanici klasoru altina ham baytlari yukler', async () => {
    const baytlar = new Uint8Array([1, 2, 3]).buffer
    mockArrayBuffer.mockResolvedValue(baytlar)
    const upload = jest.fn().mockResolvedValue({ data: { path: 'kullanici-1/123.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload })

    const yol = await checkinFotografYukle('kullanici-1', 'file:///yerel/foto.jpg')

    const { File } = jest.requireMock('expo-file-system')
    expect(File).toHaveBeenCalledWith('file:///yerel/foto.jpg')
    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^kullanici-1\/\d+\.jpg$/), baytlar, {
      contentType: 'image/jpeg',
    })
    expect(yol).toBe('kullanici-1/123.jpg')
  })
})
