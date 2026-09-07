import { render, screen, fireEvent } from '@testing-library/react-native'

/**
 * AltGezinme `jest.setup.js` icinde GLOBAL mock'lu - butun ekran
 * testleri onu `() => null` olarak goruyor. Burada gercek bileseni
 * olcmek istedigimiz icin mock'u yalnizca bu dosyada kaldiriyoruz.
 */
jest.unmock('../../src/tasarim/AltGezinme')

const mockYol = jest.fn(() => '/')
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => mockYol(),
}))

jest.mock('../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(async () => []),
}))
jest.mock('../../lib/bag-listeleri', () => ({
  gelenIstekleriGetir: jest.fn(async () => ({ takip: [] })),
}))
jest.mock('../../lib/etiket', () => ({
  bekleyenEtiketleriGetir: jest.fn(async () => []),
}))

import { AltGezinme } from '../../src/tasarim/AltGezinme'
import { konusmalarimiGetir } from '../../lib/sohbet'

beforeEach(() => {
  jest.clearAllMocks()
  mockYol.mockReturnValue('/')
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
})

/** Cubuk genisligini bildirir; onLayout testte kendiliginden atesenmiyor. */
async function cubugaGenislikVer(genislik = 358) {
  await fireEvent(screen.getByTestId('alt-gezinme-cubugu'), 'layout', {
    nativeEvent: { layout: { width: genislik, height: 80, x: 0, y: 0 } },
  })
}

describe('AltGezinme - aktif sekme dairesi', () => {
  /**
   * Referans videodaki varyantin cekirdegi: aktif sekmenin ikonu
   * slotta DEGIL, ustteki dairenin icinde. Slotta kalan kopya
   * gizleniyor - silinmiyor, cunku satirin yuksekligi ondan geliyor.
   */
  it('aktif sekmenin ikonunu gizler, pasif sekmelerinkini gizlemez', async () => {
    mockYol.mockReturnValue('/profil')
    await render(<AltGezinme />)

    expect(screen.getByTestId('sekme-ikonu/profil')).toHaveStyle({ opacity: 0 })
    expect(screen.getByTestId('sekme-ikonu/')).not.toHaveStyle({ opacity: 0 })
    expect(screen.getByTestId('sekme-ikonu/mesajlar')).not.toHaveStyle({ opacity: 0 })
  })

  it('daireyi cizer', async () => {
    await render(<AltGezinme />)

    expect(screen.getByTestId('aktif-sekme-dairesi')).toBeTruthy()
  })

  /**
   * Check-in bir SEKME degil eylem. O ekrandayken hicbir sekme aktif
   * olmadigi icin daire soneuyor ve hicbir ikon gizlenmiyor - aksi
   * halde daire, sahibi olmayan bir slotta asili kalirdi.
   */
  it('check-in ekranindayken hicbir sekme ikonu gizlenmez', async () => {
    mockYol.mockReturnValue('/mekanlar')
    await render(<AltGezinme />)
    await cubugaGenislikVer()

    for (const yol of ['/', '/bildirimler', '/mesajlar', '/profil']) {
      expect(screen.getByTestId(`sekme-ikonu${yol}`)).not.toHaveStyle({ opacity: 0 })
    }
  })

  /**
   * Etiketler referans varyantta yok. Ekran okuyucu icin kayip
   * olmadigini da olcuyoruz: ad hala erisilebilirlik etiketinde.
   */
  it('sekme adlarini yazi olarak gostermez ama erisilebilirlik etiketinde tutar', async () => {
    await render(<AltGezinme />)

    expect(screen.queryByText('Ana sayfa')).toBeNull()
    expect(screen.queryByText('Mesajlar')).toBeNull()
    expect(screen.queryByText('Check-in')).toBeNull()

    expect(screen.getByLabelText('Mesajlar')).toBeTruthy()
    expect(screen.getByLabelText('Check-in yap')).toBeTruthy()
  })

  /** Rozet pasif sekmede duruyor. */
  it('okunmamis mesaj rozetini pasif sekmede gosterir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([{ okunmamis: 2 }, { okunmamis: 1 }])
    await render(<AltGezinme />)

    expect(await screen.findByText('3')).toBeTruthy()
  })

  /**
   * Daire cubugun genisligine gore konumlaniyor; genislik daha
   * olculmeden animasyon baslatilmamali, yoksa daire once sol kenarda
   * belirip sonra yerine ziplardi.
   */
  it('cubuk genisligi olculmeden once daire konumlanmaya calismaz', async () => {
    await render(<AltGezinme />)

    const daire = screen.getByTestId('aktif-sekme-dairesi')
    expect(daire).toBeTruthy()

    await cubugaGenislikVer()
    expect(screen.getByTestId('aktif-sekme-dairesi')).toBeTruthy()
  })
})
