import { render, screen, fireEvent } from '@testing-library/react-native'
import AnlikArsiviEkrani from '../../src/app/anlik-arsivi'
import { anlikArsiviniGetir } from '../../lib/hikaye'

jest.mock('../../lib/hikaye', () => ({
  ...jest.requireActual('../../lib/hikaye'),
  anlikArsiviniGetir: jest.fn(),
}))
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    require('react').useEffect(effect, [])
  },
}))

/**
 * ANLIK ARSIVI (2026-09-24, kullanicinin karari): kisinin kendi butun
 * anliklari suresiz, yalnizca kendisi gorur; ana sayfanin sag ustunden.
 */
function anlik(id: string, bitis: string) {
  return {
    id, kullaniciId: 'ben', fotograf: `ben/${id}.jpg`, fotografUrl: `https://imzali/${id}.jpg`,
    yazi: null, ifade: null, etiketler: [], mekanId: null, mekanAdi: null,
    olusturuldu: new Date(Date.now() - 3 * 86400000).toISOString(), bitis,
    gordum: true, goruntulenmeSayisi: 0, gorunurluk: 'arkadaslar', yerlesim: null,
  }
}

beforeEach(() => jest.clearAllMocks())

describe('AnlikArsiviEkrani', () => {
  it('anliklari izgarada listeler; seritteki (aktif) anlikta nokta; dokunmak izleyiciyi o anliktan acar', async () => {
    const gelecek = new Date(Date.now() + 3600000).toISOString()
    const gecmis = new Date(Date.now() - 86400000).toISOString()
    ;(anlikArsiviniGetir as jest.Mock).mockResolvedValue({
      kullaniciId: 'ben', ad: 'Ben', kullaniciAdi: 'ben', avatarUrl: null, benimMi: true, gorulmemisVar: false,
      hikayeler: [anlik('y1', gelecek), anlik('y2', gecmis)],
    })
    await render(<AnlikArsiviEkrani />)
    expect(await screen.findByTestId('arsiv-y1')).toBeTruthy()
    expect(screen.getByTestId('arsiv-y2')).toBeTruthy()
    expect(screen.getByTestId('arsiv-aktif-y1')).toBeTruthy()
    expect(screen.queryByTestId('arsiv-aktif-y2')).toBeNull()
    expect(screen.getByText('Yalnızca sen görürsün. Anlıkların 24 saat sonra şeritten kalkar, burada kalır.')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('arsiv-y2'))
    expect(mockPush).toHaveBeenCalledWith('/hikaye/izle?arsiv=y2')
  })

  it('bos arsivde bilgi metni', async () => {
    ;(anlikArsiviniGetir as jest.Mock).mockResolvedValue({
      kullaniciId: 'ben', ad: '', kullaniciAdi: '', avatarUrl: null, benimMi: true, gorulmemisVar: false, hikayeler: [],
    })
    await render(<AnlikArsiviEkrani />)
    expect(await screen.findByTestId('arsiv-bos')).toHaveTextContent('Henüz bir anlığın yok.')
  })

  it('okuma hatasi ekranda yazilir', async () => {
    ;(anlikArsiviniGetir as jest.Mock).mockRejectedValue(new Error('Bir sorun oldu.'))
    await render(<AnlikArsiviEkrani />)
    expect(await screen.findByTestId('arsiv-bos')).toHaveTextContent('Bir sorun oldu.')
  })
})
