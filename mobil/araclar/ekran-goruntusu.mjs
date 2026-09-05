/**
 * Ekran goruntusu araci - GERCEK telefon viewport'uyla.
 *
 * Neden Chrome'un `--screenshot` bayragi yetmedi: Windows'ta pencere
 * asgari bir genislige sahip ve `--window-size=390` istense bile layout
 * ~500 px'te kaliyor, goruntu de o layout'tan kirpiliyor. Sonuc, dar
 * ekranda olmayan bir "sag kenar tasmasi" gibi gorunuyordu - yani arac
 * yanlis teshis uretiyordu.
 *
 * Puppeteer, CDP uzerinden gercek cihaz olculerini uyguluyor
 * (`deviceScaleFactor`, `isMobile`, dokunma destegi), dolayisiyla
 * goruntu telefondaki halin aynisi oluyor. `puppeteer-core` kullaniliyor:
 * tarayici indirmiyor, sistemdeki Chrome'a baglaniyor.
 *
 * Kullanim:
 *   node araclar/ekran-goruntusu.mjs <yol> <cikti.png> [genislik] [yukseklik]
 * Ornek (Git Bash'te bastaki egik cizgiyi YAZMA):
 *   node araclar/ekran-goruntusu.mjs giris ../tasarim/ekran-giris.png
 */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , hamYol = '/', cikti = 'ekran.png', gen = '390', yuk = '844'] = process.argv

