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
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
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

  // Ust bardaki dugme artik DAIMA kullaniciyi sikayet eder. Eskiden
  // hedefTur='mesaj' ile KONUSMA id'si gonderiyordu; moderator "hangi
  // mesaj" sorusunu cevaplayamiyordu (Plan 2 Task 6, karar 62).
  it('ust bardaki sikayet dugmesi daima kullaniciyi sikayet eder', async () => {
    await render(<SohbetEkrani />)
    await fireEvent.press(await screen.findByText('Şikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })

  it('konusma henuz yokken de ust bar dugmesi kullaniciyi sikayet eder', async () => {
    ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])

    await render(<SohbetEkrani />)
    await fireEvent.press(await screen.findByText('Şikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })

  it('karsi tarafin mesajina uzun basinca o MESAJI sikayet eder', async () => {
    ;(mesajlariGetir as jest.Mock).mockResolvedValue([
      mesaj({ id: 'm42', gonderenId: 'kullanici-2', metin: 'Kotu soz' }),
    ])

    await render(<SohbetEkrani />)
    await fireEvent(await screen.findByText('Kotu soz'), 'longPress')

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=mesaj&hedefId=m42')
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
