import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { acikRenk } from '../../src/tasarim/tema'
import AnaSayfa from '../../src/app/index'
import { akisiGetir } from '../../lib/akis'
import type { AkisOgesi } from '../../lib/akis'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { checkIniSil, checkInNotunuGuncelle } from '../../lib/checkin'
import { etiketiKaldir, etiketleriKaydet, etiketleriGetir } from '../../lib/etiket'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'
import { etkilesimOzetleriniGetir, yorumlariGetir } from '../../lib/etkilesim'

// AKIS_SAYFA_BOYU testte KUCULTULUYOR (3): FlatList sanallastirmasi
// varsayilan olarak yalnizca ilk 10 satiri ciziyor, yani 30'luk bir
// sayfada ikinci sayfanin ilk ogesi hic render edilmezdi ve iddia
// gercek davranisi degil sanallastirmayi olcerdi.
jest.mock('../../lib/akis', () => ({ akisiGetir: jest.fn(), AKIS_SAYFA_BOYU: 3 }))
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
jest.mock('../../lib/etiket', () => ({
  etiketiKaldir: jest.fn(),
  etiketleriKaydet: jest.fn(),
  etiketleriGetir: jest.fn().mockResolvedValue({}),
}))
// Yerinde duzenleme acilinca kart arkadas listesini cekiyor; gercek
// modul supabase'e gider.
jest.mock('../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
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

/** Ic ice stil dizilerini tek nesneye duzlestirir. */
function duzYazi(dugum: { props: { style?: unknown } }) {
  return StyleSheet.flatten(dugum.props.style) as {
    color?: string
    fontSize?: number
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(etiketleriKaydet as jest.Mock).mockResolvedValue(undefined)
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

    // AYRI PENCERE YOK (kullanicinin istegi 2026-09-05): duzenleme
    // kartin kendi icinde aciliyor.
    expect(screen.queryByText('Paylaşımı düzenle')).toBeNull()
    expect(screen.getByTestId('yerinde-duzenle')).toBeTruthy()
    // Alan BOS acilmiyor: mevcut not iceride.
    expect(screen.getByTestId('duzenle-not').props.value).toBe('guzel bir aksam')
  })

  it('"Mekan ve zaman değişmez" SATIRI YOK ama ikisi baslikta duruyor', async () => {
    // Kullanicinin istegi 2026-09-05: o satir kaldirildi. Bilgi
    // kaybolmadi - pencerenin basligi mekan adini ve zamani yaziyor,
    // ve ikisi de duzenlenebilir bir alan olarak gorunmuyor.
    //
    // KURALIN KENDISI DEGISMEDI: sunucudaki
    // `check_in_notunu_guncelle` yalnizca notu yaziyor. Onu
    // "notu degistirip kaydedince sunucuya yaziyor" testi olcuyor.
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))

    expect(screen.queryByText('Mekan ve zaman değişmez')).toBeNull()
    // Mekan adi pencerenin basliginda: neyin degismedigi yine belli.
    expect(screen.getAllByText(/Sahil Kafe/).length).toBeGreaterThan(0)
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

  /*
   * ARKADAS ETIKETLE (kullanicinin istegi 2026-09-18): duzenlemede buton,
   * basinca aranabilir liste (profil resmi + kullanici adi); secim
   * Kaydet'e kadar cip olarak durur, Kaydet etiketleri sunucuya yazar.
   * Onay kurali sunucuda (karsi tarafin ayari) - burada olculmez.
   */
  it('"Arkadaş etiketle" listeden secilen arkadasi Kaydet ile etiketler', async () => {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
      { id: 'k-9', kullaniciAdi: 'denizy', ad: 'Deniz Yılmaz', avatarUrl: 'https://x/d.jpg' },
      { id: 'k-8', kullaniciAdi: 'mert', ad: 'Mert Can', avatarUrl: null },
    ])
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ benimMi: true })])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))

    // Satir ici "+ ad" cipleri YOK; buton var.
    expect(screen.queryByText('+ Deniz Yılmaz')).toBeNull()
    await fireEvent.press(screen.getByTestId('arkadas-etiketle'))
    expect(await screen.findByTestId('arkadas-secici')).toBeTruthy()
    // Liste: profil resmi + kullanici adi.
    expect(screen.getByTestId('arkadas-avatar-k-9')).toBeTruthy()
    expect(screen.getByText('denizy')).toBeTruthy()

    // Arama kullanici adiyla da calisiyor.
    await fireEvent.changeText(screen.getByTestId('arkadas-secici-arama'), 'mer')
    expect(screen.queryByText('denizy')).toBeNull()
    expect(screen.getByText('mert')).toBeTruthy()
    await fireEvent.changeText(screen.getByTestId('arkadas-secici-arama'), '')

    await fireEvent.press(screen.getByLabelText('Deniz Yılmaz'))
    await fireEvent.press(screen.getByText('Tamam (1)'))
    // Secim cip olarak duruyor (KULLANICI ADIYLA, ad-soyad degil), sunucuya HENUZ gitmedi.
    expect(screen.getByLabelText('denizy etiketini kaldır')).toBeTruthy()
    expect(screen.getByText('denizy')).toBeTruthy()
    expect(screen.queryByText('Deniz Yılmaz')).toBeNull()
    expect(etiketleriKaydet).not.toHaveBeenCalled()

    // Sunucu (onay ayari kapali) etiketi hemen onayladi: yeniden okunup
    // karta yaziliyor - "Birlikte" satiri Kaydet'ten hemen sonra gorunur.
    ;(etiketleriGetir as jest.Mock).mockResolvedValue({
      'checkin-1': [{ kullaniciId: 'k-9', ad: 'Deniz Yılmaz', kullaniciAdi: 'denizy', avatarUrl: null }],
    })
    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    await waitFor(() => expect(etiketleriKaydet).toHaveBeenCalledWith('checkin-1', ['k-9']))
    expect(await screen.findByTestId('birlikte-k-9')).toBeTruthy()
  })

  it('etiketi kaldirinca sunucuya yaziyor ve karttan dusuyor', async () => {
    ;(etiketiKaldir as jest.Mock).mockResolvedValue(undefined)
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ benimMi: true, etiketler: [{ kullaniciId: 'kisi-9', ad: 'Deniz', kullaniciAdi: 'denizy', avatarUrl: null }] }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    // "Birlikte" satirinda AD YAZMAZ, yalnizca avatar (kullanicinin karari
    // 2026-09-18); avatar erisilebilirlik etiketiyle bulunuyor.
    expect(screen.getByTestId('birlikte-kisi-9')).toBeTruthy()
    expect(screen.queryByText('Deniz')).toBeNull()

    await fireEvent.press(screen.getByLabelText('Paylaşım seçenekleri'))
    await fireEvent.press(screen.getByTestId('menu-duzenle'))
    await fireEvent.press(screen.getByLabelText('denizy etiketini kaldır'))
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(etiketiKaldir).toHaveBeenCalledWith('checkin-1', 'kisi-9')
    expect(screen.queryByTestId('birlikte-kisi-9')).toBeNull()
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
    // DUZENLEME ACIK KALIYOR: yazilan metin kaybolmasin diye. Not
    // artik kartta duz metin degil, taslak olarak girdinin icinde -
    // yerinde duzenlemede ikisi ayni anda gorunmuyor.
    expect(screen.getByTestId('yerinde-duzenle')).toBeTruthy()
    expect(screen.getByTestId('duzenle-not').props.value).toBe('yeni not')
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

  // REFERANS DUZENI (2026-09-18 gece): fotograf kartin ICINDE, yuvarlak
  // koseli ve YATAY (16:7). Onceki "kenara yapisik, 4:5" deseni kalkti.
  // Buyuk gorunum fotografi kendi oraninda acar (contain).
  it('fotograf kartin icinde, yuvarlak koseli ve 16:7 yatay (referans)', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ fotografUrl: 'https://imzali/foto.jpg' })])
    await render(<AnaSayfa />)
    const kap = await screen.findByTestId('akis-fotografi')
    const stil = StyleSheet.flatten(typeof kap.props.style === 'function' ? kap.props.style({ pressed: false }) : kap.props.style)
    expect(stil.marginHorizontal).toBeUndefined()
    expect(stil.borderRadius).toBeGreaterThan(0)
    // Kart icindeki gorsel (jest'te yedek Image cizilir; testID ayni).
    const gorsel = screen.getAllByTestId('buyuk-fotograf')[0]
    expect(StyleSheet.flatten(gorsel.props.style).aspectRatio).toBeCloseTo(16 / 7)
  })

  it('"Birlikte" satirindaki avatara basinca etiketlenen kisinin profili acilir', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ etiketler: [{ kullaniciId: 'kisi-9', ad: 'Deniz', kullaniciAdi: 'denizy', avatarUrl: null }] }),
    ])
    await render(<AnaSayfa />)
    expect(await screen.findByText('Birlikte')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('birlikte-kisi-9'))
    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kisi-9')
  })

  it('fotograf hem kartta hem tam ekranda YAKINLASTIRILABILIR', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge({ fotografUrl: 'https://imzali/1.jpg' })])
    await render(<AnaSayfa />)

    // KARTIN ICINDE de zoom var (kullanicinin istegi 2026-09-08: "tam
    // ekran acilmadan da zoom yapma ekle").
    const kartKabi = await screen.findByTestId('yakinlastirilabilir')
    // GENISLIGI SIFIRLAYAN TUZAK (yasandi): kapsayici `alignItems:
    // center` kullaninca `flex: 1` yalnizca YUKSEKLIGI dolduruyor ve
    // genislik icerige gore hesaplaniyordu - icerik de `width: 100%`
    // istedigi icin kutu 0 x 844 kaliyor, fotograf hic gorunmuyordu.
    const stil = Object.assign(
      {},
      ...[kartKabi.props.style].flat(Infinity).filter(Boolean)
    ) as Record<string, unknown>
    expect(stil.alignSelf).toBe('stretch')

    // Tek dokunus HALA tam ekrani aciyor.
    fireEvent.press(screen.getByTestId('akis-fotografi'))
    expect(await screen.findByTestId('fotograf-gorunumu')).toBeTruthy()
  })

  /**
   * Kullanicinin istegi (2026-09-17, Swarm ornegiyle): "paylasilan
   * fotografin sol altinda paylasanin resmi, kullanici adi, konumu ve
   * tarihi gosterilsin fotograf buyuk acildigi zaman".
   */
  it('buyuk gorunumun SOL ALTINDA paylasan, mekan ve zaman yaziyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg', rumuz: 'byada' }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(screen.getByTestId('akis-fotografi'))

    const altyazi = await screen.findByTestId('akis-fotograf-altyazisi')
    // Kartta oldugu gibi KULLANICI ADI yaziyor (karar 2026-08-30).
    expect(within(altyazi).getByText('byada')).toBeTruthy()
    expect(within(altyazi).getByText('Sahil Kafe')).toBeTruthy()
    expect(within(altyazi).getByText('az önce')).toBeTruthy()
  })

  /**
   * Kullanicinin istegi (2026-09-17): "profil resmine basinca, kullanici
   * adina basinca o kullanicinin profiline yonlendirir, konum ismine
   * basinca konuma yonlendirsin." Yani altyazi tek bir dokunus hedefi
   * degil, UC AYRI hedef.
   */
  it.each([
    ['avatar', 'akis-fotograf-altyazisi-avatar'],
    ['kullanici adi', 'akis-fotograf-altyazisi-kisi'],
  ])('altyazida %s profili aciyor ve buyuk gorunum kapaniyor', async (_ad, testId) => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg', rumuz: 'byada' }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(screen.getByTestId('akis-fotografi'))
    await screen.findByTestId('akis-fotograf-altyazisi')

    await fireEvent.press(screen.getByTestId(testId))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kullanici-2')
    expect(screen.queryByTestId('fotograf-gorunumu')).toBeNull()
  })

  it('altyazidaki MEKAN ADI mekan sayfasini aciyor', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue([
      oge({ fotografUrl: 'https://imzali/foto.jpg', rumuz: 'byada' }),
    ])

    await render(<AnaSayfa />)
    await screen.findByText('Sahil Kafe')
    await fireEvent.press(screen.getByTestId('akis-fotografi'))
    await screen.findByTestId('akis-fotograf-altyazisi')

    await fireEvent.press(screen.getByTestId('akis-fotograf-altyazisi-mekan'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
    expect(screen.queryByTestId('fotograf-gorunumu')).toBeNull()
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

  // ------------------------------------------------------------------ //
  // KART HIYERARSISI (2026-09-07 tasarim denetimi)
  //
  // Onceden ad, mekan ve etiketler TEK satirdaydi; mekan adi turuncu ve
  // yari kalin oldugu icin kisinin adini bastiriyordu, ustelik beyaz
  // kart uzerinde 2,65:1 veriyordu. Ayrica zaman IKI KEZ yaziyordu.
  // ------------------------------------------------------------------ //

  it('mekan adi TURUNCU, adin altinda igneli satirda (referans 2026-09-18)', async () => {
    // 2026-09-07 karari "mekan adi turuncu" duruyor; 2026-09-18
    // referansiyla mekan adi adin ALTINA, igne ikonlu kendi satirina
    // indi (turuncu marka tonu, tiklanabilir).
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])
    await render(<AnaSayfa />)

    const mekan = await screen.findByText('Sahil Kafe')
    const ad = await screen.findByText('Ada')

    expect(duzYazi(mekan).color).toBe(acikRenk.turuncuYazi)
    expect(duzYazi(mekan).color).toBe('#FE7813')
    expect(duzYazi(ad).color).toBe(acikRenk.metin)
    expect(mekan.parent).not.toBe(ad.parent)
  })

  it('TAM TARIH YOK: zaman tek bicimde yaziliyor', async () => {
    // Onceden sagda "10 saat once", adin altinda da "06.09.2026 22:54"
    // vardi - ayni bilgi, iki bicim, her kartta.
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])
    await render(<AnaSayfa />)

    await screen.findByText('Sahil Kafe')
    // Gun.ay.yil bicimindeki hicbir metin kalmamali.
    expect(screen.queryByText(/\d{2}\.\d{2}\.\d{4}/)).toBeNull()
  })

  it('mekan adina basmak HALA haritayi aciyor', async () => {
    // Duzen degisti ama davranis degismedi: mekan adi konum ekranina
    // giden tek kapi (kullanicinin karari 2026-08-30).
    ;(akisiGetir as jest.Mock).mockResolvedValue([oge()])
    await render(<AnaSayfa />)

    await fireEvent.press(await screen.findByText('Sahil Kafe'))
    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
  })
})

