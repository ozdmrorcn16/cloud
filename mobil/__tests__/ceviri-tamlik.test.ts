/**
 * Ceviri sozluklerinin ESITLIGI (i18n turu 2026-09-13).
 *
 * Turkce (`tr.ts`) kaynak dil. Diger alti dilin her biri tr'deki HER
 * yaprak anahtari tasimali; fazla anahtar da olmamali (olu ceviri).
 * Bir anahtar eksikse ekran sessizce Turkceye duesuyor - bu test o
 * sessizligi kirar.
 *
 * Ayrica `{{yer tutucu}}` adlari dil dosyalari arasinda ayni olmali:
 * tr'de `{{sayi}}` olan bir metin en'de `{{count}}` ise deger hic
 * dolmaz ve kullanici ham `{{count}}` gorur.
 */
import tr from '../lib/ceviriler/tr'
import en from '../lib/ceviriler/en'
import de from '../lib/ceviriler/de'
import es from '../lib/ceviriler/es'
import fr from '../lib/ceviriler/fr'
import ru from '../lib/ceviriler/ru'
import ar from '../lib/ceviriler/ar'

type Sozluk = Record<string, unknown>

function yapraklar(o: Sozluk, onek = ''): Map<string, string> {
  const sonuc = new Map<string, string>()
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') {
      for (const [ik, iv] of yapraklar(v as Sozluk, `${onek}${k}.`)) sonuc.set(ik, iv)
    } else {
      sonuc.set(`${onek}${k}`, String(v))
    }
  }
  return sonuc
}

function yerTutucular(metin: string): string[] {
  return [...metin.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort()
}

const DILLER: [string, Sozluk][] = [
  ['en', en],
  ['de', de],
  ['es', es],
  ['fr', fr],
  ['ru', ru],
  ['ar', ar],
]

const trYaprak = yapraklar(tr as Sozluk)

describe('ceviri sozlukleri tr ile birebir ayni anahtar kumesini tasir', () => {
  it('tr kaynak sozlugu bos degil', () => {
    expect(trYaprak.size).toBeGreaterThan(600)
  })

  it.each(DILLER)('%s: eksik anahtar yok', (_ad, sozluk) => {
    const dil = yapraklar(sozluk)
    const eksik = [...trYaprak.keys()].filter((k) => !dil.has(k))
    expect(eksik).toEqual([])
  })

  it.each(DILLER)('%s: fazla (olu) anahtar yok', (_ad, sozluk) => {
    const dil = yapraklar(sozluk)
    const fazla = [...dil.keys()].filter((k) => !trYaprak.has(k))
    expect(fazla).toEqual([])
  })

  it.each(DILLER)('%s: yer tutucu adlari tr ile ayni', (_ad, sozluk) => {
    const dil = yapraklar(sozluk)
    const uyumsuz: string[] = []
    for (const [k, trMetin] of trYaprak) {
      const dilMetin = dil.get(k)
      if (dilMetin === undefined) continue
      const a = yerTutucular(trMetin).join(',')
      const b = yerTutucular(dilMetin).join(',')
      if (a !== b) uyumsuz.push(`${k}: tr[${a}] vs [${b}]`)
    }
    expect(uyumsuz).toEqual([])
  })

  it.each(DILLER)('%s: hicbir deger bos degil', (_ad, sozluk) => {
    const bos = [...yapraklar(sozluk)].filter(([, v]) => v.trim() === '').map(([k]) => k)
    expect(bos).toEqual([])
  })
})
