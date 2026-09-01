import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MesajlarEkrani from '../../src/app/mesajlar'
import { konusmalarimiGetir, konusmayiGizle, mesajIsteklerimiGetir } from '../../lib/sohbet'
import type { Konusma } from '../../lib/sohbet'

jest.mock('../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
  konusmayiGizle: jest.fn(),
  mesajIsteklerimiGetir: jest.fn(),
}))

const mockRouterPush = jest.fn()
// useFocusEffect'i gercek useEffect gibi (mount'ta bir kez) davranacak
// sekilde taklit ediyoruz, ayrica sonuncu geri cagirmayi testlerin
// "yeniden odaklanma" simule edebilmesi icin disariya biriktiriyoruz. Set
// kullaniyoruz cunku bu ekranda konusma listesi her cekiste yeni bir dizi
// referansi aldigi icin (sayi rozetindeki gibi ayni deger bailout'u yok)
// bilesen birden fazla kez render olabiliyor; ayni useCallback referansi
// her render'da tekrar kaydedilirse dizi cogalirdi, Set bunu tekillestirir.
let mockOdakGeriCagirmalari = new Set<() => void>()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    mockOdakGeriCagirmalari.add(effect)
    require('react').useEffect(effect, [])
  },
}))

function konusma(ustune: Partial<Konusma> = {}): Konusma {
  return {
    konusmaId: 'k1',
    kisiId: 'u1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    sonMesaj: 'Selam, nasilsin?',
    sonMesajZamani: '2026-08-20T10:00:00Z',
    okunmamis: 0,
    yazilabilirMi: true,
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockOdakGeriCagirmalari = new Set<() => void>()
  // Ekran artik konusmalarla BIRLIKTE mesaj isteklerini de cekiyor
  // (Promise.all). Varsayilan bos: istegi olan testler kendi degerini
  // ayrica veriyor. Bu olmadan cagri undefined donuyor ve ekran hata
  // durumuna dusuyor.
  ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])
})

describe('MesajlarEkrani', () => {
  it('konusmalari karsi kisinin adi ve son mesaj onizlemesiyle listeler', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('Selam, nasilsin?')).toBeTruthy()
  })

  it('okunmamis sayisi sifirdan buyukse rozet gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 3 })])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('3')).toBeTruthy()
  })

  it('okunmamis sayisi sifirsa rozet hic render edilmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 0 })])

    await render(<MesajlarEkrani />)

    await screen.findByText('Orcun Ozdemir')
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('bir satira basinca kisi id ile sohbet rotasina yonlendirir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Orcun Ozdemir'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/u1'))
  })

  it('Gizle butonuna basinca konusmayiGizle dogru konusma id ile cagrilir ve satir listeden kalkar', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiGizle as jest.Mock).mockResolvedValue(undefined)

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Gizle'))

    await waitFor(() => expect(konusmayiGizle).toHaveBeenCalledWith('k1'))
    await waitFor(() => expect(screen.queryByText('Orcun Ozdemir')).toBeNull())
  })

  it('gizleme reddedilirse hata mesaji gorunur ve satir listede kalir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
    ;(konusmayiGizle as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<MesajlarEkrani />)
    await fireEvent.press(await screen.findByText('Gizle'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('liste bossa bos durum metni gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Henüz bir konuşman yok')).toBeTruthy()
  })

  it('silinmis karsi taraf icin "Silinmiş kullanıcı" gosterir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      konusma({
        kisiId: null,
        kullaniciAdi: null,
        ad: null,
        sonMesaj: 'eski mesaj',
        okunmamis: 0,
        yazilabilirMi: false,
      }),
    ])

    await render(<MesajlarEkrani />)

    expect(await screen.findByText('Silinmiş kullanıcı')).toBeTruthy()
  })

  it('ekrana yeniden odaklaninca listeyi tekrar ceker (useFocusEffect, tek seferlik useEffect degil)', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])

    await render(<MesajlarEkrani />)
    await waitFor(() => expect(konusmalarimiGetir).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()

    // konusma acilip okunmus, geri donulmus gibi: okunmamis sayisi
    // degisti VE ekran yeniden odaklandi. useEffect (deps: []) olsaydi
    // bu ikinci cagriyi hic yapmazdi - liste bayat kalirdi.
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ okunmamis: 0 })])
    await act(async () => {
      mockOdakGeriCagirmalari.forEach((geriCagirma) => geriCagirma())
    })

    await waitFor(() => expect(konusmalarimiGetir).toHaveBeenCalledTimes(2))
  })
})

/**
 * MESAJ ISTEKLERI (kullanicinin karari 2026-09-01): "Mesajlar kismina
 * uste istekler kismi ekle; arkadasin olmayan kisilerden gelen mesaj
 * istekleri burada gorunecek."
 *
 * Istekler listenin USTUNDE ayri bir bolumde duruyor; normal konusmalar
 * asagida kaliyor. Istege basinca sohbet aciliyor - okumak kabul etmez.
 */
describe('MesajlarEkrani - istekler bolumu', () => {
  it('bana gelen istekleri USTTE ayri bolumde gosterir', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([
      konusma({ konusmaId: 'k1', kisiId: 'kisi-9', ad: 'Bağlı Kişi' }),
    ])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([
      {
        gonderenId: 'kisi-1',
        kullaniciAdi: 'deniz',
        ad: 'Deniz',
        konusmaId: 'konusma-1',
        sonMesaj: 'Merhaba',
        sonMesajZamani: '2026-09-01T10:00:00Z',
      },
    ])

    render(<MesajlarEkrani />)

    await waitFor(() => expect(screen.getByText('Deniz')).toBeTruthy())
    expect(screen.getByText('İstekler')).toBeTruthy()
    // Bagli kisinin konusmasi da listede, ama ayri.
    expect(screen.getByText('Bağlı Kişi')).toBeTruthy()
  })

  it('istek yoksa Istekler bolumu HIC gorunmez', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([])

    render(<MesajlarEkrani />)

    await waitFor(() => expect(screen.getByText('Henüz bir konuşman yok')).toBeTruthy())
    expect(screen.queryByText('İstekler')).toBeNull()
  })

  it('istege basinca o kisinin sohbetini acar', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([
      {
        gonderenId: 'kisi-1',
        kullaniciAdi: 'deniz',
        ad: 'Deniz',
        konusmaId: 'konusma-1',
        sonMesaj: 'Merhaba',
        sonMesajZamani: '2026-09-01T10:00:00Z',
      },
    ])

    render(<MesajlarEkrani />)
    await waitFor(() => screen.getByText('Deniz'))

    await fireEvent.press(screen.getByText('Deniz'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/kisi-1')
  })
})
