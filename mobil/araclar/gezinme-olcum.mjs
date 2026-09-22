/**
 * GEZINME OLCUMU (2026-09-22): "her sayfa her seferinde yukleniyor"
 * sikayetinin kok nedenini SAYIYLA gostermek icin.
 *
 * Ne olcuyor: giris yaptiktan sonra alt gezinmeden sekme sekme gezip
 * her geciste Supabase'e giden istek sayisini ve gecisin "ekran dolana
 * kadar" suresini yaziyor. Ayni sekmeye IKINCI kez girildiginde sayi
 * dusuyor mu (onbellek var mi) - asil soru bu.
 *
 * Kullanim (once `npm run yayinla` ya da yerel dist + spa-sunucu):
 *   SLOOIN_TEST_EPOSTA=... SLOOIN_TEST_SIFRE=... node araclar/gezinme-olcum.mjs
 */
import puppeteer from 'puppeteer-core'

const CHROME =
  process.env.SLOOIN_CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const TABAN = process.env.SLOOIN_TABAN_ADRES ?? 'http://127.0.0.1:8080'

const tarayici = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
})

try {
  const baglam = tarayici.defaultBrowserContext()
  await baglam.overridePermissions(TABAN, ['geolocation'])
  const sayfa = await tarayici.newPage()
  await sayfa.setGeolocation({ latitude: 40.2261, longitude: 28.8656 })
  await sayfa.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })

  // Supabase'e giden her istegi say (rest, rpc, storage, auth).
  let istekler = []
  sayfa.on('request', (i) => {
    const u = i.url()
    if (u.includes('.supabase.co/')) {
      istekler.push({ yol: u.split('.supabase.co/')[1].split('?')[0], t: Date.now() })
    }
  })

  await sayfa.goto(`${TABAN}/giris`, { waitUntil: 'networkidle0', timeout: 60000 })
  const alanlar = await sayfa.$$('input')
  await alanlar[0].type(process.env.SLOOIN_TEST_EPOSTA, { delay: 8 })
  await alanlar[1].type(process.env.SLOOIN_TEST_SIFRE, { delay: 8 })
  await sayfa.evaluate(() => {
    const h = [...document.querySelectorAll('div,span')].find(
      (e) => e.textContent?.trim() === 'Giriş yap' && e.children.length === 0
    )
    h?.closest('[role="button"]')?.click() ?? h?.click()
  })
  await new Promise((c) => setTimeout(c, 6000))

  /** Alt gezinmedeki sekmeye dokun, ag sessizlesene kadar bekle. */
  async function sekme(etiket) {
    istekler = []
    const basla = Date.now()
    const bulundu = await sayfa.evaluate((e) => {
      const h = [...document.querySelectorAll('div,span')].find(
        (x) => x.textContent?.trim() === e && x.children.length === 0
      )
      const d = h?.closest('[role="button"]') ?? h
      if (!d) return false
      d.click()
      return true
    }, etiket)
    if (!bulundu) return { etiket, hata: 'sekme bulunamadi' }
    // Ag sessizligi: 900 ms boyunca yeni Supabase istegi gelmezse bitti say.
    let son = Date.now()
    while (Date.now() - basla < 15000) {
      const oncekiSayi = istekler.length
      await new Promise((c) => setTimeout(c, 300))
      if (istekler.length > oncekiSayi) son = Date.now()
      else if (Date.now() - son > 900 && istekler.length > 0) break
      else if (Date.now() - son > 2500) break
    }
    const sure = son - basla
    const dokum = {}
    for (const i of istekler) dokum[i.yol] = (dokum[i.yol] ?? 0) + 1
    return { etiket, istek: istekler.length, sureMs: sure, dokum }
  }

  const tur = []
  // Alt gezinme etiketleri (lib/ceviriler/tr.ts `altGezinme`). Check-in
  // dugmesinin yazisi yok, bu yuzden Kesfet olculmuyor.
  for (const e of ['Bildirimler', 'Mesajlar', 'Profil', 'Ana sayfa', 'Profil', 'Ana sayfa']) {
    tur.push(await sekme(e))
    await new Promise((c) => setTimeout(c, 500))
  }

  console.log('\n=== GEZINME OLCUMU ===')
  for (const s of tur) {
    if (s.hata) {
      console.log(`${s.etiket.padEnd(12)} ${s.hata}`)
      continue
    }
    console.log(`${s.etiket.padEnd(12)} ${String(s.istek).padStart(3)} istek  ${String(s.sureMs).padStart(5)} ms`)
    for (const [yol, n] of Object.entries(s.dokum).sort((a, b) => b[1] - a[1])) {
      console.log(`             ${String(n).padStart(3)}x ${yol}`)
    }
  }
} finally {
  await tarayici.close()
}
