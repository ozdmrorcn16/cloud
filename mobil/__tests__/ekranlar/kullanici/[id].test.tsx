import { Share, StyleSheet } from 'react-native'
import { acikRenk } from '../../../src/tasarim/tema'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KullaniciProfiliEkrani from '../../../src/app/kullanici/[id]'
import { baskasininProfiliniGetir, kendiKullaniciIdim } from '../../../lib/profil'
import { engelle, engellediklerimiGetir } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir } from '../../../lib/checkin'
import { profilFotograflariUrl, checkInFotografiUrl } from '../../../lib/fotograf-url'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIstegiGonder,
  sohbetIsteginiYanitla,
} from '../../../lib/bag'

jest.mock('../../../lib/profil', () => ({
  baskasininProfiliniGetir: jest.fn(),
  kendiKullaniciIdim: jest.fn(),
}))
jest.mock('../../../lib/engelleme', () => ({
  engelle: jest.fn(),
  engeliKaldir: jest.fn(),
  engellediklerimiGetir: jest.fn(),
}))
jest.mock('../../../lib/checkin', () => ({ kullanicininAnilariniGetir: jest.fn() }))
jest.mock('../../../lib/fotograf-url', () => ({
  profilFotograflariUrl: jest.fn(),
  checkInFotografiUrl: jest.fn(),
}))
jest.mock('../../../lib/bag', () => ({
  bagDurumunuGetir: jest.fn(),
  takipIstegiGonder: jest.fn(),
  takipIsteginiYanitla: jest.fn(),
  takibiBirak: jest.fn(),
  takipciyiCikar: jest.fn(),
  sohbetIstegiGonder: jest.fn(),
  sohbetIsteginiYanitla: jest.fn(),
}))

const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
const mockRouterReplace = jest.fn()
const mockSetParams = jest.fn()
let mockSekmeParam: string | undefined
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    replace: mockRouterReplace,
    setParams: mockSetParams,
  }),
  useLocalSearchParams: () => ({ id: 'kullanici-2', sekme: mockSekmeParam }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockSekmeParam = undefined
  // Varsayilan: baktigim profil BENIM DEGIL. Kendi profilim senaryosu
  // bunu kendi testinde degistiriyor.
  ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('ben')
  ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
    id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    profilGizli: false, arkadasSayisi: 4,
  })
  ;(engellediklerimiGetir as jest.Mock).mockResolvedValue([])
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
  ;(profilFotograflariUrl as jest.Mock).mockImplementation((yollar: string[]) =>
    Promise.resolve(yollar.map((yol) => `https://ornek/imzali/${yol}`))
  )
  ;(checkInFotografiUrl as jest.Mock).mockResolvedValue(null)
  ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
    takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'yok',
  })
})

