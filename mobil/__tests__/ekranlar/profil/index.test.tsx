import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native'
import { Share, StyleSheet } from 'react-native'
import { acikRenk, koyuRenk, olcek } from '../../../src/tasarim/tema'
import ProfilEkrani from '../../../src/app/profil/index'
import { kendiProfilimiGetir, profilFotografiniKaldir } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { takibiBirak } from '../../../lib/bag'
import { engelle } from '../../../lib/engelleme'
import { avatarlariGetir } from '../../../lib/akis'
import { checkIniSil } from '../../../lib/checkin'
import { etkilesimOzetleriniGetir, begen, paylas } from '../../../lib/etkilesim'

jest.mock('../../../lib/profil', () => ({
  kendiProfilimiGetir: jest.fn(),
  profilFotografiniDegistir: jest.fn(),
  profilFotografiniKaldir: jest.fn(),
}))
const mockGaleriAc = jest.fn()
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...a: unknown[]) => mockGaleriAc(...a),
  MediaTypeOptions: { Images: 'Images' },
}))
jest.mock('../../../lib/fotograf-url', () => ({ profilFotografiUrl: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({
  ...jest.requireActual('../../../lib/checkin'),
  kullanicininAnilariniGetir: jest.fn(),
  aktifCheckInimiGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
  checkIniSil: jest.fn(),
  checkInNotunuGuncelle: jest.fn(),
}))
jest.mock('../../../lib/etiket', () => ({ etiketiKaldir: jest.fn() }))
// Sabitler GERCEK kaliyor, yalnizca ag cagrilari degistiriliyor: eksik
// bir sabit hata vermiyor, sessizce undefined donuyor (2026-09-02'de
// yasandi).
jest.mock('../../../lib/etkilesim', () => ({
  ...jest.requireActual('../../../lib/etkilesim'),
  etkilesimOzetleriniGetir: jest.fn(),
  begen: jest.fn(),
  begeniyiKaldir: jest.fn(),
  paylas: jest.fn(),
}))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))
jest.mock('../../../lib/bag', () => ({ takibiBirak: jest.fn() }))
jest.mock('../../../lib/engelleme', () => ({ engelle: jest.fn() }))
jest.mock('../../../lib/akis', () => ({
  ...jest.requireActual('../../../lib/akis'),
  avatarlariGetir: jest.fn().mockResolvedValue({}),
}))

const mockRouterPush = jest.fn()
const mockSetParams = jest.fn()
// Rota parametresi: test icinde `mockSekmeParam = 'yerler'` diye
// kurulunca ekran o sekmede acilir (geri donus senaryosu).
let mockSekmeParam: string | undefined
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, setParams: mockSetParams }),
  useLocalSearchParams: () => ({ sekme: mockSekmeParam }),
  useFocusEffect: (effect: () => void) => {
    require('react').useEffect(effect, [])
  },
}))

function ani(ustune: Record<string, unknown> = {}) {
  return {
    id: 'ani-1',
    mekanId: 'mekan-1',
    mekanAdi: 'Sahil Kafe',
    mekanSemti: 'Nilüfer',
    mekanKonumu: { lat: 41, lng: 29 },
    notMetni: 'harika bir aksamdi',
    fotograf: null,
    olusturmaZamani: '2026-08-20T10:00:00Z',
    bitisZamani: '2026-08-20T14:00:00Z',
    canliMi: false,
    bulunurluk: 'herkese_acik',
    ...ustune,
  }
}
// RN stil prop'u nesne ya da (ic ice) dizi olabilir; renk iddialari icin
// tek bir nesneye indiriyoruz.
function duzYazi(oge: { props: { style?: unknown } }): Record<string, unknown> {
  const parcalar = [oge.props.style].flat(Infinity).filter(Boolean)
  return Object.assign({}, ...(parcalar as Record<string, unknown>[]))
}


beforeEach(() => {
  jest.clearAllMocks()
  mockSekmeParam = undefined
  // Varsayilan: sayac yok. Kart eylem satirini ancak ozet gelince
  // ciziyor, yani bu deger verilmezse eski davranis olculur.
  ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({})
  ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
    id: 'kullanici-1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    biyografi: 'İzmir',
    fotograflar: [],
  })
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([])
  ;(aktifCheckInimiGetir as jest.Mock).mockResolvedValue(null)
  ;(profilFotografiUrl as jest.Mock).mockResolvedValue(null)
})

