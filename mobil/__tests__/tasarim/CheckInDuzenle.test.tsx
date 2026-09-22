import { render, screen, fireEvent, waitFor, within } from '@testing-library/react-native'
import * as ImagePicker from 'expo-image-picker'
import { CheckInDuzenle, type DuzenlemeDegisiklikleri } from '../../src/tasarim/CheckInDuzenle'
import type { AkisOgesi } from '../../lib/akis'
import { takipcilerimiGetir } from '../../lib/bag-listeleri'

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock('../../lib/bag-listeleri', () => ({ takipcilerimiGetir: jest.fn() }))

/**
 * "Check-in'i duzenle" sayfasi (referans, 2026-09-21). Sayfa sunucuya
 * dokunmaz; olculen sey Kaydet'e giden paket ve Vazgec'in hicbir sey
 * gondermemesi.
 */

function oge(ustune: Partial<AkisOgesi> = {}): AkisOgesi {
  return {
    id: 'checkin-1',
    kullaniciId: 'kullanici-1',
    kullaniciAdi: 'Orcun',
    rumuz: 'byorcun',
    mekanId: 'mekan-1',
    mekanAdi: 'Özdemir Kafe',
    mekanSemti: 'Nilüfer',
    notMetni: 'Kısa bir kahve molası.',
    ifade: 'kahve-keyfi',
    fotograflar: ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'],
    fotografUrller: ['https://imzali/a.jpg', 'https://imzali/b.jpg'],
    olusturmaZamani: new Date().toISOString(),
    canliMi: false,
    benimMi: true,
    etiketler: [{ kullaniciId: 'kisi-2', ad: 'Sena', kullaniciAdi: 'ozdemrs', avatarUrl: null }],
    avatarUrl: null,
    ...ustune,
  }
}

async function menudenSec(testID: string) {
  await fireEvent.press(await screen.findByTestId(testID))
  await waitFor(() => expect(screen.queryByTestId('secim-penceresi')).toBeNull())
  await new Promise((r) => setTimeout(r, 120))
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(takipcilerimiGetir as jest.Mock).mockResolvedValue([
    { id: 'kisi-3', ad: 'Ada', kullaniciAdi: 'ada', avatarUrl: null },
  ])
})

