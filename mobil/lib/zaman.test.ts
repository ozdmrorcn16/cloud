import { gorecelZaman, suAnBuradaMi, tamZaman, saatYazisi } from './zaman'

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
  it('CANLI ve 1 saatten yeniyse "şu an burada" gosterilir', () => {
    expect(suAnBuradaMi(oncesi(5 * DAKIKA), true)).toBe(true)
    expect(suAnBuradaMi(oncesi(31 * DAKIKA), true)).toBe(true)
    expect(suAnBuradaMi(oncesi(SAAT - DAKIKA), true)).toBe(true)
  })

  it('1 SAAT DOLUNCA artik "şu an burada" DEGIL', () => {
    // Kullanicinin karari 2026-09-07: "1 saati dolunca '1 saat once',
    // kac saat gecmisse o sekilde devam eden bir gosterme". Onceki
    // deger 30 dakikaydi (2026-08-29). Sunucu tarafi da ayni sureye
    // cekildi: check_in_yap artik `now() + interval '1 hour'` yaziyor
    // (migrasyon 20260907120000).
    expect(suAnBuradaMi(oncesi(SAAT + DAKIKA), true)).toBe(false)
    expect(suAnBuradaMi(oncesi(3 * SAAT), true)).toBe(false)
  })

  it('ikinci kademe: 1 saatten sonra GORECE ZAMAN devam ediyor', () => {
    // Kural iki parcali - once "su an burada", sonra saatler. Ikinci
    // parca icin yeni kod yazilmadi; `gorecelZaman` zaten basamakli.
    expect(suAnBuradaMi(oncesi(5 * SAAT), true)).toBe(false)
    expect(gorecelZaman(oncesi(5 * SAAT), t)).toBe('5 saat önce')
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

describe('saatYazisi', () => {
  it('yalnizca saat ve dakika yazar', () => {
    expect(saatYazisi('2026-08-29T09:05:00')).toBe('09:05')
  })
})
