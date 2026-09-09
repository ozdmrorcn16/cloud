import {
  etiketlenecekler,
  EN_FAZLA_ETIKET,
  ETIKET_GENISLIK,
  ETIKET_YUKSEKLIK,
  type EtiketCercevesi,
} from './harita-etiket'

/**
 * Bu kural iki kez kirildi ve ikisini de KULLANICI bildirdi; hicbir sey
 * onu olcmuyordu. Testler o iki hatayi da kilitliyor.
 */

// 390x210'luk bir harita, ~240 m'lik bir cerceve. Bir derece enlem
// ~111 km oldugu icin 0,00216 derece ~240 m.
const CERCEVE: EtiketCercevesi = {
  merkez: { lat: 40.22, lng: 28.87 },
  latitudeDelta: 0.00216,
  longitudeDelta: 0.00283,
  en: 358,
  boy: 210,
}

/** Merkezden verilen piksel kadar otelenmis bir aday uretir. */
function aday(id: string, dx: number, dy: number, kisiSayisi = 0) {
  const pxEnlem = CERCEVE.boy / CERCEVE.latitudeDelta
  const pxBoylam = CERCEVE.en / CERCEVE.longitudeDelta
  return {
    id,
    kisiSayisi,
    konum: {
      lat: CERCEVE.merkez.lat - dy / pxEnlem,
      lng: CERCEVE.merkez.lng + dx / pxBoylam,
    },
  }
}

describe('etiketlenecekler', () => {
  it('cerceve ya da olcu yoksa HICBIRI secilmiyor', () => {
    expect(etiketlenecekler([aday('a', 0, 0)], null).size).toBe(0)
    expect(etiketlenecekler([aday('a', 0, 0)], { ...CERCEVE, en: 0 }).size).toBe(0)
  })

  /*
   * ASIL HATA BUYDU (kullanicinin bildirdigi: "isimleri yazmiyor").
   * Eski kural METRE cinsindendi ve esigi `max(50 m, ...)` idi; dikeyde
   * siralanmis yakin mekanlarin hepsini eliyordu. Piksel kutusu
   * dikeyde ayrik olanlari ELEMEZ.
   */
  it('dikeyde ayrik duran mekanlarin HEPSI etiketleniyor', () => {
    const adaylar = [0, 1, 2, 3, 4].map((i) =>
      aday(`d${i}`, 0, i * (ETIKET_YUKSEKLIK + 2))
    )

    expect(etiketlenecekler(adaylar, CERCEVE).size).toBe(5)
  })

  it('ust uste binen etiketlerden yalnizca biri seciliyor', () => {
    const adaylar = [
      aday('a', 0, 0),
      // Ayni satirda ve kutu genisliginden yakin: elenmeli.
      aday('b', ETIKET_GENISLIK - 20, 4),
    ]

    const secilen = etiketlenecekler(adaylar, CERCEVE)
    expect(secilen.size).toBe(1)
    expect(secilen.has('a')).toBe(true)
  })

  it('yatayda kutu genisligi kadar ayrik olanlar birlikte seciliyor', () => {
    const adaylar = [aday('a', 0, 0), aday('b', ETIKET_GENISLIK + 5, 0)]

    expect(etiketlenecekler(adaylar, CERCEVE).size).toBe(2)
  })

  /*
   * ONCELIK: kalabalik mekan once etiketlenir. Haritanin cevapladigi
   * soru "su an nerede hareket var".
   */
  it('cakisma varsa KALABALIK olan etiketleniyor', () => {
    const adaylar = [aday('sakin', 0, 0, 0), aday('kalabalik', 10, 4, 7)]

    const secilen = etiketlenecekler(adaylar, CERCEVE)
    expect(secilen.has('kalabalik')).toBe(true)
    expect(secilen.has('sakin')).toBe(false)
  })

  it('ust sinir asilmiyor', () => {
    // Hepsi dikeyde ayrik, yani geometri elemiyor; sayi siniri devrede.
    const adaylar = Array.from({ length: 40 }, (_, i) =>
      aday(`c${i}`, 0, i * (ETIKET_YUKSEKLIK + 2))
    )

    expect(etiketlenecekler(adaylar, CERCEVE).size).toBe(EN_FAZLA_ETIKET)
  })

  it('konumu olmayan aday atlaniyor', () => {
    const adaylar = [{ id: 'yok', kisiSayisi: 0, konum: null }, aday('var', 0, 0)]

    const secilen = etiketlenecekler(adaylar, CERCEVE)
    expect(secilen.has('var')).toBe(true)
    expect(secilen.has('yok')).toBe(false)
  })
})