describe('ProfilEkrani', () => {
  /**
   * Kullanicinin istegi (2026-09-17): buyuk acilan fotografin sol
   * altinda paylasan, mekan ve zaman gorunsun. Izgaradan acilan
   * gorunumde de ayni satir var - ayni kavram, ayni bilesen.
   */
  it('izgaradan acilan fotografin altinda kisi, mekan ve zaman yaziyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani({ fotografUrl: 'https://imzali/1.jpg' }),
    ])

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('Fotoğraf'))
    await fireEvent.press(screen.getByLabelText('Sahil Kafe'))

    const altyazi = await screen.findByTestId('izgara-fotograf-altyazisi')
    expect(within(altyazi).getByText('orcun')).toBeTruthy()
    expect(within(altyazi).getByText('Sahil Kafe')).toBeTruthy()
  })

  /*
   * FOTOGRAF GEZGINI (kullanicinin istegi 2026-09-18): izgaradan ya da
   * ani kartindan acilan buyuk gorunum TEK fotograf degil, profilin
   * butun fotograflari - sayac var, saga-sola kaydirmayla geciliyor.
   */
  it('izgaradan acilan buyuk gorunumde sayac var ve kaydirinca sonraki fotografa gecer', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani({ id: 'ani-1', fotografUrl: 'https://imzali/1.jpg' }),
      ani({ id: 'ani-2', fotografUrl: 'https://imzali/2.jpg', mekanAdi: 'Kent Meydanı' }),
      ani({ id: 'ani-3', fotografUrl: null }),
    ])

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('Fotoğraf'))
    await fireEvent.press(screen.getAllByLabelText('Sahil Kafe')[0])

    await screen.findByTestId('izgara-buyuk-gorunum')
    // Fotografsiz ani sayilmiyor: 2 fotograf.
    expect(screen.getByTestId('izgara-sayac')).toHaveTextContent('1 / 2')

    // Ikinci sayfaya kaydirma (genislik kadar ofset).
    const liste = screen.getByTestId('izgara-sayfalar')
    const genislik = require('react-native').Dimensions.get('window').width
    await fireEvent(liste, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: genislik, y: 0 } },
    })
    expect(screen.getByTestId('izgara-sayac')).toHaveTextContent('2 / 2')
    expect(within(screen.getByTestId('izgara-fotograf-altyazisi')).getByText('Kent Meydanı')).toBeTruthy()
  })

  it('ani KARTINDAKI fotografa dokununca da ayni gezgin, o fotograftan acilir', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani({ id: 'ani-1', fotografUrl: 'https://imzali/1.jpg' }),
      ani({ id: 'ani-2', fotografUrl: 'https://imzali/2.jpg', mekanAdi: 'Kent Meydanı' }),
    ])

    await render(<ProfilEkrani />)
    // Anilar sekmesi (varsayilan): ikinci kartin fotografi.
    const fotograflar = await screen.findAllByTestId('akis-fotografi')
    await fireEvent.press(fotograflar[1])

    await screen.findByTestId('izgara-buyuk-gorunum')
    expect(screen.getByTestId('izgara-sayac')).toHaveTextContent('2 / 2')
    // Kartin kendi tek fotografli penceresi ACILMADI.
    expect(screen.queryByTestId('fotograf-gorunumu')).toBeNull()
  })

  it('izgaradaki fotografin MEKAN ADI mekan sayfasini aciyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani({ fotografUrl: 'https://imzali/1.jpg' }),
    ])

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('Fotoğraf'))
    await fireEvent.press(screen.getByLabelText('Sahil Kafe'))
    await screen.findByTestId('izgara-fotograf-altyazisi')

    await fireEvent.press(screen.getByTestId('izgara-fotograf-altyazisi-mekan'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
  })

  it('kullanici adini, adi ve biyografiyi gosterir', async () => {
    await render(<ProfilEkrani />)

    // @ ISARETI GERI GELDI (2026-09-10, referans gorselle) ve artik
    // ust cubukta degil ADIN ALTINDA duruyor.
    expect(await screen.findByText('@orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('İzmir')).toBeTruthy()
  })

  /*
   * INSTAGRAM BEYANI (kullanicinin istegi 2026-09-11). DOGRULANMIS
   * DEGIL - Meta kisisel hesaplar icin OAuth yolunu 2024-12-04'te
   * kapatti. Satir yalnizca deger VARSA ciziliyor: bos bir baglanti
   * satiri profilde sebepsiz dururdu.
   */
  it('instagram varsa tiklanabilir satir ciziyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun Ozdemir',
      biyografi: 'İzmir',
      instagram: 'orcun.ozdemir',
      fotograflar: [],
    })

    await render(<ProfilEkrani />)

    expect(await screen.findByTestId('instagram-baglantisi')).toBeTruthy()
    expect(screen.getByText('orcun.ozdemir')).toBeTruthy()
  })

  /*
   * YASADIGI BOLGE (kullanicinin istegi 2026-09-11): "secerse
   * profilinde biyografi kisimlarinin orada gorunur". Opsiyonel -
   * secilmemisse satir HIC cizilmiyor.
   */
  it('bolge secilmisse biyografinin altinda gosteriliyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun Ozdemir',
      biyografi: 'İzmir',
      instagram: null,
      yasadigiIl: 'Bursa',
      yasadigiIlce: 'Nilüfer',
      fotograflar: [],
    })

    await render(<ProfilEkrani />)

    expect(await screen.findByTestId('profil-bolgesi')).toBeTruthy()
    expect(screen.getByText('Nilüfer, Bursa')).toBeTruthy()
  })

  it('bolge secilmemisse satir hic cizilmiyor', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('@orcun')

    expect(screen.queryByTestId('profil-bolgesi')).toBeNull()
  })

  it('instagram yoksa satir hic cizilmiyor', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('@orcun')

    expect(screen.queryByTestId('instagram-baglantisi')).toBeNull()
  })

  /*
   * BIYOGRAFI KIRPILMIYOR (kullanicinin bildirdigi kusur 2026-09-11:
   * "alt alta 2-3 tane sey yazinca hepsi gorunmuyor"). Onceden
   * `numberOfLines={2}` vardi. Sinirsiz buyume riski yok - alan 160
   * karakterle kapali.
   */
  it('biyografi satir sayisiyla kirpilmiyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun Ozdemir',
      biyografi: 'Birinci satır\nİkinci satır\nÜçüncü satır',
      fotograflar: [],
    })

    await render(<ProfilEkrani />)

    const metin = await screen.findByText('Birinci satır\nİkinci satır\nÜçüncü satır')
    expect(metin.props.numberOfLines).toBeUndefined()
  })

  it('fotografi olmayanda bas harfi gosterir', async () => {
    await render(<ProfilEkrani />)
    expect(await screen.findByText('O')).toBeTruthy()
    expect(screen.queryByTestId('profil-fotografi')).toBeNull()
  })

  it('ani ve bag sayilarini gosterir', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani(), ani({ id: 'ani-2' })])
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([{ id: 'k2' }])

    await render(<ProfilEkrani />)

    expect(await screen.findByText('2')).toBeTruthy()
    expect(screen.getByText('Anı')).toBeTruthy()
    // "Yer" sayaci KALKTI (kullanicinin istegi 2026-09-05), yerine
    // fotograf sayisi geldi. Yer bilgisi kaybolmadi - anilar
    // bolumunun "En sık" alt sekmesinde duruyor.
    expect(screen.queryByText('Yer')).toBeNull()
    expect(screen.getByText('Fotoğraf')).toBeTruthy()
    expect(screen.getByText('Arkadaş')).toBeTruthy()
  })

  it('Yerler sekmesi en cok gidilen mekani kac kez gidildigiyle listeler', async () => {
    // Kullanicinin secimi 2026-08-29. Sunucuda yeni sorgu yok; ayni
    // anilardan gruplaniyor.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      ani(),
      ani({ id: 'ani-2' }),
      ani({ id: 'ani-3', mekanId: 'mekan-2', mekanAdi: 'Kent Meydanı' }),
    ])

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('En sık'))

    expect(await screen.findByText('2 kez')).toBeTruthy()
    expect(screen.getByText('1 kez')).toBeTruthy()
    expect(screen.getByText('Kent Meydanı')).toBeTruthy()
  })

  /*
   * SEKME ROTA PARAMETRESINDE (kullanicinin bildirimi 2026-09-18):
   * "En sık"tan bir mekana gidip geri gelince sekme "Anılar"a atiyordu
   * - kok duzen Slot oldugu icin ekran yeniden kuruluyor. Secim
   * `router.setParams` ile yaziliyor, donuste parametreden okunuyor.
   */
  it('sekme secimi rota parametresine yazilir', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])
    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('En sık'))
    expect(mockSetParams).toHaveBeenCalledWith({ sekme: 'yerler' })
  })

  it('rota parametresi "yerler" ise ekran En sık sekmesinde acilir (geri donus)', async () => {
    mockSekmeParam = 'yerler'
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani(), ani({ id: 'ani-2' })])
    await render(<ProfilEkrani />)
    // "2 kez" yalnizca En sık listesinde cizilir.
    expect(await screen.findByText('2 kez')).toBeTruthy()
  })

  it('bilinmeyen rota parametresi varsayilan sekmeye duser', async () => {
    mockSekmeParam = 'olmayan-sekme'
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani(), ani({ id: 'ani-2' })])
    await render(<ProfilEkrani />)
    await screen.findByText('En sık')
    expect(screen.queryByText('2 kez')).toBeNull()
  })

  it('6 VE SONRASI duz rakamla ve OKUNUR bir tonda cizilir', async () => {
    // Kullanicinin bildirdigi hata 2026-09-05: "6-7 diye devam eden
    // sayilar cok silik". Ilk bes sira madalya gorseli aliyor, sonrasi
    // duz rakam; o rakamin puntosu 13'tu ve rengi ekranin en acik metin
    // tonuydu (`metinSoluk`), yani madalyalarin yanibasinda
    // kayboluyordu.
    //
    // Test rengin TAM KOYU olmadigini da dogruluyor: bu satirlar
    // madalyali ilk bes kadar one cikmamali.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(
      Array.from({ length: 7 }, (_, i) =>
        ani({ id: `ani-${i}`, mekanId: `mekan-${i}`, mekanAdi: `Mekan ${i + 1}` })
      )
    )

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('En sık'))

    const stil = StyleSheet.flatten((await screen.findByText('6')).props.style)
    expect(stil.fontSize).toBe(olcek.altBaslik)
    expect(stil.color).toBe(acikRenk.metinIkincil)
    expect(stil.color).not.toBe(acikRenk.metinSoluk)
  })

  it('EN COK 20 yer listeleniyor', async () => {
    // Kullanicinin karari 2026-09-05: "En fazla 20'ye kadar sinirli
    // olucak". Liste en cok gidilenden az gidilene sirali oldugu icin
    // sinir kuyrugu kesiyor; bir kez gidilmis onlarca mekan listeyi
    // uzatmaktan baska bir sey yapmiyordu.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(
      Array.from({ length: 25 }, (_, i) =>
        ani({ id: `ani-${i}`, mekanId: `mekan-${i}`, mekanAdi: `Mekan ${i + 1}` })
      )
    )

    await render(<ProfilEkrani />)
    await fireEvent.press(await screen.findByText('En sık'))

    // Sira rakamiyla saymak yaniltici: satir sayisi kez rozetinden
    // olculuyor.
    await screen.findByText('En sık')
    expect(screen.getAllByText('1 kez')).toHaveLength(20)

    // SINIR YALNIZCA LISTEDE: Ani sayaci 25 gostermeye devam ediyor.
    expect(screen.getByText('25')).toBeTruthy()
  })

  // 'Profili duzenle dugmesi duzenleme ekranina goturur' testi
  // KALDIRILDI (2026-09-03): dugme bandan cikti. Ayni iddia artik
  // ayarlar testinde - 'Profili duzenle satiri GERI GELDI'.

  it('canli check-in ANILAR LISTESINDE rozetiyle gorunur, ayri serit YOK', async () => {
    // Kullanicinin karari 2026-08-29: profildeki "Şu an buradasın"
    // seridi kaldirildi; canli check-in yalnizca ani akisinda,
    // "şu an burada" rozetiyle gorunuyor.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      // Rozet 30 dakikalik canlilik penceresine bagli (karar 2026-08-29);
      // kayit yeni olmali.
      ani({
        id: 'ani-canli',
        mekanAdi: 'Kordon',
        canliMi: true,
        olusturmaZamani: new Date().toISOString(),
      }),
    ])

    await render(<ProfilEkrani />)

    expect(await screen.findByText('şu an burada')).toBeTruthy()
    expect(screen.getByText('Kordon')).toBeTruthy()
    // Eski serit ve eylemleri artik profilde DEGIL.
    expect(screen.queryByText('Şu an buradasın')).toBeNull()
    expect(screen.queryByText('Ayrıl')).toBeNull()
  })

  it('canli check-in yoksa profilde HICBIR serit ya da kart cizilmiyor', async () => {
    // "Su an bir yerde degilsin" karti kaldirildi (kullanicinin karari
    // 2026-08-27). Check-in'e giris artik alt cubugun ortasindaki
    // turuncu dugmede; profilde ikinci bir cagri gerekmiyor.
    await render(<ProfilEkrani />)
    await screen.findByText('Anılar')

    expect(screen.queryByText('Şu an bir yerde değilsin')).toBeNull()
    expect(screen.queryByText('Bir yere check-in yap')).toBeNull()
    expect(screen.queryByText('Şu an buradasın')).toBeNull()
  })

  it('anilar bosken yon veren bir metin gosterir', async () => {
    await render(<ProfilEkrani />)
    expect(await screen.findByText('Henüz bir anın yok')).toBeTruthy()
  })

  it('ani satirina basilinca KONUM ekranini acar', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/mekan-1')
  })

  it('ayarlar dugmesi ayarlar ekranini acar', async () => {
    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByLabelText('Ayarlar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  /*
   * UST CUBUKTA "Profil" BASLIGI YOK (kullanicinin istegi 2026-09-11).
   * Baslik 2026-09-10'da referans gorselle gelmisti; cubukta artik
   * yalnizca ayarlar duruyor. Tam eslesme araniyor - "Profili düzenle"
   * butonu bu iddiayi tetiklemiyor.
   */
  it('ust cubukta sayfa basligi YOK, yalnizca ayarlar var', async () => {
    await render(<ProfilEkrani />)
    await screen.findByLabelText('Ayarlar')

    expect(screen.queryByText('Profil')).toBeNull()
  })

  it('profil satiri yoksa profil olusturmaya yonlendirir', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue(null)

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByText('Profilini oluştur'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil-olustur')
  })

  describe('profil fotografi (kullanicinin istegi 2026-08-30)', () => {
    beforeEach(() => {
      ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
        id: 'kullanici-1',
        kullaniciAdi: 'orcun',
        ad: 'Orcun Ozdemir',
        biyografi: null,
        fotograflar: ['kullanici-1/1.jpg'],
      })
      ;(profilFotografiUrl as jest.Mock).mockResolvedValue('https://ornek/foto.jpg')
      mockGaleriAc.mockResolvedValue({ canceled: true })
      ;(profilFotografiniKaldir as jest.Mock).mockResolvedValue(undefined)
    })

    it('yalnizca + rozeti galeriyi acar; fotografa basmak acmaz', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')

      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      expect(mockGaleriAc).not.toHaveBeenCalled()

      await fireEvent.press(screen.getByLabelText('Profil fotoğrafı ekle'))
      expect(mockGaleriAc).toHaveBeenCalledTimes(1)
    })

    it('fotografa basinca buyuk gorunum acilir, Kapat ile kapanir', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')

      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      expect(screen.getByTestId('profil-fotografi-buyuk')).toBeTruthy()
      expect(screen.getByText('Fotoğrafı kaldır')).toBeTruthy()

      await fireEvent.press(screen.getByLabelText('Kapat'))
      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
    })

    it('kaldirma iki adimli: onaylayinca sunucuya gider ve profil yenilenir', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))

      await fireEvent.press(screen.getByText('Fotoğrafı kaldır'))
      expect(profilFotografiniKaldir).not.toHaveBeenCalled()
      expect(screen.getByText('Fotoğrafın kaldırılsın mı?')).toBeTruthy()

      await fireEvent.press(screen.getAllByText('Fotoğrafı kaldır')[0])
      await waitFor(() => expect(profilFotografiniKaldir).toHaveBeenCalledTimes(1))
      await waitFor(() => expect(kendiProfilimiGetir).toHaveBeenCalledTimes(2))
      expect(screen.queryByTestId('profil-fotografi-buyuk')).toBeNull()
    })

    it('Vazgec onayi geri alir, fotograf kaldirilmaz', async () => {
      await render(<ProfilEkrani />)
      await screen.findByTestId('profil-fotografi')
      await fireEvent.press(screen.getByLabelText('Profil fotoğrafını büyüt'))
      await fireEvent.press(screen.getByText('Fotoğrafı kaldır'))

      await fireEvent.press(screen.getByText('Vazgeç'))

      expect(screen.queryByText('Fotoğrafın kaldırılsın mı?')).toBeNull()
      expect(profilFotografiniKaldir).not.toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------- //
  // KIMLIK BANDI: YUMUSAK GECIS (kullanicinin secimi 2026-09-03, "B")
  // ---------------------------------------------------------------- //

  // ZEMIN TAM BEYAZ (kullanicinin istegi 2026-09-08). Burada
  // 2026-09-03'ten beri seftaliden beyaza bir gecis vardi; kaldirildi.
  it('profil zemini TAM BEYAZ: renkli band YOK', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    expect(screen.queryByTestId('profil-bandi')).toBeNull()
  })

  it('band icindeki yazilar KOYU: acik gecis uzerinde beyaz okunmaz', async () => {
    await render(<ProfilEkrani />)
    const ad = await screen.findByText('Orcun Ozdemir')

    expect(duzYazi(ad).color).toBe('#17130F')
    // SAYILAR ARTIK KARTLARDA ve TURUNCU (kullanicinin istegi
    // 2026-09-05, gorsel referansla). Beyaz olmadiklari surece
    // bandin altinda kaybolmuyorlar; asil kural buydu.
    //
    // Ton 2026-09-07 denetiminde #FE7813'ten `turuncuYazi`ya gecti:
    // marka turuncusu bandin ustunde (#FFE6D2) 2,21:1 veriyordu,
    // yani bandin icindeki en zor okunan yerdi. Yeni ton 4,51:1.
    expect(duzYazi(screen.getAllByText('0')[0]).color).toBe(acikRenk.turuncuYazi)
  })

  it('bandin DISINDA hicbir sey degismedi: mekan adi hala marka turuncusu', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])
    await render(<ProfilEkrani />)

    // Kullanicinin kurali (2026-09-03): "sadece profil resminin
    // arkasindaki renk icin, geri kalan her sey ayni kalsin".
    //
    // 2026-09-07'de bu deger bir kez ikincil metne cevrilmis, ayni gun
    // geri alinmisti ("konumlar ismin yaninda yine turuncu gorunsun").
    // Mekan adinin marka turuncusu olmasi verilmis bir karar.
    const mekan = await screen.findByText('Sahil Kafe')
    expect(duzYazi(mekan).color).toBe('#FE7813')
    expect(duzYazi(mekan).color).not.toBe(acikRenk.bandUst)
  })

  // ---------------------------------------------------------------- //
  // GECIS TEPEDEN BASLAR (kullanicinin secimi 2026-09-03, "A")
  // ---------------------------------------------------------------- //

  it('kimlik blogunun kendi zemini YOK: sayfa beyazi gorunuyor', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    // Gecis kalkinca blogun kendi rengi de kalkti; zemin kokten
    // (`renk.zemin`) geliyor. Buraya bir renk geri konursa test kirilir.
    const blok = screen.getByText('Orcun Ozdemir').parent
    expect(duzYazi(blok as { props: { style?: unknown } }).backgroundColor).toBeUndefined()
  })

  it('gecis dokunuslari YUTMUYOR: altindaki ayarlar ikonu calisiyor', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    // Mutlak zemin ust cubugun USTUNDE ciziliyor olsaydi ayarlar
    // dugmesi tiklanamazdi; pointerEvents="none" bunu engelliyor.
    fireEvent.press(screen.getByLabelText('Ayarlar'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
  })

  // ---------------------------------------------------------------- //
  // BANT SADELESTI, PAYLASMA IKONA GECTI (kullanicinin secimi 2026-09-03)
  // ---------------------------------------------------------------- //

  /*
   * IDDIA TERSINE CEVRILDI, SILINMEDI (2026-09-10).
   *
   * "Profili düzenle" 2026-09-03'te kullanicinin istegiyle
   * KALDIRILMISTI ve giris ayarlara tasinmisti; referans gorselle geri
   * geldi. Paylas da ust cubuktan eylem satirindaki kare butona indi.
   *
   * 2026-09-11: ayarlardaki "Profili düzenle" satiri kullanicinin
   * istegiyle KALDIRILDI, yani bu buton artik `/profil/duzenle`
   * ekraninin TEK girisi. Bu yuzden asagida butonun VARLIGI degil
   * NEREYE GITTIGI de olculuyor - yonlendirme koparsa o ekran hicbir
   * yerden acilamaz ve eskiden bunu hicbir test yakalamazdi.
   * Ayni sinif hata 2026-09-03'te bir kez yasanmisti.
   */
  it('eylem satirinda Profili duzenle ve paylas butonu VAR', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    expect(screen.getByTestId('profili-duzenle')).toBeTruthy()
    expect(screen.getByText('Profili düzenle')).toBeTruthy()
    expect(screen.getByTestId('profili-paylas')).toBeTruthy()
  })

  it('Profili duzenle butonu duzenleme ekranini aciyor (TEK giris)', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    await fireEvent.press(screen.getByTestId('profili-duzenle'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil/duzenle')
  })

  it('eylem satirindaki paylas butonu profili paylasiyor', async () => {
    const paylas = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never)
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    await fireEvent.press(screen.getByLabelText('Paylaş'))

    expect(paylas).toHaveBeenCalled()
    paylas.mockRestore()
  })

  /*
   * IDDIA TERSINE CEVRILDI, SILINMEDI. 2026-09-03'te @ kaldirilmisti
   * ("uygulamanin geri kalani zaten @'siz gosteriyor"); 2026-09-10'da
   * kullanicinin gonderdigi referansta @ var ve geri kondu.
   */
  it('kullanici adi @ ISARETIYLE, adin altinda', async () => {
    await render(<ProfilEkrani />)

    expect(await screen.findByText('@orcun')).toBeTruthy()
  })

  /*
   * FOTOGRAF ROZETI ARTIK IKI MODDA DA TURUNCU (2026-09-10, referans
   * gorsel). Onceden acik modda KOYU idi (`rozetZemin`); referansta
   * turuncu ve kurala da uyuyor - rozet bir EYLEM (fotograf degistir).
   *
   * `rozetZemin` jetonu SILINMEDI: baska bir yerde gerekirse duruyor,
   * yalnizca profil rozeti onu kullanmiyor.
   */
  it('fotograf rozeti IKI MODDA DA turuncu', async () => {
    expect(acikRenk.turuncu).toBe('#FE7813')
    expect(koyuRenk.turuncu).toBe(acikRenk.turuncu)
  })
})

