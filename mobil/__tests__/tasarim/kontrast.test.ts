import { acikRenk, koyuRenk, type Renk } from '../../src/tasarim/tema'

/**
 * JETONLARIN KONTRAST TESTI (2026-09-07 tasarim denetimi).
 *
 * Bu paket bir tasarim tercihini degil OLCULEBILIR bir esigi koruyor.
 * Denetimde bulunan kusurlarin hepsi renk jetonlarindaydi ve hicbiri
 * gozle fark edilmemisti - ancak hesaplanınca ortaya cikti:
 *
 *   turuncu dolgu uzerinde beyaz yazi ......... 2,65:1  (esik 3,0)
 *   beyaz zeminde turuncu yazi ................ 2,65:1  (esik 4,5)
 *   profil bandinda turuncu yazi .............. 2,21:1
 *   koyu modda BASILI butonun beyaz etiketi ... 1,96:1
 *   yer tutucu metni .......................... 2,74:1
 *
 * Bir jetonun degeri ileride degistirilirse bu testler kirilir. Amaci
 * tam bu: renk kararlari artik sessizce gerileyemez.
 *
 * WCGA 2.1 esikleri: govde metni 4,5:1; kalin >=14px ya da >=18px yazi
 * 3:1; metin olmayan ogeler (ikon, grafik) 3:1.
 */

/** sRGB kanalini dogrusallastirir (WCAG 2.1 bagil parlaklik). */
function kanal(deger: number): number {
  const o = deger / 255
  return o <= 0.03928 ? o / 12.92 : ((o + 0.055) / 1.055) ** 2.4
}

function parlaklik(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b)
}

/** Iki rengin WCAG kontrast orani (1 ile 21 arasi). */
export function kontrast(a: string, b: string): number {
  const la = parlaklik(a)
  const lb = parlaklik(b)
  const ust = Math.max(la, lb)
  const alt = Math.min(la, lb)
  return (ust + 0.05) / (alt + 0.05)
}

const BEYAZ = '#FFFFFF'

/** Iki basamakli, okunur bir sayi - hata mesaji anlasilir olsun. */
function oran(a: string, b: string): number {
  return Math.round(kontrast(a, b) * 100) / 100
}

describe('kontrast: dogrulama yardimcisi', () => {
  it('bilinen degerleri dogru hesapliyor', () => {
    // Siyah/beyaz ust sinir 21, ayni renk 1.
    expect(oran('#000000', '#FFFFFF')).toBe(21)
    expect(oran('#FE7813', '#FE7813')).toBe(1)
    // Denetimde olculen degerin kendisi - yardimci dogru degilse bu
    // paketin butun iddialari anlamsiz olurdu.
    expect(oran('#FE7813', BEYAZ)).toBe(2.65)
  })
})