describe('CheckInDuzenle', () => {
  it('acilinca mevcut not, ifade, fotograflar ve etiketler dolu gelir; baslik ve mekan karti referanstaki gibi', async () => {
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={jest.fn()} onKaydet={jest.fn()} />)
    expect(screen.getByText('Check-in’i düzenle')).toBeTruthy()
    expect(screen.getByText('Özdemir Kafe')).toBeTruthy()
    expect(screen.getByText('byorcun · 3 saat önce')).toBeTruthy()
    expect(screen.getByTestId('duzenle-not').props.value).toBe('Kısa bir kahve molası.')
    expect(screen.getByTestId('duzenle-foto-0')).toBeTruthy()
    expect(screen.getByTestId('duzenle-foto-1')).toBeTruthy()
    expect(screen.getByTestId('duzenle-foto-ekle')).toBeTruthy()
    // Ifade satiri: kutuda ifadenin ikonu, baslikta etiketi (referans 2026-09-22).
    expect(screen.getByTestId('duzenle-ifade-kahve-keyfi')).toBeTruthy()
    expect(screen.getByText('Kahve keyfi')).toBeTruthy()
    expect(screen.getByTestId('duzenle-etiket-kisi-2')).toBeTruthy()
    // Dip not ve cizgi KALKTI (kullanicinin istegi 2026-09-22).
    expect(screen.queryByText('Değişiklikler kaydedildiğinde uygulanır.')).toBeNull()
  })

  it('hicbir seye dokunmadan Kaydet: not ve ifade aynen, fotograflar NULL (dokunulmadi), etiket listeleri bos', async () => {
    const onKaydet = jest.fn().mockResolvedValue(undefined)
    const onKapat = jest.fn()
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={onKapat} onKaydet={onKaydet} />)
    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    await waitFor(() => expect(onKaydet).toHaveBeenCalled())
    const paket = onKaydet.mock.calls[0][0] as DuzenlemeDegisiklikleri
    expect(paket).toEqual({ not: 'Kısa bir kahve molası.', ifade: 'kahve-keyfi', fotograflar: null, etiketEkle: [], etiketKaldir: [] })
    await waitFor(() => expect(onKapat).toHaveBeenCalled())
  })

  it('FOTOGRAF: galeriden iki secim -> dort kare; birini kaldir; Kaydet kalan yollari + yeni dosyalari verir', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///c.jpg' }, { uri: 'file:///d.jpg' }],
    })
    const onKaydet = jest.fn().mockResolvedValue(undefined)
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={jest.fn()} onKaydet={onKaydet} />)

    await fireEvent.press(screen.getByTestId('duzenle-foto-ekle'))
    await menudenSec('foto-galeri')
    // Galeri kalan yer kadar COKLU secimle acildi (5 - 2 = 3).
    expect((ImagePicker.launchImageLibraryAsync as jest.Mock).mock.calls[0][0]).toMatchObject({
      allowsMultipleSelection: true,
      selectionLimit: 3,
    })
    expect(await screen.findByTestId('duzenle-foto-3')).toBeTruthy()

    // Mevcut ilk fotografi kaldir (a.jpg).
    await fireEvent.press(screen.getByTestId('duzenle-foto-kaldir-0'))
    expect(screen.queryByTestId('duzenle-foto-3')).toBeNull()

    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    await waitFor(() => expect(onKaydet).toHaveBeenCalled())
    const paket = onKaydet.mock.calls[0][0] as DuzenlemeDegisiklikleri
    expect(paket.fotograflar).toEqual({ kalanYollar: ['kullanici-1/b.jpg'], yeniUriler: ['file:///c.jpg', 'file:///d.jpg'] })
  })

  it('FOTOGRAF: 5 kareye ulasinca "Ekle" karesi gizlenir', async () => {
    const bes = oge({
      fotograflar: ['u/1.jpg', 'u/2.jpg', 'u/3.jpg', 'u/4.jpg', 'u/5.jpg'],
      fotografUrller: ['h/1', 'h/2', 'h/3', 'h/4', 'h/5'],
    })
    await render(<CheckInDuzenle acikMi oge={bes} zamanYazisi="az önce" onKapat={jest.fn()} onKaydet={jest.fn()} />)
    expect(screen.getByTestId('duzenle-foto-4')).toBeTruthy()
    expect(screen.queryByTestId('duzenle-foto-ekle')).toBeNull()
  })

  it('FOTOGRAF: "Degistir" tek secimle o kareyi yeniler; kalan yollar arasinda artik yok', async () => {
    ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///yeni.jpg' }] })
    const onKaydet = jest.fn().mockResolvedValue(undefined)
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={jest.fn()} onKaydet={onKaydet} />)
    await fireEvent.press(screen.getByTestId('duzenle-foto-degistir-1'))
    await menudenSec('foto-galeri')
    expect((ImagePicker.launchImageLibraryAsync as jest.Mock).mock.calls[0][0]).toMatchObject({ selectionLimit: 1 })
    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    await waitFor(() => expect(onKaydet).toHaveBeenCalled())
    expect((onKaydet.mock.calls[0][0] as DuzenlemeDegisiklikleri).fotograflar).toEqual({
      kalanYollar: ['kullanici-1/a.jpg'],
      yeniUriler: ['file:///yeni.jpg'],
    })
  })

  it('IFADE ve BIRLIKTE: ifade kaldir, mevcut etiketi kaldir, listeden yeni arkadas ekle -> paket dogru', async () => {
    const onKaydet = jest.fn().mockResolvedValue(undefined)
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={jest.fn()} onKaydet={onKaydet} />)
    await fireEvent.press(screen.getByTestId('ifade-kaldir'))
    expect(screen.queryByTestId('duzenle-ifade-kahve-keyfi')).toBeNull()
    // Ifade yokken satir "Ifade ekle" + alt yazi.
    expect(screen.getByText('İfade ekle')).toBeTruthy()
    expect(screen.getByText('Bu ana bir ifade kat')).toBeTruthy()

    await fireEvent.press(screen.getByTestId('duzenle-etiket-kaldir-kisi-2'))
    expect(screen.queryByTestId('duzenle-etiket-kisi-2')).toBeNull()

    await fireEvent.press(screen.getByTestId('duzenle-birlikte-ekle'))
    await fireEvent.press(await screen.findByText('ada'))
    await waitFor(() => expect(screen.getByTestId('duzenle-etiket-kisi-3')).toBeTruthy())

    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'Yeni not')
    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    await waitFor(() => expect(onKaydet).toHaveBeenCalled())
    expect(onKaydet.mock.calls[0][0]).toEqual({
      not: 'Yeni not',
      ifade: null,
      fotograflar: null,
      etiketEkle: ['kisi-3'],
      etiketKaldir: ['kisi-2'],
    })
  })

  it('VAZGEC ve X onKaydet cagirmaz, onKapat cagirir', async () => {
    const onKaydet = jest.fn()
    const onKapat = jest.fn()
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={onKapat} onKaydet={onKaydet} />)
    await fireEvent.press(screen.getByTestId('duzenle-foto-kaldir-0'))
    await fireEvent.press(screen.getByTestId('duzenle-vazgec'))
    expect(onKaydet).not.toHaveBeenCalled()
    expect(onKapat).toHaveBeenCalledTimes(1)
    await fireEvent.press(screen.getByTestId('duzenle-kapat'))
    expect(onKapat).toHaveBeenCalledTimes(2)
  })

  it('Kaydet reddedilirse hata gorunur, sayfa ACIK kalir, yazilan not durur', async () => {
    const onKaydet = jest.fn().mockRejectedValue(new Error('En fazla 5 fotoğraf'))
    const onKapat = jest.fn()
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="3 saat önce" onKapat={onKapat} onKaydet={onKaydet} />)
    await fireEvent.changeText(screen.getByTestId('duzenle-not'), 'kaybolmasin')
    await fireEvent.press(screen.getByTestId('duzenle-kaydet'))
    expect(await screen.findByTestId('duzenle-hata')).toHaveTextContent('En fazla 5 fotoğraf')
    expect(onKapat).not.toHaveBeenCalled()
    expect(screen.getByTestId('duzenle-not').props.value).toBe('kaybolmasin')
  })

  it('FOTOGRAFA DOKUNUNCA BUYUK ACILIR (2026-09-22): gezgin o kareden, sayacli; x ve Degistir ayri', async () => {
    await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="" onKapat={jest.fn()} onKaydet={jest.fn()} />)
    await fireEvent.press(screen.getByTestId('duzenle-foto-ac-1'))
    expect(await screen.findByTestId('duzenle-foto-buyuk-gorunum')).toBeTruthy()
    expect(screen.getByTestId('duzenle-foto-sayac')).toHaveTextContent('2 / 2')
    await fireEvent.press(within(screen.getByTestId('duzenle-foto-buyuk-gorunum')).getByLabelText('Kapat'))
    await waitFor(() => expect(screen.queryByTestId('duzenle-foto-buyuk-gorunum')).toBeNull())
    // Kaldirma hala calisiyor, buyuk gorunumu acmiyor.
    await fireEvent.press(screen.getByTestId('duzenle-foto-kaldir-0'))
    expect(screen.queryByTestId('duzenle-foto-buyuk-gorunum')).toBeNull()
    expect(screen.queryByTestId('duzenle-foto-1')).toBeNull()
  })

  it('KLAVYE sayfayi itmez (2026-09-22): KeyboardAvoidingView yok, icerik klavye kadar kaydirilabilir', async () => {
    const ekran = await render(<CheckInDuzenle acikMi oge={oge()} zamanYazisi="" onKapat={jest.fn()} onKaydet={jest.fn()} />)
    const agac = JSON.stringify(ekran.toJSON())
    expect(agac).not.toContain('KeyboardAvoidingView')
    // ScrollView klavye icin alt bosluk ekler; alt serit yerinde kalir.
    expect(agac).toContain('"automaticallyAdjustKeyboardInsets":true')
  })

  it('kapaliyken hicbir sey cizmez', async () => {
    await render(<CheckInDuzenle acikMi={false} oge={oge()} zamanYazisi="" onKapat={jest.fn()} onKaydet={jest.fn()} />)
    expect(screen.queryByTestId('duzenle-sayfasi')).toBeNull()
  })
})
