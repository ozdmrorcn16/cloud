import { bulunmaEki } from './bulunma-eki'

describe('bulunmaEki', () => {
  it.each([
    ['Özdemir Kafe', "'de"],
    ['Karpa Pide', "'de"],
    ['Hozee', "'de"],
    ['Bursa', "'da"],
    ['Dayı', "'da"],
    ['Nilüfer', "'de"],
    ['Park', "'ta"],
    ['Starbucks', "'ta"],
    ['Kebap', "'ta"],
    ['Altınyıl İnşaat', "'ta"],
    ['Hadim erikli subesi', "'nde"],
    ['Kültür Merkezi', "'nde"],
    ['Muayene İstasyonu', "'nda"],
    ['Osmangazi Köprüsü', "'nde"],
    ['MVT', "'de"],
    ['Cafe 34', "'te"],
    ['Blok 40', "'ta"],
    ['Salon 100', "'de"],
    ['AVM', "'de"],
    ['Sahil Kafe!', "'de"],
  ])('%s -> %s', (ad, ek) => {
    expect(bulunmaEki(ad)).toBe(ek)
  })
})
