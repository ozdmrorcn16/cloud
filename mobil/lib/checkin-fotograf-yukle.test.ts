import { checkinFotografYukle } from './checkin-fotograf-yukle'
import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'

jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}))
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}))

describe('checkinFotografYukle', () => {
  it('check-in-fotograflari bucketina kullanici klasoru altina yukler', async () => {
    ;(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64icerik')
    const upload = jest.fn().mockResolvedValue({ data: { path: 'kullanici-1/123.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload })

    const yol = await checkinFotografYukle('kullanici-1', 'file:///yerel/foto.jpg')

    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(upload.mock.calls[0][0]).toMatch(/^kullanici-1\//)
    expect(yol).toBe('kullanici-1/123.jpg')
  })
})