/**
 * SAYFALAMA.
 *
 * Kullanicinin kurali (2026-09-07): "Yapilan butun paylasimlar
 * check-in'ler hem ana sayfaya hem profile duesecek." Akis en yeni bir
 * sayfayi cekiyordu ve devami HIC yuklenmiyordu; yani sayfa boyunu
 * asan eski paylasimlar ana sayfada erisilemez oluyordu.
 */
describe('AnaSayfa sayfalama', () => {
  // "Kullanici listenin sonuna geldi." fireEvent.scroll DENENDI ve
  // tetiklemedi: VirtualizedList sonu hesaplamak icin yerlesim
  // olculerini bekliyor, testte hicbir sey olculmuyor. Olay dogrudan
  // listenin kendi kancasina gonderiliyor.
  function sonaGel() {
    fireEvent(screen.getByTestId('akis-listesi'), 'endReached')
  }

  function sayfa(baslangic: number, adet: number): AkisOgesi[] {
    return Array.from({ length: adet }, (_, i) =>
      oge({
        id: `checkin-${baslangic + i}`,
        mekanAdi: `Mekan ${baslangic + i}`,
        olusturmaZamani: new Date(
          Date.parse('2026-09-07T12:00:00Z') - (baslangic + i) * 60_000
        ).toISOString(),
      })
    )
  }

  it('sona gelince sonraki sayfayi ZAMAN IMLECIYLE isteyip ALTA ekliyor', async () => {
    const ilk = sayfa(0, 3)
    ;(akisiGetir as jest.Mock)
      .mockResolvedValueOnce(ilk)
      .mockResolvedValueOnce(sayfa(3, 1))
    await render(<AnaSayfa />)
    await screen.findByText('Mekan 0')

    sonaGel()

    expect(await screen.findByText('Mekan 3')).toBeTruthy()
    expect(akisiGetir).toHaveBeenLastCalledWith(3, ilk[2].olusturmaZamani)
    // Ilk sayfa YERINDE duruyor: yeni sayfa altina ekleniyor, yerine
    // gecmiyor.
    expect(screen.getByText('Mekan 0')).toBeTruthy()
  })

  it('sayfa dolu gelmediyse daha fazlasini ISTEMIYOR', async () => {
    ;(akisiGetir as jest.Mock).mockResolvedValue(sayfa(0, 2))
    await render(<AnaSayfa />)
    await screen.findByText('Mekan 0')

    sonaGel()

    await waitFor(() => expect(akisiGetir).toHaveBeenCalledTimes(1))
  })

  it('sonraki sayfa hata verirse eldeki akis KAYBOLMUYOR', async () => {
    ;(akisiGetir as jest.Mock)
      .mockResolvedValueOnce(sayfa(0, 3))
      .mockRejectedValueOnce(new Error('ag hatasi'))
    await render(<AnaSayfa />)
    await screen.findByText('Mekan 0')

    sonaGel()

    expect(await screen.findByText('ag hatasi')).toBeTruthy()
    expect(screen.getByText('Mekan 0')).toBeTruthy()
  })
})
