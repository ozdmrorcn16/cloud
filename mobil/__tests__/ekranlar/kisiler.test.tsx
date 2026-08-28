import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KisilerEkrani from '../../src/app/kisiler'
import { kisiAra } from '../../lib/kisi-ara'

jest.mock('../../lib/kisi-ara', () => ({ kisiAra: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve({ data: { signedUrl: 'https://ornek/imzali-foto.jpg' }, error: null }),
      }),
    },
  },
}))

describe('KisilerEkrani', () => {
  beforeEach(() => {
    ;(kisiAra as jest.Mock).mockReset()
    mockRouterPush.mockReset()
  })

  it('sonuclari kullanici adi ve isimle listeler', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı ya da isim'), 'orc')

    expect(await screen.findByText('orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('iki karakterden kisa metinde uyari gosterir', async () => {
    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı ya da isim'), 'o')

    expect(await screen.findByText('En az 2 karakter yaz.')).toBeTruthy()
    expect(kisiAra).not.toHaveBeenCalled()
  })

  it('sonuc yoksa bilgilendirir', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı ya da isim'), 'zzz')

    expect(await screen.findByText('Kimse bulunamadı.')).toBeTruthy()
  })

  it('sonuca basinca profile gider', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı ya da isim'), 'orc')
    await fireEvent.press(await screen.findByText('orcun'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k1'))
  })

  it('fotografi olan sonuc icin Image gosterir, olmayan icin gostermez', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'foto-var', ad: 'Foto Var', fotograf: 'kullanici-1/1.jpg' },
      { id: 'k2', kullaniciAdi: 'foto-yok', ad: 'Foto Yok', fotograf: null },
    ])

    await render(<KisilerEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Kullanıcı adı ya da isim'), 'foto')

    expect(await screen.findByText('foto-var')).toBeTruthy()
    expect(screen.getByText('foto-yok')).toBeTruthy()

    const gorseller = screen.getAllByTestId('kisi-fotografi')
    expect(gorseller).toHaveLength(1)
    // expo-image kaynagi DIZIYE normallestiriyor (react-native'in
    // Image'i tek nesne veriyordu). Onemli olan imzalanmis adresin
    // gorsele gecmesi.
    expect(gorseller[0].props.source).toEqual([{ uri: 'https://ornek/imzali-foto.jpg' }])
  })

  it('gec donen eski arama, yeni aramanin sonuclarinin uzerine yazmaz', async () => {
    let ilkiCoz: (deger: unknown) => void = () => {}
    const ilkSoz = new Promise((coz) => { ilkiCoz = coz })

    // Iki sonucta da gercek bir fotograf yolu var: imzalama (async)
    // asamasinin gercekten calistigindan ve imzalamadan SONRAKI
    // sonIstekRef kontrolunun devrede oldugundan emin olmak icin.
    // fotograf: null olsaydi imzalama hic tetiklenmez, o kontrol
    // hicbir zaman test edilmemis olurdu.
    ;(kisiAra as jest.Mock)
      .mockImplementationOnce(() => ilkSoz)
      .mockResolvedValueOnce([
        { id: 'k2', kullaniciAdi: 'ikinci', ad: 'Ikinci Kisi', fotograf: 'k2/b.jpg' },
      ])

    await render(<KisilerEkrani />)
    const kutu = screen.getByPlaceholderText('Kullanıcı adı ya da isim')

    // fireEvent.changeText yerine handler'i dogrudan cagiriyoruz: RNTL'in
    // fireEvent'i her cagriyi kendi act() kapsamiyla sarmaliyor ve iki
    // cozulmemis async cagriyi ust uste ates etmek "overlapping act()
    // calls" durumuna yol acip ikinci guncellemeyi sessizce dusuruyordu
    // (olculdu). Dogrudan cagri bu sorunu ortadan kaldiriyor.
    kutu.props.onChangeText('ilk')
    kutu.props.onChangeText('ikinci')

    expect(await screen.findByText('ikinci')).toBeTruthy()

    // Eski istek simdi geri donuyor; ekrani degistirmemeli.
    ilkiCoz([{ id: 'k1', kullaniciAdi: 'birinci', ad: 'Birinci Kisi', fotograf: 'k1/a.jpg' }])

    // waitFor kullanilmadi: ilk senkron kontrolde henuz hic guncelleme
    // islenmeden 'dogru' gorunup erken cikardi ve testi gecersiz kilardi
    // (olculdu). Eski istegin `await kisiAra(...)` devami Babel'in
    // regenerator tabanli async/await ceviriminden gectigi icin tek bir
    // mikrogorev turu yetmiyor; birden fazla gercek makrogorev turu
    // (setTimeout 0) gerekiyor.
    for (let i = 0; i < 5; i++) {
      await new Promise((cozumle) => setTimeout(cozumle, 0))
    }

    expect(screen.queryByText('birinci')).toBeNull()
    expect(screen.getByText('ikinci')).toBeTruthy()
  })
})
