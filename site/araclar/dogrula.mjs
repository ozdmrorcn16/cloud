/**
 * Site dogrulama araci.
 *
 * Uretilen `dist/` klasorunu statik olarak servis eder ve su sorulari
 * cevaplar:
 *   - beklenen butun sayfalar var mi
 *   - hukuki sayfalar JAVASCRIPT KAPALIYKEN okunuyor mu (Apple sarti)
 *   - masaustunde ve 390 px telefonda yatay tasma var mi
 *   - ic baglantilarin hepsi var olan bir sayfaya mi gidiyor
 *
 * Chrome yolu ve puppeteer, depodaki mevcut arac ile ayni:
 * `mobil/araclar/ekran-goruntusu.mjs`. Windows'ta ters bolu YERINE
 * duez egik cizgi kullanilir - ters bolu heredoc/ESM yollarinda
 * yeniyor.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'file:///C:/Users/orcns/projects/cloud/mobil/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

const BURASI = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(BURASI, '..', 'dist')
const CHROME =
  process.env.SLOOIN_CHROME ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe'

const SAYFALAR = ['/', '/gizlilik', '/kosullar', '/destek', '/hesap-sil']
// JS kapaliyken tam okunmasi GEREKEN sayfalar (Apple sarti).
const JSSIZ_OKUNMALI = ['/gizlilik', '/kosullar', '/destek']

const TURLER = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function sunucuKur(kok) {
  return http.createServer((istek, yanit) => {
    let yol = decodeURIComponent(istek.url.split('?')[0])
    if (yol.endsWith('/')) yol += 'index.html'
    else if (!path.extname(yol)) yol += '/index.html'
    const dosya = path.join(kok, yol)
    if (!dosya.startsWith(kok) || !fs.existsSync(dosya)) {
      yanit.writeHead(404).end('yok')
      return
    }
    yanit.writeHead(200, { 'Content-Type': TURLER[path.extname(dosya)] || 'application/octet-stream' })
    fs.createReadStream(dosya).pipe(yanit)
  })
}

const hatalar = []
function kontrol(kosul, mesaj) {
  if (kosul) console.log('  GECTI  ' + mesaj)
  else {
    console.log('  KALDI  ' + mesaj)
    hatalar.push(mesaj)
  }
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ yok - once `npm run build` calistir')
  process.exit(1)
}

const sunucu = sunucuKur(DIST)
await new Promise((c) => sunucu.listen(4321, c))
const TABAN = 'http://127.0.0.1:4321'

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})

try {
  // 1) Butun sayfalar 200 donuyor mu
  console.log('\nSayfalar')
  for (const yol of SAYFALAR) {
    const s = await fetch(TABAN + yol)
    kontrol(s.status === 200, `${yol} -> ${s.status}`)
  }

  // 2) JS kapaliyken hukuki sayfalar okunuyor mu
  console.log('\nJavaScript kapali')
  for (const yol of JSSIZ_OKUNMALI) {
    const sayfa = await tarayici.newPage()
    await sayfa.setJavaScriptEnabled(false)
    await sayfa.goto(TABAN + yol, { waitUntil: 'domcontentloaded' })
    const uzunluk = await sayfa.evaluate(() => document.body.innerText.trim().length)
    kontrol(uzunluk > 400, `${yol} JS'siz metin uzunlugu ${uzunluk} (>400 bekleniyor)`)
    await sayfa.close()
  }

  // 3) Yatay tasma
  console.log('\nYatay tasma')
  for (const genislik of [1280, 390]) {
    for (const yol of SAYFALAR) {
      const sayfa = await tarayici.newPage()
      await sayfa.setViewport({ width: genislik, height: 900 })
      await sayfa.goto(TABAN + yol, { waitUntil: 'networkidle0' })
      const sw = await sayfa.evaluate(() => document.documentElement.scrollWidth)
      kontrol(sw <= genislik, `${genislik}px ${yol} scrollWidth ${sw}`)
      await sayfa.close()
    }
  }

  // 4) Marka lockup ve radar hizasi
  console.log('\nMarka ve radar')
  {
    const sayfa = await tarayici.newPage()
    await sayfa.setViewport({ width: 1280, height: 900 })
    await sayfa.goto(TABAN + '/', { waitUntil: 'networkidle0' })
    await new Promise((c) => setTimeout(c, 1200))

    const olcum = await sayfa.evaluate(() => {
      const img = document.querySelector('.kelime-markasi')
      const halkalar = [...document.querySelectorAll('.halka')]
      if (!img || halkalar.length === 0) return null
      const k = img.getBoundingClientRect()
      // Igne bas dairesinin merkezi goruntude (911, 44.5) / (1200, 348)
      const igne = {
        x: k.x + k.width * (911 / 1200),
        y: k.y + k.height * (44.5 / 348),
      }
      const h = halkalar[0].getBoundingClientRect()
      const olcekler = halkalar
        .map((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)
        .sort((a, b) => a - b)
      return {
        adet: halkalar.length,
        sapmaX: Math.abs(igne.x - (h.x + h.width / 2)),
        sapmaY: Math.abs(igne.y - (h.y + h.height / 2)),
        olcekler,
      }
    })

    kontrol(olcum !== null, 'kelime markasi ve halkalar sayfada var')
    if (olcum) {
      kontrol(olcum.adet === 3, `radar halkasi sayisi ${olcum.adet} (3 bekleniyor)`)
      kontrol(olcum.sapmaX < 2, `radar yatay sapma ${olcum.sapmaX.toFixed(2)}px (<2 bekleniyor)`)
      kontrol(olcum.sapmaY < 2, `radar dikey sapma ${olcum.sapmaY.toFixed(2)}px (<2 bekleniyor)`)
    }
    await sayfa.close()
  }

  // 5) Olu ic baglanti
  console.log('\nIc baglantilar')
  const gorulen = new Set()
  for (const yol of SAYFALAR) {
    const sayfa = await tarayici.newPage()
    await sayfa.goto(TABAN + yol, { waitUntil: 'domcontentloaded' })
    const linkler = await sayfa.evaluate(() =>
      [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
    )
    linkler.forEach((l) => gorulen.add(l))
    await sayfa.close()
  }
  for (const l of gorulen) {
    const s = await fetch(TABAN + l)
    kontrol(s.status === 200, `baglanti ${l} -> ${s.status}`)
  }
} finally {
  await tarayici.close()
  sunucu.close()
}

console.log('\n' + (hatalar.length ? `${hatalar.length} KONTROL KALDI` : 'HEPSI GECTI'))
process.exit(hatalar.length ? 1 : 0)
