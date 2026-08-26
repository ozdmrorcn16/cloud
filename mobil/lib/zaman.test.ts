import { gorecelZaman, suAnBuradaMi, tamZaman } from './zaman'

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
  it('CANLI ve bir saatten yeniyse "şu an burada" gosterilir', () => {
    expect(suAnBuradaMi(oncesi(5 * DAKIKA), true)).toBe(true)
    expect(suAnBuradaMi(oncesi(59 * DAKIKA), true)).toBe(true)
  })

  it('bir saat DOLUNCA artik "şu an burada" DEGIL', () => {
    // Check-in 4 saat canli kalmaya devam ediyor; degisen yalnizca
    // etiket. "Su an" iddiasi bir saatten sonra dogru hissettirmiyor.
    expect(suAnBuradaMi(oncesi(SAAT + DAKIKA), true)).toBe(false)
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
