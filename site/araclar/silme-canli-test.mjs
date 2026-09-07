/**
 * Site uzerinden hesap silmeyi UCTAN UCA dogrular.
 *
 * Kosum:
 *   1. araclar/site-silme-test-hesabi.py ile atilabilir hesap acilir
 *   2. bu betik `dist/`i servis eder, /hesap-sil sayfasini acar,
 *      formu doldurur, gonderir
 *   3. sayfada basari mesaji cikiyor mu
 *   4. hesap GERCEKTEN gitti mi - ayni parolayla giris denenir,
 *      basarisiz olmali
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

const EPOSTA = process.env.SILME_TEST_EPOSTA
const PAROLA = process.env.SILME_TEST_PAROLA
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL
const ANON = process.env.PUBLIC_SUPABASE_ANON_KEY

if (!EPOSTA || !PAROLA) {
  console.error('SILME_TEST_EPOSTA ve SILME_TEST_PAROLA gerekli')
  process.exit(1)
}
if (!SUPABASE_URL || !ANON) {
  console.error('PUBLIC_SUPABASE_URL ve PUBLIC_SUPABASE_ANON_KEY gerekli')
  process.exit(1)
}

const sunucu = http.createServer((istek, yanit) => {
  let yol = decodeURIComponent(istek.url.split('?')[0])
  if (yol.endsWith('/')) yol += 'index.html'
  else if (!path.extname(yol)) yol += '/index.html'
  const dosya = path.join(DIST, yol)
  if (!dosya.startsWith(DIST) || !fs.existsSync(dosya)) {
    yanit.writeHead(404).end('yok')
    return
  }
  const tur = dosya.endsWith('.js')
    ? 'text/javascript; charset=utf-8'
    : dosya.endsWith('.css')
      ? 'text/css; charset=utf-8'
      : 'text/html; charset=utf-8'
  yanit.writeHead(200, { 'Content-Type': tur })
  fs.createReadStream(dosya).pipe(yanit)
})
await new Promise((c) => sunucu.listen(4322, c))

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
})
const sayfa = await tarayici.newPage()

let hata = 0
function kontrol(kosul, mesaj) {
  console.log((kosul ? '  GECTI  ' : '  KALDI  ') + mesaj)
  if (!kosul) hata++
}

try {
  await sayfa.goto('http://127.0.0.1:4322/hesap-sil', { waitUntil: 'networkidle0' })
  await sayfa.type('input[name="eposta"]', EPOSTA)
  await sayfa.type('input[name="parola"]', PAROLA)
  await sayfa.click('#sil-dugmesi')

  await sayfa.waitForFunction(
    () => {
      const d = document.getElementById('durum')
      return d && /silindi|silinemedi|yapılamadı/i.test(d.textContent || '')
    },
    { timeout: 45000 },
  )

  const durum = await sayfa.$eval('#durum', (el) => el.textContent.trim())
  console.log('  durum metni: ' + durum)
  kontrol(/Hesabın silindi/.test(durum), 'sayfa basari mesaji gosteriyor')

  const formGizli = await sayfa.$eval('#silme-formu', (el) => el.hidden)
  kontrol(formGizli === true, 'form silme sonrasi gizlendi')

  // Hesap gercekten gitti mi
  const giris = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EPOSTA, password: PAROLA }),
  })
  kontrol(giris.status >= 400, `silinen hesapla giris reddedildi (${giris.status})`)
} finally {
  await tarayici.close()
  sunucu.close()
}

console.log(hata ? `\n${hata} KONTROL KALDI` : '\nHEPSI GECTI')
process.exit(hata ? 1 : 0)
