import { epostaGecerliMi, epostaNormallestir } from './eposta'

describe('epostaGecerliMi', () => {
  it('siradan adresleri kabul eder', () => {
    expect(epostaGecerliMi('ornek@eposta.com')).toBe(true)
    expect(epostaGecerliMi('ad.soyad+etiket@alt.alan.co.uk')).toBe(true)
  })

  it('bicimi bozuk adresleri reddeder', () => {
    expect(epostaGecerliMi('')).toBe(false)
    expect(epostaGecerliMi('ornek')).toBe(false)
    expect(epostaGecerliMi('ornek@')).toBe(false)
    expect(epostaGecerliMi('@eposta.com')).toBe(false)
    expect(epostaGecerliMi('ornek@eposta')).toBe(false)
    expect(epostaGecerliMi('bosluk lu@eposta.com')).toBe(false)
  })

  it('bastaki ve sondaki bosluklari onemsemez', () => {
    expect(epostaGecerliMi('  ornek@eposta.com  ')).toBe(true)
  })
})

describe('epostaNormallestir', () => {
  /**
   * Supabase adresi kucuk harfe cevirerek sakliyor. Istemci de ayni
   * seyi yapmazsa "Ornek@eposta.com" ile "ornek@eposta.com" farkli
   * gorunur ve "bu adres kayitli mi" kontrolu yanlis cevap verir.
   */
  it('kucuk harfe cevirir ve bosluklari kirpar', () => {
    expect(epostaNormallestir('  Ornek@Eposta.COM ')).toBe('ornek@eposta.com')
  })

  /**
   * TURKCE BUYUK I TUZAGI: JavaScript'in toLowerCase'i Turkce yerelde
   * dogru calisiyor ama 'İ' harfi 'i̇' (i + birlesik nokta) uretiyor.
   * E-posta adresleri ASCII oldugu icin bu pratikte gorulmez; yine de
   * kullanicinin yanlislikla yazdigi bir Turkce harf adresi sessizce
   * bozmamali - bicim kontrolu onu zaten reddediyor.
   */
  it('Turkce harf iceren adres GECERSIZ sayilir', () => {
    expect(epostaGecerliMi('İsim@eposta.com')).toBe(false)
    expect(epostaGecerliMi('ornek@şirket.com')).toBe(false)
  })
})
