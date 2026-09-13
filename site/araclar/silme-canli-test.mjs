/**
 * Site uzerinden hesap silmeyi UCTAN UCA dogrular.
 *
 * Kosum:
 *   1. araclar/site-silme-test-hesabi.py ile atilabilir hesap acilir
 *   2. bu betik `dist/`i servis eder (ya da SLOOIN_SITE_ADRES verilirse
 *      CANLI siteyi acar), /hesap-sil sayfasinda e-postayi yazar,
 *      "Onay kodu gonder"e basar
 *   3. Kodu admin API'den alir (`generate_link` type=magiclink ->
 *      `email_otp`; `.test` adreslerine posta gitmedigi icin - kod
 *      kullanicinin postasinda gorecegi kodun ta kendisi), kutuya
 *      yazar, "Hesabimi sil"e basar
 *   4. sayfada basari mesaji cikiyor mu, form gizlendi mi
 *   5. hesap GERCEKTEN gitti mi - ayni parolayla giris denenir,
 *      basarisiz olmali
 *
 * AKIS 2026-09-13'TE PAROLADAN ONAY KODUNA GECTI; bu betik de o gun
 * guncellendi (onceki hali parola alanina yaziyordu ve o alan artik yok).
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
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
// Verilirse yerel sunucu yerine canli site (ornegin https://slooin.com)
const SITE_ADRES = process.env.SLOOIN_SITE_ADRES

if (!EPOSTA || !PAROLA) {
  console.error('SILME_TEST_EPOSTA ve SILME_TEST_PAROLA gerekli')
  process.exit(1)
}
if (!SUPABASE_URL || !ANON || !SERVICE) {
  console.error('PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY ve SUPABASE_SERVICE_ROLE_KEY gerekli')
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
if (!SITE_ADRES) await new Promise((c) => sunucu.listen(4322, c))
const TABAN = SITE_ADRES ? SITE_ADRES.replace(/\/$/, '') : 'http://127.0.0.1:4322'

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
  await sayfa.goto(`${TABAN}/hesap-sil`, { waitUntil: 'networkidle0' })
  await sayfa.type('input[name="eposta"]', EPOSTA)
  await sayfa.click('#kod-dugmesi')
  // Ya kod alani acilir (posta gitti) ya da durum satirina bir hata duser.
  // `.test` adreslerine Supabase posta GONDERMIYOR ("invalid email");
  // o durumda gonderim adimi olculemiyor, alan elle acilip KOD
  // DOGRULAMA + SILME yolu olculuyor - asil kapi orasi.
  await sayfa.waitForFunction(
    () => !document.getElementById('kod-alani').hidden || (document.getElementById('durum').textContent || '').trim() !== '',
    { timeout: 30000 },
  )
  const gonderimDurumu = await sayfa.$eval('#durum', (el) => el.textContent.trim())
  const alanAcik = await sayfa.$eval('#kod-alani', (el) => !el.hidden)
  console.log('  gonderim sonrasi durum: ' + (gonderimDurumu || '(bos)') + ' | kod alani ' + (alanAcik ? 'ACIK' : 'kapali'))
  if (!alanAcik) {
    console.log('  NOT: test adresine posta gitmedigi icin kod alani elle aciliyor')
    await sayfa.$eval('#kod-alani', (el) => { el.hidden = false })
  }

  // Kod: admin generate_link -> email_otp. Gercek kullanicida bu kod
  // postayla gelir; test hesabina posta gitmedigi icin buradan aliniyor.
  const baglanti = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: EPOSTA }),
  })
  const govde = await baglanti.json()
  const kod = govde.email_otp
  kontrol(typeof kod === 'string' && kod.length === 6, 'admin API 6 haneli kod verdi')
  await sayfa.type('input[name="kod"]', kod)
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
  if (!SITE_ADRES) sunucu.close()
}

console.log(hata ? `\n${hata} KONTROL KALDI` : '\nHEPSI GECTI')
process.exit(hata ? 1 : 0)
