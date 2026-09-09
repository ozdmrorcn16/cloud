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

  /**
   * Igne artik SAYI degil AD + DURUM tasiyor (2026-09-06, referans
   * gorsel). Sayi kalabalik mekanin erisilebilirlik etiketinde
   * duruyor; sakin mekan da artik ciziliyor ve durumunu soyluyor.
   */
  it('igne ad ve durum tasiyor; sakin mekan da ciziliyor', async () => {
    await render(<CanliHarita merkez={MERKEZ} mekanlar={[mekan(1, 7), mekan(2)]} />)

    expect(screen.getByLabelText('Mekan 1, 7 kişi burada')).toBeTruthy()
    expect(screen.getByLabelText('Mekan 2, Sakin')).toBeTruthy()
  })

  it('igneye basinca mekan kimligiyle onMekanSec cagrilir', async () => {
    const onMekanSec = jest.fn()
    await render(<CanliHarita merkez={MERKEZ} mekanlar={[mekan(3, 2)]} onMekanSec={onMekanSec} />)

    fireEvent.press(screen.getByLabelText('Mekan 3, 2 kişi burada'))

    expect(onMekanSec).toHaveBeenCalledWith('mekan-3')
  })

  /**
   * SAKIN MEKANLAR HARITADA CIZILMIYOR (kullanicinin istegi 2026-09-01:
   * "Harita uzerinde bu gri noktalari kaldir, mekan konumlarini
   * gosteren turuncu ikon kalsin").
   *
   * Gri noktalar haritayi dolduruyordu ve hicbir sey anlatmiyordu.
   *
   * 2026-09-06'DA DEGISTI (kullanicinin referans gorseli): igneler
   * artik ANLAM TASIYOR - her biri renkli, yaninda mekanin adi ve
   * durumu (Sakin / Yogun / Populer) yaziyor. Yani "hicbir sey
   * anlatmayan gri nokta" itirazi ortadan kalkti; sakin mekanlar da
   * yesil igneyle ciziliyor.
   *
   * 2026-09-09'DA BIR KEZ DAHA DEGISTI (kullanicinin istegi):
   * "yakinindaki mekanlar listesinde gorunen butun yerler haritada o
   * anlik gosterilsin". Sayi siniri ve aralik kurali artik IGNEYI
   * degil yalnizca ADIN yazilip yazilmayacagini belirliyor - cakisan
   * sey igne degil etiketti.
   */
  it('LISTEDEKI HER mekanin ignesini cizer (+ merkez)', async () => {
    const cok = Array.from({ length: 20 }, (_, i) => mekan(i + 1))
    cok[19] = { ...cok[19], kisiSayisi: 5 }

    await render(<CanliHarita merkez={MERKEZ} mekanlar={cok} />)

    // 20 mekan ignesi + 1 merkez ignesi. Etiketler yine eleniyor ama
    // igneler eksiksiz: kullanici listede gordugu yeri haritada da
    // gormek istiyor.
    expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(21)
  })

  /**
   * SIRALAMA: once kalabalik olanlar. Haritanin cevaplamasi gereken
   * soru "su an nerede hareket var" - bes yer varsa kalabalik olani
   * eleyip sakin birini cizmek yanlis olurdu.
   */
  it('kalabalik mekan, sakinlerin arasinda bile CIZILIYOR', async () => {
    const cok = Array.from({ length: 20 }, (_, i) => mekan(i + 1))
    // 20. mekan en UZAK ve tek kalabalik olan; yine de listeye girmeli.
    cok[19] = { ...cok[19], kisiSayisi: 5 }

    await render(<CanliHarita merkez={MERKEZ} mekanlar={cok} />)

    expect(screen.getByLabelText('Mekan 20, 5 kişi burada')).toBeTruthy()
  })

  it('sakin mekanin ignesi DURUMUNU soyluyor', async () => {
    const sakinler = Array.from({ length: 3 }, (_, i) => mekan(i + 1))

    await render(<CanliHarita merkez={MERKEZ} mekanlar={sakinler} />)

    expect(screen.getByLabelText('Mekan 1, Sakin')).toBeTruthy()
    // 3 mekan + merkez.
    expect(screen.getAllByTestId('harita-ignesi')).toHaveLength(4)
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
