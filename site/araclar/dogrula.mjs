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
import { execSync } from 'node:child_process'

const BURASI = path.dirname(fileURLToPath(import.meta.url))
const SITE_DIZINI = path.join(BURASI, '..')
const DIST = path.join(SITE_DIZINI, 'dist')
const DILLER_TS = path.join(SITE_DIZINI, 'src', 'i18n', 'diller.ts')
const CHROME =
  process.env.SLOOIN_CHROME ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe'

// Bu yol da CHROME gibi tek makineye ozel; sabit `import` bir degiskeni
// kabul etmedigi icin calisma aninda dinamik import ile yukleniyor.
const PUPPETEER_YOLU =
  process.env.SLOOIN_PUPPETEER ||
  'file:///C:/Users/orcns/projects/cloud/mobil/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'

let puppeteer
try {
  puppeteer = (await import(PUPPETEER_YOLU)).default
} catch (e) {
  console.error(
    `puppeteer-core yuklenemedi (${PUPPETEER_YOLU}). Bu makinede yol farkliysa ` +
      `SLOOIN_PUPPETEER ortam degiskenini gecerli puppeteer-core.js dosyasina isaret et.\n` +
      (e && e.message ? e.message : e),
  )
  process.exit(1)
}

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

let tarayici
try {
  tarayici = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox'],
  })
} catch (e) {
  console.error(
    `Chrome baslatilamadi (${CHROME}). Bu makinede yol farkliysa SLOOIN_CHROME ` +
      `ortam degiskenini gecerli chrome.exe/chrome dosyasina isaret et.\n` +
      (e && e.message ? e.message : e),
  )
  sunucu.close()
  process.exit(1)
}

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

  // 5) Hesap silme sayfasi JS kapaliyken de ANLATIYOR mu
  console.log('\nHesap silme erisilebilirligi')
  {
    const sayfa = await tarayici.newPage()
    await sayfa.setJavaScriptEnabled(false)
    await sayfa.goto(TABAN + '/hesap-sil', { waitUntil: 'domcontentloaded' })
    const metin = await sayfa.evaluate(() => document.body.innerText)
    kontrol(metin.length > 500, `JS'siz aciklama uzunlugu ${metin.length} (>500 bekleniyor)`)
    kontrol(
      metin.includes('destek@slooin.com'),
      "JS'siz halde destek adresi gorunuyor (parolasiz hesaplar icin tek yol)",
    )
    await sayfa.close()
  }

  // 6) Cok dilli yapi - YEDI DIL KALICI (2026-09-13).
  //
  // Eskiden `diller.ts` gecici olarak ['tr','en'] yapilip derleniyor,
  // sonra geri aliniyordu ("yayina bos dil konmuyor"). Artik yedi
  // dilin hepsi dolu: gizlilik ve kosullar uygulamayla ortak
  // kaynaktan (`mobil/lib/hukuki`), kalan sayfalar `sozlukler.ts`ten.
  // Olcum: her dilin bes sayfasi uretilmis mi, hreflang karsilikli mi,
  // <html lang> dogru mu, Arapca sayfa dir="rtl" mi, ve her dilin
  // gizlilik sayfasi GERCEKTEN o dilde mi (Turkce basligi tasimiyor).
  console.log('\nCok dilli yapi')
  const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar']
  const onek = (d) => (d === 'tr' ? '' : '/' + d)
  for (const d of DILLER) {
    for (const yol of ['', '/gizlilik', '/kosullar', '/destek', '/hesap-sil']) {
      const dosya = path.join(DIST, onek(d) + yol, 'index.html')
      kontrol(fs.existsSync(dosya), `${onek(d) + yol || '/'}/index.html uretildi mi`)
    }
  }
  // 404: Pages `404.html` yoksa olmayan yollara ana sayfayi 200 ile
  // verir (2026-09-14'te canlida goruldu). Tek dosya, yedi dilin metni
  // gomulu; sunucu tarafi Turkce.
  const d404 = path.join(DIST, '404.html')
  kontrol(fs.existsSync(d404), '404.html uretildi mi')
  if (fs.existsSync(d404)) {
    const h = fs.readFileSync(d404, 'utf8')
    kontrol(h.includes('Sayfa bulunamadı'), '404 sayfasi Turkce basligi tasiyor')
    for (const [d, metin] of [['en', 'Page not found'], ['de', 'Seite nicht gefunden'], ['ar', 'الصفحة غير موجودة']])
      kontrol(h.includes(metin), `404 sayfasinda ${d} metni gomulu`)
  }
  const trHtml = fs.readFileSync(path.join(DIST, 'gizlilik', 'index.html'), 'utf8')
  for (const d of DILLER) {
    kontrol(new RegExp(`hreflang="${d}"`).test(trHtml), `Turkce gizlilik sayfasi hreflang="${d}" tasiyor`)
    if (d === 'tr') continue
    const html = fs.readFileSync(path.join(DIST, d, 'gizlilik', 'index.html'), 'utf8')
    kontrol(new RegExp(`<html[^>]*\\slang="${d}"`).test(html), `${d} sayfasinda <html lang="${d}">`)
    kontrol(/hreflang="tr"/.test(html), `${d} sayfasi hreflang="tr" tasiyor (karsilikli)`)
    kontrol(!html.includes('3. Konum özel olarak'), `${d} gizlilik sayfasi Turkce baslik TASIMIYOR (gercekten cevrilmis)`)
    kontrol(html.includes('destek@slooin.com'), `${d} gizlilik sayfasinda basvuru adresi var`)
  }
  const arHtml = fs.readFileSync(path.join(DIST, 'ar', 'gizlilik', 'index.html'), 'utf8')
  kontrol(/<html[^>]*\sdir="rtl"/.test(arHtml), 'Arapca sayfa dir="rtl"')
  kontrol(/<html[^>]*\sdir="ltr"/.test(trHtml), 'Turkce sayfa dir="ltr"')

  // 7) Olu ic baglanti
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
