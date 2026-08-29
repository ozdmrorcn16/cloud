import { gorecelZaman, suAnBuradaMi, tamZaman, goreceZamanGosterilir, saatYazisi } from './zaman'

const DAKIKA = 60 * 1000
const SAAT = 60 * DAKIKA

/** Sozlukteki gercek metinlerin sadelestirilmis karsiligi. */
function t(anahtar: string, secenekler?: Record<string, unknown>): string {
  const sayi = secenekler?.sayi
  if (anahtar === 'anaSayfa.azOnce') return 'az önce'
  if (anahtar === 'anaSayfa.dakika') return `${sayi} dakika önce`
  if (anahtar === 'anaSayfa.saat') return `${sayi} saat önce`
  if (anahtar === 'anaSayfa.gun') return `${sayi} gün önce`
  return anahtar
}

function oncesi(ms: number): string {
  return new Date(Date.now() - ms).toISOString()
}

describe('suAnBuradaMi', () => {
  it('CANLI ve 30 dakikadan yeniyse "şu an burada" gosterilir', () => {
    expect(suAnBuradaMi(oncesi(5 * DAKIKA), true)).toBe(true)
    expect(suAnBuradaMi(oncesi(29 * DAKIKA), true)).toBe(true)
  })

  it('30 dakika DOLUNCA artik "şu an burada" DEGIL', () => {
    // Kullanicinin karari 2026-08-29: 4 saat kurali kalkti, canlilik
    // penceresi 30 dakika. Sunucu tarafi da ayni sureye cekildi.
    expect(suAnBuradaMi(oncesi(31 * DAKIKA), true)).toBe(false)
    expect(suAnBuradaMi(oncesi(3 * SAAT), true)).toBe(false)
  })

  it('canli olmayan check-in hicbir zaman "şu an burada" degil', () => {
    expect(suAnBuradaMi(oncesi(DAKIKA), false)).toBe(false)
  })
})

describe('gorecelZaman', () => {
  it('saatleri "N saat önce" diye yazar', () => {
    expect(gorecelZaman(oncesi(2 * SAAT), t)).toBe('2 saat önce')
    expect(gorecelZaman(oncesi(SAAT + DAKIKA), t)).toBe('1 saat önce')
  })

  it('dakikalari ve az onceyi yazar', () => {
    expect(gorecelZaman(oncesi(30 * 1000), t)).toBe('az önce')
    expect(gorecelZaman(oncesi(20 * DAKIKA), t)).toBe('20 dakika önce')
  })

  it('bir haftayi gecince TARIHE doner', () => {
    // "23 gün" artik yakinlik bilgisi tasimiyor.
    const sonuc = gorecelZaman(oncesi(30 * 24 * SAAT), t)
    expect(sonuc).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })
})

describe('tamZaman', () => {
  it('gun.ay.yil saat:dakika bicimini verir', () => {
    // Yerel saat dilimine gore uretiliyor; bicim dogrulaniyor.
    expect(tamZaman(new Date(2026, 7, 27, 9, 5).toISOString())).toBe('27.08.2026 09:05')
  })
})

describe('goreceZamanGosterilir', () => {
  it('bir saate kadar gorece zaman gosterilir', () => {
    expect(goreceZamanGosterilir(oncesi(35 * DAKIKA))).toBe(true)
    expect(goreceZamanGosterilir(oncesi(SAAT - DAKIKA))).toBe(true)
  })

  it('bir saati GECINCE gorece zaman kalkar, geriye saat kalir', () => {
    // Kullanicinin karari: "1 saat sonrasinda ibare kalkicak sadece
    // tarih saat bilgileri kalmaya devam edicek".
    expect(goreceZamanGosterilir(oncesi(SAAT + DAKIKA))).toBe(false)
    expect(goreceZamanGosterilir(oncesi(5 * SAAT))).toBe(false)
  })
})

describe('saatYazisi', () => {
  it('yalnizca saat ve dakika yazar', () => {
    expect(saatYazisi('2026-08-29T09:05:00')).toBe('09:05')
  })
})