describe.each([
  ['acik', acikRenk as Renk],
  ['koyu', koyuRenk],
])('kontrast: %s mod', (mod, renk) => {
  // ---------------------------------------------------------------- //
  // DOLGULAR - uzerlerinde BEYAZ etiket duruyor.
  //
  // Butun birincil butonlarin etiketi '#FFFFFF' olarak koda gomulu
  // (jeton degil), cunku iki modda da turuncu dolgunun uzerinde
  // duruyorlar. Bu yuzden esik moda bagli degil.
  // ---------------------------------------------------------------- //

  it('turuncu dolgu uzerindeki beyaz etiket 3:1 esigini geciyor', () => {
    expect(oran(BEYAZ, renk.turuncu)).toBeGreaterThanOrEqual(3)
  })

  it('BASILI dolgu uzerindeki beyaz etiket 3:1 esigini geciyor', () => {
    // Bu, koyu modda 1,96:1'e dusen ve etiketi yok eden haldi.
    expect(oran(BEYAZ, renk.turuncuBasili)).toBeGreaterThanOrEqual(3)
  })

  it('basili dolgu, basilmamis dolgudan AYIRT EDILEBILIR', () => {
    // Basili hal geri bildirim veriyorsa gozle secilmeli. Ayni zamanda
    // "basildi" hissi icin KOYULASMASI gerekiyor: koyu modda aciltilmis
    // bir dolgu "basildi" degil "pasif" gibi okunuyordu.
    expect(renk.turuncuBasili).not.toBe(renk.turuncu)
    expect(parlaklik(renk.turuncuBasili)).toBeLessThan(parlaklik(renk.turuncu))
  })

  // ---------------------------------------------------------------- //
  // YAZILAR - govde esigi 4,5:1.
  // ---------------------------------------------------------------- //

  const yuzeyler: [string, keyof Renk][] = [
    ['sayfa zemini', 'zemin'],
    ['kart yuzeyi', 'yuzey'],
    ['karsilama zemini', 'karsilamaZemini'],
    ['turuncu cip zemini', 'turuncuZemin'],
    ['profil bandi ustu', 'bandUst'],
    ['profil bandi ortasi', 'bandOrta'],
  ]

  describe.each(yuzeyler)('%s uzerinde', (_ad, yuzeyJetonu) => {
    const yuzey = renk[yuzeyJetonu]

    it('ana metin okunuyor', () => {
      expect(oran(renk.metin, yuzey)).toBeGreaterThanOrEqual(4.5)
    })

    it('ikincil metin okunuyor', () => {
      // Yer tutucular ve harita atfi da bu jetonu kullaniyor.
      expect(oran(renk.metinIkincil, yuzey)).toBeGreaterThanOrEqual(4.5)
    })

    it('turuncu YAZI okunuyor', () => {
      // Denetimin en yaygin bulgusu: 37 yerde turuncu yazi vardi ve
      // acik modda hicbirinde esigi gecmiyordu.
      expect(oran(renk.turuncuYazi, yuzey)).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('yikici eylem metni sayfa zemininde okunuyor', () => {
    expect(oran(renk.yikici, renk.zemin)).toBeGreaterThanOrEqual(4.5)
  })

  // ---------------------------------------------------------------- //
  // IKONLAR ve GRAFIKLER - esik 3:1, metin degil.
  // ---------------------------------------------------------------- //

  it('turuncu ikon sayfa zemininde 3:1 esigini geciyor', () => {
    // Dolgu jetonu ikon olarak da kullaniliyor (alt gezinme, igneler,
    // arama ikonu). Metin esigini gecmesi gerekmiyor, grafik esigini
    // gecmesi gerekiyor.
    expect(oran(renk.turuncu, renk.zemin)).toBeGreaterThanOrEqual(3)
  })

  it('profil rozetinin isareti zemininde okunuyor', () => {
    // Rozetin uzerindeki "+" isareti `renk.zemin` rengini aliyor.
    expect(oran(renk.zemin, renk.rozetZemin)).toBeGreaterThanOrEqual(4.5)
  })

  // ---------------------------------------------------------------- //
  // JETON ROLLERI
  // ---------------------------------------------------------------- //

  it('yuzer cubuk OPAK: saydamlik bulaniklik olmadan kirlilik uretiyordu', () => {
    // rgba(...) yerine duz bir hex bekleniyor. Saydam cubugun ardindan
    // gecen icerik (kirpilmis mekan adi, yarim buton) malzeme gibi
    // degil cizim hatasi gibi okunuyordu.
    expect(renk.yuzerZemin).toMatch(/^#[0-9A-F]{6}$/i)
  })

  it('turuncu YAZI ile turuncu DOLGU ayri jetonlar', () => {
    // Ayni ton hem dolgu (uzerinde beyaz yazi) hem yazi (acik zeminde)
    // olamaz: ikisi zit yonde duzeltme ister. Koyu modda zemin koyu
    // oldugu icin ikisi ayni degere DENK GELEBILIR - iddia degerlerin
    // farkli olmasi degil, jetonlarin ayri olmasi.
    expect(renk).toHaveProperty('turuncuYazi')
    expect(renk).toHaveProperty('turuncuBasili')
  })
})

describe('kontrast: acik modun kendine ozgu kisiti', () => {
  it('turuncu yazi acik modda marka tonundan KOYU olmak zorunda', () => {
    // Bu, acik modun bedeli. Koyu modda ayni odun gerekmiyor - orada
    // marka tonu 7,10:1 veriyor ve jeton marka tonunda kaliyor.
    expect(parlaklik(acikRenk.turuncuYazi)).toBeLessThan(parlaklik(acikRenk.turuncu))
    expect(koyuRenk.turuncuYazi).toBe('#FE7813')
  })

  it('kart siniri zeminden ayirt edilebilir', () => {
    // 3:1 grafik esigine cikmak MUMKUN DEGIL: olculdu, #CFC4B8 bile
    // 1,72:1 veriyor ve daha koyusu karti cerceveli bir kutuya
    // ceviriyor. Bu yuzden esik dusuk ama GERILEME korumasi var -
    // onceki deger (#EFEAE5) 1,20:1 veriyordu.
    expect(oran(acikRenk.cizgi, acikRenk.zemin)).toBeGreaterThan(1.3)
  })
})