describe('KullaniciProfiliEkrani', () => {
  it('profili gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: 'merhaba', fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('merhaba')).toBeTruthy()
    })
  })

  it('kullanici adini gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'k1',
      kullaniciAdi: 'orcun',
      ad: 'Orcun Ozdemir',
      biyografi: null,
      fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
      // @ GERI GELDI (2026-09-13): kendi profildeki gibi adin altinda.
      expect(screen.getByText('@orcun')).toBeTruthy()
    })
  })

  it('kullanicinin herkese acik anilarini listeler', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotograf: null, olusturmaZamani: '', bitisZamani: '', canliMi: false,
        mekanKonumu: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(kullanicininAnilariniGetir).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
  })

  it('profil null donerse bulunamadi gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue(null)

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Bu profil bulunamadı')).toBeTruthy()
    })
  })

  it('fotograflari olan profil icin imzali URL ile Image gosterir, olmayan icin gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: ['kullanici-2/1.jpg', 'kullanici-2/2.jpg'],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(profilFotograflariUrl).toHaveBeenCalledWith(['kullanici-2/1.jpg', 'kullanici-2/2.jpg'])
    })

    await waitFor(() => {
      const gorseller = screen.getAllByTestId('profil-fotografi')
      expect(gorseller).toHaveLength(2)
      expect(gorseller.map((g) => g.props.source.uri)).toEqual([
        'https://ornek/imzali/kullanici-2/1.jpg',
        'https://ornek/imzali/kullanici-2/2.jpg',
      ])
    })
  })

  it('fotografi olmayan profil icin Image gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => screen.getByText('Ada'))

    expect(screen.queryAllByTestId('profil-fotografi')).toHaveLength(0)
  })

  it('engelle butonuna basinca engeller ve profili kapatir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(engelle as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    // Engelleme iki adimli: once niyet, sonra onay. Geri alinamayan bir
    // eylem tek dokunusla tetiklenmemeli.
    // Sikayet ve engelleme ust cubuktaki menude (2026-09-17).
    await fireEvent.press(screen.getByTestId('kullanici-menusu'))
    await fireEvent.press(await screen.findByTestId('menu-engelle'))
    await fireEvent.press(await screen.findByText('Evet, engelle'))

    await waitFor(() => {
      expect(engelle).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Bu profil bulunamadı')).toBeTruthy()
    })
  })

  it('sikayet butonuna basinca sikayet ekranina yonlendirir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByTestId('kullanici-menusu'))
    await fireEvent.press(await screen.findByTestId('menu-sikayet'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })

  it('engelleme basarisiz olursa hata gosterir ve profili kapatmaz', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(engelle as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    // Sikayet ve engelleme ust cubuktaki menude (2026-09-17).
    await fireEvent.press(screen.getByTestId('kullanici-menusu'))
    await fireEvent.press(await screen.findByTestId('menu-engelle'))
    await fireEvent.press(await screen.findByText('Evet, engelle'))

    await waitFor(() => {
      expect(screen.getByText('Sunucuya ulasilamadi')).toBeTruthy()
    })
    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.queryByText('Bu profil bulunamadı')).toBeNull()
  })

  it('yuklenirken bulunamadi mesajini gostermez', async () => {
    let cozumlendir: (deger: unknown) => void = () => {}
    const bekleyenSoz = new Promise((cozum) => {
      cozumlendir = cozum
    })
    ;(baskasininProfiliniGetir as jest.Mock).mockReturnValue(bekleyenSoz)

    await render(<KullaniciProfiliEkrani />)

    expect(screen.queryByText('Bu profil bulunamadı')).toBeNull()

    cozumlendir({ id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [] })
    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
    })
  })

  it('baskasinin anisinda sil butonu gostermez', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotograf: null, olusturmaZamani: '', bitisZamani: '', canliMi: false,
        mekanKonumu: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(screen.queryByText('Sil')).toBeNull()
  })

  it('bag yokken eylem satirinda "Arkadaş ekle" ve "Mesaj yaz" var; "Sohbet iste" YOK', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'yok' })
    await render(<KullaniciProfiliEkrani />)
    expect(await screen.findByText('Arkadaş ekle')).toBeTruthy()
    expect(screen.getByText('Mesaj yaz')).toBeTruthy()
    // Ayri bir "sohbet iste" adimi KALKTI (2026-09-13): mesaj
    // istekleri modeli geregi yabanci dogrudan tek mesaj yazabiliyor.
    expect(screen.queryByText('Sohbet iste')).toBeNull()
  })

  it('takip istegi gonderir ve durumu gunceller', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'yok' })
    ;(takipIstegiGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaş ekle'))

    await waitFor(() => expect(takipIstegiGonder).toHaveBeenCalledWith('kullanici-2'))
    // Ayni dugme "Beklemede" olur; ayri "Istegi geri cek" satiri YOK
    // (kullanicinin istegi 2026-09-17).
    expect(await screen.findByText('Beklemede')).toBeTruthy()
    expect(screen.queryByText('İsteği geri çek')).toBeNull()
  })

  it('"Arkadaş ekle" dolu turuncu + beyaz yazi (Mesaj yaz ile ayni agirlik)', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'yok' })
    await render(<KullaniciProfiliEkrani />)
    const ekle = await screen.findByTestId('arkadas-ekle')
    const stil = StyleSheet.flatten(typeof ekle.props.style === 'function' ? ekle.props.style({ pressed: false }) : ekle.props.style)
    expect(stil.backgroundColor).toBe(acikRenk.turuncu)
    expect(StyleSheet.flatten(screen.getByText('Arkadaş ekle').props.style).color).toBe('#FFFFFF')
  })

  // 2026-09-14 (kullanicinin istegi): "Arkadasliktan cikar" artik ayri
  // bir satir degil; "Arkadassin" dugmesine basinca acilan menude.
  it('arkadasken "Arkadassin" basilabilir ve menude "Arkadasliktan cikar" var; ekranda ayri satir YOK', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'kabul', sohbet: 'yok' })
    await render(<KullaniciProfiliEkrani />)
    expect(await screen.findByText('Arkadaşsın')).toBeTruthy()
    expect(screen.queryByText('Arkadaşlıktan çıkar')).toBeNull()

    await fireEvent.press(screen.getByTestId('arkadas-durumu'))

    expect(screen.getByText('Arkadaşlıktan çıkar')).toBeTruthy()
  })

  it('sunucu hatasini gosterir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'yok' })
    ;(takipIstegiGonder as jest.Mock).mockRejectedValue(
      new Error('Bugunluk istek sinirina ulastin')
    )

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Arkadaş ekle'))
    expect(await screen.findByText('Bugunluk istek sinirina ulastin')).toBeTruthy()
  })

  it('takibi birak butonuna basinca dogru id ile cagirir ve takip et gosterir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'kabul', sohbet: 'yok' })
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByTestId('arkadas-durumu'))
    await fireEvent.press(await screen.findByText('Arkadaşlıktan çıkar'))

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('kullanici-2'))
    expect(await screen.findByText('Arkadaş ekle')).toBeTruthy()
    expect(screen.queryByText('Arkadaşlıktan çıkar')).toBeNull()
  })

  it('"Mesaj yaz" bag YOKKEN de sohbet ekranini acar; sohbet istegi RPC\'si HIC cagrilmaz', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'yok' })

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Mesaj yaz'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/kullanici-2')
    // Istegi sunucu `mesaj_gonder` icinde kendisi kuruyor; ekranin
    // onceden bir istek atmasi ayni isi iki kez yapmak olurdu.
    expect(sohbetIstegiGonder).not.toHaveBeenCalled()
    expect(screen.queryByText('İstek gönderildi')).toBeNull()
  })

  /**
   * Kullanicinin kurali (2026-09-01): "Gonderdigi mesaj istegini geri
   * cekme diye bir islem yok. Mesaj bir kere gonderildikten sonra geri
   * alinamaz."
   *
   * Sebep yalnizca politika degil, olculmus bir HATA: geri cekme
   * istegi geri almiyordu, ONAYLIYORDU. Yalnizca istek satirini
   * siliyor, konusmayi birakiyordu; konusmalarim() bir konusmayi
   * "istek" saymak icin bekleyen istek satirina baktigi icin konusma
   * alicinin MESAJLAR kutusuna dusuyordu.
   *
   * Yerine bilgi veren bir durum etiketi kondu. Vazgecmenin tek yolu
   * engellemek (ve istenirse engeli kaldirmak); o yol konusmayi
   * mesajlariyla birlikte siliyor.
   */
  it('sohbet beklemedeyken GERI CEK butonu YOK; durum etiketi de artik yok, "Mesaj yaz" var', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'kabul', sohbet: 'beklemede' })

    await render(<KullaniciProfiliEkrani />)

    // 2026-09-13: "Istek gonderildi" etiketi kalkti - istegin durumu
    // sohbet ekraninin kendisinde gorunuyor.
    expect(await screen.findByText('Arkadaşsın')).toBeTruthy()
    expect(screen.queryByText('İstek gönderildi')).toBeNull()
    expect(screen.queryByText('İsteği geri çek')).toBeNull()
    expect(screen.getByText('Mesaj yaz')).toBeTruthy()
  })

  it('takip beklemedeyken "Beklemede" dugmesine basmak istegi geri ceker ve "Arkadaş ekle"ye doner', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'beklemede', sohbet: 'yok' })
    ;(takibiBirak as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    expect(screen.queryByText('İsteği geri çek')).toBeNull()
    await fireEvent.press(await screen.findByText('Beklemede'))

    // Once ONAY (kullanicinin istegi 2026-09-17): pencere acilmadan
    // sunucuya gidilmez.
    expect(takibiBirak).not.toHaveBeenCalled()
    expect(screen.getByText('Arkadaşlık isteğini geri çekmek istiyor musun?')).toBeTruthy()
    await fireEvent.press(screen.getByText('Evet, geri çek'))

    await waitFor(() => expect(takibiBirak).toHaveBeenCalledWith('kullanici-2'))
    expect(await screen.findByText('Arkadaş ekle')).toBeTruthy()
  })

  it('geri cek onayinda "Vazgeç" istegi korur', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'beklemede', sohbet: 'yok' })
    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Beklemede'))
    await fireEvent.press(screen.getByText('Vazgeç'))

    expect(takibiBirak).not.toHaveBeenCalled()
    expect(screen.getByText('Beklemede')).toBeTruthy()
    expect(screen.queryByText('Arkadaşlık isteğini geri çekmek istiyor musun?')).toBeNull()
  })

  it('gelen takip istegi icin kabul et ve reddet butonlarini ve aciklamayi gosterir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'beklemede', gelenSohbet: 'yok',
    })

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Kabul et')).toBeTruthy()
    expect(screen.getByText('Reddet')).toBeTruthy()
    expect(screen.getByText("Kabul edersen birbirinizin check-in'lerini görebilir ve mesajlaşabilirsiniz.")).toBeTruthy()
  })

  it('gelen takip istegini kabul edince dogru id ile yanitlar ve blok kaybolur', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'beklemede', gelenSohbet: 'yok',
    })
    ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('kullanici-2', true))
    await waitFor(() => expect(screen.queryByText('Kabul et')).toBeNull())
  })

  it('gelen takip istegini reddedince dogru id ile yanitlar ve blok kaybolur', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'beklemede', gelenSohbet: 'yok',
    })
    ;(takipIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(takipIsteginiYanitla).toHaveBeenCalledWith('kullanici-2', false))
    await waitFor(() => expect(screen.queryByText('Reddet')).toBeNull())
  })

  it('gelen takip istegini yanitlama basarisiz olursa hata gosterir ve blok kalir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'beklemede', gelenSohbet: 'yok',
    })
    ;(takipIsteginiYanitla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Kabul et')).toBeTruthy()
  })

  it('gelen sohbet istegi icin kabul et ve reddet butonlarini gosterir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'beklemede',
    })

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Kabul et')).toBeTruthy()
    expect(screen.getByText('Reddet')).toBeTruthy()
  })

  it('gelen sohbet istegini kabul edince dogru id ile yanitlar', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'beklemede',
    })
    ;(sohbetIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    await waitFor(() => expect(sohbetIsteginiYanitla).toHaveBeenCalledWith('kullanici-2', true))
    await waitFor(() => expect(screen.queryByText('Kabul et')).toBeNull())
  })

  it('gelen sohbet istegini reddedince dogru id ile yanitlar', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'beklemede',
    })
    ;(sohbetIsteginiYanitla as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Reddet'))

    await waitFor(() => expect(sohbetIsteginiYanitla).toHaveBeenCalledWith('kullanici-2', false))
    await waitFor(() => expect(screen.queryByText('Reddet')).toBeNull())
  })

  it('sohbet kabul edilmisse "Sohbet açık" etiketi YOK, "Mesaj yaz" var', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'yok', sohbet: 'kabul' })

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Mesaj yaz')).toBeTruthy()
    expect(screen.queryByText('Sohbet açık')).toBeNull()
  })

  it('gelen sohbet istegini yanitlama basarisiz olursa hata gosterir ve blok kalir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'beklemede',
    })
    ;(sohbetIsteginiYanitla as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('Kabul et'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Kabul et')).toBeTruthy()
    expect(screen.getByText('Reddet')).toBeTruthy()
  })

  it('gelen sohbet istegi kabul edilmisse "Mesaj yaz" var, "Sohbet iste" yok', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'kabul',
    })

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Mesaj yaz')).toBeTruthy()
    expect(screen.queryByText('Sohbet iste')).toBeNull()
  })

  it('kendi istegim beklemedeyken gelen sohbet istegi kabul edilmisse sohbet acik gosterir, geri cek gostermez', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'beklemede', gelenTakip: 'yok', gelenSohbet: 'kabul',
    })

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Mesaj yaz')).toBeTruthy()
    expect(screen.queryByText('İsteği geri çek')).toBeNull()
  })

  it('gelen sohbet istegi beklemedeyken sohbet iste butonu gorunmez', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'beklemede',
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => expect(screen.getByText('Kabul et')).toBeTruthy())
    expect(screen.queryByText('Sohbet iste')).toBeNull()
  })

  it('takibi birakma basarisiz olursa hata gosterir ve durumu degistirmez', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'kabul', sohbet: 'yok' })
    ;(takibiBirak as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByTestId('arkadas-durumu'))
    await fireEvent.press(await screen.findByText('Arkadaşlıktan çıkar'))

    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(screen.getByText('Arkadaşsın')).toBeTruthy()
    expect(screen.queryByText('Arkadaş ekle')).toBeNull()
  })

  /*
   * PAYLAS SAG USTTE (kullanicinin tarifi 2026-09-13): "yukari saga
   * paylas ikonu olucak ... bu profilini birine paylasmak icin".
   */
  /**
   * PAYLAS IKONU UST CUBUKTAN KALKTI (kullanicinin istegi 2026-09-17):
   * "Profili paylaş" artik menunun ilk satiri. Ust cubukta tek dugme
   * var - uc nokta.
   */
  it('menudeki "Profili paylaş" profil baglantisini paylasir; ust cubukta ikon YOK', async () => {
    const paylasSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never)

    await render(<KullaniciProfiliEkrani />)
    await screen.findByText('Ada')
    expect(screen.queryByTestId('profili-paylas')).toBeNull()

    await fireEvent.press(screen.getByTestId('kullanici-menusu'))
    await fireEvent.press(await screen.findByTestId('menu-paylas'))

    await waitFor(() => expect(paylasSpy).toHaveBeenCalled())
    const mesaj = (paylasSpy.mock.calls[0][0] as { message: string }).message
    expect(mesaj).toContain('ada123')
    expect(mesaj).toContain('/kullanici/kullanici-2')
    paylasSpy.mockRestore()
  })

  it('arkadasken "Mesaj yaz" sohbet rotasina yonlendirir, buton "Arkadaşsın" durumunu gosterir', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'kabul', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'yok',
    })

    await render(<KullaniciProfiliEkrani />)
    expect(await screen.findByText('Arkadaşsın')).toBeTruthy()
    await fireEvent.press(screen.getByText('Mesaj yaz'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sohbet/kullanici-2')
    expect(screen.queryByText('Arkadaş ekle')).toBeNull()
  })

  /*
   * "MESAJ YAZ" HER ZAMAN VAR (2026-09-13). Eskiden "Mesaj gonder"
   * yalnizca bag varken gorunuyordu; iddia TERSINE cevrildi: bag yokken
   * de buton var, cunku mesaj istekleri modeli (2026-09-01) yabanciya
   * tek mesaj hakki veriyor ve kural sunucuda.
   */
  it('hicbir bag yokken de "Mesaj yaz" butonu VAR', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'yok', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'yok',
    })

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))

    expect(screen.getByText('Mesaj yaz')).toBeTruthy()
    expect(screen.queryByText('Mesaj gönder')).toBeNull()
  })
})


