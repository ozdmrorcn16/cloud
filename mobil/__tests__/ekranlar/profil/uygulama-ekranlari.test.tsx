import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Linking } from 'react-native'
import GorunumEkrani from '../../../src/app/profil/gorunum'
import YardimEkrani from '../../../src/app/profil/yardim'
import HakkindaEkrani from '../../../src/app/profil/hakkinda'
import ToplulukKurallariEkrani from '../../../src/app/topluluk-kurallari'
import HesapYonetimiEkrani from '../../../src/app/profil/hesap-yonetimi'
import BildirimAyarlariEkrani from '../../../src/app/profil/bildirim-ayarlari'
import { temaTercihiniSifirla, temaTercihiniYukle, temaTercihi } from '../../../lib/tema-tercihi'
import { hesabiDondur } from '../../../lib/hesap'
import { verilerimiDisaAktar } from '../../../lib/veri-disa-aktar'
import { bildirimTercihleriniGetir, bildirimTercihiAyarla } from '../../../lib/ayarlar'
import { supabase } from '../../../lib/supabase'

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args), back: jest.fn() },
  useRouter: () => ({ push: mockRouterPush, back: jest.fn() }),
}))
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }))
jest.mock('../../../lib/hesap', () => ({ hesabiDondur: jest.fn() }))
jest.mock('../../../lib/veri-disa-aktar', () => ({ verilerimiDisaAktar: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({ supabase: { auth: { signOut: jest.fn() } } }))
jest.mock('../../../lib/ayarlar', () => ({
  bildirimTercihleriniGetir: jest.fn(),
  bildirimTercihiAyarla: jest.fn(),
}))

beforeEach(async () => {
  jest.clearAllMocks()
  await AsyncStorage.clear()
  temaTercihiniSifirla()
})

/**
 * GORUNUM (referans 2026-09-19): Tema karti - Sistemle ayni / Acik /
 * Koyu. Tercih CIHAZDA (AsyncStorage) saklanir ve aninda uygulanir.
 */
describe('GorunumEkrani', () => {
  it('uc secenek, varsayilan Sistemle ayni', async () => {
    await render(<GorunumEkrani />)
    expect(screen.getByText('Tema')).toBeTruthy()
    expect(screen.getByTestId('tema-sistem').props.accessibilityState.selected).toBe(true)
    expect(screen.getByTestId('tema-acik').props.accessibilityState.selected).toBe(false)
    expect(screen.getByText('Düşük ışıkta daha yumuşak görünüm.')).toBeTruthy()
  })

  it('Koyu secilince aninda secili olur ve cihaza yazilir', async () => {
    await render(<GorunumEkrani />)
    await fireEvent.press(screen.getByTestId('tema-koyu'))
    await waitFor(() => expect(screen.getByTestId('tema-koyu').props.accessibilityState.selected).toBe(true))
    await waitFor(async () => expect(await AsyncStorage.getItem('tema-tercihi')).toBe('koyu'))
    expect(temaTercihi()).toBe('koyu')
  })

  it('cihazdaki tercih acilista okunur; bozuk deger sistem sayilir', async () => {
    await AsyncStorage.setItem('tema-tercihi', 'acik')
    expect(await temaTercihiniYukle()).toBe('acik')
    await AsyncStorage.setItem('tema-tercihi', 'mor')
    expect(await temaTercihiniYukle()).toBe('sistem')
  })
})

/**
 * YARDIM MERKEZI (referans): dort soru, dokununca cevap; "Sorun bildir"
 * destek adresine e-posta acar.
 */
describe('YardimEkrani', () => {
  it('dort soru kapali acilir, dokununca cevap gorunur', async () => {
    await render(<YardimEkrani />)
    expect(screen.getByText('Gizli profil nasıl çalışır?')).toBeTruthy()
    expect(screen.getByText('Hesap dondurma ile silme arasındaki fark ne?')).toBeTruthy()
    expect(screen.queryByTestId('cevap-2')).toBeNull()
    await fireEvent.press(screen.getByTestId('soru-2'))
    expect(screen.getByTestId('cevap-2').props.children).toContain('Hayır')
    // Ayni soruya tekrar basinca kapanir.
    await fireEvent.press(screen.getByTestId('soru-2'))
    expect(screen.queryByTestId('cevap-2')).toBeNull()
  })

  it('Sorun bildir destek adresine konu satirli e-posta acar', async () => {
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    await render(<YardimEkrani />)
    await fireEvent.press(screen.getByTestId('sorun-bildir'))
    expect(ac).toHaveBeenCalledWith(expect.stringMatching(/^mailto:destek@slooin\.com\?subject=/))
    ac.mockRestore()
  })
})

/** SLOOIN HAKKINDA (referans): uc satir + surum. */
describe('HakkindaEkrani', () => {
  it('Birlikte daha iyi: topluluk kurallari, gizlilik, kosullar; surum yazili', async () => {
    await render(<HakkindaEkrani />)
    expect(screen.getByText('Birlikte daha iyi')).toBeTruthy()
    await fireEvent.press(screen.getByText('Topluluk kuralları'))
    await fireEvent.press(screen.getByText('Gizlilik politikası'))
    await fireEvent.press(screen.getByText('Kullanım koşulları'))
    expect(mockRouterPush.mock.calls.map((c) => c[0])).toEqual(['/topluluk-kurallari', '/gizlilik', '/kosullar'])
    expect(screen.getByTestId('surum').props.children).toBe('Slooin 1.0.0')
  })
})

describe('ToplulukKurallariEkrani', () => {
  it('alti kural ve kapanis', async () => {
    await render(<ToplulukKurallariEkrani />)
    expect(screen.getByText('Saygılı ol')).toBeTruthy()
    expect(screen.getByText('18 yaşından büyük ol')).toBeTruthy()
    expect(screen.getByText(/her şikâyet bir moderatör tarafından incelenir/)).toBeTruthy()
  })
})

/**
 * HESAP YONETIMI (referans): dondur (onay penceresi, sonra cikis), sil
 * (silme ekrani), "Verilerimi indir" (imzali adres).
 */
describe('HesapYonetimiEkrani', () => {
  it('dondurma onay ister; onayda dondurur ve oturumu kapatir', async () => {
    ;(hesabiDondur as jest.Mock).mockResolvedValue(undefined)
    ;(supabase.auth.signOut as jest.Mock).mockResolvedValue(undefined)
    await render(<HesapYonetimiEkrani />)
    await fireEvent.press(screen.getByText('Hesabı dondur'))
    expect(hesabiDondur).not.toHaveBeenCalled()
    await fireEvent.press(await screen.findByText('Evet, dondur'))
    await waitFor(() => expect(hesabiDondur).toHaveBeenCalled())
    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled())
  })

  it('vazgec basinca dondurmaz', async () => {
    await render(<HesapYonetimiEkrani />)
    await fireEvent.press(screen.getByText('Hesabı dondur'))
    await fireEvent.press(await screen.findByText('Vazgeç'))
    await waitFor(() => expect(screen.queryByText('Evet, dondur')).toBeNull())
    expect(hesabiDondur).not.toHaveBeenCalled()
  })

  it('dondurma hatasi ekranda, cikis yok', async () => {
    ;(hesabiDondur as jest.Mock).mockRejectedValue(new Error('Sunucuya ulasilamadi'))
    await render(<HesapYonetimiEkrani />)
    await fireEvent.press(screen.getByText('Hesabı dondur'))
    await fireEvent.press(await screen.findByText('Evet, dondur'))
    expect(await screen.findByText('Sunucuya ulasilamadi')).toBeTruthy()
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('Hesabi sil silme ekranina gider', async () => {
    await render(<HesapYonetimiEkrani />)
    await fireEvent.press(screen.getByText('Hesabı sil'))
    expect(mockRouterPush).toHaveBeenCalledWith('/profil/hesabi-sil')
  })

  it('Verilerimi indir imzali adresi acar; hata altinda yazar', async () => {
    const ac = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never)
    ;(verilerimiDisaAktar as jest.Mock).mockResolvedValue('https://imzali/dosya.json')
    await render(<HesapYonetimiEkrani />)
    expect(screen.getByText('Anıların sende kalsın')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('verilerimi-indir'))
    await waitFor(() => expect(ac).toHaveBeenCalledWith('https://imzali/dosya.json'))

    ;(verilerimiDisaAktar as jest.Mock).mockRejectedValue(new Error('olmadi'))
    await fireEvent.press(screen.getByTestId('verilerimi-indir'))
    expect(await screen.findByText('Veriler hazırlanamadı. Tekrar dene.')).toBeTruthy()
    ac.mockRestore()
  })
})

/**
 * BILDIRIMLER (referans 2026-09-19): ana anahtar, uc etkilesim
 * anahtari, ani hatirlatmasi, gece sessizi, cihaz ayarlari penceresi.
 * "Mekan onerileri" BILEREK YOK.
 */
describe('BildirimAyarlariEkrani', () => {
  const acik = { anlik: true, mesaj: true, arkadas: true, ani: true, aniHatirlatma: false, sessizGece: false }

  beforeEach(() => {
    ;(bildirimTercihleriniGetir as jest.Mock).mockResolvedValue(acik)
    ;(bildirimTercihiAyarla as jest.Mock).mockResolvedValue(undefined)
  })

  it('referans bolumleri ve anahtarlari; mekan onerileri YOK', async () => {
    await render(<BildirimAyarlariEkrani />)
    await waitFor(() => expect(screen.getByTestId('bildirim-anlik').props.value).toBe(true))
    for (const m of ['Anlık bildirimler', 'İnsanlar ve etkileşim', 'Arkadaşlık istekleri', 'Mesajlar', 'Etiketler', 'Keşif ve anılar', 'Anı hatırlatmaları', 'Sessiz saatler', 'Gece sessize al', 'Cihaz bildirim ayarları']) {
      expect(screen.getByText(m)).toBeTruthy()
    }
    expect(screen.queryByText('Mekân önerileri')).toBeNull()
    expect(screen.getByTestId('bildirim-aniHatirlatma').props.value).toBe(false)
  })

  it('anahtar degisince sunucuya yazar; hata olursa geri alir', async () => {
    await render(<BildirimAyarlariEkrani />)
    await waitFor(() => expect(screen.getByTestId('bildirim-sessizGece').props.value).toBe(false))
    await act(async () => {
      fireEvent(screen.getByTestId('bildirim-sessizGece'), 'valueChange', true)
    })
    await waitFor(() => expect(bildirimTercihiAyarla).toHaveBeenCalledWith('sessizGece', true))
    expect(screen.getByTestId('bildirim-sessizGece').props.value).toBe(true)

    ;(bildirimTercihiAyarla as jest.Mock).mockRejectedValue(new Error('olmadi'))
    await act(async () => {
      fireEvent(screen.getByTestId('bildirim-mesaj'), 'valueChange', false)
    })
    expect(await screen.findByText('olmadi')).toBeTruthy()
    expect(screen.getByTestId('bildirim-mesaj').props.value).toBe(true)
  })

  it('ana anahtar kapaliyken digerleri pasif', async () => {
    ;(bildirimTercihleriniGetir as jest.Mock).mockResolvedValue({ ...acik, anlik: false })
    await render(<BildirimAyarlariEkrani />)
    await waitFor(() => expect(screen.getByTestId('bildirim-anlik').props.value).toBe(false))
    expect(screen.getByTestId('bildirim-mesaj').props.disabled).toBe(true)
    expect(screen.getByTestId('bildirim-anlik').props.disabled).toBe(false)
  })

  it('Cihaz bildirim ayarlari pencereyi acar; Vazgec kapatir', async () => {
    await render(<BildirimAyarlariEkrani />)
    await waitFor(() => expect(screen.getByTestId('bildirim-anlik').props.value).toBe(true))
    expect(screen.queryByTestId('bildirim-izni-penceresi')).toBeNull()
    await fireEvent.press(screen.getByTestId('cihaz-bildirim-ayarlari'))
    expect(screen.getByText('Bildirim iznini yönet')).toBeTruthy()
    expect(screen.getByText(/Ayarlar → Bildirimler → Slooin/)).toBeTruthy()
    await fireEvent.press(screen.getByText('Vazgeç'))
    await waitFor(() => expect(screen.queryByTestId('bildirim-izni-penceresi')).toBeNull())
  })
})