/**
 * PROFILDE TUM PAYLASIMLAR.
 *
 * Kullanicinin kurali (2026-09-07): "Yapilan butun paylasimlar
 * profilde de gorunecek, orda kalicak kullanici tek tek silmek
 * isteyene kadar" ve "profilde hep asagi dogru kaydirilabilsin".
 *
 * Onceki hal: profil yalnizca UC ani onizliyor, gerisi ayri bir
 * ekranda duruyordu ("Tümü" baglantisi). Onizlemedeki kartlar ayrica
 * SALT OKUNURDU - silme ve duzenleme yalnizca o ayri ekranda vardi.
 */
describe('ProfilEkrani anilar listesi', () => {
  // Kaydirma olayi: gorunen alanin alt kenari icerigin dibine geldi.
  const dibeGeldi = {
    nativeEvent: {
      contentOffset: { y: 900 },
      contentSize: { height: 1000, width: 390 },
      layoutMeasurement: { height: 100, width: 390 },
    },
  }

  function anilar(adet: number) {
    return Array.from({ length: adet }, (_, i) =>
      ani({
        id: `ani-${i}`,
        mekanId: `mekan-${i}`,
        mekanAdi: `Mekan ${i}`,
        olusturmaZamani: new Date(
          Date.parse('2026-09-07T12:00:00Z') - i * 60_000
        ).toISOString(),
      })
    )
  }

  it('"Tümü" baglantisi YOK, ayri ani ekranina gonderilmiyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(5))

    await render(<ProfilEkrani />)
    await screen.findByText('Mekan 0')

    expect(screen.queryByText('Tümü')).toBeNull()
    expect(mockRouterPush).not.toHaveBeenCalledWith('/profil/anilar')
  })

  it('UC ile sinirli DEGIL: bes aninin hepsi profilde', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(5))

    await render(<ProfilEkrani />)

    expect(await screen.findByText('Mekan 0')).toBeTruthy()
    expect(screen.getByText('Mekan 3')).toBeTruthy()
    expect(screen.getByText('Mekan 4')).toBeTruthy()
  })

  it('uzun listede asagi kaydirinca DEVAMI geliyor', async () => {
    // Ilk cizim penceresi 10; 12 ani ile son ikisi baslangicta yok.
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(12))

    await render(<ProfilEkrani />)
    await screen.findByText('Mekan 0')
    expect(screen.queryByText('Mekan 11')).toBeNull()

    fireEvent.scroll(screen.getByTestId('profil-kaydirma'), dibeGeldi)

    expect(await screen.findByText('Mekan 11')).toBeTruthy()
  })

  it('ani PROFILDEN silinebiliyor (menu -> sil -> onay)', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(2))
    ;(checkIniSil as jest.Mock).mockResolvedValue(undefined)

    await render(<ProfilEkrani />)
    await screen.findByText('Mekan 0')

    fireEvent.press(screen.getAllByLabelText('Paylaşım seçenekleri')[0])
    fireEvent.press(await screen.findByTestId('menu-sil'))
    fireEvent.press(await screen.findByTestId('onay-eylemi'))

    await waitFor(() => expect(checkIniSil).toHaveBeenCalledWith('ani-0'))
    await waitFor(() => expect(screen.queryByText('Mekan 0')).toBeNull())
    // Digeri YERINDE: silme tek tek.
    expect(screen.getByText('Mekan 1')).toBeTruthy()
  })

  /*
   * ETKILESIM SATIRI (kullanicinin istegi 2026-09-09: "profildeki
   * paylasimlarda ana sayfadaki gibi begen paylas yorum yapma ikonu
   * ekle"). Kart bu satiri ancak `ozet` gelince ciziyor ve profil
   * ozetleri HIC cekmiyordu.
   */
  it('kartlarda begen / yorum / paylas satiri var', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(1))
    ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({
      'ani-0': { begeni: 4, yorum: 2, begendim: false },
    })

    await render(<ProfilEkrani />)

    expect(await screen.findByLabelText('Beğen')).toBeTruthy()
    expect(screen.getByLabelText('Yorumlar')).toBeTruthy()
    // "Paylaş" IKI YERDE: ust cubukta profili paylasma dugmesi ve
    // kartin eylem satiri. Sonuncusu kartinki.
    expect(screen.getAllByLabelText('Paylaş')).toHaveLength(2)
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('kalbe basinca begeni gonderiliyor ve sayi ANINDA artiyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(1))
    ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({
      'ani-0': { begeni: 4, yorum: 0, begendim: false },
    })
    ;(begen as jest.Mock).mockResolvedValue(undefined)

    await render(<ProfilEkrani />)
    fireEvent.press(await screen.findByLabelText('Beğen'))

    expect(await screen.findByText('5')).toBeTruthy()
    await waitFor(() => expect(begen).toHaveBeenCalledWith('ani-0'))
  })

  it('paylas ikonu paylasim penceresini aciyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar(1))
    ;(etkilesimOzetleriniGetir as jest.Mock).mockResolvedValue({
      'ani-0': { begeni: 0, yorum: 0, begendim: false },
    })
    ;(paylas as jest.Mock).mockResolvedValue(undefined)

    await render(<ProfilEkrani />)
    await screen.findByLabelText('Beğen')
    // Ust cubuktaki profil paylasma dugmesi degil, KARTINKI.
    const dugmeler = screen.getAllByLabelText('Paylaş')
    fireEvent.press(dugmeler[dugmeler.length - 1])

    await waitFor(() => expect(paylas).toHaveBeenCalledWith('Mekan 0', 'orcun'))
  })
})

