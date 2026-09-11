import { instagramNormallestir, instagramGecerliMi, instagramAdresi } from './instagram'

describe('instagramNormallestir', () => {
  /*
   * INSANLAR UC BICIMDE YAZIYOR ve ucu de makul. Hepsini kabul edip
   * ayni degere indirmek, "yanlis yazdin" demekten iyi - alanin tek
   * isi bir profile gitmek.
   */
  it('sade kullanici adini oldugu gibi birakiyor', () => {
    expect(instagramNormallestir('orcun')).toBe('orcun')
  })

  it('bastaki @ isaretini atiyor', () => {
    expect(instagramNormallestir('@orcun')).toBe('orcun')
  })

  it('yapistirilmis adresi kullanici adina indirgiyor', () => {
    expect(instagramNormallestir('https://www.instagram.com/orcun/')).toBe('orcun')
    expect(instagramNormallestir('instagram.com/orcun')).toBe('orcun')
    expect(instagramNormallestir('https://instagram.com/orcun?igsh=abc')).toBe('orcun')
  })

  /*
   * KUCUK HARFE CEVIRME YERELDEN BAGIMSIZ OLMALI. `toLocaleLowerCase('tr')`
   * 'I' harfini 'ı' yapar; o karakter ASCII disi oldugu icin hem
   * sunucudaki kisiti ihlal eder hem de baglantiyi bozardi.
   */
  it('buyuk harfleri kucultuyor ve Turkce I tuzagina duesmuyor', () => {
    expect(instagramNormallestir('ORCUN')).toBe('orcun')
    expect(instagramNormallestir('Ismail')).toBe('ismail')
  })

  it('bastaki ve sondaki bosluklari atiyor', () => {
    expect(instagramNormallestir('  orcun  ')).toBe('orcun')
  })
})

describe('instagramGecerliMi', () => {
  it('harf, rakam, nokta ve alt cizgiyi kabul ediyor', () => {
    expect(instagramGecerliMi('orcun.ozdemir_1')).toBe(true)
  })

  it('bos degeri reddediyor', () => {
    expect(instagramGecerliMi('')).toBe(false)
  })

  it('30 karakteri asani reddediyor', () => {
    expect(instagramGecerliMi('a'.repeat(30))).toBe(true)
    expect(instagramGecerliMi('a'.repeat(31))).toBe(false)
  })

  it('bosluk ve egik cizgi gibi karakterleri reddediyor', () => {
    expect(instagramGecerliMi('orcun ozdemir')).toBe(false)
    expect(instagramGecerliMi('orcun/ozdemir')).toBe(false)
    expect(instagramGecerliMi('orçun')).toBe(false)
  })

  /*
   * Instagram nokta ile baslayan/biten ve ust uste iki nokta iceren
   * adlari kabul etmiyor; boyle bir adi kaydetmek HICBIR YERE
   * GITMEYEN bir baglanti uretirdi.
   */
  it('nokta ile baslayan, biten ya da cift nokta icereni reddediyor', () => {
    expect(instagramGecerliMi('.orcun')).toBe(false)
    expect(instagramGecerliMi('orcun.')).toBe(false)
    expect(instagramGecerliMi('or..cun')).toBe(false)
  })
})

describe('instagramAdresi', () => {
  it('profil adresini uretiyor', () => {
    expect(instagramAdresi('orcun')).toBe('https://instagram.com/orcun')
  })
})
