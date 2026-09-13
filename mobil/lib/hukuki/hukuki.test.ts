/**
 * HUKUKI METINLERIN YAPISAL ESITLIGI (i18n E asamasi, 2026-09-13).
 *
 * Turkce kaynak; alti ceviri bolum bolum ve paragraf paragraf ayni
 * yapida olmali. Bir ceviride bir paragraf eksikse o dildeki kullanici
 * bir OLGUSAL IDDIAYI (ornegin "koordinat 1 saat 10 dakika saklanir")
 * hic gormez - bu test o sessizligi kirar.
 */
import { HUKUKI_METINLER, gizlilikBolumleri, kosulBolumleri, hukukiMetin } from './index'

// `lib/dil` jest'te mock'lu ve yalnizca tr/en tasiyor; liste burada
// gercek haliyle yaziliyor ve metin tablosuyla karsilastiriliyor.
const DESTEKLENEN_DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar'] as const

const kaynak = HUKUKI_METINLER.tr
const DIGER = DESTEKLENEN_DILLER.filter((d) => d !== 'tr')

describe('hukuki metinler: alti ceviri Turkce kaynakla ayni yapida', () => {
  it('yedi dilin hepsinin metni var', () => {
    expect(Object.keys(HUKUKI_METINLER).sort()).toEqual([...DESTEKLENEN_DILLER].sort())
  })

  it('Turkce kaynak: veri sorumlusu + 7 madde gizlilik, 11 madde kosullar', () => {
    expect(kaynak.gizlilik).toHaveLength(8)
    expect(kaynak.kosullar).toHaveLength(11)
  })

  it.each(DIGER)('%s: bolum ve paragraf sayilari tr ile birebir', (dil) => {
    const metin = hukukiMetin(dil)
    for (const belge of ['gizlilik', 'kosullar'] as const) {
      expect(metin[belge].map((b) => b.paragraflar.length)).toEqual(
        kaynak[belge].map((b) => b.paragraflar.length)
      )
    }
  })

  it.each(DIGER)('%s: hicbir baslik ya da paragraf bos degil, hepsi tr ile AYNI DEGIL', (dil) => {
    const metin = hukukiMetin(dil)
    for (const belge of ['gizlilik', 'kosullar'] as const) {
      metin[belge].forEach((bolum, i) => {
        expect(bolum.baslik.trim().length).toBeGreaterThan(0)
        bolum.paragraflar.forEach((p, j) => {
          expect(p.trim().length).toBeGreaterThan(0)
          // Ceviri yapilmis olmali: kaynak paragrafin oldugu gibi
          // kopyalanmasi "cevrildi" sayilmaz.
          expect(p).not.toBe(kaynak[belge][i].paragraflar[j])
        })
      })
    }
  })

  /*
   * Olgusal sabitler her dilde gecmeli: e-posta adresi, 30 gun, 2 yil,
   * 200 metre, 04:45, eu-central-1. Bir ceviri bunlardan birini
   * duesuerduyse belge o dilde yanlis bilgi veriyor demektir.
   */
  it.each(DESTEKLENEN_DILLER)('%s: olgusal sabitler belgede geciyor', (dil) => {
    const hepsi = [...gizlilikBolumleri(dil), ...kosulBolumleri(dil)]
      .flatMap((b) => b.paragraflar)
      .join('\n')
    for (const sabit of ['destek@slooin.com', '30', '200', 'eu-central-1', 'Foursquare', 'OpenStreetMap', 'JSON', '24']) {
      expect(hepsi).toContain(sabit)
    }
    // Saat yazimi dile gore degisiyor (Fransizca "04h45").
    expect(hepsi).toMatch(/04[:h]45/)
  })

  it('bilinmeyen dil Turkceye duser', () => {
    expect(hukukiMetin('xx' as never)).toBe(kaynak)
  })
})
