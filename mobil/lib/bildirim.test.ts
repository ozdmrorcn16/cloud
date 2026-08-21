let mockIsDevice = true
// react-native butun haliyle birakiliyor (yalnizca Platform.OS testte
// ayarlanir); wholesale mock, expo'nun winter global kurulumunu bozup
// baska paketlerde tearcown sonrasi fetch hatasina yol aciyordu.
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice
  },
}))
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}))
jest.mock('./supabase', () => ({ supabase: { rpc: jest.fn() } }))

import { Platform } from 'react-native'

import * as Notifications from 'expo-notifications'
import { supabase } from './supabase'
import {
  bildirimleriBaslat,
  bildirimJetonunuSil,
  bildirimeDokunmaDinle,
} from './bildirim'

const mockRpc = supabase.rpc as jest.Mock
const mockIzinAl = Notifications.getPermissionsAsync as jest.Mock
const mockIzinIste = Notifications.requestPermissionsAsync as jest.Mock
const mockJetonAl = Notifications.getExpoPushTokenAsync as jest.Mock
const mockDinle = Notifications.addNotificationResponseReceivedListener as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  Platform.OS = 'ios'
  mockIsDevice = true

})

describe('bildirimleriBaslat', () => {
  it("web'de hicbir sey yapmaz: izin sorulmaz, RPC cagrilmaz", async () => {
    Platform.OS = 'web'
    await bildirimleriBaslat('kullanici-1')
    expect(mockIzinAl).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('gercek cihaz degilse izin sormaz ve RPC cagirmaz', async () => {
    mockIsDevice = false
    await bildirimleriBaslat('kullanici-1')
    expect(mockIzinAl).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('izin reddedilirse jeton_kaydet cagrilmaz', async () => {
    mockIzinAl.mockResolvedValue({ granted: false })
    mockIzinIste.mockResolvedValue({ granted: false })
    await bildirimleriBaslat('kullanici-1')
    expect(mockJetonAl).not.toHaveBeenCalled()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('izin varsa jetonu alir ve jeton_kaydet-i ios platformuyla cagirir', async () => {
    mockIzinAl.mockResolvedValue({ granted: true })
    mockJetonAl.mockResolvedValue({ data: 'ExponentPushToken[abc]' })
    mockRpc.mockResolvedValue({ error: null })
    await bildirimleriBaslat('kullanici-1')
    expect(mockIzinIste).not.toHaveBeenCalled()
    expect(mockRpc).toHaveBeenCalledWith('jeton_kaydet', {
      p_jeton: 'ExponentPushToken[abc]',
      p_platform: 'ios',
    })
  })

  it('izin yoksa ama istekle verilirse android platformuyla kaydeder', async () => {
    Platform.OS = 'android'
    mockIzinAl.mockResolvedValue({ granted: false })
    mockIzinIste.mockResolvedValue({ granted: true })
    mockJetonAl.mockResolvedValue({ data: 'ExponentPushToken[xyz]' })
    mockRpc.mockResolvedValue({ error: null })
    await bildirimleriBaslat('kullanici-1')
    expect(mockRpc).toHaveBeenCalledWith('jeton_kaydet', {
      p_jeton: 'ExponentPushToken[xyz]',
      p_platform: 'android',
    })
  })

  it('RPC patlarsa hata firlatmaz (sessiz)', async () => {
    mockIzinAl.mockResolvedValue({ granted: true })
    mockJetonAl.mockResolvedValue({ data: 'ExponentPushToken[abc]' })
    mockRpc.mockRejectedValue(new Error('ag hatasi'))
    await expect(bildirimleriBaslat('kullanici-1')).resolves.toBeUndefined()
  })
})

describe('bildirimJetonunuSil', () => {
  it("web'de RPC cagirmaz", async () => {
    Platform.OS = 'web'
    await bildirimJetonunuSil()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('cihazda jetonu alip jeton_sil-i cagirir', async () => {
    mockJetonAl.mockResolvedValue({ data: 'ExponentPushToken[abc]' })
    mockRpc.mockResolvedValue({ error: null })
    await bildirimJetonunuSil()
    expect(mockRpc).toHaveBeenCalledWith('jeton_sil', { p_jeton: 'ExponentPushToken[abc]' })
  })

  it('jeton alinamazsa hata firlatmaz', async () => {
    mockJetonAl.mockRejectedValue(new Error('jeton yok'))
    await expect(bildirimJetonunuSil()).resolves.toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
  })
})

describe('bildirimeDokunmaDinle', () => {
  function dinleyiciyiCalistir(data: Record<string, unknown>) {
    const geriCagirim = mockDinle.mock.calls[0][0]
    geriCagirim({ notification: { request: { content: { data } } } })
  }

  it("mesaj bildiriminde /sohbet/<id>'e yonlendirir", () => {
    const yonlendir = jest.fn()
    mockDinle.mockReturnValue({ remove: jest.fn() })
    bildirimeDokunmaDinle(yonlendir)
    dinleyiciyiCalistir({ tur: 'mesaj', kullaniciId: 'kisi-9' })
    expect(yonlendir).toHaveBeenCalledWith('/sohbet/kisi-9')
  })

  it('takip ve sohbet isteklerinde /baglar-a yonlendirir', () => {
    const yonlendir = jest.fn()
    mockDinle.mockReturnValue({ remove: jest.fn() })
    bildirimeDokunmaDinle(yonlendir)
    dinleyiciyiCalistir({ tur: 'takip_istegi', kullaniciId: 'kisi-1' })
    dinleyiciyiCalistir({ tur: 'sohbet_kabul', kullaniciId: 'kisi-2' })
    expect(yonlendir).toHaveBeenNthCalledWith(1, '/baglar')
    expect(yonlendir).toHaveBeenNthCalledWith(2, '/baglar')
  })

  it('bilinmeyen turde yonlendirme yapmaz', () => {
    const yonlendir = jest.fn()
    mockDinle.mockReturnValue({ remove: jest.fn() })
    bildirimeDokunmaDinle(yonlendir)
    dinleyiciyiCalistir({ tur: 'baska' })
    expect(yonlendir).not.toHaveBeenCalled()
  })

  it('cleanup dinleyiciyi kaldirir', () => {
    const remove = jest.fn()
    mockDinle.mockReturnValue({ remove })
    const kaldir = bildirimeDokunmaDinle(jest.fn())
    kaldir()
    expect(remove).toHaveBeenCalled()
  })

  it("web'de dinleyici kurmaz, cleanup zararsizdir", () => {
    Platform.OS = 'web'
    const kaldir = bildirimeDokunmaDinle(jest.fn())
    expect(mockDinle).not.toHaveBeenCalled()
    expect(() => kaldir()).not.toThrow()
  })
})
