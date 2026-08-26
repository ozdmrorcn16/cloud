import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  BEKLEME_SANIYE,
  EN_FAZLA_GONDERIM,
  gonderimDurumu,
  gonderimKaydet,
} from './kod-gonderim'

const TEL = '+905550000000'
const T0 = 1_700_000_000_000

beforeEach(async () => {
  await AsyncStorage.clear()
})

describe('kod gonderim sayaci', () => {
  it('kayit yokken TAM BEKLEME uygular', async () => {
    // Sifir dondurmek, /dogrula adresini elle acan birine "Tekrar
    // gonder"i aninda acardi.
    const durum = await gonderimDurumu(TEL, T0)
    expect(durum.kalanSaniye).toBe(BEKLEME_SANIYE)
    expect(durum.kalanHak).toBe(EN_FAZLA_GONDERIM)
  })

  it('gonderimden hemen sonra tam bekleme, sure gecince serbest', async () => {
    await gonderimKaydet(TEL, T0)

    expect((await gonderimDurumu(TEL, T0)).kalanSaniye).toBe(BEKLEME_SANIYE)
    expect((await gonderimDurumu(TEL, T0 + 30_000)).kalanSaniye).toBe(BEKLEME_SANIYE - 30)
    expect((await gonderimDurumu(TEL, T0 + 61_000)).kalanSaniye).toBe(0)
  })

  it('bekleme SAYFA YENILENSE DE surer - sayac cihazda duruyor', async () => {
    await gonderimKaydet(TEL, T0)
    // Ekran durumu sifirlanmis gibi yeniden soruyoruz.
    const durum = await gonderimDurumu(TEL, T0 + 10_000)
    expect(durum.kalanSaniye).toBe(BEKLEME_SANIYE - 10)
  })

  it('pencere icinde hak tukenince kalanHak sifirlanir', async () => {
    let an = T0
    for (let i = 0; i < EN_FAZLA_GONDERIM; i++) {
      await gonderimKaydet(TEL, an)
      an += 61_000
    }
    expect((await gonderimDurumu(TEL, an)).kalanHak).toBe(0)
  })

  it('pencere dolunca sayac sifirlanir', async () => {
    await gonderimKaydet(TEL, T0)
    const birSaatSonra = T0 + 60 * 60 * 1000 + 1000
    const durum = await gonderimDurumu(TEL, birSaatSonra)
    expect(durum.kalanHak).toBe(EN_FAZLA_GONDERIM)
  })

  it('sayac NUMARA BASINA tutuluyor', async () => {
    await gonderimKaydet(TEL, T0)
    const digeri = await gonderimDurumu('+905550000001', T0)
    expect(digeri.kalanHak).toBe(EN_FAZLA_GONDERIM)
  })
})
