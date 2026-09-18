// Panel ekran goruntusu (gelistirme). Sahte kipte calisan dev sunucusunu
// (VITE_SAHTE=1 npx vite --port 5199) acar, verilen yollari PNG olarak
// kaydeder. Kullanim: node araclar/ekran-goruntusu.mjs <cikti-dizini>
import puppeteer from 'puppeteer-core'
import path from 'node:path'

const CHROME = process.env.SLOOIN_CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TABAN = process.env.PANEL_TABAN ?? 'http://localhost:5199'
const cikti = process.argv[2] ?? '.'
const YOLLAR = [
  ['ozet', '/ozet'],
  ['sikayetler', '/sikayetler'],
  ['sikayet-detayi', '/sikayetler/s1'],
  ['kullanici-detayi', `/kullanicilar/c3d4e5f6-0000-4000-8000-000000000003`],
  ['talepler', '/talepler'],
  ['iz', '/iz'],
]

const tarayici = await puppeteer.launch({ executablePath: CHROME, headless: true })
const sayfa = await tarayici.newPage()
await sayfa.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.PANEL_SEMA ?? 'light' }])
await sayfa.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1.5 })
for (const [ad, yol] of YOLLAR) {
  await sayfa.goto(TABAN + yol, { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 600))
  await sayfa.screenshot({ path: path.join(cikti, `panel-${ad}.png`), fullPage: true })
  console.log(ad, 'ok')
}
// dar ekran
await sayfa.setViewport({ width: 420, height: 860, deviceScaleFactor: 1.5 })
await sayfa.goto(TABAN + '/sikayetler', { waitUntil: 'networkidle0' })
await new Promise((r) => setTimeout(r, 600))
await sayfa.screenshot({ path: path.join(cikti, 'panel-dar.png'), fullPage: true })
await tarayici.close()
