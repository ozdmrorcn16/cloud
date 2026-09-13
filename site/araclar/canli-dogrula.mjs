/**
 * CANLI SITE DOGRULAMASI (2026-09-14) - https://slooin.com uzerinde.
 *
 * `dogrula.mjs` yerel `dist`i olcer; bu betik YAYINDAKI siteyi olcer.
 * Ikisi ayri, cunku aradaki fark daha once iki kez uretim hatasi
 * yaratti: Cloudflare'in e-posta gizlemesi adresleri "[email protected]"
 * yapmisti ve olmayan yollar 404 yerine ana sayfayi 200 ile donuyordu -
 * ikisi de yerel dist'te gorunmezdi (docs/magaza-hazirlik-denetimi-
 * 2026-09-13.md). Tarayici gerekmez; ham HTML'den olculur, yani "JS
 * kapaliyken ne gorunuyor" sorusunun ta kendisi.
 *
 *   node araclar/canli-dogrula.mjs            # slooin.com
 *   SLOOIN_SITE=https://... node araclar/canli-dogrula.mjs
 *
 * Yayindan hemen sonra kosulursa Pages'in birkac dakikalik yayilimi
 * yuzunden eski surumu olcebilir; "KALDI" gorunce once bekleyip tekrar
 * kos.
 */
const TABAN = (process.env.SLOOIN_SITE || 'https://slooin.com').replace(/\/$/, '')
const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar']
const onek = (d) => (d === 'tr' ? '' : '/' + d)
const SAYFALAR = ['/', '/gizlilik/', '/kosullar/', '/destek/', '/hesap-sil/']
// JS'siz okunmasi gereken sayfalar (Apple sarti) ve beklenen en az metin.
const JSSIZ = { '/gizlilik/': 4000, '/kosullar/': 2000, '/destek/': 800, '/hesap-sil/': 500 }

let gecen = 0
const hatalar = []
function kontrol(kosul, ad) {
  if (kosul) gecen++
  else hatalar.push(ad)
  console.log(`  ${kosul ? 'GECTI ' : 'KALDI '} ${ad}`)
}
async function al(yol, basliklar = {}) {
  const r = await fetch(TABAN + yol, { redirect: 'manual', headers: basliklar })
  return { durum: r.status, konum: r.headers.get('location'), html: r.status === 200 ? await r.text() : '' }
}
// HTML yorumlari once atilir: Duzen.astro'daki aciklama yorumu
// "[email protected]" ornegini iceriyor ve ilk kosumda yanlis alarm verdi.
const yorumsuz = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ')
function duzMetin(html) {
  return yorumsuz(html)
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

console.log(`Canli olcum: ${TABAN}`)

// 1) Her dilin her sayfasi 200 ve dogru <html lang>
console.log('\nSayfalar (7 dil)')
for (const d of DILLER) {
  for (const yol of SAYFALAR) {
    const tam = onek(d) + (yol === '/' && d !== 'tr' ? '/' : yol)
    const { durum, html } = await al(tam)
    kontrol(durum === 200, `${tam} -> ${durum}`)
    if (durum === 200) kontrol(new RegExp(`<html[^>]*\\slang="${d}"`).test(html), `${tam} <html lang="${d}">`)
  }
}

// 2) JS'siz okunabilirlik: ham HTML'deki duz metin
console.log("\nJavaScript kapali (ham HTML)")
for (const [yol, enAz] of Object.entries(JSSIZ)) {
  const { html } = await al(yol)
  const n = duzMetin(html).length
  kontrol(n >= enAz, `${yol} JS'siz metin ${n} karakter (>=${enAz})`)
}

// 3) E-posta adresleri gizlenmemis (Cloudflare email_off)
console.log('\nE-posta adresleri ham HTML\'de acik')
for (const yol of ['/gizlilik/', '/destek/', '/hesap-sil/']) {
  const html = yorumsuz((await al(yol)).html)
  kontrol(!html.includes('[email protected]') && !html.includes('__cf_email__'), `${yol} Cloudflare gizlemesi yok`)
  kontrol(/destek@slooin\.com|contact@slooin\.com/.test(html), `${yol} bir iletisim adresi okunuyor`)
}

// 4) Olmayan yol 404 (Pages 404.html)
console.log('\n404')
for (const yol of ['/olmayan-sayfa-' + Date.now() + '/', '/en/olmayan-' + Date.now() + '/']) {
  const { durum } = await al(yol)
  kontrol(durum === 404, `${yol} -> ${durum}`)
}

// 5) Dil algilama (Pages Function)
console.log('\nOtomatik dil algilama')
{
  const de = await al('/gizlilik/', { 'Accept-Language': 'de-DE,de;q=0.9' })
  kontrol(de.durum === 302 && /\/de\/gizlilik\/$/.test(de.konum || ''), `Almanca tarayici -> ${de.durum} ${de.konum}`)
  const tr = await al('/gizlilik/', { 'Accept-Language': 'tr-TR,tr;q=0.9' })
  kontrol(tr.durum === 200, `Turkce tarayici -> ${tr.durum} (yonlenmez)`)
  const cerez = await al('/gizlilik/', { 'Accept-Language': 'de', Cookie: 'dil=tr' })
  kontrol(cerez.durum === 200, `dil=tr cerezi Almanca tarayiciyi tutar -> ${cerez.durum}`)
}

// 6) Sitede slooin.expo.app baglantisi YOK (kullanici karari, 2026-09-14)
console.log('\nexpo.app baglantisi yok')
for (const yol of SAYFALAR) {
  const { html } = await al(yol)
  kontrol(!/href="[^"]*slooin\.expo\.app/.test(html), `${yol} expo.app'e baglanti vermiyor`)
}

console.log(`\n${gecen} gecti, ${hatalar.length} kaldi` + (hatalar.length ? '\n' + hatalar.map((h) => '  - ' + h).join('\n') : ''))
process.exit(hatalar.length ? 1 : 0)