/**
 * EKRAN KENDI PROFIL DUZENINE TASINDI - kullanicinin istegi
 * 2026-09-08: "baskasi baskasinin profilini boyle goruyor boyle
 * olmamali, su an kullanicinin profili nasilsa aynisinin kapali
 * halini gormeli".
 */
describe('KullaniciProfiliEkrani duzen', () => {
  it('uc sayaci gosterir: ani, fotograf ve ARKADAS (sunucudan gelen sayi)', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
    await render(<KullaniciProfiliEkrani />)

    // Arkadas sayisi istemcide hesaplanamaz - bag listesi RLS'e tabi -
    // bu yuzden RPC'den geliyor.
    expect(await screen.findByLabelText('4 Arkadaş')).toBeTruthy()
    expect(screen.getByLabelText('0 Anı')).toBeTruthy()
    expect(screen.getByLabelText('0 Fotoğraf')).toBeTruthy()
  })

  it('sekme hapi var: Anilar ve En sik', async () => {
    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Anılar')).toBeTruthy()
    expect(screen.getByText('En sık')).toBeTruthy()
    expect(screen.getByTestId('sekme-gostergesi')).toBeTruthy()
  })

  /**
   * SIRA PROFILIN DURUMUNA GORE (kullanicinin istegi 2026-09-17):
   * GIZLI profilde once sayaclar sonra butonlar; ACIK profilde eski
   * duzen (once butonlar) AYNEN duruyor. Iki testi birden yazmak sart -
   * yalnizca biri olsaydi "her iki halde de ayni sira" da yesil gecerdi.
   */
  it('GIZLI profilde once sayaclar, sonra butonlar', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: true, arkadasSayisi: 2,
    })

    await render(<KullaniciProfiliEkrani />)
    await screen.findByTestId('profil-kilitli')

    const duzen = JSON.stringify(screen.toJSON())
    expect(duzen.indexOf('Fotoğraf')).toBeLessThan(duzen.indexOf('Arkadaş ekle'))
    // Sekme secici gizli profilde zaten cizilmiyordu.
    expect(screen.queryByText('En sık')).toBeNull()
  })

  it('ACIK profilde once butonlar, sonra sayaclar ve sekmeler', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: false, arkadasSayisi: 2,
    })

    await render(<KullaniciProfiliEkrani />)
    await screen.findByText('Anılar')

    const duzen = JSON.stringify(screen.toJSON())
    expect(duzen.indexOf('Arkadaş ekle')).toBeLessThan(duzen.indexOf('Fotoğraf'))
    expect(screen.getByText('En sık')).toBeTruthy()
  })

  /**
   * SIKAYET VE ENGELLEME SAYFANIN DIBINDEN KALKTI (kullanicinin
   * istegi 2026-09-17) ama islev DURUYOR: ust cubuktaki menude.
   * Magaza kurali (App Store, kullanici icerigi) bu yolu sart kosuyor,
   * bu yuzden test hem YOKLUGU hem VARLIGI olcuyor.
   */
  it('dipteki Sikayet/Engelle satiri YOK, menude VAR', async () => {
    await render(<KullaniciProfiliEkrani />)
    await screen.findByText('Ada')

    expect(screen.queryByText('Şikayet et')).toBeNull()
    expect(screen.queryByText('Engelle')).toBeNull()

    await fireEvent.press(screen.getByTestId('kullanici-menusu'))
    expect(await screen.findByText('Şikayet et')).toBeTruthy()
    expect(screen.getByText('Engelle')).toBeTruthy()
  })

  it('istek gonderilmisse BEKLEMEDE yazar, "Arkadaş ekle" gostermez', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'beklemede', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'yok',
    })
    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Beklemede')).toBeTruthy()
    expect(screen.queryByText('Arkadaş ekle')).toBeNull()
  })

  it('KAPALI PROFIL: duzen ayni kalir, liste yerine aciklama cikar', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: true, arkadasSayisi: 2,
    })
    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Bu profil kapalı')).toBeTruthy()
    // KIMLIK BLOGU AYNI kaliyor: sayaclar yerinde.
    expect(screen.getByLabelText('2 Arkadaş')).toBeTruthy()
    /*
     * SEKME HAPI ARTIK YOK (kullanicinin netlestirmesi 2026-09-10).
     * Bu satir eskiden `getByText('En sık')` idi: sekmeler kapali
     * profilde de duruyordu ve basildiginda hicbir sey degismiyordu.
     * Iddia silinmedi, TERSINE cevrildi - sekmeler sessizce geri
     * gelirse burasi kirilir.
     */
    expect(screen.queryByText('En sık')).toBeNull()
  })

  it('arkadaslik varsa kapali profil ACILIYOR', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: true, arkadasSayisi: 2,
    })
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({
      takip: 'kabul', sohbet: 'yok', gelenTakip: 'yok', gelenSohbet: 'yok',
    })
    await render(<KullaniciProfiliEkrani />)

    await screen.findByText('Arkadaşsın')
    expect(screen.queryByText('Bu profil kapalı')).toBeNull()
  })
  // ------------------------------------------------------------------ //
  // KENDI PROFILIM BU EKRANDA ACILMAZ (kullanicinin bildirdigi hata
  // 2026-09-09: "yorumda kendi profilime basinca sanki baskasinin
  // profiliymis gibi gosteriyor").
  //
  // Kural GIRIS NOKTALARINDA degil BURADA: on uc ayri yerden bu ekrana
  // giriliyor ve `benimMi` kontrolu yalnizca ikisinde vardi.
  // ------------------------------------------------------------------ //

  it('kendi profilime basinca /profil ekranina yonlendiriliyor', async () => {
    ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('kullanici-2')

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/profil'))
    // `push` DEGIL `replace`: geri tusu kullaniciyi geldigi yere
    // dondurmeli, arada olu bir ekran kalmamali.
    expect(mockRouterPush).not.toHaveBeenCalledWith('/profil')
  })

  it('kendi profilimde BOSA ISTEK atilmiyor', async () => {
    ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue('kullanici-2')

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalled())

    expect(baskasininProfiliniGetir).not.toHaveBeenCalled()
    expect(kullanicininAnilariniGetir).not.toHaveBeenCalled()
    expect(bagDurumunuGetir).not.toHaveBeenCalled()
  })

  /*
   * Kimlik okunamazsa (oturum yok, ag hatasi) ESKI DAVRANIS surer.
   * Bilmedigimiz bir sey yuzunden ekrani bos birakmak yanlis olurdu.
   */
  it('kendi kimligim okunamazsa ekran normal aciliyor', async () => {
    ;(kendiKullaniciIdim as jest.Mock).mockResolvedValue(null)

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => expect(baskasininProfiliniGetir).toHaveBeenCalledWith('kullanici-2'))
    expect(mockRouterReplace).not.toHaveBeenCalled()
  })
  /*
   * KAPALI PROFILDE SEKME YOK (kullanicinin netlestirmesi 2026-09-10:
   * "profili gizliyse asagida kitli oldugunu gosteren bir ifade
   * olucak; profili herkese aciksa normalde nasil gorunuyorsa oyle
   * gorunecek").
   *
   * Onceden sekmeler kapali profilde de duruyordu ve basildiginda
   * hicbir sey degismiyordu - secilecek bir sey yokken secici
   * gostermek kullaniciya bozuk bir kontrol sunuyordu.
   */
  it('KAPALI profilde sekme secici CIZILMIYOR', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: true, arkadasSayisi: 2,
    })

    await render(<KullaniciProfiliEkrani />)
    await screen.findByTestId('profil-kilitli')

    expect(screen.queryByText('Anılar')).toBeNull()
    expect(screen.queryByText('En sık')).toBeNull()
  })

  /*
   * ACIK PROFILDE HICBIR SEY DEGISMEDI: sekmeler duruyor, liste
   * normal. Bu test sart - onsuz "sekmeyi herkese kapat" hali de
   * yesil gecerdi.
   */
  it('ACIK profilde sekme secici DURUYOR', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: false, arkadasSayisi: 2,
    })

    await render(<KullaniciProfiliEkrani />)
    await screen.findByText('Anılar')

    expect(screen.getByText('En sık')).toBeTruthy()
    expect(screen.queryByTestId('profil-kilitli')).toBeNull()
  })
  /*
   * "EN SIK" BASKASININ PROFILINDE ILK BESLE SINIRLI (kullanicinin
   * karari 2026-09-10: "baskasi baskasinin profiline baktiginda en sik
   * ilk 5'i gorebilsin sadece").
   *
   * Kendi profil ekraninda boyle bir sinir YOK - orasi kisinin kendi
   * gecmisi. Buradaki liste bir TANITIM: "bu kisi genelde nereye
   * gidiyor" sorusunu cevapliyor, tam bir ziyaret dokumu vermiyor.
   */
  /*
   * YENI DUZEN (kullanicinin tarifi 2026-09-13): kapali profilde akis
   * yerine BUYUK bir kilit; acik profilde paylasimlar kendi profildeki
   * gibi KART olarak gorunuyor (menusuz - baskasinin karti).
   */
  it('KAPALI profilde akis karti YOK, kilit alani VAR', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: true, arkadasSayisi: 2,
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotografUrl: null, olusturmaZamani: new Date().toISOString(), canliMi: false,
        mekanSemti: null, etiketler: [] },
    ])

    await render(<KullaniciProfiliEkrani />)
    await screen.findByTestId('profil-kilitli')

    expect(screen.queryByText('Sahil Kafe')).toBeNull()
    // Sayaclar yine de sayiyi soyluyor - kilit yalnizca AKISI kapatiyor.
    expect(screen.getByLabelText('1 Anı')).toBeTruthy()
  })

  it('profil fotografina (avatar/serit) dokununca profil fotograflari gezgini acilir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: ['kullanici-2/1.jpg', 'kullanici-2/2.jpg'], profilGizli: false, arkadasSayisi: 0,
    })
    ;(profilFotograflariUrl as jest.Mock).mockResolvedValue([
      'https://ornek/imzali/kullanici-2/1.jpg',
      'https://ornek/imzali/kullanici-2/2.jpg',
    ])

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => expect(screen.getAllByTestId('profil-fotografi')).toHaveLength(2))

    // Seritteki ilk fotograf listede 2. sirada (ilki avatar).
    await fireEvent.press(screen.getAllByLabelText('Fotoğrafı büyüt')[1])
    await screen.findByTestId('profil-fotograflari-buyuk-gorunum')
    expect(screen.getByTestId('profil-fotograflari-sayac')).toHaveTextContent('2 / 2')
    expect(screen.getByTestId('profil-fotograflari-altyazisi')).toHaveTextContent(/ada123/)

    await fireEvent.press(screen.getByLabelText('Kapat'))
    // Avatar 1. sirayi acar.
    await fireEvent.press(screen.getAllByLabelText('Fotoğrafı büyüt')[0])
    expect(screen.getByTestId('profil-fotograflari-sayac')).toHaveTextContent('1 / 2')
  })

  it('kartin fotografina dokununca gezgin acilir: sayac ve kaydirma (2026-09-18)', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: null,
        fotografUrl: 'https://imzali/1.jpg', olusturmaZamani: new Date().toISOString(),
        canliMi: false, mekanSemti: null, etiketler: [] },
      { id: 'checkin-2', mekanId: 'mekan-2', mekanAdi: 'Kent Meydanı', notMetni: null,
        fotografUrl: 'https://imzali/2.jpg', olusturmaZamani: new Date().toISOString(),
        canliMi: false, mekanSemti: null, etiketler: [] },
    ])

    await render(<KullaniciProfiliEkrani />)
    const fotograflar = await screen.findAllByTestId('akis-fotografi')
    await fireEvent.press(fotograflar[0])

    await screen.findByTestId('kullanici-buyuk-gorunum')
    expect(screen.getByTestId('kullanici-sayac')).toHaveTextContent('1 / 2')
    expect(screen.queryByTestId('fotograf-gorunumu')).toBeNull()

    const liste = screen.getByTestId('kullanici-sayfalar')
    const genislik = require('react-native').Dimensions.get('window').width
    await fireEvent(liste, 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: genislik, y: 0 } },
    })
    expect(screen.getByTestId('kullanici-sayac')).toHaveTextContent('2 / 2')
    expect(screen.getByTestId('kullanici-fotograf-altyazisi')).toHaveTextContent(/Kent Meydanı/)
  })

  it('ACIK profilde paylasimlar KART olarak gorunur ve duzenleme menusu YOK', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotografUrl: null, olusturmaZamani: new Date().toISOString(), canliMi: false,
        mekanSemti: null, etiketler: [] },
    ])

    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByText('Sahil Kafe')).toBeTruthy()
    expect(screen.getByText('harika')).toBeTruthy()
    // Kart kendi profildekiyle AYNI bilesen; ama baskasinin karti
    // oldugu icin uc nokta menusu cizilmiyor.
    expect(screen.queryByLabelText('Seçenekler')).toBeNull()
    expect(screen.queryByText('Sil')).toBeNull()
  })

  it('fotografsiz profilde ortak bas harfli avatar cizilir', async () => {
    await render(<KullaniciProfiliEkrani />)

    expect(await screen.findByTestId('bos-avatar')).toBeTruthy()
    expect(screen.getByText('A')).toBeTruthy()
  })

  it('EN SIK listesinde en fazla BES yer gorunuyor', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', kullaniciAdi: 'ada123', ad: 'Ada', biyografi: null,
      fotograflar: [], profilGizli: false, arkadasSayisi: 2,
    })
    // Yedi FARKLI mekan; en cok gidilen ustte olacak sekilde azalan
    // sayida ani uretiliyor.
    const anilar: unknown[] = []
    for (let m = 0; m < 7; m += 1) {
      for (let k = 0; k < 7 - m; k += 1) {
        anilar.push({
          id: `ani-${m}-${k}`,
          mekanId: `mekan-${m}`,
          mekanAdi: `Mekan ${m}`,
          mekanSemti: 'Nilüfer',
          olusturmaZamani: new Date().toISOString(),
          notMetni: null,
          fotografUrl: null,
          etiketler: [],
        })
      }
    }
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue(anilar)

    await render(<KullaniciProfiliEkrani />)
    await fireEvent.press(await screen.findByText('En sık'))

    // Ilk bes: en cok gidilenden az gidilene.
    for (let m = 0; m < 5; m += 1) {
      expect(await screen.findByText(`Mekan ${m}`)).toBeTruthy()
    }
    // Altinci ve yedinci KESILIYOR.
    expect(screen.queryByText('Mekan 5')).toBeNull()
    expect(screen.queryByText('Mekan 6')).toBeNull()
  })

  // DUGME RENKLERI (kullanicinin istegi 2026-09-14: "daha belirgin"):
  // "Mesaj yaz" dolu turuncu + beyaz yazi; "Arkadassin" turuncu cizgili
  // + turuncu yazi. Onceki ikisi de notr gri/seftaliydi.
  it('"Mesaj yaz" dolu turuncu, "Arkadassin" turuncu cerceveli', async () => {
    ;(bagDurumunuGetir as jest.Mock).mockResolvedValue({ takip: 'kabul', sohbet: 'yok' })
    await render(<KullaniciProfiliEkrani />)
    const mesaj = await screen.findByTestId('mesaj-yaz')
    const mesajStil = StyleSheet.flatten(typeof mesaj.props.style === 'function' ? mesaj.props.style({ pressed: false }) : mesaj.props.style)
    expect(mesajStil.backgroundColor).toBe(acikRenk.turuncu)
    expect(StyleSheet.flatten(screen.getByText('Mesaj yaz').props.style).color).toBe('#FFFFFF')

    const durum = screen.getByTestId('arkadas-durumu')
    const durumStil = StyleSheet.flatten(typeof durum.props.style === 'function' ? durum.props.style({ pressed: false }) : durum.props.style)
    expect(durumStil.borderColor).toBe(acikRenk.turuncu)
    expect(StyleSheet.flatten(screen.getByText('Arkadaşsın').props.style).color).toBe(acikRenk.turuncuYazi)
  })
})
