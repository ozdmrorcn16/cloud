/**
 * Arka plan fikirlerini tek tek PNG olarak alir.
 *
 * Kullanim (mobil/ klasorunden):
 *   node araclar/arka-plan-goruntule.mjs
 *
 * Cikti: tasarim/arka-plan-<no>.png (390x844) ve tasarim/arka-plan-tahta.png
 */
import puppeteer from 'puppeteer-core'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Betik mobil/araclar altinda; gorseller ve HTML depo kokundeki tasarim/ icinde.
const burasi = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tasarim')
const sayfaYolu = join(burasi, 'arka-plan-fikirleri.html')

const KROM = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  process.env.PUPPETEER_EXECUTABLE_PATH,
].filter(Boolean)

const fs = await import('node:fs')
const krom = KROM.find((y) => fs.existsSync(y))
if (!krom) throw new Error('Chrome bulunamadi: ' + KROM.join(', '))

const tarayici = await puppeteer.launch({
  executablePath: krom,
  headless: 'new',
  args: ['--allow-file-access-from-files'],
})

try {
  const sayfa = await tarayici.newPage()
  await sayfa.setViewport({ width: 460, height: 1000, deviceScaleFactor: 2 })
  await sayfa.goto('file:///' + sayfaYolu.replace(/\\/g, '/'), { waitUntil: 'networkidle0' })
  // Yazi tipleri ve gorseller insin
  await sayfa.evaluate(() => document.fonts.ready)
  await new Promise((c) => setTimeout(c, 800))

  for (const no of ['1', '2', '3', '4', '5', '6']) {
    const oge = await sayfa.$('#s' + no)
    if (!oge) throw new Error('secenek bulunamadi: ' + no)
    const cikti = join(burasi, `arka-plan-${no}.png`)
    await oge.screenshot({ path: cikti })
    console.log(cikti)
  }

  // Hepsi bir arada: karsilastirmak icin
  await sayfa.setViewport({ width: 1320, height: 1000, deviceScaleFactor: 1 })
  await sayfa.addStyleTag({
    content: `#tahta { display: grid; grid-template-columns: repeat(3, 390px); gap: 8px 24px; }
              .etiket { margin-top: 8px; }`,
  })
  await new Promise((c) => setTimeout(c, 400))
  const tahta = join(burasi, 'arka-plan-tahta.png')
  await sayfa.screenshot({ path: tahta, fullPage: true })
  console.log(tahta)
} finally {
  await tarayici.close()
}
