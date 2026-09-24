// node tipleri uygulama tsconfig'inde yok; dar tiplerle requireActual.
const fs = jest.requireActual('fs') as { readFileSync: (yol: string, kod: string) => string }
const path = jest.requireActual('path') as { join: (...p: string[]) => string }

/**
 * CANLI KAMERA IZNI (2026-09-24, kullanicinin bildirimi "Izin ver'e
 * basiyorum bir sey olmuyor"). Izin islevleri expo-camera'nin kokunden
 * degil `Camera` nesnesinden geliyor; kok duzeyden cagrilinca her cagri
 * TypeError oluyor ve izin HIC sorulmuyordu. Ekran testleri
 * `lib/kamera`yi tamamen taklit ettigi icin bunu goremedi - bu dosya
 * paketin GERCEK dosyasini okuyup sekli kilitliyor.
 */

jest.mock('expo-modules-core', () => ({
  ...jest.requireActual('expo-modules-core'),
  requireOptionalNativeModule: jest.fn(() => ({})),
}))

const mockIzin = { get: jest.fn(), request: jest.fn() }
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  // Gercek paketteki sekil: izinler YALNIZCA Camera nesnesinde.
  Camera: {
    getCameraPermissionsAsync: (...a: unknown[]) => mockIzin.get(...a),
    requestCameraPermissionsAsync: (...a: unknown[]) => mockIzin.request(...a),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { kameraIzinDurumu, kameraGorunumu } = require('./kamera') as typeof import('./kamera')

beforeEach(() => {
  mockIzin.get.mockReset()
  mockIzin.request.mockReset()
})

describe('expo-camera paket sekli', () => {
  it('kok dosya izin islevlerini DISA AKTARMIYOR, Camera nesnesinde tasiyor', () => {
    const kaynak = fs.readFileSync(
      path.join(process.cwd(), 'node_modules', 'expo-camera', 'build', 'index.js'),
      'utf8'
    )
    expect(kaynak).not.toMatch(/export\s+(async\s+)?function\s+getCameraPermissionsAsync/)
    expect(kaynak).toMatch(/export const Camera = \{[^}]*getCameraPermissionsAsync[^}]*requestCameraPermissionsAsync/)
  })
})

describe('kameraIzinDurumu', () => {
  it('izin verilmisse "verildi", onizleme bileseni gelir', async () => {
    mockIzin.get.mockResolvedValue({ granted: true, canAskAgain: true })
    expect(await kameraIzinDurumu(true)).toBe('verildi')
    expect(kameraGorunumu()).toBeTruthy()
    expect(mockIzin.request).not.toHaveBeenCalled()
  })

  it('verilmemis ve sorulabiliyorsa SISTEM PENCERESI acilir (request cagrilir)', async () => {
    mockIzin.get.mockResolvedValue({ granted: false, canAskAgain: true })
    mockIzin.request.mockResolvedValue({ granted: true, canAskAgain: true })
    expect(await kameraIzinDurumu(true)).toBe('verildi')
    expect(mockIzin.request).toHaveBeenCalledTimes(1)
  })

  it('kalici redde sormaz, "ayarlardan" doner', async () => {
    mockIzin.get.mockResolvedValue({ granted: false, canAskAgain: false })
    expect(await kameraIzinDurumu(true)).toBe('ayarlardan')
    expect(mockIzin.request).not.toHaveBeenCalled()
  })

  it('sor=false iken yalnizca okur', async () => {
    mockIzin.get.mockResolvedValue({ granted: false, canAskAgain: true })
    expect(await kameraIzinDurumu(false)).toBe('sorulabilir')
    expect(mockIzin.request).not.toHaveBeenCalled()
  })
})
