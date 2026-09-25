import { Text } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { SekmeKaydirma } from '../../src/tasarim/SekmeKaydirma'
import { yatayAlan, yatayKilidiSifirla } from '../../lib/yatay-kilit'

const mockReplace = jest.fn()
let mockYol = '/'
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockYol,
}))

/**
 * ANA SEKMELER ARASI KAYDIRMA (2026-09-24): sola = sonraki, saga = onceki;
 * sira alt gezinmeyle ayni. Yatay kilit varken (harita, serit...) calismaz.
 */
function kaydir(dx: number, vx = 0) {
  fireGestureHandler(getByGestureTestId('sekme-kaydirma'), [
    { state: State.BEGAN, translationX: 0 },
    { state: State.ACTIVE, translationX: dx / 2, velocityX: vx },
    { state: State.ACTIVE, translationX: dx, velocityX: vx },
    { state: State.END, translationX: dx, velocityX: vx },
  ])
}

async function ciz() {
  await render(
    <SekmeKaydirma>
      <Text>icerik</Text>
    </SekmeKaydirma>
  )
  expect(screen.getByText('icerik')).toBeTruthy()
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  yatayKilidiSifirla()
  mockYol = '/'
})
afterEach(() => jest.useRealTimers())

const bekle = () => jest.runAllTimers()

describe('SekmeKaydirma', () => {
  it('ana sayfada SOLA kaydirma Bildirimler\'e gecer', async () => {
    await ciz()
    kaydir(-200)
    bekle()
    expect(mockReplace).toHaveBeenCalledWith('/bildirimler')
  })

  it('Mesajlar\'da SAGA kaydirma Check-in\'e (onceki) gecer', async () => {
    mockYol = '/mesajlar'
    await ciz()
    kaydir(220)
    bekle()
    expect(mockReplace).toHaveBeenCalledWith('/mekanlar')
  })

  it('kisa ve yavas kaydirma sekme DEGISTIRMEZ; hizli firlatma degistirir', async () => {
    mockYol = '/bildirimler'
    await ciz()
    kaydir(-40, 100)
    bekle()
    expect(mockReplace).not.toHaveBeenCalled()
    kaydir(-40, -900)
    bekle()
    expect(mockReplace).toHaveBeenCalledWith('/mekanlar')
  })

  it('ilk sekmede (ana sayfa) SAGA gecis YOK', async () => {
    await ciz()
    kaydir(250)
    bekle()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('son sekmede (profil) SOLA gecis YOK', async () => {
    mockYol = '/profil'
    await ciz()
    kaydir(-250)
    bekle()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('YATAY KILIT varken (harita, serit...) sekme degismez', async () => {
    await ciz()
    yatayAlan.onTouchStart()
    kaydir(-250)
    bekle()
    expect(mockReplace).not.toHaveBeenCalled()
    yatayAlan.onTouchEnd()
    kaydir(-250)
    bekle()
    expect(mockReplace).toHaveBeenCalledWith('/bildirimler')
  })

  it('ana sekme olmayan ekranda (sohbet) calismaz', async () => {
    mockYol = '/sohbet/abc'
    await ciz()
    kaydir(-250)
    bekle()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
