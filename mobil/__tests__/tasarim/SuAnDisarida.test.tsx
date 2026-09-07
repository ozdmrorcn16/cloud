import { render, screen, fireEvent } from '@testing-library/react-native'
import type { AkisOgesi } from '../../lib/akis'
import { SuAnDisarida, disaridakileriCikar } from '../../src/tasarim/SuAnDisarida'

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

function oge(ustune: Partial<AkisOgesi> = {}): AkisOgesi {
  return {
    id: 'checkin-1',
    kullaniciId: 'kullanici-1',
    kullaniciAdi: 'Ada',
    mekanId: 'mekan-1',
    mekanSemti: 'Nilüfer',
    avatarUrl: null,
    rumuz: null,
    mekanAdi: 'Sahil Kafe',
    notMetni: null,
    fotografUrl: null,
    olusturmaZamani: new Date().toISOString(),
    canliMi: true,
    benimMi: false,
    etiketler: [],
    ...ustune,
  }
}

/** Canlilik penceresinin (30 dk) disina dusen bir zaman damgasi. */
function eski(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
}

beforeEach(() => {
  mockRouterPush.mockClear()
})

describe('disaridakileriCikar', () => {
  it('yalnizca CANLI check-inleri aliyor', () => {
    const kisiler = disaridakileriCikar([
      oge({ id: 'a', kullaniciId: 'k1', canliMi: true }),
      oge({ id: 'b', kullaniciId: 'k2', canliMi: false }),
    ])

    expect(kisiler.map((k) => k.kullaniciId)).toEqual(['k1'])
  })

  it('canliMi true olsa da SURESI GECMIS kaydi almiyor', () => {
    // Serit ve kart AYNI olcutu kullaniyor (suAnBuradaMi). Ayri bir
    // kural yazilsaydi serit birini "disarida" sayarken kart ayni
    // kisiye tarih basardi.
    const kisiler = disaridakileriCikar([
      oge({ kullaniciId: 'k1', canliMi: true, olusturmaZamani: eski() }),
    ])

    expect(kisiler).toEqual([])
  })

  it('ayni kisiyi IKI KEZ gostermiyor', () => {
    // Sunucuda "tek aktif check-in" kurali var ama suresi dolmus bir
    // satirin konumu henuz silinmemis olabilir (cron 10 dakikada bir).
    const kisiler = disaridakileriCikar([
      oge({ id: 'a', kullaniciId: 'k1', mekanAdi: 'Yeni Yer' }),
      oge({ id: 'b', kullaniciId: 'k1', mekanAdi: 'Eski Yer' }),
    ])

    expect(kisiler).toHaveLength(1)
    // Akistaki SIRA korunuyor: en yeni check-in once geliyor.
    expect(kisiler[0].mekanAdi).toBe('Yeni Yer')
  })

  it('rumuz varsa onu, yoksa kullanici adini kullaniyor', () => {
    const kisiler = disaridakileriCikar([
      oge({ kullaniciId: 'k1', kullaniciAdi: 'Ada', rumuz: 'Adacan' }),
      oge({ kullaniciId: 'k2', kullaniciAdi: 'Deniz', rumuz: null }),
    ])

    expect(kisiler.map((k) => k.ad)).toEqual(['Adacan', 'Deniz'])
  })
})

describe('SuAnDisarida', () => {
  it('kimse disarida degilse HIC cizilmiyor', async () => {
    // Bos bir serit ekranin en ustunde yer kaplayip hicbir sey
    // soylemezdi; akis dogrudan basliyor.
    await render(<SuAnDisarida ogeler={[oge({ canliMi: false })]} />)

    expect(screen.queryByTestId('su-an-disarida')).toBeNull()
  })

  it('kisiyi adi VE bulundugu mekanla gosteriyor', async () => {
    await render(<SuAnDisarida ogeler={[oge({ kullaniciAdi: 'Ada', mekanAdi: 'Sahil Kafe' })]} />)

    expect(screen.getByText('Ada')).toBeTruthy()
    expect(screen.getByText('Sahil Kafe')).toBeTruthy()
  })

  it('sayi rozeti GERCEK sayiyi gosteriyor', async () => {
    await render(
      <SuAnDisarida
        ogeler={[
          oge({ id: 'a', kullaniciId: 'k1' }),
          oge({ id: 'b', kullaniciId: 'k2' }),
          oge({ id: 'c', kullaniciId: 'k3', canliMi: false }),
        ]}
      />
    )

    expect(screen.getByText('2 kişi')).toBeTruthy()
  })

  it('avatara basinca KISININ PROFILINE gidiyor', async () => {
    await render(<SuAnDisarida ogeler={[oge({ kullaniciId: 'k9', kullaniciAdi: 'Ada' })]} />)
    await fireEvent.press(screen.getByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k9')
  })

  it('kendi satirinda KENDI PROFILINE gidiyor', async () => {
    await render(<SuAnDisarida ogeler={[oge({ benimMi: true, kullaniciAdi: 'Ada' })]} />)
    await fireEvent.press(screen.getByText('Ada'))

    expect(mockRouterPush).toHaveBeenCalledWith('/profil')
  })

  it('mekan adina basinca MEKAN SAYFASINA gidiyor', async () => {
    // Akis kartindaki ayni ayrim: kisi -> profil, mekan -> harita.
    await render(<SuAnDisarida ogeler={[oge({ mekanId: 'm7', mekanAdi: 'Sahil Kafe' })]} />)
    await fireEvent.press(screen.getByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/harita/m7')
  })

  it('altidan fazla kisi varsa "+N" cikiyor ve basinca YERINDE aciliyor', async () => {
    const ogeler = Array.from({ length: 9 }, (_, i) =>
      oge({ id: `c${i}`, kullaniciId: `k${i}`, kullaniciAdi: `Kisi${i}` })
    )
    await render(<SuAnDisarida ogeler={ogeler} />)

    // Once alti gorunuyor, yedincisi gizli.
    expect(screen.getByText('+3')).toBeTruthy()
    expect(screen.queryByText('Kisi7')).toBeNull()

    // "+N" yeni bir ekran acmiyor, seridi yerinde geniletiyor -
    // boylece hicbir kisi erisilemez kalmiyor.
    await fireEvent.press(screen.getByTestId('disarida-hepsi'))

    expect(screen.getByText('Kisi7')).toBeTruthy()
    expect(screen.queryByText('+3')).toBeNull()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('YESIL CEVRIMICI NOKTASI YOK: presence verisi olmadan uydurulmuyor', async () => {
    // Referansta her avatarin sag altinda yesil bir nokta var. Bu
    // uygulamada presence sistemi yok; o noktayi "aktif kullanici"
    // anlaminda koymak uydurma veri olurdu. Ustelik seritteki herkes
    // tanim geregi canli, yani nokta bilgi tasimazdi.
    const agac = await render(<SuAnDisarida ogeler={[oge()]} />)
    const cizim = JSON.stringify(agac.toJSON())

    expect(cizim).not.toContain('#22C55E')
    expect(cizim).not.toContain('#4ADE80')
  })
})
