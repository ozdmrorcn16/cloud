import { render, screen, fireEvent } from '@testing-library/react-native'
import { HikayeSeridi } from '../../src/tasarim/HikayeSeridi'
import type { HikayeGrubu } from '../../lib/hikaye'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))

/**
 * HIKAYE SERIDI (2026-09-22): ilk daire hep "Hikayen"; arkadaslar
 * gorulmemis turuncu / gorulmus gri halka.
 */

function grup(id: string, ek: Partial<HikayeGrubu> = {}): HikayeGrubu {
  return {
    kullaniciId: id,
    ad: `Ad ${id}`,
    kullaniciAdi: `k_${id}`,
    avatarUrl: null,
    benimMi: false,
    gorulmemisVar: true,
    hikayeler: [
      {
        id: `${id}-h1`,
        kullaniciId: id,
        fotograf: 'x',
        fotografUrl: 'https://imzali/x.jpg',
        yazi: null,
        ifade: null,
        etiketler: [],
        mekanId: null,
        mekanAdi: null,
        olusturuldu: '2026-09-22T10:00:00Z',
        bitis: '2026-09-23T10:00:00Z',
        gordum: false,
        goruntulenmeSayisi: 0,
  gorunurluk: 'arkadaslar' as const,
  yerlesim: null,
      },
    ],
    ...ek,
  }
}

const ben = { id: 'ben', ad: 'Orçun', kullaniciAdi: 'byorcun', avatarUrl: null }

beforeEach(() => jest.clearAllMocks())

describe('HikayeSeridi', () => {
  it('hikayem yokken kendi dairem ekleme ekranini acar; arti rozeti de', async () => {
    await render(<HikayeSeridi gruplar={[]} ben={ben} />)
    expect(screen.getByTestId('hikaye-seridi')).toBeTruthy()
    expect(screen.getByText('Hikâyen')).toBeTruthy()
    await fireEvent.press(screen.getByTestId('hikaye-benim'))
    expect(mockPush).toHaveBeenCalledWith('/hikaye/ekle')
    await fireEvent.press(screen.getByTestId('hikaye-ekle-rozeti'))
    expect(mockPush).toHaveBeenLastCalledWith('/hikaye/ekle')
  })

  it('hikayem varken kendi dairem izleyiciyi acar, rozet yine ekler', async () => {
    await render(<HikayeSeridi gruplar={[grup('ben', { benimMi: true, gorulmemisVar: false })]} ben={ben} />)
    await fireEvent.press(screen.getByTestId('hikaye-benim'))
    expect(mockPush).toHaveBeenCalledWith('/hikaye/izle?kullanici=ben')
    await fireEvent.press(screen.getByTestId('hikaye-ekle-rozeti'))
    expect(mockPush).toHaveBeenLastCalledWith('/hikaye/ekle')
  })

  it('arkadaslar sirayla; gorulmemis olan secili (turuncu) durumunda, gorulmus degil; dokununca izleyici', async () => {
    await render(
      <HikayeSeridi gruplar={[grup('ayse'), grup('burak', { gorulmemisVar: false })]} ben={ben} />
    )
    expect(screen.getByText('k_ayse')).toBeTruthy()
    expect(screen.getByTestId('hikaye-ayse').props.accessibilityState).toEqual({ selected: true })
    expect(screen.getByTestId('hikaye-burak').props.accessibilityState).toEqual({ selected: false })
    await fireEvent.press(screen.getByTestId('hikaye-burak'))
    expect(mockPush).toHaveBeenCalledWith('/hikaye/izle?kullanici=burak')
  })

  it('profil okunamadiysa (ben=null) serit yine cizilir', async () => {
    await render(<HikayeSeridi gruplar={[]} ben={null} />)
    expect(screen.getByTestId('hikaye-benim')).toBeTruthy()
  })
})
