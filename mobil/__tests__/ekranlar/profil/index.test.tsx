import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { processColor, Share, StyleSheet } from 'react-native'
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
  kullanicininAnilariniGetir: jest.fn(),
  aktifCheckInimiGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
jest.mock('../../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
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
  it('kullanici adini, adi ve biyografiyi gosterir', async () => {
    await render(<ProfilEkrani />)

    // Baslikta @ isareti VAR (kullanicinin istegi 2026-08-30). Bir gun
    // once kaldirilmisti; yeni istek onun yerine gecti.
    expect(await screen.findByText('orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
    expect(screen.getByText('İzmir')).toBeTruthy()
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
    // Uc sayi var: iki ani AYNI mekanda oldugu icin Yer 1, arkadas da 1.
    expect(screen.getByText('Yer')).toBeTruthy()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('Arkadaşlarım')).toBeTruthy()
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
    await fireEvent.press(await screen.findByText('Yerler'))

    expect(await screen.findByText('2 kez')).toBeTruthy()
    expect(screen.getByText('1 kez')).toBeTruthy()
    expect(screen.getByText('Kent Meydanı')).toBeTruthy()
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
    await fireEvent.press(await screen.findByText('Yerler'))

    const stil = StyleSheet.flatten((await screen.findByText('6')).props.style)
    expect(stil.fontSize).toBe(olcek.altBaslik)
    expect(stil.color).toBe(acikRenk.metinIkincil)
    expect(stil.color).not.toBe(acikRenk.metinSoluk)
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

  it('band dolu turuncu degil, seftaliden beyaza gecis', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    const band = screen.getByTestId('profil-bandi')
    // Gradyan renkleri prop olarak veriliyor; ilki seftali, sonuncusu
    // BEYAZ - bandin nerede bittigi gorunmesin diye. Bilesen renkleri
    // sayiya cevirdigi icin iki taraf da ayni donusumden geciriliyor.
    const renkler = band.props.colors as (string | number)[]
    expect(renkler[0]).toBe(processColor('#FFE6D2'))
    expect(renkler[renkler.length - 1]).toBe(processColor('#FFFFFF'))
  })

  it('band icindeki yazilar KOYU: acik gecis uzerinde beyaz okunmaz', async () => {
    await render(<ProfilEkrani />)
    const ad = await screen.findByText('Orcun Ozdemir')

    expect(duzYazi(ad).color).toBe('#17130F')
    // Sayilar da ayni: beyaz kalsaydi bandin altinda kaybolurlardi.
    expect(duzYazi(screen.getAllByText('0')[0]).color).toBe('#17130F')
  })

  it('bandin DISINDA hicbir sey degismedi: mekan adi hala marka turuncusu', async () => {
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([ani()])
    await render(<ProfilEkrani />)

    // Kullanicinin kurali: "sadece profil resminin arkasindaki renk
    // icin, geri kalan her sey ayni kalsin".
    const mekan = await screen.findByText('Sahil Kafe')
    expect(duzYazi(mekan).color).toBe('#FE7813')
  })

  // ---------------------------------------------------------------- //
  // GECIS TEPEDEN BASLAR (kullanicinin secimi 2026-09-03, "A")
  // ---------------------------------------------------------------- //

  it('gecis UST CUBUGUN ARDINDAN gecip tepeye uzaniyor', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    // "Rengi yukari kadar devam ettir, sonsuz dursun": gecis artik
    // sarmalayici degil, arkada duran mutlak bir zemin. Ust cubugun
    // ARDINDAN gecmesi icin icerigin ust ve yan paylarini geri aliyor.
    const duz = duzYazi(screen.getByTestId('profil-bandi'))
    expect(duz.position).toBe('absolute')
    expect(Number(duz.top)).toBeLessThan(0)
    expect(Number(duz.left)).toBeLessThan(0)
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

  it('bantta Profili duzenle / Paylas BUTONLARI YOK', async () => {
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    // Ikisi de kalkti: duzenleme ayarlara dondu, paylasma ust cubukta
    // ikon oldu.
    expect(screen.queryByText('Profili düzenle')).toBeNull()
    expect(screen.queryByText('Paylaş')).toBeNull()
  })

  it('ust cubuktaki paylas ikonu profili paylasiyor', async () => {
    const paylas = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never)
    await render(<ProfilEkrani />)
    await screen.findByText('Orcun Ozdemir')

    await fireEvent.press(screen.getByLabelText('Paylaş'))

    expect(paylas).toHaveBeenCalled()
    paylas.mockRestore()
  })

  it('kullanici adinda @ ISARETI YOK', async () => {
    await render(<ProfilEkrani />)

    // Kullanicinin karari 2026-09-03. Uygulamanin geri kalani (akis
    // kartlari, arama) zaten @'siz gosteriyordu.
    expect(await screen.findByText('orcun')).toBeTruthy()
    expect(screen.queryByText('@orcun')).toBeNull()
  })

  it('fotograf rozeti KOYU MODDA TURUNCU, acik modda koyu', async () => {
    // Kullanicinin istegi 2026-09-03: koyu modda "+" turuncuya donsun.
    // Palet karsilastirmasi: ekran testinde sema degistirilemedigi icin
    // iddia jetonun kendisine.
    expect(acikRenk.rozetZemin).toBe('#17130F')
    expect(koyuRenk.rozetZemin).toBe('#FE7813')
  })
})
