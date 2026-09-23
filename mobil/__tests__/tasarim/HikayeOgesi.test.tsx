import { render, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { HikayeOgesi, parmakAraligi, yeniKonum } from '../../src/tasarim/HikayeOgesi'

/**
 * Sürüklenip boyutlandırılabilen hikâye etiketlerinin matematiği
 * (2026-09-22). Konumlar oransal tutuluyor; bu testler ekran boyu
 * değişince etiketin aynı yerde kalmasını ve ölçeğin sınırlar dışına
 * çıkmamasını kilitliyor.
 */
describe('parmakAraligi', () => {
  it('tek dokunusta 0 verir', () => {
    expect(parmakAraligi([{ pageX: 10, pageY: 10 }])).toBe(0)
    expect(parmakAraligi([])).toBe(0)
  })

  it('iki dokunus arasindaki uzakligi olcer', () => {
    expect(parmakAraligi([{ pageX: 0, pageY: 0 }, { pageX: 3, pageY: 4 }])).toBe(5)
  })
})

describe('yeniKonum', () => {
  const alan = { en: 400, boy: 800 }
  const baslangic = { x: 0.5, y: 0.5, olcek: 1 }

  it('kaymayi ORANA cevirir', () => {
    const k = yeniKonum(baslangic, { dx: 100, dy: 200 }, alan, 1)
    expect(k.x).toBeCloseTo(0.75)
    expect(k.y).toBeCloseTo(0.75)
  })

  it('ekranin disina TASMAZ', () => {
    const sag = yeniKonum(baslangic, { dx: 5000, dy: 5000 }, alan, 1)
    expect(sag.x).toBe(1)
    expect(sag.y).toBe(1)
    const sol = yeniKonum(baslangic, { dx: -5000, dy: -5000 }, alan, 1)
    expect(sol.x).toBe(0)
    expect(sol.y).toBe(0)
  })

  it('alan olculmediyse konum DEGISMEZ (0 bolme yok)', () => {
    const k = yeniKonum(baslangic, { dx: 100, dy: 100 }, { en: 0, boy: 0 }, 1)
    expect(k.x).toBe(0.5)
    expect(k.y).toBe(0.5)
  })

  it('olcek carpani uygulanir ama 0,5 - 3 arasinda kalir', () => {
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 2).olcek).toBe(2)
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 99).olcek).toBe(3)
    expect(yeniKonum(baslangic, { dx: 0, dy: 0 }, alan, 0.01).olcek).toBe(0.5)
  })
})

/**
 * COKME KORUMASI (2026-09-23): oge ARTIK yuzdeli left/top ya da yuzdeli
 * translate kullanmiyor - konum piksele cevriliyor. Bu test yuzdeli bir
 * degerin geri gelmesini engelliyor.
 */
describe('HikayeOgesi cizimi', () => {
  it('konumu PIKSEL transform ile veriyor, yuzde ile degil', async () => {
    await render(
      <HikayeOgesi konum={{ x: 0.5, y: 0.25, olcek: 1 }} alan={{ en: 400, boy: 800 }} testID="oge">
        <Text>merhaba</Text>
      </HikayeOgesi>
    )
    const stil = StyleSheet.flatten(screen.getByTestId('oge').props.style)
    expect(stil.left).toBeUndefined()
    expect(stil.top).toBeUndefined()
    const cevrimler = Object.assign({}, ...stil.transform)
    expect(typeof cevrimler.translateX).toBe('number')
    expect(typeof cevrimler.translateY).toBe('number')
    // 0.5 * 400 = 200 (oge olculmeden once kendi yarisi 0)
    expect(cevrimler.translateX).toBe(200)
    expect(cevrimler.translateY).toBe(200)
  })
})
