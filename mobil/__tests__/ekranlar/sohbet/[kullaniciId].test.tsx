import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import SohbetEkrani from '../../../src/app/sohbet/[kullaniciId]'
import {
  konusmalarimiGetir,
  mesajlariGetir,
  mesajGonder,
  konusmayiOkunduIsaretle,
  mesajlaraAbonelOl,
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
} from '../../../lib/sohbet'
import type { Konusma, Mesaj } from '../../../lib/sohbet'
import { avatarlariGetir } from '../../../lib/akis'

jest.mock('../../../lib/akis', () => ({ avatarlariGetir: jest.fn() }))

jest.mock('../../../lib/sohbet', () => ({
  konusmalarimiGetir: jest.fn(),
  mesajlariGetir: jest.fn(),
  mesajGonder: jest.fn(),
  konusmayiOkunduIsaretle: jest.fn(),
  konusmayiGizle: jest.fn(),
  mesajlaraAbonelOl: jest.fn(),
  mesajIsteklerimiGetir: jest.fn(),
  mesajIsteginiKabulEt: jest.fn(),
  mesajIsteginiReddet: jest.fn(),
}))

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
let mockGeriGidilebilir = true
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    canGoBack: () => mockGeriGidilebilir,
  }),
  useLocalSearchParams: () => ({ kullaniciId: 'kullanici-2' }),
}))

// Kendi mesajim / karsi tarafin mesaji ayrimi oturum kimligine bakiyor.
// Mock olmadan oturum null kalir, her mesaj "karsi taraf" sayilirdi ve
// kendi mesajina sikayet acilmadigini olcen test hicbir sey olcmezdi.
jest.mock('../../../lib/oturum', () => ({
  useOturum: () => ({ oturum: { user: { id: 'kullanici-1' } }, yukleniyor: false }),
}))

function konusma(ustune: Partial<Konusma> = {}): Konusma {
  return {
    konusmaId: 'konusma-1',
    kisiId: 'kullanici-2',
    kullaniciAdi: 'ada123',
    ad: 'Ada',
    sonMesaj: 'Iki',
    sonMesajZamani: '2026-08-20T10:02:00Z',
    okunmamis: 0,
    yazilabilirMi: true,
    ...ustune,
  }
}

function mesaj(ustune: Partial<Mesaj> = {}): Mesaj {
  return {
    id: 'm1',
    gonderenId: 'kullanici-2',
    metin: 'Bir',
    olusturuldu: '2026-08-20T10:01:00Z',
    ...ustune,
  }
}

const bosAbonelikIptali = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma()])
  ;(mesajlariGetir as jest.Mock).mockResolvedValue([])
  ;(konusmayiOkunduIsaretle as jest.Mock).mockResolvedValue(undefined)
  ;(mesajlaraAbonelOl as jest.Mock).mockReturnValue(bosAbonelikIptali)
  ;(avatarlariGetir as jest.Mock).mockResolvedValue({})
})

