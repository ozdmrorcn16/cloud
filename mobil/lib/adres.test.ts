import { adresYaz } from './adres'

/**
 * Koordinattan cozulen adres parcalarini tek satira cevirme kurallari.
 * Saf fonksiyon: cihaz API'si burada YOK, yalnizca bicimlendirme.
 */
describe('adresYaz', () => {
  test('mahalle, cadde + kapi no ve ilce/il tek satirda birlesir', () => {
    expect(
      adresYaz({
        district: 'Ataevler Mahallesi',
        street: 'İzmir Yolu Caddesi',
        streetNumber: '12',
        subregion: 'Nilüfer',
        region: 'Bursa',
      })
    ).toBe('Ataevler Mahallesi, İzmir Yolu Caddesi No:12, Nilüfer/Bursa')
  })

  test('kapi no yoksa cadde tek basina yazilir', () => {
    expect(
      adresYaz({
        street: 'İzmir Yolu Caddesi',
        subregion: 'Nilüfer',
        region: 'Bursa',
      })
    ).toBe('İzmir Yolu Caddesi, Nilüfer/Bursa')
  })

  test('ilce ile il ayni ise tek kez yazilir', () => {
    // Buyuksehirde saglayici ikisine de "Bursa" diyebiliyor;
    // "Bursa/Bursa" gorunmemeli.
    expect(adresYaz({ street: 'Atatürk Caddesi', subregion: 'Bursa', region: 'Bursa' })).toBe(
      'Atatürk Caddesi, Bursa'
    )
  })

  test('ilce yoksa sehir alani ilcenin yerine gecer', () => {
    expect(adresYaz({ street: 'Bağdat Caddesi', city: 'Kadıköy', region: 'İstanbul' })).toBe(
      'Bağdat Caddesi, Kadıköy/İstanbul'
    )
  })

  test('bos ve bosluktan ibaret parcalar elenir', () => {
    expect(
      adresYaz({ district: '   ', street: 'Atatürk Caddesi', subregion: null, region: 'Bursa' })
    ).toBe('Atatürk Caddesi, Bursa')
  })

  test('hicbir parca yoksa null doner', () => {
    expect(adresYaz({})).toBeNull()
    expect(adresYaz({ street: '  ', region: null })).toBeNull()
  })

  test('yalnizca il varsa onu yazar', () => {
    expect(adresYaz({ region: 'Bursa' })).toBe('Bursa')
  })
})
