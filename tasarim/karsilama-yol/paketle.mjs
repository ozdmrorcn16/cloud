// Prototipi TEK dosyaya paketler (gorseller base64 gomulu): indirilip
// telefonda/masaustunde cevrimdisi acilabilir. `node tasarim/karsilama-yol/paketle.mjs`
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const kok = path.dirname(fileURLToPath(import.meta.url))
let html = fs.readFileSync(path.join(kok, 'prototip.html'), 'utf8')
// Maskot katmanlari 1254 px; pakette 384 px kopyalari (varlik/kucuk) kullanilir - ekranda 92 px.
html = html.replace(/src="(varlik\/[^"]+\.png)"/g, (_, yol) => {
  const kucuk = yol.replace('varlik/', 'varlik/kucuk/')
  const veri = fs.readFileSync(path.join(kok, fs.existsSync(path.join(kok, kucuk)) ? kucuk : yol)).toString('base64')
  return `src="data:image/png;base64,${veri}"`
})
const cikti = path.join(kok, 'slooin-acilis-prototip.html')
fs.writeFileSync(cikti, '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' + html + '</html>')
console.log(cikti, (fs.statSync(cikti).size / 1024).toFixed(0) + ' KB')
