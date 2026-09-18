import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import ProfilDuzenleEkrani from '../../../src/app/profil/duzenle'
import { kendiProfilimiGetir, profiliGuncelle } from '../../../lib/profil'
import { kullaniciAdiniDegistir } from '../../../lib/kullanici-adi'
import { kullaniciAdiDurumunuGetir } from '../../../lib/ayarlar'

jest.mock('../../../lib/profil', () => ({
  kendiProfilimiGetir: jest.fn(),
  profiliGuncelle: jest.fn(),
}))
// Modulun SABITLERI gercek kaliyor (KULLANICI_ADI_KURALI ve bicim
// kontrolu); yalnizca ag cagrisi degistiriliyor. Eksik bir sabit hata
// vermiyor, sessizce undefined donuyor - 2026-09-02'de ogrenilen tuzak.
jest.mock('../../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../../lib/kullanici-adi'),
  kullaniciAdiniDegistir: jest.fn(),
}))
jest.mock('../../../lib/ayarlar', () => ({
  kullaniciAdiDurumunuGetir: jest.fn(),
}))

const PROFIL = {
  id: 'kullanici-1',
  kullaniciAdi: 'orcun',
  ad: 'Orcun Ozdemir',
  biyografi: 'merhaba',
  instagram: null,
  fotograflar: [],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue(PROFIL)
  ;(profiliGuncelle as jest.Mock).mockResolvedValue(undefined)
  ;(kullaniciAdiniDegistir as jest.Mock).mockResolvedValue(undefined)
  ;(kullaniciAdiDurumunuGetir as jest.Mock).mockResolvedValue({
    kullaniciAdi: 'orcun',
    sonrakiDegisimTarihi: null,
  })
})

/**
 * INSTAGRAM ALANI (kullanicinin istegi 2026-09-11).
 *
 * BEYAN, DOGRULAMA DEGIL: Meta kisisel hesaplar icin OAuth yolunu
 * 2024-12-04'te kapatti. Testler alanin BICIM davranisini kilitliyor;
 * dogrulama diye bir sey yok.
 */
describe('ProfilDuzenleEkrani - Instagram', () => {
  /*
   * DEGER testID ILE OKUNUYOR, `findByDisplayValue` ile DEGIL:
   * kullanici adi alani satir ici oldugundan (2026-09-11) ayni deger
   * iki alanda birden bulunabiliyor ve sorgu "birden fazla eleman"
   * diye patliyor.
   */
  it('mevcut degeri alana yaziyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
      ...PROFIL,
      instagram: 'orcun.ozdemir',
    })

    await render(<ProfilDuzenleEkrani />)

    const alan = await screen.findByTestId('instagram-girdisi')
    expect(alan.props.value).toBe('orcun.ozdemir')
  })

  /*
   * INSANLAR UC BICIMDE YAZIYOR (`orcun`, `@orcun`, yapistirilmis
   * adres) ve ucu de makul. Kaydederken hepsi ayni degere iniyor;
   * "yanlis yazdin" demek alanin tek isini (bir profile gitmek)
   * gereksiz yere zorlastirirdi.
   */
  it('yapistirilmis adresi sade kullanici adina indirip kaydediyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('Orcun Ozdemir')

    await fireEvent.changeText(
      screen.getByTestId('instagram-girdisi'),
      'https://www.instagram.com/Orcun.Ozdemir/'
    )
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() =>
      expect(profiliGuncelle).toHaveBeenCalledWith(
        expect.objectContaining({ instagram: 'orcun.ozdemir' })
      )
    )
  })

  it('alan bosaltilinca baglanti kaldiriliyor', async () => {
    ;(kendiProfilimiGetir as jest.Mock).mockResolvedValue({
      ...PROFIL,
      instagram: 'orcun.ozdemir',
    })

    await render(<ProfilDuzenleEkrani />)
    await screen.findByTestId('instagram-girdisi')

    await fireEvent.changeText(screen.getByTestId('instagram-girdisi'), '')
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() =>
      expect(profiliGuncelle).toHaveBeenCalledWith(expect.objectContaining({ instagram: null }))
    )
  })

  /*
   * GECERSIZ AD SUNUCUYA HIC GITMIYOR. Sunucudaki kisit onu zaten
   * reddederdi ama kullanici ham bir kisit ihlali gorurdu; burada
   * sebebi yaziyor.
   */
  it('gecersiz kullanici adini gondermiyor, sebebini soyluyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('Orcun Ozdemir')

    await fireEvent.changeText(screen.getByTestId('instagram-girdisi'), '.orcun')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(profiliGuncelle).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'Instagram kullanıcı adı harf, rakam, nokta ve alt çizgiden oluşur; nokta ile başlayamaz ya da bitemez.'
      )
    ).toBeTruthy()
  })
})

/**
 * KULLANICI ADI SATIR ICINDE (kullanicinin istegi 2026-09-11:
 * "kullanici adi satirina basinca baska sayfaya geciyor, onu iptal et;
 * bu attigim kendi satirinda duzenleme yapilacak").
 *
 * Ayri ekran SILINMEDI - ayarlardaki satir hala oraya gidiyor.
 */