/**
 * SAYAC SATIRI VE SEKME GOSTERGESI - kullanicinin 2026-09-08 istekleri:
 * "ani fotograf arkadaslarin etrafindaki kare sutunu kaldir
 * boyutlarini kucult" ve "Anılar ve en sık yazısına kaydırmalı sütun
 * getir".
 */
describe('ProfilEkrani sayac satiri ve sekmeler', () => {
  it('sayaclarin etrafinda KUTU YOK: kenarlik da zemin de yok', async () => {
    await render(<ProfilEkrani />)

    const sayac = await screen.findByLabelText('0 Anı')
    const stil = duzYazi(sayac as { props: { style?: unknown } })

    expect(stil.borderWidth).toBeUndefined()
    expect(stil.backgroundColor).toBeUndefined()
    // Golge de kalkti; kutuyu geri getiren tek bir ozellik kalmamali.
    expect(stil.shadowOpacity).toBeUndefined()
  })

  it('secim RENKTE tasiniyor: acik olan bolumun sayisi turuncu, digerleri notr', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])
    await render(<ProfilEkrani />)
    await screen.findByText('Sahil Kafe')

    // Acilista "Anılar" bolumu acik.
    const aniSayisi = screen.getByText('1')
    const bagSayisi = screen.getAllByText('0')[0]

    expect(duzYazi(aniSayisi).color).toBe(acikRenk.turuncuYazi)
    expect(duzYazi(bagSayisi).color).toBe(acikRenk.metin)
  })

  it('sekme gostergesi AYRI bir oge: sekmenin kendi alt cizgisi yok', async () => {
    await render(<ProfilEkrani />)

    // Gosterge cubugun cocugu; sekmeye baglansaydi kayamazdi.
    expect(await screen.findByTestId('sekme-gostergesi')).toBeTruthy()

    const sekmeYazisi = screen.getByText('Anılar')
    expect(duzYazi(sekmeYazisi).borderBottomWidth).toBeUndefined()
  })

  it('"En sık"a basinca gosterge KAYBOLMUYOR, tek gosterge kaliyor', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])
    await render(<ProfilEkrani />)

    fireEvent.press(await screen.findByText('En sık'))

    expect(screen.getAllByTestId('sekme-gostergesi')).toHaveLength(1)
  })
})