describe('SohbetEkrani', () => {
  it('gecmis mesajlari yeniden eskiye listeler', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm3', metin: 'Uc', olusturuldu: '2026-08-20T10:03:00Z' }),
      mesaj({ id: 'm2', metin: 'Iki', olusturuldu: '2026-08-20T10:02:00Z' }),
      mesaj({ id: 'm1', metin: 'Bir', olusturuldu: '2026-08-20T10:01:00Z' }),
    ])

    await render(<SohbetEkrani />)

    const satirlar = await screen.findAllByTestId('mesaj-metni')
    expect(satirlar.map((s) => s.props.children)).toEqual(['Uc', 'Iki', 'Bir'])
  })

  it('yazip gonderince mesajGonder dogru kullanici id ve metinle cagrilir, giris alani temizlenir', async () => {
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(mesajGonder).toHaveBeenCalledWith('kullanici-2', 'Merhaba')
    })
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('')
    })
  })

  it('gonderme reddedilirse hata gorunur, metin girdide kalir ve iyimser satir listeden kalkar', async () => {
    ;(mesajGonder as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('Merhaba')
    // Iyimser eklenen satir geri alinmali: gonderilemeyen mesaj
    // gonderilmis gibi durmasin.
    expect(screen.queryAllByTestId('mesaj-metni')).toHaveLength(0)
  })

  it('bos ya da yalnizca bosluk metinle gonder butonu etkin degil', async () => {
    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')

    await fireEvent.changeText(girdi, '   ')
    await fireEvent.press(screen.getByText('Gönder'))

    expect(mesajGonder).not.toHaveBeenCalled()
  })

  it('yazilabilirMi false donerse giris alani yerine kisa bir not gorunur ve gecmis yine okunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([konusma({ yazilabilirMi: false })])
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([mesaj({ id: 'm1', metin: 'Eski mesaj' })])

    await render(<SohbetEkrani />)

    expect(await screen.findByText('Eski mesaj')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Bir mesaj yaz...')).toBeNull()
    expect(screen.getByText('Bu kişiye şu an mesaj gönderemezsin.')).toBeTruthy()
  })

  it('konusma hic yoksa giris alani acik kalir ve ilk gonderme reddi hata olarak gorunur', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajGonder as jest.Mock).mockRejectedValue(new Error('Bu kişiye şu an mesaj gönderemezsin.'))

    await render(<SohbetEkrani />)
    expect(await screen.findByPlaceholderText('Bir mesaj yaz...')).toBeTruthy()

    await fireEvent.changeText(screen.getByPlaceholderText('Bir mesaj yaz...'), 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    expect(await screen.findByText('Bu kişiye şu an mesaj gönderemezsin.')).toBeTruthy()
    expect(screen.getByPlaceholderText('Bir mesaj yaz...').props.value).toBe('Merhaba')
  })

  it('ekran acilinca konusmayiOkunduIsaretle cagrilir', async () => {
    await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(konusmayiOkunduIsaretle).toHaveBeenCalledWith('konusma-1')
    })
  })

  it('konusma yokken konusmayiOkunduIsaretle cagrilmaz', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<SohbetEkrani />)
    await screen.findByPlaceholderText('Bir mesaj yaz...')

    expect(konusmayiOkunduIsaretle).not.toHaveBeenCalled()
  })

  // SOHBETTE SIKAYET GIRISI YOK (kullanicinin karari 2026-09-19):
  // ust bardaki "Sikayet et" dugmesi ve balona uzun basinca acilan
  // mesaj sikayeti kaldirildi. Sikayet yalnizca baskasinin profilindeki
  // uc nokta menusunden. Onceki uc test (dugme kullaniciyi sikayet eder,
  // konusma yokken de eder, uzun basis mesaji sikayet eder) bu yuzden
  // tersine dondu.
  it('ust barda "Sikayet et" dugmesi YOK', async () => {
    await render(<SohbetEkrani />)
    await screen.findByPlaceholderText('Bir mesaj yaz...')

    expect(screen.queryByText('Şikâyet et')).toBeNull()
  })

  it('karsi tarafin mesajina uzun basmak sikayet ACMAZ', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm42', gonderenId: 'kullanici-2', metin: 'Kotu soz' }),
    ])

    await render(<SohbetEkrani />)
    await fireEvent(await screen.findByText('Kotu soz'), 'longPress')

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('kendi mesajina uzun basmak sikayet acmaz', async () => {
    // Sunucu zaten reddediyor (Kendi mesajini sikayet edemezsin);
    // arayuz de bos bir yola sokmamali.
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm43', gonderenId: 'kullanici-1', metin: 'Benim mesajim' }),
    ])

    await render(<SohbetEkrani />)
    await fireEvent(await screen.findByText('Benim mesajim'), 'longPress')

    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('abonelik konusma id ile kuruluyor ve gelen mesaj listeye eklenir', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })

    await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(mesajlaraAbonelOl).toHaveBeenCalledWith('konusma-1', expect.any(Function))
    })

    expect(geldiCallback).not.toBeNull()
    await act(async () => {
      geldiCallback!(mesaj({ id: 'm-yeni', metin: 'Yeni gelen mesaj' }))
    })

    expect(await screen.findByText('Yeni gelen mesaj')).toBeTruthy()
  })

  it('gonderilen mesaj Realtime yansimasini beklemeden listede gorunur', async () => {
    // Abonelik kuruluyor ama geri cagri hic tetiklenmiyor: sunucudan
    // hicbir yansima gelmiyor. Konusma zaten var, yani gecmis de
    // yeniden cekilmiyor. Eski davranista bu senaryoda ekranda hicbir
    // balon olmazdi; simdi iyimser ekleme sayesinde var.
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((_konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    ;(mesajlariGetir as jest.Mock).mockClear()

    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(mesajGonder).toHaveBeenCalledWith('kullanici-2', 'Merhaba')
    })

    const satirlar = await screen.findAllByTestId('mesaj-metni')
    expect(satirlar.map((s) => s.props.children)).toEqual(['Merhaba'])
    // Satir gecmisin yeniden cekilmesinden gelmis olamaz...
    expect(mesajlariGetir).not.toHaveBeenCalled()
    // ...ve Realtime'dan da gelmis olamaz.
    expect(geldiCallback).not.toBeNull()
  })

  it('kendi mesajimizin Realtime yansimasi ikinci bir balon uretmez', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((_konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(mesajGonder).toHaveBeenCalled()
    })
    expect(await screen.findAllByTestId('mesaj-metni')).toHaveLength(1)

    // Sunucu ayni mesaji geri yansitiyor. Gonderen biziz, yani
    // gonderenId karsi tarafin id'si DEGIL.
    await act(async () => {
      geldiCallback!(mesaj({ id: 'm-sunucu', gonderenId: 'ben', metin: 'Merhaba' }))
    })

    const satirlar = screen.getAllByTestId('mesaj-metni')
    expect(satirlar.map((s) => s.props.children)).toEqual(['Merhaba'])
  })

  it('ekran acikken karsi taraftan mesaj gelince konusma yeniden okundu isaretlenir', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((_konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })

    await render(<SohbetEkrani />)
    await waitFor(() => {
      expect(konusmayiOkunduIsaretle).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      geldiCallback!(mesaj({ id: 'm-yeni', gonderenId: 'kullanici-2', metin: 'Yeni gelen' }))
    })

    // Ikinci cagri: mesaj kullanicinin gozunun onunde okundu, sayac
    // ekran acikken de ilerlemeli.
    await waitFor(() => {
      expect(konusmayiOkunduIsaretle).toHaveBeenCalledTimes(2)
    })
    expect(konusmayiOkunduIsaretle).toHaveBeenLastCalledWith('konusma-1')
  })

  it('kendi mesajimizin yansimasi konusmayi yeniden okundu isaretlemez', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((_konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })

    await render(<SohbetEkrani />)
    await waitFor(() => {
      expect(konusmayiOkunduIsaretle).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      geldiCallback!(mesaj({ id: 'm-benim', gonderenId: 'ben', metin: 'Kendi mesajim' }))
    })

    expect(konusmayiOkunduIsaretle).toHaveBeenCalledTimes(1)
  })

  it('konusma bu gonderimle acildiysa iyimser satir sunucu gecmisiyle degisir, mukerrer olmaz', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-9')
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm-sunucu', gonderenId: 'ben', metin: 'Merhaba' }),
    ])

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await waitFor(() => {
      expect(mesajlariGetir).toHaveBeenCalledWith('konusma-9')
    })
    await waitFor(() => {
      const satirlar = screen.getAllByTestId('mesaj-metni')
      expect(satirlar.map((s) => s.props.children)).toEqual(['Merhaba'])
    })
  })

  it('ekran kapaninca abonelik iptal edilir', async () => {
    const { unmount } = await render(<SohbetEkrani />)

    await waitFor(() => {
      expect(mesajlaraAbonelOl).toHaveBeenCalled()
    })

    await unmount()

    expect(bosAbonelikIptali).toHaveBeenCalled()
  })
})