// Git Bash (MSYS) "/giris" gibi bir argumani Windows yoluna ceviriyor
// ("C:/Program Files/Git/giris") ve URL bozuluyor. Bu yuzden yol
// bastaki egik cizgi OLMADAN da verilebiliyor; burada normalize
// ediliyor.
const yol = '/' + hamYol.replace(/^.*[\/]Git[\/]/, '').replace(/^\/+/, '')

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  // Konum izni ve sahte konum: kesfet gibi ekranlar konum olmadan
  // hata durumunu ciziyor, tasarim degerlendirilemiyordu. Varsayilan
  // Bursa/Nilufer - veritabaninda o cevrede gercek mekan var.
  // Taban adres: varsayilan yerel onizleme sunucusu. Yayinlanmis
  // surumu denetlemek icin SLOOIN_TABAN_ADRES=https://slooin.expo.app
  const tabanAdres = process.env.SLOOIN_TABAN_ADRES ?? 'http://127.0.0.1:8080'
  const baglam = tarayici.defaultBrowserContext()
  await baglam.overridePermissions(tabanAdres, ['geolocation'])

  const sayfa = await tarayici.newPage()
  // Cihaz dili taklidi: uygulamanin cihaz dilini gercekten okuyup
  // okumadigini dogrulamak icin. SLOOIN_TEST_DIL=en-US verilince
  // tarayici Ingilizce bir cihaz gibi davraniyor.
  // Koyu/acik mod (2026-09-03, koyu mod geldikten sonra eklendi):
  // SLOOIN_TEST_SEMA=dark ya da light. Verilmezse tarayicinin kendi
  // ayari gecerli - o da makinenin ayarina bagli oldugu icin
  // KARSILASTIRMA YAPARKEN mutlaka verilmeli.
  const testSema = process.env.SLOOIN_TEST_SEMA
  if (testSema) {
    await sayfa.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: testSema },
    ])
  }

  const testDil = process.env.SLOOIN_TEST_DIL
  if (testDil) {
    await sayfa.setExtraHTTPHeaders({ 'Accept-Language': testDil })
    await sayfa.evaluateOnNewDocument((d) => {
      Object.defineProperty(navigator, 'language', { get: () => d })
      Object.defineProperty(navigator, 'languages', { get: () => [d] })
    }, testDil)
  }
  await sayfa.setGeolocation({
    latitude: Number(process.env.SLOOIN_TEST_LAT ?? 40.2261),
    longitude: Number(process.env.SLOOIN_TEST_LNG ?? 28.8656),
  })
  await sayfa.setViewport({
    width: Number(gen),
    height: Number(yuk),
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })
  // Ic ekranlar oturum istiyor. SLOOIN_TEST_TELEFON ve
  // SLOOIN_TEST_SIFRE tanimliysa once giris yapiliyor; yoksa dogrudan
  // istenen yola gidiliyor (giris/kayit gibi acik ekranlar icin).
  const tel = process.env.SLOOIN_TEST_TELEFON
  const sif = process.env.SLOOIN_TEST_SIFRE
  if (tel && sif) {
    await sayfa.goto(`${tabanAdres}/giris`, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    })
    await sayfa.evaluate(() => document.fonts.ready)
    const alanlar = await sayfa.$$('input')
    if (alanlar.length >= 2) {
      await alanlar[0].type(tel, { delay: 12 })
      await alanlar[1].type(sif, { delay: 12 })
      // Butonu metninden buluyoruz: React Native Web dugmeyi <div>
      // olarak ciziyor, bu yuzden 'button' secicisi ise yaramiyor.
      await sayfa.evaluate(() => {
        const hedef = [...document.querySelectorAll('div,span')].find(
          (e) => e.textContent?.trim() === 'Giriş yap' && e.children.length === 0
        )
        hedef?.closest('[role="button"]')?.click() ?? hedef?.click()
      })
      await new Promise((c) => setTimeout(c, 4000))
    }
  }

  await sayfa.goto(`${tabanAdres}${yol}`, {
    waitUntil: 'networkidle0',
    timeout: 60000,
  })
  // Yazi tipleri yuklenmeden cekilen goruntu sistem fontunu gosterir.
  await sayfa.evaluate(() => document.fonts.ready)
  await new Promise((c) => setTimeout(c, 1200))

  // SLOOIN_TIKLA="Yerler" verilirse goruntu alinmadan once o metne
  // basiliyor. Sekmeli ekranlarda (profildeki Anilar/Yerler gibi)
  // varsayilan olmayan sekmeyi gormenin tek yolu bu; onceden sekmeyi
  // gormek icin kodda varsayilani gecici olarak degistirmek
  // gerekiyordu. Birden fazla hedef "|" ile sirayla verilebilir.
  const tiklanacaklar = (process.env.SLOOIN_TIKLA ?? '').split('|').filter(Boolean)
  for (const metin of tiklanacaklar) {
    const bulundu = await sayfa.evaluate((aranan) => {
      // React Native Web dugmeyi <div> olarak ciziyor; 'button'
      // secicisi ise yaramiyor, metinden bulmak gerekiyor.
      // Once METINDEN, bulunamazsa ERISILEBILIRLIK ETIKETINDEN ara.
      // Ikonlu dugmelerin (uc nokta menusu gibi) metni yok; RN Web
      // onlari aria-label olarak ciziyor.
      const hedef =
        [...document.querySelectorAll('div,span')].find(
          (e) => e.textContent?.trim() === aranan && e.children.length === 0
        ) ?? document.querySelector(`[aria-label="${aranan}"]`)
      if (!hedef) return false
      const basilabilir = hedef.closest('[role="button"],[role="tab"]') ?? hedef
      basilabilir.click()
      return true
    }, metin)
    if (!bulundu) {
      console.error(`UYARI: "${metin}" bulunamadi, tiklanmadi.`)
    }
    await new Promise((c) => setTimeout(c, 900))
  }

  // Yatay tasma gercekten var mi? Arac degil sayfa olcsun.
  const olcum = await sayfa.evaluate(() => ({
    govde: document.body.scrollWidth,
    gorunum: window.innerWidth,
  }))
  await sayfa.screenshot({ path: cikti })
  console.log(
    `${cikti}  gorunum=${olcum.gorunum}px  govde=${olcum.govde}px` +
      (olcum.govde > olcum.gorunum ? '  <-- YATAY TASMA VAR' : '  (tasma yok)')
  )
} finally {
  await tarayici.close()
}
