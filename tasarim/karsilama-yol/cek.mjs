// Prototipi dort anda cizdirir: `node tasarim/karsilama-yol/cek.mjs` (depo kokunden).
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const puppeteer = createRequire(new URL('../../mobil/package.json', import.meta.url))('puppeteer-core')
const kok = path.dirname(fileURLToPath(import.meta.url))
const CHROME = process.env.SLOOIN_CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const tarayici = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] })
const sayfa = await tarayici.newPage()
await sayfa.setViewport({ width: 430, height: 900 })
await sayfa.goto(pathToFileURL(path.join(kok, 'prototip.html')).href, { waitUntil: 'networkidle0' })
for (const [ad, ms] of [['a1', 300], ['a2', 900], ['a3', 1900], ['a4', 4700], ['a5', 6500]]) {
  await new Promise((r) => setTimeout(r, ms))
  await sayfa.screenshot({ path: path.join(kok, `kare-${ad}.png`) })
  console.log(ad)
}
await tarayici.close()
