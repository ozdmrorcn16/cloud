import { render, screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'

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

/*
 * "HAREKETI AZALT" ACIK KABUL EDILIYOR ve bu bilincli bir olcum
 * karari. Acik oldugunda deger `setValue` ile ANINDA atanıyor; yay
 * yolunda ise `Animated.spring` zaman aliyor ve `useNativeDriver`
 * yuzunden JS tarafindaki deger jest'te hic ilerlemiyor - yani yay
 * yolu bu ortamda OLCULEMEZ.
 *
 * Olculen sey degerlerin KENDISI (buyume ve yukari tasma), ki iki
 * yolda da ayni; degisen tek sey oraya nasil gidildigi. Ustelik bu
 * ayni zamanda gercek bir iddia: hareket azaltilmis olsa bile basili
 * hal geri bildirimi KAYBOLMUYOR.
 */
jest.mock('../../src/tasarim/hareket', () => ({ useHareket: () => false }))

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
   * Etiketler referans varyantta yoktu ve bir sure kaldirilmislardi;
   * kullanici geri istedi (2026-09-07). Iddia silinmedi TERSINE
   * cevrildi, boylece sessizce yeniden kaldirilirlarsa test kirilir.
   */
  it('sekme adlarini etiket olarak gosterir', async () => {
    await render(<AltGezinme />)

    expect(screen.getByText('Ana sayfa')).toBeTruthy()
    expect(screen.getByText('Mesajlar')).toBeTruthy()
    expect(screen.getByText('Check-in')).toBeTruthy()

    // Erisilebilirlik etiketi de duruyor - gorsel etiketten bagimsiz.
    expect(screen.getByLabelText('Check-in yap')).toBeTruthy()
  })

  /**
   * Aktif sekmede IKON gizleniyor ama ETIKET gizlenmiyor: ikonun
   * yerini ustteki daire aliyor, etiket ise slotta kalan tek isaret.
   * Gizlenseydi aktif sekmenin adi hicbir yerde yazmazdi.
   */
  it('aktif sekmenin etiketi GORUNUR kaliyor', async () => {
    mockYol.mockReturnValue('/profil')
    await render(<AltGezinme />)

    expect(screen.getByTestId('sekme-ikonu/profil')).toHaveStyle({ opacity: 0 })
    expect(screen.getByText('Profil')).toBeTruthy()
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
  /*
   * BASILI HAL: BUYUYOR VE YUKARI CIKIYOR (kullanicinin istegi
   * 2026-09-10: "checkin dugmesi basilinca biraz buyusun, yukari dogru
   * ciksin, basildigi anlasilsin").
   *
   * SECILI hal ile KARISTIRILMAMALI: o hareket 2026-09-09'da
   * kaldirilmisti ve secili hal hala yalnizca RENK. Buradaki hareket
   * parmagin o an uzerinde olmasina bagli.
   */
  it('check-in dugmesi BASILINCA buyuyup yukari cikiyor (hareket azaltilmis olsa bile)', async () => {
    await render(<AltGezinme />)
    const daire = await screen.findByTestId('checkin-dugmesi-daire')

    const once = StyleSheet.flatten(daire.props.style) as {
      transform?: { scale?: number; translateY?: number }[]
    }
    const olcekOnce = once.transform?.find((d) => 'scale' in d)?.scale
    const yOnce = once.transform?.find((d) => 'translateY' in d)?.translateY
    expect(olcekOnce).toBe(1)
    expect(yOnce).toBe(0)

    const dugme = screen.getByLabelText('Check-in yap')
    await fireEvent(dugme, 'pressIn')

    const sonra = StyleSheet.flatten(
      screen.getByTestId('checkin-dugmesi-daire').props.style
    ) as { transform?: { scale?: number; translateY?: number }[] }
    const olcekSonra = sonra.transform?.find((d) => 'scale' in d)?.scale
    const ySonra = sonra.transform?.find((d) => 'translateY' in d)?.translateY

    expect(olcekSonra).toBeGreaterThan(1)
    // Negatif = YUKARI. Isaretin dogru olmasi onemli: pozitif deger
    // dugmeyi cubugun icine gomerdi.
    expect(ySonra).toBeLessThan(0)
  })

  /*
   * TRANSFORM ICTEKI DAIREDE, PRESSABLE'DA DEGIL.
   *
   * Pressable'a verilseydi altindaki "Check-in" ETIKETI de yukari
   * cikardi ve komsu etiketlerden ayrilirdi - tam bu hata
   * 2026-09-07'de yasandi (etiket komsularindan 18 px yukarida
   * kaliyordu).
   */
  it('basili halde ETIKET yerinde kaliyor', async () => {
    await render(<AltGezinme />)
    const dugme = await screen.findByLabelText('Check-in yap')
    await fireEvent(dugme, 'pressIn')

    const kap = StyleSheet.flatten(
      screen.getByLabelText('Check-in yap').props.style
    ) as { transform?: unknown }
    expect(kap.transform).toBeUndefined()
  })

  /*
   * NEON PARILTI KALDIRILDI (kullanicinin istegi 2026-09-10: "sabit
   * sutundaki tuslarin altinda neon isigi olmasin").
   *
   * IDDIA silinmedi, tersine cevrildi: turuncu golge geri gelirse bu
   * test kirilir. Golgenin KENDISI duruyor (dugmeyi cubuktan ayirmak
   * onun isi), yalnizca RENGI notre dondu.
   */
  it('dugmelerin altinda TURUNCU parilti yok', async () => {
    await render(<AltGezinme />)
    const daire = await screen.findByTestId('checkin-dugmesi-daire')
    const stil = StyleSheet.flatten(daire.props.style) as { shadowColor?: string }

    expect(stil.shadowColor?.toUpperCase()).not.toBe('#FE7813')
  })
})