describe('ProfilDuzenleEkrani - kullanici adi', () => {
  it('mevcut kullanici adi alanda duzenlenebilir duruyor', async () => {
    await render(<ProfilDuzenleEkrani />)

    expect(await screen.findByDisplayValue('orcun')).toBeTruthy()
  })

  /*
   * DEGISMEDIYSE RPC HIC CAGRILMIYOR: 30 gun sayaci yalnizca ad
   * gercekten degistiginde harcanmali. Kisi biyografisini duzeltip
   * kaydettiginde kullanici adi hakkini kaybetmemeli.
   */
  it('kullanici adi degismediyse degistirme cagrisi YAPILMIYOR', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.changeText(screen.getByTestId('instagram-girdisi'), 'orcun')
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() => expect(profiliGuncelle).toHaveBeenCalled())
    expect(kullaniciAdiniDegistir).not.toHaveBeenCalled()
  })

  it('kullanici adi degisince RPC cagriliyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.changeText(screen.getByTestId('kullanici-adi-girdisi'), 'yeni.ad')
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() => expect(kullaniciAdiniDegistir).toHaveBeenCalledWith('yeni.ad'))
  })

  /*
   * SIRA ONEMLI: reddedilebilen islem (kullanici adi) ONCE deneniyor.
   * Sonra yapilsaydi ad ve biyografi kaydedilir, kullanici adi
   * reddedilirdi ve kisi neyin kaydedilip neyin kaydedilmedigini
   * anlamazdi.
   */
  it('kullanici adi reddedilirse profil de kaydedilmiyor', async () => {
    ;(kullaniciAdiniDegistir as jest.Mock).mockRejectedValue(
      new Error('Kullanıcı adını 30 günde bir değiştirebilirsin. 12 gün kaldı.')
    )

    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.changeText(screen.getByTestId('kullanici-adi-girdisi'), 'yeni.ad')
    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() =>
      expect(
        screen.getByText('Kullanıcı adını 30 günde bir değiştirebilirsin. 12 gün kaldı.')
      ).toBeTruthy()
    )
    expect(profiliGuncelle).not.toHaveBeenCalled()
  })

  it('gecersiz kullanici adi sunucuya hic gitmiyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.changeText(screen.getByTestId('kullanici-adi-girdisi'), 'AB')
    await fireEvent.press(screen.getByText('Kaydet'))

    expect(kullaniciAdiniDegistir).not.toHaveBeenCalled()
    expect(profiliGuncelle).not.toHaveBeenCalled()
  })
})

/**
 * OTURDUGU BOLGE BU EKRANDA YOK (kullanicinin karari 2026-09-18 aksam):
 * bolge yalnizca hesap olusturmada secilir, profilde gosterilmez ve
 * gizleme ayari yok. Ekran bolgeyi ne cizer ne kaydeder - kaydetmede
 * bolge alani GONDERILMIYOR ki hesap olusturmada yazilan deger ezilmesin.
 */
describe('ProfilDuzenleEkrani - oturdugun bolge yok', () => {
  it('bolge secicileri cizilmiyor', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    expect(screen.queryByTestId('bolge-ulke')).toBeNull()
    expect(screen.queryByTestId('bolge-il')).toBeNull()
    expect(screen.queryByTestId('bolge-ilce')).toBeNull()
    expect(screen.queryByText('Oturduğun bölge')).toBeNull()
  })

  it('kaydetmede bolge alanlari gonderilmiyor (kayittaki deger korunur)', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.press(screen.getByText('Kaydet'))

    await waitFor(() => expect(profiliGuncelle).toHaveBeenCalled())
    const gonderilen = (profiliGuncelle as jest.Mock).mock.calls[0][0]
    expect(gonderilen).not.toHaveProperty('yasadigiUlke')
    expect(gonderilen).not.toHaveProperty('yasadigiIl')
    expect(gonderilen).not.toHaveProperty('yasadigiIlce')
  })
})

/**
 * SONUC MESAJI KAYDET'IN HEMEN USTUNDE (kullanicinin istegi 2026-09-18:
 * "kaydedildigi hemen ustunde yazsin, en ustte solda degil"). Sira
 * agactan olculuyor: mesaj Instagram ipucundan SONRA, dugmeden ONCE.
 */
describe('ProfilDuzenleEkrani - sonuc mesajinin yeri', () => {
  it('"Kaydedildi" dugmenin hemen ustunde ve ortali', async () => {
    await render(<ProfilDuzenleEkrani />)
    await screen.findByDisplayValue('orcun')

    await fireEvent.press(screen.getByText('Kaydet'))
    const mesaj = await screen.findByTestId('kaydet-bilgi')

    expect(mesaj.props.children).toBe('Profilin güncellendi.')
    const duz = Array.isArray(mesaj.props.style) ? Object.assign({}, ...mesaj.props.style) : mesaj.props.style
    expect(duz.textAlign).toBe('center')

    // Agactaki sira: ipucu -> mesaj -> Kaydet (JSON ciktisinda metin
    // sirasi = ekran sirasi; ayni yontem ayarlar testinde de var).
    const agac = JSON.stringify(screen.toJSON())
    const ipucuSira = agac.indexOf('Bağlantı da yapıştırabilirsin')
    const mesajSira = agac.indexOf('"kaydet-bilgi"')
    const dugmeSira = agac.indexOf('"Kaydet"')
    expect(ipucuSira).toBeGreaterThan(-1)
    expect(mesajSira).toBeGreaterThan(ipucuSira)
    expect(dugmeSira).toBeGreaterThan(mesajSira)
  })
})
