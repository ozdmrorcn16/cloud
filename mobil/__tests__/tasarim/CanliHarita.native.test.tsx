import { render, screen, fireEvent } from '@testing-library/react-native'
// jest-expo iOS ontanimli: bu import `.native.tsx` dosyasini cozer.
import { CanliHarita, type HaritaMekani } from '../../src/tasarim/CanliHarita'

const MERKEZ = { lat: 40.19, lng: 29.06 }

function mekan(i: number, kisiSayisi = 0): HaritaMekani {
  return {
    id: `mekan-${i}`,
    ad: `Mekan ${i}`,
    // Her mekan merkezden biraz daha uzakta.
    konum: { lat: 40.19 + i * 0.001, lng: 29.06 },
    kisiSayisi,
  }
}

describe('CanliHarita (native)', () => {
  it('merkez yokken harita cizmez, ayni yukseklikte bos yuzey birakir', async () => {
    await render(<CanliHarita merkez={null} mekanlar={[mekan(1)]} />)

    expect(screen.getByTestId('canli-harita-bos')).toBeTruthy()
    expect(screen.queryByTestId('canli-harita')).toBeNull()
  })

  it('merkez gelince haritayi ve merkez ignesini cizer', async () => {
    await render(<CanliHarita merkez={MERKEZ} mekanlar={[]} />)

    expect(screen.getByTestId('canli-harita')).toBeTruthy()
    expect(screen.getByLabelText('Buradasın')).toBeTruthy()
  })

  it('kalabalik mekanin ignesinde kisi sayisi yazar', async () => {
    await render(<CanliHarita merkez={MERKEZ} mekanlar={[mekan(1, 7), mekan(2)]} />)

    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByLabelText('Mekan 1, 7 kişi burada')).toBeTruthy()
    expect(screen.getByLabelText('Mekan 2')).toBeTruthy()
  })

  it('igneye basinca mekan kimligiyle onMekanSec cagrilir', async () => {
    const onMekanSec = jest.fn()
    await render(<CanliHarita merkez={MERKEZ} mekanlar={[mekan(3, 2)]} onMekanSec={onMekanSec} />)

    fireEvent.press(screen.getByLabelText('Mekan 3, 2 kişi burada'))

    expect(onMekanSec).toHaveBeenCalledWith('mekan-3')
  })

  it('en fazla 12 igne cizer, kalabaliklar once gelir', async () => {
    const cok = Array.from({ length: 20 }, (_, i) => mekan(i + 1))
    // 20. mekan en uzak ama en kalabalik: listede olmali.
    cok[19] = { ...cok[19], kisiSayisi: 5 }

    await render(<CanliHarita merkez={MERKEZ} mekanlar={cok} />)

    expect(screen.getByLabelText('Mekan 20, 5 kişi burada')).toBeTruthy()
    // 12 mekan ignesi + 1 merkez ignesi.
    expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(13)
  })

  it('konumu olmayan mekani cizmez', async () => {
    await render(
      <CanliHarita
        merkez={MERKEZ}
        mekanlar={[{ id: 'x', ad: 'Konumsuz', konum: null, kisiSayisi: 3 }]}
      />
    )

    expect(screen.queryByLabelText('Konumsuz, 3 kişi burada')).toBeNull()
  })
})