/**
 * MESAJ ISTEGI EKRANI (kullanicinin karari 2026-09-01).
 *
 * Bekleyen bir istegin konusmasi `konusmalarim` listesinde YOK - sunucu
 * onu ayiriyor. Ekran bu durumda istekler listesinden bulup mesajlari
 * yine de gostermeli: kullanici "mesaji okuyabilir ama onaylamadigi
 * surece isteklerde kalir".
 */
describe('SohbetEkrani - mesaj istegi', () => {
  beforeEach(() => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
    ;(mesajIsteklerimiGetir as jest.Mock).mockResolvedValue([
      {
        gonderenId: 'kullanici-2',
        kullaniciAdi: 'deniz',
        ad: 'Deniz',
        konusmaId: 'konusma-9',
        sonMesaj: 'Merhaba',
        sonMesajZamani: '2026-09-01T10:00:00Z',
      },
    ])
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      { id: 'm1', gonderenId: 'kullanici-2', metin: 'Merhaba', olusturuldu: '2026-09-01T10:00:00Z' },
    ])
    ;(mesajlaraAbonelOl as jest.Mock).mockReturnValue(() => {})
  })

  it('istek konusmasinin mesajlarini gosterir ve Kabul/Reddet sunar', async () => {
    render(<SohbetEkrani />)

    await waitFor(() => expect(screen.getByText('Merhaba')).toBeTruthy())
    expect(screen.getByText('Kabul et')).toBeTruthy()
    expect(screen.getByText('Reddet')).toBeTruthy()
  })

  it('Kabul et istegi onaylar', async () => {
    ;(mesajIsteginiKabulEt as jest.Mock).mockResolvedValue(undefined)
    render(<SohbetEkrani />)
    await waitFor(() => screen.getByText('Kabul et'))

    await fireEvent.press(screen.getByText('Kabul et'))

    await waitFor(() => expect(mesajIsteginiKabulEt).toHaveBeenCalledWith('kullanici-2'))
  })

  it('Reddet istegi siler', async () => {
    ;(mesajIsteginiReddet as jest.Mock).mockResolvedValue(undefined)
    render(<SohbetEkrani />)
    await waitFor(() => screen.getByText('Reddet'))

    await fireEvent.press(screen.getByText('Reddet'))

    await waitFor(() => expect(mesajIsteginiReddet).toHaveBeenCalledWith('kullanici-2'))
  })
})

