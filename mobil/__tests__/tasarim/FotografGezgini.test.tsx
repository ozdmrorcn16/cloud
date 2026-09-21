import { render, screen, waitFor } from '@testing-library/react-native'
import { State } from 'react-native-gesture-handler'
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils'
import { FotografGezgini } from '../../src/tasarim/FotografGezgini'

/**
 * Fotograf gezgini: DIKEY SURUKLEME KAPATIR (kullanicinin istegi
 * 2026-09-22: "fotograf buyuk acikken yukari ya da asagi kaydirma
 * yapinca kapansin"). Yatay kaydirma sayfa gecisi olarak kalir.
 */

const fotograflar = [
  { id: 'a', url: 'https://imzali/a.jpg' },
  { id: 'b', url: 'https://imzali/b.jpg' },
]

function surukle(translationY: number, velocityY = 0) {
  fireGestureHandler(getByGestureTestId('fotograf-surukleme'), [
    { state: State.BEGAN, translationY: 0 },
    { state: State.ACTIVE, translationY: translationY / 2 },
    { state: State.ACTIVE, translationY },
    { state: State.END, translationY, velocityY },
  ])
}

describe('FotografGezgini dikey surukleme', () => {
  it('ASAGI yeterince surukleyince kapanir', async () => {
    const onKapat = jest.fn()
    await render(<FotografGezgini fotograflar={fotograflar} acikIndeks={0} onIndeks={jest.fn()} onKapat={onKapat} />)
    surukle(180)
    await waitFor(() => expect(onKapat).toHaveBeenCalledTimes(1))
  })

  it('YUKARI surukleyince de kapanir', async () => {
    const onKapat = jest.fn()
    await render(<FotografGezgini fotograflar={fotograflar} acikIndeks={1} onIndeks={jest.fn()} onKapat={onKapat} />)
    surukle(-180)
    await waitFor(() => expect(onKapat).toHaveBeenCalledTimes(1))
  })

  it('kisa ama HIZLI fiske de kapatir', async () => {
    const onKapat = jest.fn()
    await render(<FotografGezgini fotograflar={fotograflar} acikIndeks={0} onIndeks={jest.fn()} onKapat={onKapat} />)
    surukle(40, 1500)
    await waitFor(() => expect(onKapat).toHaveBeenCalledTimes(1))
  })

  it('kisa ve yavas surukleme KAPATMAZ, yerine oturur', async () => {
    const onKapat = jest.fn()
    await render(<FotografGezgini fotograflar={fotograflar} acikIndeks={0} onIndeks={jest.fn()} onKapat={onKapat} />)
    surukle(40, 100)
    await new Promise((r) => setTimeout(r, 50))
    expect(onKapat).not.toHaveBeenCalled()
    expect(screen.getByTestId('fotograf-buyuk-gorunum')).toBeTruthy()
  })

  it('surukleme tutamaci TEK parmakla calisir (iki parmak yakinlastirmaya kalir) ve yatay harekette geri cekilir', async () => {
    await render(<FotografGezgini fotograflar={fotograflar} acikIndeks={0} onIndeks={jest.fn()} onKapat={jest.fn()} />)
    const t = getByGestureTestId('fotograf-surukleme')
    expect(t.config.maxPointers).toBe(1)
    // Yatayda 12 px'ten sonra bu tutamac vazgecer: sayfa kaydirmasi kalir.
    expect(t.config.failOffsetXStart).toBe(-12)
    expect(t.config.failOffsetXEnd).toBe(12)
    expect(t.config.activeOffsetYStart).toBe(-12)
    expect(t.config.activeOffsetYEnd).toBe(12)
  })
})
