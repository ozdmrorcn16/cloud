/**
 * HIKAYE IZLEYICI EKRAN GORUNTUSU (2026-09-22).
 *
 * Genel `ekran-goruntusu.mjs` bu ekran icin YETMIYOR: hikaye fotografi
 * imzali adresten iniyor (sayfa "bos" cizilirken cekiliyor) ve istenen
 * kare cogu zaman ilk hikaye degil. Bu betik fotografin inmesini
 * bekliyor ve gerekirse ileri dokunarak acik renkli kareye geciyor.
 *
 * Kullanicinin bildirimi (2026-09-22) "dolma ibaresi beyaz bir
 * fotografta hic gorunmuyor" tam olarak bu kosulda olculdu.
 *
 * node araclar/hikaye-ekran-goruntusu.mjs <cikti.png> [kullaniciId]
 */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TABAN = 'http://127.0.0.1:8080'
const cikti = process.argv[2] ?? 'hikaye.png'
const KULLANICI = process.argv[3] ?? 'e9819ec3-ffe8-42a4-86ac-8706d0ce62e9'

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})
try {
  const sayfa = await tarayici.newPage()
  await sayfa.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await sayfa.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])

  await sayfa.goto(`${TABAN}/giris`, { waitUntil: 'networkidle0', timeout: 60000 })
  const alanlar = await sayfa.$$('input')
  await alanlar[0].type('test0@slooin.test', { delay: 8 })
  await alanlar[1].type('test1234', { delay: 8 })
  await sayfa.evaluate(() => {
    const h = [...document.querySelectorAll('div,span')].find(
      (e) => e.textContent?.trim() === 'Giriş yap' && e.children.length === 0
    )
    h?.closest('[role="button"]')?.click() ?? h?.click()
  })
  await new Promise((c) => setTimeout(c, 6000))

  await sayfa.goto(`${TABAN}/hikaye/izle?kullanici=${KULLANICI}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((c) => setTimeout(c, 3000))

  /** Ekrandaki hikaye fotografinin ortalama parlakligi (0-255). */
  const parlaklik = async () =>
    sayfa.evaluate(async () => {
      const img = [...document.querySelectorAll('img')].find((i) => i.naturalWidth > 200)
      if (!img) return null
      const t = document.createElement('canvas')
      t.width = 40
      t.height = 40
      const c = t.getContext('2d')
      try {
        c.drawImage(img, 0, 0, 40, 40)
        const d = c.getImageData(0, 0, 40, 40).data
        let s = 0
        for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3
        return Math.round(s / (d.length / 4))
      } catch {
        return 'cors'
      }
    })

  // Beyaz hikaye son sirada: parlaklik yeterince yuksek olana kadar ileri dokun.
  for (let deneme = 0; deneme < 4; deneme++) {
    const p = await parlaklik()
    console.log('kare parlakligi:', p)
    if (p !== null && p !== 'cors' && p > 230) break
    const ileri = await sayfa.$('[data-testid="hikaye-ileri"]')
    if (ileri) await ileri.click()
    else
      await sayfa.evaluate(() => {
        const d = document.querySelector('[data-testid="hikaye-ileri"]')
        d?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
    await new Promise((c) => setTimeout(c, 2500))
  }

  await sayfa.screenshot({ path: cikti })
  console.log('cekildi:', cikti)
} finally {
  await tarayici.close()
}
