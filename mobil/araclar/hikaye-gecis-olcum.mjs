/**
 * HIKAYELER ARASI GECIS OLCUMU (2026-09-22).
 *
 * Kullanicinin bildirimi: "hikayeler arasi gecis cok kotu surekli
 * yeniden yukleniyor gecikmeli geliyor."
 *
 * Olcuelen: izleyici acilirken kac istek gidiyor ve ekranda fotograf
 * kac ms sonra beliriyor; sonra ileri/geri dokunarak gezildiginde AYNI
 * fotograf yeniden indiriliyor mu (onbellek) ve bir sonraki kare
 * onceden inmis mi (on yukleme).
 *
 * node araclar/hikaye-gecis-olcum.mjs
 */
import puppeteer from 'puppeteer-core'

const CHROME =
  process.env.SLOOIN_CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TABAN = process.env.SLOOIN_TABAN_ADRES ?? 'http://127.0.0.1:8080'
const KULLANICI = process.argv[2] ?? 'e9819ec3-ffe8-42a4-86ac-8706d0ce62e9'

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})
try {
  const sayfa = await tarayici.newPage()
  await sayfa.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

  const medya = []
  const rpc = []
  sayfa.on('request', (i) => {
    const u = i.url()
    if (u.includes('/storage/v1/object/sign/hikaye-medyalari')) medya.push({ u, t: Date.now() })
    else if (u.includes('.supabase.co/')) rpc.push({ u: u.split('.supabase.co/')[1].split('?')[0], t: Date.now() })
  })

  await sayfa.goto(`${TABAN}/giris`, { waitUntil: 'networkidle0', timeout: 60000 })
  const alanlar = await sayfa.$$('input')
  await alanlar[0].type(process.env.SLOOIN_TEST_EPOSTA ?? 'test0@slooin.test', { delay: 8 })
  await alanlar[1].type(process.env.SLOOIN_TEST_SIFRE ?? 'test1234', { delay: 8 })
  await sayfa.evaluate(() => {
    const h = [...document.querySelectorAll('div,span')].find(
      (e) => e.textContent?.trim() === 'Giriş yap' && e.children.length === 0
    )
    h?.closest('[role="button"]')?.click() ?? h?.click()
  })
  await new Promise((c) => setTimeout(c, 6000))

  // Ana sayfa seridi zaten hikayeleri cekmis olmali; izleyici oradan aciliyor.
  await sayfa.goto(TABAN, { waitUntil: 'networkidle0', timeout: 60000 })
  await new Promise((c) => setTimeout(c, 2500))

  rpc.length = 0
  medya.length = 0
  const basla = Date.now()
  /*
   * IZLEYICI SERITTEN ACILIYOR, `goto` ILE DEGIL. Tam sayfa yeniden
   * yuklemek modul duzeyindeki onbellegi sifirliyor ve "seridin verisiyle
   * aninda ac" yolu hic olculemiyordu - gercek kullanimda kullanici
   * seritteki daireye dokunuyor.
   */
  const acildi = await sayfa.evaluate((kullaniciId) => {
    const d = document.querySelector(`[data-testid="hikaye-${kullaniciId}"]`)
      ?? document.querySelector('[data-testid="hikaye-benim"]')
    if (!d) return false
    d.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return true
  }, KULLANICI)
  if (!acildi) {
    console.log('UYARI: seritte daire bulunamadi, dogrudan yola gidiliyor')
    await sayfa.goto(`${TABAN}/hikaye/izle?kullanici=${KULLANICI}`, { waitUntil: 'domcontentloaded' })
  }

  /** Ekranda gercekten cizilmis (yuklenmis) fotograf var mi. */
  const fotografHazir = () =>
    sayfa.evaluate(() => {
      const img = [...document.querySelectorAll('img')].find((i) => i.naturalWidth > 200 && i.complete)
      return img ? img.currentSrc.slice(-40) : null
    })

  let ilkKare = null
  while (Date.now() - basla < 15000) {
    const f = await fotografHazir()
    if (f) {
      ilkKare = { ms: Date.now() - basla, src: f }
      break
    }
    await new Promise((c) => setTimeout(c, 100))
  }
  console.log('\n=== IZLEYICI ACILISI ===')
  console.log('ilk fotograf ekranda :', ilkKare ? `${ilkKare.ms} ms` : 'GELMEDI')
  console.log('acilista RPC         :', rpc.length, rpc.map((r) => r.u).join(', '))
  console.log('acilista medya istegi:', medya.length)

  // Ileri/geri gezinti: ayni fotograf yeniden isteniyor mu?
  console.log('\n=== GECISLER ===')
  for (const [ad, testID] of [
    ['ileri', 'hikaye-ileri'],
    ['ileri', 'hikaye-ileri'],
    ['geri', 'hikaye-geri'],
    ['geri', 'hikaye-geri'],
  ]) {
    // GERCEK KULLANIM: kullanici kareye en az bir saniye bakiyor;
    // hemen tiklamak on yuklemeye hic firsat vermez ve olcumu
    // gercekte olmayan bir kosula gore yapardi.
    await new Promise((c) => setTimeout(c, 1200))
    const oncekiMedya = medya.length
    const oncekiSrc = await fotografHazir()
    const t0 = Date.now()
    await sayfa.evaluate((id) => {
      const d = document.querySelector(`[data-testid="${id}"]`)
      d?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      d?.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
      d?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }, testID)
    // Kare DEGISENE kadar bekle.
    let yeni = null
    while (Date.now() - t0 < 8000) {
      const f = await fotografHazir()
      if (f && f !== oncekiSrc) {
        yeni = f
        break
      }
      await new Promise((c) => setTimeout(c, 60))
    }
    console.log(
      `${ad.padEnd(6)} yeni kare ${yeni ? String(Date.now() - t0).padStart(5) + ' ms' : '  GELMEDI'}` +
        `   yeni medya istegi: ${medya.length - oncekiMedya}`
    )
  }
} finally {
  await tarayici.close()
}
