import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { YorumSayfasi } from '../../src/tasarim/YorumSayfasi'
import {
  yorumlariGetir,
  yorumEkle,
  yorumSil,
  yorumuSikayetEt,
  type Yorum,
} from '../../lib/etkilesim'

// requireActual: mock yalnizca AG CAGRILARINI degistiriyor, modulun
// sabitleri (YORUM_EN_FAZLA) gercek kalsin. Mock'lanmis bir sabit
// `undefined` doner ve `slice(0, undefined)` sessizce hicbir sey
// kirpmaz - bu tuzak bir kez yasandi.
jest.mock('../../lib/etkilesim', () => ({
  ...jest.requireActual('../../lib/etkilesim'),
  yorumlariGetir: jest.fn(),
  yorumEkle: jest.fn(),
  yorumSil: jest.fn(),
  yorumuSikayetEt: jest.fn(),
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

function yorum(ustune: Partial<Yorum> = {}): Yorum {
  return {
    id: 'yorum-1',
    kullaniciId: 'kisi-2',
    kullaniciAdi: 'deniz.k',
    ad: 'Deniz',
    metin: 'Buranın kahvesi gerçekten iyi mi?',
    olusturuldu: new Date().toISOString(),
    silebilirMi: false,
    ...ustune,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(yorumlariGetir as jest.Mock).mockResolvedValue([])
})

describe('YorumSayfasi', () => {
  it('kapaliyken hicbir sey cizmiyor', async () => {
    await render(<YorumSayfasi acikMi={false} checkInId="checkin-1" onKapat={jest.fn()} />)

    expect(screen.queryByTestId('yorum-sayfasi')).toBeNull()
    expect(yorumlariGetir).not.toHaveBeenCalled()
  })

  it('acilinca o paylasimin yorumlarini yukluyor ve gosteriyor', async () => {
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum()])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)

    expect(await screen.findByText('Buranın kahvesi gerçekten iyi mi?')).toBeTruthy()
    expect(screen.getByText('deniz.k')).toBeTruthy()
    expect(yorumlariGetir).toHaveBeenCalledWith('checkin-1')
  })

  it('yorum yokken yon veriyor, bos alan birakmiyor', async () => {
    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)

    expect(await screen.findByText('Henüz yorum yok')).toBeTruthy()
    // Yazma alani bos durumda da yerinde: kullanici hemen yazabilmeli.
    expect(screen.getByTestId('yorum-girdisi')).toBeTruthy()
  })

  it('zemine dokununca kapaniyor', async () => {
    const onKapat = jest.fn()
    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={onKapat} />)
    await screen.findByText('Henüz yorum yok')

    await fireEvent.press(screen.getByTestId('yorum-zemini'))

    expect(onKapat).toHaveBeenCalled()
  })

  it('yorum gonderiyor, kutuyu bosaltiyor ve listeyi tazeliyor', async () => {
    ;(yorumEkle as jest.Mock).mockResolvedValue(undefined)
    ;(yorumlariGetir as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([yorum({ metin: 'yeni yorum' })])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('Henüz yorum yok')

    await fireEvent.changeText(screen.getByTestId('yorum-girdisi'), 'yeni yorum')
    await fireEvent.press(screen.getByTestId('yorum-gonder'))

    expect(yorumEkle).toHaveBeenCalledWith('checkin-1', 'yeni yorum')
    expect(await screen.findByText('yeni yorum')).toBeTruthy()
    // Kutu bosalmazsa kullanici ayni yorumu ikinci kez gonderdigini sanir.
    expect(screen.getByTestId('yorum-girdisi').props.value).toBe('')
  })

  it('bos yorum gondermiyor', async () => {
    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('Henüz yorum yok')

    await fireEvent.changeText(screen.getByTestId('yorum-girdisi'), '   ')
    await fireEvent.press(screen.getByTestId('yorum-gonder'))

    expect(yorumEkle).not.toHaveBeenCalled()
  })

  it('emojiye dokununca yazma kutusuna ekliyor, dogrudan gondermiyor', async () => {
    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('Henüz yorum yok')

    await fireEvent.changeText(screen.getByTestId('yorum-girdisi'), 'harika')
    await fireEvent.press(screen.getByTestId('emoji-0'))

    expect(screen.getByTestId('yorum-girdisi').props.value).toBe('harika❤️')
    expect(yorumEkle).not.toHaveBeenCalled()
  })

  it('SINIRI asan yorum 500 karakterde kirpiliyor', async () => {
    ;(yorumEkle as jest.Mock).mockResolvedValue(undefined)
    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('Henüz yorum yok')

    await fireEvent.changeText(screen.getByTestId('yorum-girdisi'), 'a'.repeat(600))
    await fireEvent.press(screen.getByTestId('yorum-gonder'))

    expect(yorumEkle).toHaveBeenCalledWith('checkin-1', 'a'.repeat(500))
  })

  it('kendi yorumunda menude SIL var, sikayet yok', async () => {
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum({ silebilirMi: true })])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('deniz.k')

    await fireEvent.press(screen.getByTestId('yorum-menu-yorum-1'))

    expect(screen.getByTestId('secim-sil')).toBeTruthy()
    expect(screen.queryByTestId('secim-sikayet')).toBeNull()
  })

  it('baskasinin yorumunda menude SIKAYET var, silme yok', async () => {
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum({ silebilirMi: false })])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('deniz.k')

    await fireEvent.press(screen.getByTestId('yorum-menu-yorum-1'))

    expect(screen.getByTestId('secim-sikayet')).toBeTruthy()
    expect(screen.queryByTestId('secim-sil')).toBeNull()
  })

  it('silme ONAY istiyor ve onaylaninca listeden kaldiriyor', async () => {
    ;(yorumSil as jest.Mock).mockResolvedValue(undefined)
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum({ silebilirMi: true })])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('deniz.k')

    await fireEvent.press(screen.getByTestId('yorum-menu-yorum-1'))
    await fireEvent.press(screen.getByTestId('secim-sil'))
    expect(yorumSil).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    await waitFor(() => expect(yorumSil).toHaveBeenCalledWith('yorum-1'))
    await waitFor(() => expect(screen.queryByText('deniz.k')).toBeNull())
  })

  it('sikayet ONAY istiyor ve onaylaninca yorumu listeden kaldiriyor', async () => {
    ;(yorumuSikayetEt as jest.Mock).mockResolvedValue(undefined)
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum({ silebilirMi: false })])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('deniz.k')

    await fireEvent.press(screen.getByTestId('yorum-menu-yorum-1'))
    await fireEvent.press(screen.getByTestId('secim-sikayet'))
    expect(yorumuSikayetEt).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByTestId('onay-eylemi'))

    await waitFor(() => expect(yorumuSikayetEt).toHaveBeenCalledWith('yorum-1', 'taciz'))
    // Sikayet edilen yorum sunucuda ANINDA gizleniyor; listeden de kalkiyor.
    await waitFor(() => expect(screen.queryByText('deniz.k')).toBeNull())
  })

  it('yorum sayisi degisince haber veriyor (karttaki sayac guncellensin)', async () => {
    const onSayiDegisti = jest.fn()
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum(), yorum({ id: 'yorum-2' })])

    await render(
      <YorumSayfasi
        acikMi
        checkInId="checkin-1"
        onKapat={jest.fn()}
        onSayiDegisti={onSayiDegisti}
      />
    )

    await waitFor(() => expect(onSayiDegisti).toHaveBeenCalledWith(2))
  })

  it('yazara dokununca onun profiline gidiyor', async () => {
    ;(yorumlariGetir as jest.Mock).mockResolvedValue([yorum()])

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)
    await screen.findByText('deniz.k')

    await fireEvent.press(screen.getByText('deniz.k'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/kisi-2')
  })

  it('yorumlar yuklenemezse hata gosteriyor', async () => {
    ;(yorumlariGetir as jest.Mock).mockRejectedValue(new Error('ağ hatası'))

    await render(<YorumSayfasi acikMi checkInId="checkin-1" onKapat={jest.fn()} />)

    expect(await screen.findByText('ağ hatası')).toBeTruthy()
  })
})
