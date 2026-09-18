// Dort yonun tam sayfa ekran goruntusu (1280 px). mobil/node_modules'taki
// puppeteer-core ile: `node tasarim/site-yonler/cek.mjs` (depo kokunden). puppeteer-core mobil'in require'iyla cozuluyor.
import { createRequire } from 'node:module'
const puppeteer = createRequire(new URL('../../mobil/package.json', import.meta.url))('puppeteer-core')
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const kok = path.dirname(fileURLToPath(import.meta.url))
const CHROME = process.env.SLOOIN_CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const yonler = ['0-beceri-onerisi', 'A-sehir-uyaniyor', 'B-kalabalik-olcer', 'C-radar']

const tarayici = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
for (const ad of yonler) {
  const sayfa = await tarayici.newPage()
  await sayfa.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })
  await sayfa.goto('file:///' + path.join(kok, ad + '.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' })
  await sayfa.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, 3500)) // kartlar belirsin
  await sayfa.screenshot({ path: path.join(kok, ad + '.png'), fullPage: true })
  const y = await sayfa.evaluate(() => document.documentElement.scrollHeight)
  console.log(ad, 'tam sayfa', y, 'px')
  await sayfa.close()
}
await tarayici.close()