// 2026-09-14, kullanicinin uc istegi: ust barda karsi tarafin profil
// resmi, kendi mesajimin altinda "Teslim edildi", yazma kutusunun
// klavyenin altinda kalmamasi.
describe('SohbetEkrani - profil resmi ve teslim durumu', () => {
  it('ust barda karsi tarafin avatari adin yaninda; fotografi varsa resim', async () => {
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({ 'kullanici-2': 'https://x/ada.jpg' })

    await render(<SohbetEkrani />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    await waitFor(() => expect(avatarlariGetir).toHaveBeenCalledWith(['kullanici-2']))
    await waitFor(() =>
      expect(screen.getByTestId('sohbet-avatar').props.source).toEqual([{ uri: 'https://x/ada.jpg' }])
    )
  })

  it('fotografi yoksa bas harf; avatar cekilemezse ekran yine acilir', async () => {
    ;(avatarlariGetir as jest.Mock).mockRejectedValue(new Error('kova'))

    await render(<SohbetEkrani />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.queryByText('kova')).toBeNull()
  })

  it('ust bardaki avatara basinca karsi tarafin profili acilir', async () => {
    await render(<SohbetEkrani />)
    await screen.findByText('Ada')

    await fireEvent.press(screen.getByTestId('sohbet-avatar-dugmesi'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('ust bardaki ADA basinca da profil acilir (kullanicinin istegi 2026-09-18)', async () => {
    await render(<SohbetEkrani />)
    await screen.findByText('Ada')

    await fireEvent.press(screen.getByTestId('sohbet-ad'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('karsi balonun yanindaki avatara basinca profil acilir', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm1', gonderenId: 'kullanici-2', metin: 'Karsi 1' }),
    ])
    await render(<SohbetEkrani />)
    await screen.findByText('Karsi 1')

    await fireEvent.press(screen.getByTestId('balon-avatar-dugmesi-m1'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('"Teslim edildi" yalnizca EN SON kendi mesajimin altinda, karsi tarafinkinde hic', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm3', gonderenId: 'kullanici-2', metin: 'Karsi son' }),
      mesaj({ id: 'm2', gonderenId: 'kullanici-1', metin: 'Benim son' }),
      mesaj({ id: 'm1', gonderenId: 'kullanici-1', metin: 'Benim eski' }),
    ])

    await render(<SohbetEkrani />)
    await screen.findByText('Benim son')

    // Saatle birlikte: "13:01 · Teslim edildi"
    const teslimler = screen.getAllByText(/Teslim edildi/)
    expect(teslimler).toHaveLength(1)
    expect(screen.getByTestId('teslim-m2')).toBeTruthy()
    expect(screen.queryByTestId('teslim-m1')).toBeNull()
    expect(screen.queryByTestId('teslim-m3')).toBeNull()
  })

  it('sunucuya henuz ulasmamis (iyimser) mesajda "Teslim edildi" yazmaz, yansima gelince yazar', async () => {
    let geldiCallback: ((m: Mesaj) => void) | null = null
    ;(mesajlaraAbonelOl as jest.Mock).mockImplementation((_konusmaId, geldi) => {
      geldiCallback = geldi
      return bosAbonelikIptali
    })
    // Konusma zaten var: gonder() gecmisi yeniden CEKMEZ, iyimser satir
    // yansima gelene kadar yerelMi olarak kalir.
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await screen.findByText('Merhaba')
    expect(screen.queryByText(/Teslim edildi/)).toBeNull()

    await act(async () => {
      geldiCallback!(mesaj({ id: 's1', gonderenId: 'kullanici-1', metin: 'Merhaba' }))
    })
    expect(screen.getByText(/Teslim edildi/)).toBeTruthy()
  })

  it('hic kendi mesajim yoksa "Teslim edildi" hic gorunmez', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([mesaj({ id: 'm1', gonderenId: 'kullanici-2' })])

    await render(<SohbetEkrani />)
    await screen.findByText('Bir')

    expect(screen.queryByText(/Teslim edildi/)).toBeNull()
  })

  it('karsi tarafin HER mesajinin yaninda avatari var, kendi mesajimda yok', async () => {
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({ 'kullanici-2': 'https://x/ada.jpg' })
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm3', gonderenId: 'kullanici-2', metin: 'Karsi 2' }),
      mesaj({ id: 'm2', gonderenId: 'kullanici-1', metin: 'Benim' }),
      mesaj({ id: 'm1', gonderenId: 'kullanici-2', metin: 'Karsi 1' }),
    ])

    await render(<SohbetEkrani />)
    await screen.findByText('Karsi 2')

    await waitFor(() =>
      expect(screen.getByTestId('balon-avatar-m3').props.source).toEqual([{ uri: 'https://x/ada.jpg' }])
    )
    expect(screen.getByTestId('balon-avatar-m1')).toBeTruthy()
    expect(screen.queryByTestId('balon-avatar-m2')).toBeNull()
  })

  // GERI DUGMESI (kullanicinin istegi 2026-09-14: "mesajdan geri cikma
  // ekle"). Uygulamada Stack yok, ekranin kendi geri oku olmali.
  it('ust bardaki geri oku bir onceki ekrana doner', async () => {
    mockGeriGidilebilir = true
    await render(<SohbetEkrani />)
    await screen.findByText('Ada')

    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(mockRouterBack).toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalledWith('/mesajlar')
  })

  it('gecmis yoksa (bildirimden acildi) geri oku Mesajlar listesine gider', async () => {
    mockGeriGidilebilir = false
    await render(<SohbetEkrani />)
    await screen.findByText('Ada')

    await fireEvent.press(screen.getByLabelText('Geri'))

    expect(mockRouterBack).not.toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith('/mesajlar')
  })

  // SAAT VE GUN AYRACI (kullanicinin istegi 2026-09-14: "mesajlarin
  // yazilan saatleri, tarihleri, sohbet tarihi belli olsun").
  it('her balonun altinda saat, gun degisince ortada gun ayraci', async () => {
    const bugun = new Date()
    bugun.setHours(14, 5, 0, 0)
    const dun = new Date(bugun.getTime() - 24 * 60 * 60 * 1000)
    dun.setHours(9, 30, 0, 0)
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm3', gonderenId: 'kullanici-1', metin: 'Bugunku', olusturuldu: bugun.toISOString() }),
      mesaj({ id: 'm2', gonderenId: 'kullanici-2', metin: 'Dunku 2', olusturuldu: new Date(dun.getTime() + 60000).toISOString() }),
      mesaj({ id: 'm1', gonderenId: 'kullanici-2', metin: 'Dunku 1', olusturuldu: dun.toISOString() }),
    ])

    await render(<SohbetEkrani />)
    await screen.findByText('Bugunku')

    // Saatler
    expect(screen.getByText('14:05 · Teslim edildi')).toBeTruthy()
    expect(screen.getByText('09:31')).toBeTruthy()
    expect(screen.getByText('09:30')).toBeTruthy()
    // Ayraclar: en eski mesajin ustunde "Dün", gun degisiminde "Bugün";
    // ayni gunun ikinci mesajinda ayrac YOK.
    expect(screen.getByTestId('gun-ayraci-m1').props.children).toBe('Dün')
    expect(screen.getByTestId('gun-ayraci-m3').props.children).toBe('Bugün')
    expect(screen.queryByTestId('gun-ayraci-m2')).toBeNull()
  })

  // HATA (kullanicinin bildirimi 2026-09-14): gondere basinca mesaj bir
  // an karsi taraf yazmis gibi (sol, avatarli) gorunuyordu. Iyimser
  // satirin gonderenId'si bos string'di, "benim mi" kontrolu dusuyordu.
  it('iyimser satir sunucu yansimasi gelmeden de KENDI balonum olarak cizilir', async () => {
    ;(mesajlaraAbonelOl as jest.Mock).mockReturnValue(bosAbonelikIptali)
    ;(mesajGonder as jest.Mock).mockResolvedValue('konusma-1')

    await render(<SohbetEkrani />)
    const girdi = await screen.findByPlaceholderText('Bir mesaj yaz...')
    await fireEvent.changeText(girdi, 'Merhaba')
    await fireEvent.press(screen.getByText('Gönder'))

    await screen.findByText('Merhaba')
    // Karsi balonun isareti avatar: iyimser satirda OLMAMALI.
    expect(screen.queryAllByTestId(/^balon-avatar-/)).toHaveLength(0)
    // ...ve kendi balonumun altinda saat cizilir (sag hizali alt yazi).
    expect(screen.getByTestId(/^saat-yerel:/)).toBeTruthy()
  })
})
