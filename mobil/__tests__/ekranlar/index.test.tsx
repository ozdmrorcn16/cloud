import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AnaSayfa from '../../src/app/index'
import { akisiGetir } from '../../lib/akis'
import type { AkisOgesi } from '../../lib/akis'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { checkIniSil, checkInNotunuGuncelle } from '../../lib/checkin'
import { etiketiKaldir } from '../../lib/etiket'
import { etkilesimOzetleriniGetir, yorumlariGetir } from '../../lib/etkilesim'

jest.mock('../../lib/akis', () => ({ akisiGetir: jest.fn() }))
jest.mock('../../lib/sohbet', () => ({ konusmalarimiGetir: jest.fn() }))
// requireActual: mock yalnizca AG CAGRILARINI degistiriyor, modulun
// sabitleri (NOT_EN_FAZLA) gercek kalsin. Bunlar mock'lanmis olsaydi
// `undefined` donerler ve `slice(0, undefined)` hicbir sey kirpmadan
// sessizce gecerdi - test bunu yakaladi.
jest.mock('../../lib/checkin', () => ({
  ...jest.requireActual('../../lib/checkin'),
  checkIniSil: jest.fn(),
  checkInNotunuGuncelle: jest.fn(),
}))
jest.mock('../../lib/etiket', () => ({ etiketiKaldir: jest.fn() }))
// requireActual: sabitler (YORUM_EN_FAZLA) gercek kalsin.
jest.mock('../../lib/etkilesim', () => ({
  ...jest.requireActual('../../lib/etkilesim'),
  etkilesimOzetleriniGetir: jest.fn(),
  begen: jest.fn(),
  begeniyiKaldir: jest.fn(),
  paylas: jest.fn(),
  yorumlariGetir: jest.fn(),
  yorumEkle: jest.fn(),
  yorumSil: jest.fn(),
  yorumuSikayetEt: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('../../lib/kisi-ara', () => ({ kisiAra: jest.fn() }))
jest.mock('../../lib/fotograf-url', () => ({
  profilFotografiUrl: jest.fn().mockResolvedValue('https://imzali/kisi.jpg'),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

function oge(ustune: Partial<AkisOgesi> = {}): AkisOgesi {
  return {
    id: 'checkin-1',
    kullaniciId: 'kullanici-2',
    kullaniciAdi: 'Ada',
    mekanId: 'mekan-1',
    mekanSemti: 'Nilüfer',
    avatarUrl: null,
    rumuz: null,
    mekanAdi: 'Sahil Kafe',
    notMetni: 'guzel bir aksam',
    fotografUrl: null,
    olusturmaZamani: new Date().toISOString(),
    canliMi: false,
    benimMi: false,
    etiketler: [],
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(akisiGetir as jest.Mock).mockResolvedValue([])
  ;(konusmalarimiGetir as jest.Mock).mockResolvedValue([])
  ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({
    'checkin-1': { begeni: 2, yorum: 1, begendim: false },
  })
  ;(yorumlariGetir as jest.Mock).mockResolvedValue([])
})

describe('AnaSayfa', () => {
  it('akistaki check-ini kisi ve mekan adiyla gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ada')).toBeTruthy()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
  })

  it('kullanici adi okunduysa kartta AD degil KULLANICI ADI kalin yazar', async () => {
    // Kullanicinin karari 2026-08-30: kartta "byorcun", bildirimde ad-soyad.
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ rumuz: 'ada_1' })])

    await render(<AnaSayfa />)

    expect(await screen.findByText('ada_1')).toBeTruthy()
    expect(screen.queryByText('Ada')).toBeNull()
  })

  it('fotografli check-in fotografiyla gelir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ fotografUrl: 'https://imzali/1.jpg' })])

    await render(<AnaSayfa />)

    expect(await screen.findByTestId('akis-fotografi')).toBeTruthy()
  })

  it('profil fotografi varsa serit isaretinde o gorunur', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ avatarUrl: 'https://imzali/avatar.jpg' }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByTestId('akis-avatari')).toBeTruthy()
  })

  it('fotograf yoksa ADIN bas harfi gorunur - kullanici adinin degil', async () => {
    // Kullanicinin karari 2026-08-28. `kullaniciAdi` alani adi tasiyor
    // (check_inler'de denormalize duran ad, karar #18); bas harf de
    // ondan aliniyor.
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ avatarUrl: null, kullaniciAdi: 'Deniz' }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByText('D')).toBeTruthy()
    expect(screen.queryByTestId('akis-avatari')).toBeNull()
  })

  it('canli check-in "su an burada" rozetiyle gosterilir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ canliMi: true })])

    await render(<AnaSayfa />)

    expect(await screen.findByText('şu an burada')).toBeTruthy()
  })

  it('kendi check-ini de akista gorunur', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ id: 'checkin-2', kullaniciId: 'kullanici-1', kullaniciAdi: 'Ben', benimMi: true }),
    ])

    await render(<AnaSayfa />)

    expect(await screen.findByText('Ben')).toBeTruthy()
  })

  it('kendi satirinda kisiye basinca kendi profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ kullaniciAdi: 'Ben', benimMi: true })])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ben'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil')
  })

  it('baskasinin satirinda kisiye basinca onun profiline gider', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
  })

  it('mekan adina basinca KONUM ekranini acar', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
  })

  it('arama sutununa yazilinca akis yerine KISI sonuclari cikar', async () => {
    // Kullanicinin istegi 2026-08-28: markanin altindaki sutundan
    // kullanici adi ya da isimle kisi aranabiliyor.
    const { kisiAra } = require('../../lib/kisi-ara')
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k-9', kullaniciAdi: 'denizy', ad: 'Deniz Yılmaz', fotograf: 'k-9/a.jpg' },
    ])
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    await fireEvent.changeText(
      screen.getByPlaceholderText('Ara'),
      'deniz'
    )

    expect(await screen.findByText('denizy')).toBeTruthy()
    expect(await screen.findByText('Deniz Yılmaz')).toBeTruthy()
    // Akis ekrandan cekiliyor: arama sonucu onun YERINE geliyor.
    expect(screen.queryByText('Sahil Kafe')).toBeNull()
  })

  it('akis bosken kesfetmeye yonlendirir', async () => {
    await render(<AnaSayfa />)

    expect(await screen.findByText('Akışın henüz boş')).toBeTruthy()
    fireEvent.press(screen.getByText('Mekanları keşfet'))
    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
  })

  it('akis yuklenemezse hata mesaji gosterir', async () => {
    ;(akisiGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))

    await render(<AnaSayfa />)

    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })

  it('BASKASININ check-in\'inde silme dugmesi YOK', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: false })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    expect(screen.queryByLabelText('Paylaşım seçenekleri')).toBeNull()
  })

  it('kendi check-in\'inde silme ONAY ISTIYOR, tek dokunusla silmiyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-sil'))

    // Onay penceresi acildi; silme HENUZ yapilmadi.
    expect(screen.getByText('Bu check-in kalıcı olarak silinsin mi?')).toBeTruthy()
    expect(checkIniSil).not.toHaveBeenCalled()
  })

  it('onaylanınca siler ve akistan kaldirir', async () => {
    ;(checkIniSil as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-sil'))
    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    expect(checkIniSil).toHaveBeenCalledWith('checkin-1')
    // Satir tek yerde duruyor; akistan kalkmasi profilden de
    // kalktigi anlamina geliyor.
    expect(await screen.findByText('Akışın henüz boş')).toBeTruthy()
  })

  it('vazgecince silmiyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-sil'))
    await fireEvent.press(screen.getByText('Vazgeç'))

    expect(checkIniSil).not.toHaveBeenCalled()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
  })

  // ---------------------------------------------------------------- //
  // DUZENLEME (kullanicinin istegi 2026-09-02)
  // ---------------------------------------------------------------- //

  it('BASKASININ paylasiminda secenek menusu YOK', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: false })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    expect(screen.queryByLabelText('Paylaşım seçenekleri')).toBeNull()
  })

  it('menudeki Duzenle notu MEVCUT haliyle aciyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))

    expect(screen.getByText('Paylaşımı düzenle')).toBeTruthy()
    // Alan BOS acilmiyor: mevcut not iceride.
    expect(screen.getByTestId('duzenle-not').props.value).toBe('guzel bir aksam')
  })

  it('MEKAN VE ZAMANIN degismedigini ekranda soyluyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))

    expect(screen.getByText('Mekan ve zaman değişmez')).toBeTruthy()
  })

  it('notu degistirip kaydedince sunucuya yaziyor ve kartta gorunuyor', async () => {
    ;(checkInNotunuGuncelle as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'yeni not')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(checkInNotunuGuncelle).toHaveBeenCalledWith('checkin-1', 'yeni not')
    expect(await screen.findByText('yeni not')).toBeTruthy()
  })

  it('notu bosaltip kaydetmek notu SILER', async () => {
    ;(checkInNotunuGuncelle as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), '')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(checkInNotunuGuncelle).toHaveBeenCalledWith('checkin-1', '')
    expect(screen.queryByText('guzel bir aksam')).toBeNull()
  })

  it('vazgecince notu DEGISTIRMIYOR', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'yazdim ama vazgectim')
    await fireEvent.press(screen.getByText('Vazgeç'))

    expect(checkInNotunuGuncelle).not.toHaveBeenCalled()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
  })

  it('etiketi kaldirinca sunucuya yaziyor ve karttan dusuyor', async () => {
    ;(etiketiKaldir as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ benimMi: true, etiketler: [{ kullaniciId: 'kisi-9', ad: 'Deniz' }] }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    expect(screen.getByText('Deniz')).toBeTruthy()

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.press(screen.getByLabelText('Deniz etiketini kaldır'))
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(etiketiKaldir).toHaveBeenCalledWith('checkin-1', 'kisi-9')
    expect(screen.queryByText('Deniz')).toBeNull()
  })

  it('sunucu reddedince hata gosteriyor ve kart ESKI halinde kaliyor', async () => {
    ;(checkInNotunuGuncelle as jest.Mock).mockRejectedValue(
      new Error('Bu paylaşım bulunamadı.')
    )
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'yeni not')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(await screen.findByText('Bu paylaşım bulunamadı.')).toBeTruthy()
    expect(screen.getByText('guzel bir aksam')).toBeTruthy()
  })

  it('not SINIRI asilmiyor: uzun metin 500 karakterde kirpiliyor', async () => {
    ;(checkInNotunuGuncelle as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'a'.repeat(600))
    await fireEvent.press(screen.getByText('Kaydet'))

    // Sunucuda da kisit var; buradaki kirpma kullaniciyi sinira
    // carptirmadan durduruyor.
    expect(checkInNotunuGuncelle).toHaveBeenCalledWith('checkin-1', 'a'.repeat(500))
  })

  // ---------------------------------------------------------------- //
  // YORUMLAR ALTTAN ACILIYOR (kullanicinin karari 2026-09-03)
  // ---------------------------------------------------------------- //

  it('yorum ikonu ALT SAYFAYI aciyor, yeni sayfaya GITMIYOR', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(await screen.findByLabelText('Yorumlar'))

    expect(await screen.findByTestId('yorum-sayfasi')).toBeTruthy()
    // Eski davranis `/yorumlar/<id>` sayfasina gidiyordu; o sayfa
    // kaldirildi, gezinme de kalkmali.
    expect(mockRouterPush).not.toHaveBeenCalledWith(
      expect.stringContaining('/yorumlar')
    )
  })

  it('alt sayfa o paylasimin yorumlarini yukluyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(await screen.findByLabelText('Yorumlar'))

    await waitFor(() => expect(yorumlariGetir).toHaveBeenCalledWith('checkin-1'))
  })

  // ---------------------------------------------------------------- //
  // FOTOGRAFA DOKUNMAK (kullanicinin bildirdigi hata 2026-09-03)
  // ---------------------------------------------------------------- //

  it('fotografa basinca HARITAYA GITMIYOR, buyuk gorunum aciliyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg' }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByTestId('akis-fotografi'))

    expect(await screen.findByTestId('fotograf-gorunumu')).toBeTruthy()
    // Kartin kendisi haritayi aciyor; fotograf o dokunusu YUTMALI.
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('buyuk gorunum kapatilabiliyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg' }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(screen.getByTestId('akis-fotografi'))
    await screen.findByTestId('fotograf-gorunumu')

    await fireEvent.press(screen.getByLabelText('Kapat'))

    expect(screen.queryByTestId('fotograf-gorunumu')).toBeNull()
  })

  it('KARTIN BOS YERINE basinca HICBIR YERE gitmiyor', async () => {
    // Kullanicinin bildirdigi hata 2026-09-04: "Paylasimda bos biryere
    // basinca konumun icine gidiyor, sadece konum yazisinin uzerine
    // basinca haritasina gitsin". Kartin kok Pressable'i butun govdeyi
    // haritaya baglamisti; not metnine ya da bos bir yere dokunmak da
    // sayiliyordu.
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg' }),
    ])

    await render(<AnaSayfa />)
    await fireEvent.press(await screen.findByText('guzel bir aksam'))

    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
