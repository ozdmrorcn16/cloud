import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native'
import { FotografSeridi } from '../../src/tasarim/FotografSeridi'

/**
 * Akis kartinin fotograf alani (coklu fotograf, 2026-09-21).
 */

function olcumVer(en = 390) {
  fireEvent(screen.getByTestId('akis-fotografi-serit'), 'layout', {
    nativeEvent: { layout: { width: en, height: en / 2 } },
  })
}

describe('FotografSeridi', () => {
  it('hic fotograf yoksa hicbir sey cizmez', async () => {
    await render(<FotografSeridi urller={[]} onDokun={jest.fn()} />)
    expect(screen.queryByTestId('akis-fotografi-serit')).toBeNull()
  })

  it('TEK fotografta rozet ve nokta YOK; dokununca indeks 0 gelir', async () => {
    const onDokun = jest.fn()
    await render(<FotografSeridi urller={['https://imzali/1.jpg']} onDokun={onDokun} />)
    expect(screen.getByTestId('akis-fotografi')).toBeTruthy()
    expect(screen.queryByTestId('akis-fotografi-rozeti')).toBeNull()
    fireEvent.press(screen.getByTestId('akis-fotografi'))
    expect(onDokun).toHaveBeenCalledWith(0)
  })

  it('UC fotografta uc sayfa, rozet "1/3", dokunulan sayfanin indeksi gelir', async () => {
    const onDokun = jest.fn()
    await render(
      <FotografSeridi
        urller={['https://imzali/1.jpg', 'https://imzali/2.jpg', 'https://imzali/3.jpg']}
        onDokun={onDokun}
      />
    )
    await act(async () => olcumVer())
    expect(screen.getByTestId('akis-fotografi-0')).toBeTruthy()
    expect(screen.getByTestId('akis-fotografi-2')).toBeTruthy()
    expect(screen.getByTestId('akis-fotografi-rozeti').props.children.join('')).toBe('1/3')
    fireEvent.press(screen.getByTestId('akis-fotografi-1'))
    expect(onDokun).toHaveBeenCalledWith(1)
  })

  it('kaydirma bitince rozet yeni sayfayi yazar', async () => {
    await render(
      <FotografSeridi urller={['https://imzali/1.jpg', 'https://imzali/2.jpg']} onDokun={jest.fn()} />
    )
    await act(async () => olcumVer(390))
    // Yatay liste ikinci sayfaya kaydirildi (x = bir sayfa eni).
    await fireEvent(screen.getByTestId('akis-fotografi-sayfalar'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 390, y: 0 } } })
    await waitFor(() => expect(screen.getByTestId('akis-fotografi-rozeti').props.children.join('')).toBe('2/2'))
  })
})
