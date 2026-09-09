import { rotaGetir } from './rota'

/**
 * Rota istegi AGA cikiyor; testler `fetch`i degistiriyor.
 *
 * En onemli iddia KOORDINAT SIRASI: OSRM boylam,enlem istiyor ve ters
 * yazilirsa sunucu HATA VERMIYOR - denizin ortasindan bir rota
 * deniyor. Yani yanlis sira sessizce yanlis sonuc uretir, ancak testle
 * yakalanir.
 */

const BASLANGIC = { lat: 40.2117, lng: 28.9213 }
const BITIS = { lat: 40.2261, lng: 28.8656 }

function cevap(govde: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(govde) } as Response)
}

describe('rotaGetir', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('adreste koordinatlari BOYLAM,ENLEM sirasiyla yaziyor', async () => {
    const sahte = jest.spyOn(global, 'fetch').mockReturnValue(
      cevap({ code: 'Ok', routes: [{ distance: 10, geometry: { coordinates: [[1, 2], [3, 4]] } }] })
    )

    await rotaGetir(BASLANGIC, BITIS)

    const adres = String(sahte.mock.calls[0][0])
    expect(adres).toContain('28.9213,40.2117;28.8656,40.2261')
  })

  it('yolun noktalarini ENLEM/BOYLAM olarak coeziyor', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(
      cevap({
        code: 'Ok',
        routes: [
          {
            distance: 482.4,
            geometry: {
              coordinates: [
                [28.9213, 40.2117],
                [28.9, 40.22],
                [28.8656, 40.2261],
              ],
            },
          },
        ],
      })
    )

    const rota = await rotaGetir(BASLANGIC, BITIS)

    expect(rota?.noktalar).toEqual([
      { lat: 40.2117, lng: 28.9213 },
      { lat: 40.22, lng: 28.9 },
      { lat: 40.2261, lng: 28.8656 },
    ])
    // Mesafe YOL BOYUNCA, kus ucusu degil; tam sayiya yuvarlaniyor.
    expect(rota?.metre).toBe(482)
  })

  it('servis "Ok" demiyorsa rota YOK sayiliyor', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(cevap({ code: 'NoRoute', routes: [] }))

    expect(await rotaGetir(BASLANGIC, BITIS)).toBeNull()
  })

  it('HTTP hatasinda rota YOK sayiliyor', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(cevap({}, false))

    expect(await rotaGetir(BASLANGIC, BITIS)).toBeNull()
  })

  /*
   * Tek noktali bir geometri cizilemez; "yol" diye tek bir nokta
   * gostermektense hic gostermemek dogru.
   */
  it('iki noktadan az gelirse rota YOK sayiliyor', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(
      cevap({ code: 'Ok', routes: [{ distance: 0, geometry: { coordinates: [[1, 2]] } }] })
    )

    expect(await rotaGetir(BASLANGIC, BITIS)).toBeNull()
  })

  it('ag hatasi PATLAMIYOR, rota YOK donuyor', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ag yok'))

    expect(await rotaGetir(BASLANGIC, BITIS)).toBeNull()
  })
})