// ARKADAS LISTESI (kullanicinin istegi 2026-09-14): profil resmi +
// sagda "..." -> Arkadasliktan cikar / Engelle.
describe('ProfilEkrani arkadas listesi', () => {
  const ARKADAS = { id: 'k2', kullaniciAdi: 'semra', ad: 'Semra Ozdemir' }

  async function arkadasSekmesiniAc() {
    ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([ARKADAS])
    await render(<ProfilEkrani />)
    await screen.findByText('Arkadaş')
    await fireEvent.press(screen.getByText('Arkadaş'))
    await screen.findByText('Semra Ozdemir')
  }

  it('satirda arkadasin profil resmi var (avatarlariGetir ile)', async () => {
    ;(avatarlariGetir as jest.Mock).mockResolvedValue({ k2: 'https://x/semra.jpg' })
    await arkadasSekmesiniAc()

    await waitFor(() => expect(avatarlariGetir).toHaveBeenCalledWith(['k2']))
    await waitFor(() =>
      expect(screen.getByTestId('arkadas-avatar-k2').props.source).toEqual([{ uri: 'https://x/semra.jpg' }])
    )
  })

  it('"..." dugmesi iki secenek acar: Arkadasliktan cikar ve Engelle', async () => {
    await arkadasSekmesiniAc()

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))

    expect(screen.getByText('Arkadaşlıktan çıkar')).toBeTruthy()
    expect(screen.getByText('Engelle')).toBeTruthy()
  })

  it('Arkadasliktan cikar: takibiBirak cagrilir, satir listeden kalkar', async () => {
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)
    await arkadasSekmesiniAc()

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await fireEvent.press(screen.getByText('Arkadaşlıktan çıkar'))

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('k2'))
    await waitFor(() => expect(screen.queryByText('Semra Ozdemir')).toBeNull())
  })

  it('Engelle: once onay penceresi, "Evet, engelle" ile engelle cagrilir ve satir kalkar', async () => {
    ;(engelle as jest.Mock).mockResolvedValue(undefined)
    await arkadasSekmesiniAc()

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await fireEvent.press(screen.getByText('Engelle'))

    // Onay gelmeden engelleme YOK.
    expect(engelle).not.toHaveBeenCalled()
    expect(screen.getByText('Evet, engelle')).toBeTruthy()
    await fireEvent.press(screen.getByText('Evet, engelle'))

    await waitFor(() => expect(engelle).toHaveBeenCalledWith('k2'))
    await waitFor(() => expect(screen.queryByText('Semra Ozdemir')).toBeNull())
  })

  it('islem reddedilirse hata gorunur, satir yerinde kalir', async () => {
    ;(takibiBirak as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await arkadasSekmesiniAc()

    await fireEvent.press(screen.getByTestId('arkadas-secenekler-k2'))
    await fireEvent.press(screen.getByText('Arkadaşlıktan çıkar'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Semra Ozdemir')).toBeTruthy()
  })
})
