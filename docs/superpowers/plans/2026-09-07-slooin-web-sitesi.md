# Slooin internet sitesi - uygulama plani

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `slooin.com` adresinde, App Store ve Google Play'in zorunlu
tuttugu dort hukuki/destek sayfasini ve Swarm duzeninde bir tanitim
sayfasini yayina almak.

**Architecture:** Depo icinde `mobil/` ve `panel/` ile kardes yeni bir
`site/` projesi. Astro, cikti duz HTML. JavaScript YALNIZCA hesap silme
formunda calisir; hukuki sayfalar JS olmadan da tam okunur (Apple
sarti). Hesap silme mevcut `hesap-sil` Edge Function'ini cagirir -
sunucuda hicbir degisiklik yapilmaz.

**Tech Stack:** Astro 7.3.1, `@supabase/supabase-js` 2.115.x, Node 24,
npm 11. Dogrulama icin `puppeteer-core` (depoda `mobil/node_modules`
altinda zaten var) ve sistemdeki Chrome.

**Spec:** `docs/superpowers/specs/2026-09-07-slooin-web-sitesi-design.md`

**Gorsel kaynak:** `tasarim/site-ana-sayfa-maketi.html` - kullanicinin
ONAYLADIGI ana sayfa maketi. Tek dosyalik, calisir HTML. Ana sayfa bu
dosyadan tasinir; olculer, animasyon degerleri ve markup oradan birebir
alinir.

## Global Constraints

Bu bolum her gorevin gereksinimlerine dahildir.

- **Ekran metinleri DUZGUN TURKCE yazilir** (aksanli: c, g, i, o, s, u).
  ASCII kurali yalnizca kod, degisken/dosya adlari, yorumlar ve commit
  metinleri icin gecerlidir. Duzeltme isaretli harf (a, i) kullanilmaz -
  "mekan" ve "sikayet" oldugu gibi kalir.
- **Marka turuncusu `#FE7813` DEGISMEZ.** Kontrast gerekcesiyle bile
  tonu oynatilmaz.
- **Uydurma veri yasak.** Kullanici sayisi, yorum/referans, "su an N
  kisi burada" gibi iddialar siteye girmez. Gosterilen mekanlar
  veritabaninda gercekten kayitli olmalidir.
- **Sirlar depoya girmez.** Depo public. Supabase anon anahtari derleme
  degiskeninden gelir; `site/.env` gitignored olur.
- **Turkce disinda dil eklenmez** (ilk surum). Yapi dil klasoru
  eklenebilecek sekilde kurulur ama ceviri yapilmaz.
- **Hukuki sayfalar JavaScript olmadan tam okunur olmalidir.**
- Dosya ve klasor adlari Turkce ve ASCII, `panel/` deki gibi
  (`ekranlar/`, `ortak/`, `stil.css`, `tipler.ts`).

---

## Dosya yapisi

```
site/
  package.json              npm betikleri ve bagimliliklar
  astro.config.mjs          Astro yapilandirmasi (statik cikti)
  tsconfig.json             TypeScript ayarlari
  .env.ornek                Ortam degiskenlerinin ornegi (GERCEK DEGER YOK)
  public/
    marka-yazisi.png        acik harfli kelime markasi (turuncu zemin icin)
    marka-isareti.png       beyaz logo isareti
    ekran-kesfet.png        gercek uygulama ekran goruntusu
    ekran-mekan.png         gercek uygulama ekran goruntusu
  src/
    duzen/
      Duzen.astro           ortak <head>, jetonlar, alt serit
      AltSerit.astro        hukuki baglantilar + kuenye
    ortak/
      MarkaLockup.astro     kelime markasi + ignedeki radar
      Telefon.astro         telefon cercevesi (icerigi disaridan alir)
    pages/                  Astro'nun ayirdigi klasor adi; Turkcelestirilemez
      index.astro           ana sayfa
      gizlilik.astro        gizlilik politikasi
      kosullar.astro        kullanim kosullari
      destek.astro          destek ve SSS
      hesap-sil.astro       hesap silme (tek JS'li sayfa)
  src/betik/
    hesap-sil.ts            silme formunun istemci kodu
  araclar/
    dogrula.mjs             sayfa/erisim/tasma/JS-siz dogrulamalari

araclar/
  site-silme-test-hesabi.py atilabilir test hesabi acar (silme testi icin)
```

`site/src/duzen/Duzen.astro` butun sayfalarin ortak kabugu; jetonlar ve
alt serit orada tek yerde durur. `MarkaLockup.astro` yalnizca markayi ve
radarin SVG katmanini tasir - iki yerde kullanilir (ana sayfa ve hukuki
sayfalarin basligi), bu yuzden ayri bilesen.

---

### Task 1: Astro iskeleti ve dogrulama araci

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/.env.ornek`
- Create: `site/src/pages/index.astro`
- Create: `site/araclar/dogrula.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: yok (ilk gorev)
- Produces: `npm --prefix site run build` calisir ve `site/dist/`
  uretir. `node site/araclar/dogrula.mjs` sifir cikis kodu dondurur.
  Sonraki gorevler bu araci genisletir.

- [ ] **Step 1: Dogrulama aracini yaz (once basarisiz olacak)**

`site/araclar/dogrula.mjs`:

```js
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

  // 4) Olu ic baglanti
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
```

- [ ] **Step 2: Araci calistir, basarisiz oldugunu gor**

Run: `node site/araclar/dogrula.mjs`
Expected: FAIL - `dist/ yok - once npm run build calistir`, cikis kodu 1.

- [ ] **Step 3: Astro projesini elle kur**

`npm create astro` etkilesimli sorular sordugu icin dosyalar ELLE
yazilir (`eas.json` da bu sekilde yazilmisti).

`site/package.json`:

```json
{
  "name": "site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "dogrula": "node araclar/dogrula.mjs"
  },
  "dependencies": {
    "astro": "^7.3.1",
    "@supabase/supabase-js": "^2.115.0"
  }
}
```

`site/astro.config.mjs`:

```js
import { defineConfig } from 'astro/config'

// Statik cikti: her sayfa duz HTML olarak uretilir. Sunucu tarafi
// calisma zamani YOK - hukuki sayfalarin JavaScript olmadan okunmasi
// Apple'in sarti (bkz. spec bolum 1).
export default defineConfig({
  site: 'https://slooin.com',
  output: 'static',
  build: { format: 'directory' },
})
```

`site/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`site/.env.ornek`:

```
# Gercek degerler `site/.env` icine yazilir; o dosya gitignored.
# Anon anahtar RLS ile korunuyor ve uygulamada da gomulu, ama depo
# public oldugu icin buraya GERCEK DEGER YAZILMAZ.
PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-anahtar>
```

- [ ] **Step 4: `.gitignore`a site girdilerini ekle**

`.gitignore` dosyasinda `panel/` girdilerinin hemen altina:

```
site/node_modules
site/dist
site/.env
site/.astro
```

- [ ] **Step 5: Gecici ana sayfa olustur**

`site/src/pages/index.astro`:

```astro
---
// Gecici iskelet - Task 3'te gercek ana sayfayla degistirilecek.
---
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Slooin</title>
  </head>
  <body>
    <h1>Slooin</h1>
  </body>
</html>
```

- [ ] **Step 6: Bagimliliklari kur ve derle**

Run:
```bash
npm --prefix site install
npm --prefix site run build
```
Expected: `site/dist/index.html` olusur, hata yok.

- [ ] **Step 7: Araci tekrar calistir**

Run: `node site/araclar/dogrula.mjs`
Expected: `/` GECTI; `/gizlilik`, `/kosullar`, `/destek`, `/hesap-sil`
KALDI (henuz yok). Cikis kodu 1. **Bu beklenen durum** - sonraki
gorevler bu kontrolleri yesillendirir.

- [ ] **Step 8: Commit**

```bash
git add site .gitignore
git commit -m "feat(site): Astro iskeleti ve dogrulama araci"
```

---

### Task 2: Ortak duzen ve marka lockup

**Files:**
- Create: `site/src/duzen/Duzen.astro`
- Create: `site/src/duzen/AltSerit.astro`
- Create: `site/src/ortak/MarkaLockup.astro`
- Create: `site/public/marka-yazisi.png`
- Create: `site/public/marka-isareti.png`
- Modify: `site/araclar/dogrula.mjs`

**Interfaces:**
- Consumes: Task 1'in Astro iskeleti ve `dogrula.mjs`.
- Produces:
  - `Duzen.astro` - props: `baslik: string`, `aciklama: string`.
    Sayfalar `<Duzen baslik="..." aciklama="...">` icine yazilir.
  - `MarkaLockup.astro` - props: `genislik?: string` (CSS degeri,
    varsayilan `clamp(240px, 31vw, 356px)`), `radar?: boolean`
    (varsayilan `true`).
  - CSS jetonlari: `--turuncu`, `--turuncu-acik`, `--turuncu-koyu`,
    `--metin`, `--ikincil`, `--soluk`, `--cizgi`, `--beyaz`,
    `--sakin`, `--populer`, `--yogun`, `--govde`.

- [ ] **Step 1: Marka varliklarini kopyala**

Turuncu zemin icin ACIK harfli / BEYAZ isaret surumleri kullanilir;
ortalama renkleri olculmustur (spec bolum 4).

```bash
cp mobil/assets/images/marka-yazisi-koyu.png site/public/marka-yazisi.png
cp mobil/assets/images/marka-isareti-koyu.png site/public/marka-isareti.png
```

- [ ] **Step 2: Doğrulama aracina marka ve radar kontrolu ekle**

`site/araclar/dogrula.mjs` icinde, "Ic baglantilar" blogunun ONUNE
su blok eklenir:

```js
  // 5) Marka lockup ve radar hizasi
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
```

- [ ] **Step 3: Araci calistir, marka kontrollerinin kaldigini gor**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: "kelime markasi ve halkalar sayfada var" KALDI.

- [ ] **Step 4: Ortak duzeni yaz**

`site/src/duzen/Duzen.astro`:

```astro
---
interface Props {
  baslik: string
  aciklama: string
}
const { baslik, aciklama } = Astro.props
---

<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{baslik}</title>
    <meta name="description" content={aciklama} />
    <link rel="icon" href="/marka-isareti.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
    />
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  :root {
    --turuncu: #fe7813;
    --turuncu-acik: #ffa451;
    --turuncu-koyu: #e9640a;
    --metin: #17130f;
    --ikincil: #6e6660;
    --soluk: #a39b93;
    --cizgi: #e2dad2;
    --beyaz: #ffffff;
    --sakin: #2fa36b;
    --populer: #e2a32b;
    --yogun: #d2483c;
    --govde: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--beyaz);
    color: var(--metin);
    font-family: var(--govde);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  a { color: var(--turuncu); }

  img { max-width: 100%; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
```

- [ ] **Step 5: Marka lockup bilesenini yaz**

Olculer `tasarim/site-ana-sayfa-maketi.html` icindeki degerlerin
aynisidir. Igne bas dairesi merkezi `(911, 44.5)`, yaricap 42.5;
halkalarin taban yaricapi 50.

`site/src/ortak/MarkaLockup.astro`:

```astro
---
interface Props {
  genislik?: string
  radar?: boolean
}
const { genislik = 'clamp(240px, 31vw, 356px)', radar = true } = Astro.props
---

<div class="marka-lockup" style={`width: ${genislik}`}>
  <img
    class="kelime-markasi"
    src="/marka-yazisi.png"
    alt="Slooin"
    width="1200"
    height="348"
  />
  {radar && (
    <svg viewBox="0 0 1200 348" aria-hidden="true" focusable="false">
      <circle class="halka" cx="911" cy="44.5" r="50"></circle>
      <circle class="halka gecikmeli" cx="911" cy="44.5" r="50"></circle>
      <circle class="halka gecikmeli2" cx="911" cy="44.5" r="50"></circle>
    </svg>
  )}
</div>

<style>
  .marka-lockup { position: relative; display: block; }
  .marka-lockup .kelime-markasi { width: 100%; height: auto; display: block; }

  .marka-lockup svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  /*
   * "i" ustundeki konum ignesinden yayilan radar.
   *
   * DOGRUSAL hiz BILEREK secildi. Yumusatilmis (ease-out) bir egride
   * halkalar once firliyor sonra suruenuyor; ucue esit gecikmeyle
   * baslatilsa bile aralari surekli degistigi icin sinyal duzensiz
   * gorunuyor - kullanicinin "tutarli olsun" istegi tam olarak bunu
   * isaret ediyordu. Dogrusal hizda aralik sabit kaliyor.
   */
  .halka {
    fill: none;
    stroke: var(--turuncu);
    stroke-width: 9;
    opacity: 0.45;
    transform-origin: 911px 44.5px;
    animation: yayil 4.8s linear infinite;
  }

  .halka.gecikmeli { animation-delay: 1.6s; }
  .halka.gecikmeli2 { animation-delay: 3.2s; }

  @keyframes yayil {
    0%   { transform: scale(1);   opacity: 0.6; stroke-width: 9; }
    100% { transform: scale(2.5); opacity: 0;   stroke-width: 2; }
  }
</style>
```

- [ ] **Step 6: Alt seridi yaz**

`site/src/duzen/AltSerit.astro`:

```astro
<footer class="alt-serit">
  <nav class="baglantilar">
    <a href="/gizlilik">Gizlilik</a>
    <a href="/kosullar">Kullanım koşulları</a>
    <a href="/destek">Destek</a>
    <a href="/hesap-sil">Hesap silme</a>
    <a href="mailto:destek@slooin.com">İletişim</a>
  </nav>
  <p class="kunye">
    Mekan verisi Foursquare ve OpenStreetMap katkıcılarından (ODbL).
  </p>
</footer>

<style>
  .alt-serit { background: var(--beyaz); padding: 20px 28px 26px; }

  .baglantilar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 24px;
    justify-content: center;
    font-size: 13.5px;
    margin-bottom: 12px;
  }

  .baglantilar a { color: var(--turuncu); text-decoration: none; font-weight: 500; }
  .baglantilar a:hover { text-decoration: underline; }
  .baglantilar a:focus-visible { outline: 2px solid var(--turuncu); outline-offset: 3px; border-radius: 3px; }

  .kunye { text-align: center; font-size: 12px; color: var(--soluk); line-height: 1.6; margin: 0; }
</style>
```

- [ ] **Step 7: Gecici ana sayfayi lockup'i gosterecek sekilde guncelle**

`site/src/pages/index.astro`:

```astro
---
import Duzen from '../duzen/Duzen.astro'
import AltSerit from '../duzen/AltSerit.astro'
import MarkaLockup from '../ortak/MarkaLockup.astro'
---

<Duzen
  baslik="Slooin"
  aciklama="Slooin, aynı anda aynı yerde olan insanların birbirini fark etmesini sağlayan konum tabanlı bir tanışma uygulamasıdır."
>
  <header style="background: var(--turuncu); padding: 60px 28px;">
    <MarkaLockup />
  </header>
  <AltSerit />
</Duzen>
```

- [ ] **Step 8: Derle ve dogrula**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: "kelime markasi ve halkalar sayfada var" GECTI, "radar
halkasi sayisi 3" GECTI, yatay ve dikey sapma 2 pikselin altinda GECTI.
Hukuki sayfalar hala KALDI.

- [ ] **Step 9: Commit**

```bash
git add site
git commit -m "feat(site): ortak duzen, marka lockup ve radar"
```

---

### Task 3: Ana sayfa

**Files:**
- Create: `site/src/ortak/Telefon.astro`
- Create: `site/public/ekran-kesfet.png`
- Create: `site/public/ekran-mekan.png`
- Modify: `site/src/pages/index.astro`

**Interfaces:**
- Consumes: `Duzen.astro`, `AltSerit.astro`, `MarkaLockup.astro`
  (Task 2).
- Produces: `Telefon.astro` - props: `konum: 'on' | 'arka'`,
  `gorsel: string` (public altindaki yol), `alt: string`.

- [ ] **Step 1: Gercek ekran goruntulerini al**

Maketteki telefon ekranlari YENIDEN CIZIMDIR; siteye gercek goruntu
konur. Uygulamanin web surumu canlida, mevcut arac onu ekran
goruntusune ceviriyor.

**Gercek bir kullanicinin adi, fotografi ya da check-in'i tasiyan
goruntu YAYINLANMAZ (KVKK).** Goruntuler test hesabindan alinir.

```bash
cd mobil
SLOOIN_TABAN_ADRES=https://slooin.expo.app \
SLOOIN_TEST_EPOSTA=test0@slooin.test \
SLOOIN_TEST_SIFRE=test1234 \
SLOOIN_TEST_SEMA=light \
  node araclar/ekran-goruntusu.mjs mekanlar ../site/public/ekran-kesfet.png
```

Not: `ekran-goruntusu.mjs` bugun `SLOOIN_TEST_TELEFON` okuyor olabilir;
kayit e-postaya tasindigi icin arac e-posta ile giris yapacak sekilde
guncellenmelidir. Araci ac, giris adimini `signInWithPassword({ email })`
akisina uygun hale getir, sonra yukaridaki komutu calistir.

Ikinci goruntu icin mekan sayfasi:

```bash
SLOOIN_TABAN_ADRES=https://slooin.expo.app \
SLOOIN_TEST_EPOSTA=test0@slooin.test \
SLOOIN_TEST_SIFRE=test1234 \
SLOOIN_TEST_SEMA=light \
  node araclar/ekran-goruntusu.mjs "harita/<mekan-id>" ../site/public/ekran-mekan.png
```

`<mekan-id>` icin veritabanindan gercek bir Istanbul mekani secilir
(spec bolum 4'te dogrulananlardan biri, ornegin Galata Kulesi /
Beyoglu).

- [ ] **Step 2: Telefon bilesenini yaz**

`site/src/ortak/Telefon.astro`:

```astro
---
interface Props {
  konum: 'on' | 'arka'
  gorsel: string
  alt: string
}
const { konum, gorsel, alt } = Astro.props
---

<div class:list={['telefon', konum]}>
  <img class="ekran" src={gorsel} alt={alt} />
</div>

<style>
  .telefon {
    position: absolute;
    border-radius: 34px;
    background: #16151a;
    padding: 9px;
    box-shadow:
      0 34px 60px -26px rgba(60, 22, 0, 0.6),
      0 6px 18px -8px rgba(60, 22, 0, 0.32);
  }

  .ekran {
    width: 250px;
    height: 512px;
    object-fit: cover;
    object-position: top center;
    border-radius: 26px;
    display: block;
    background: var(--beyaz);
  }

  .telefon.arka {
    transform: translate(132px, 26px) scale(0.93);
    background: #edeae6;
    z-index: 0;
  }

  .telefon.on { transform: translate(-88px, 0); z-index: 1; }

  @media (max-width: 899px) {
    .ekran { width: 206px; height: 424px; }
    .telefon.arka { transform: translate(104px, 20px) scale(0.92); }
    .telefon.on { transform: translate(-62px, 0); }
  }

  @media (max-width: 520px) {
    .ekran { width: 178px; height: 368px; }
    .telefon.arka { transform: translate(84px, 18px) scale(0.9); }
    .telefon.on { transform: translate(-50px, 0); }
  }
</style>
```

- [ ] **Step 3: Ana sayfayi maketten tasi**

`tasarim/site-ana-sayfa-maketi.html` acilir. Su parcalar BIREBIR
tasinir - olculer degistirilmez:

- `.kahraman` blogu (turuncu gradyan, `min-height`, `.dalga` bandi)
- `.ust` ve `.giris` hapi
- `.govde` izgarasi ve kirilma noktasi (900 px)
- `.sol` blogu: lockup, `.rozetler`, `.slogan-satir`
- `.filigran` (logo isareti, opaklik 0.085)
- `.telefonlar` kabi

Maketteki telefon ICI markup'i (`.ekran-baslik`, `.liste`, `.mekan`
vb.) TASINMAZ - onun yerine Task 3 Step 1'de alinan gercek ekran
goruntuleri `Telefon.astro` ile gosterilir.

`site/src/pages/index.astro`:

```astro
---
import Duzen from '../duzen/Duzen.astro'
import AltSerit from '../duzen/AltSerit.astro'
import MarkaLockup from '../ortak/MarkaLockup.astro'
import Telefon from '../ortak/Telefon.astro'
---

<Duzen
  baslik="Slooin"
  aciklama="Slooin, aynı anda aynı yerde olan insanların birbirini fark etmesini sağlayan konum tabanlı bir tanışma uygulamasıdır."
>
  <header class="kahraman">
    <span class="dalga" aria-hidden="true"></span>
    <img class="filigran" src="/marka-isareti.png" alt="" aria-hidden="true" />

    <div class="ust">
      <a class="giris" href="https://slooin.expo.app">Giriş</a>
    </div>

    <div class="govde">
      <div class="sol">
        <MarkaLockup />

        <div class="rozetler">
          <span class="rozet">
            <svg viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true"><path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.6 2.1-1.5 2.6-.4 6.5 1.1 8.7.7 1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7 1.3 0 1.6.7 2.8.7 1.2 0 1.9-1 2.6-2 .8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.5zM14.2 5.9c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2z"/></svg>
            <span class="yazi"><span class="ust-yazi">Yakında</span><span class="alt-yazi">App Store'da</span></span>
          </span>
          <span class="rozet">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#34A853" d="M4.6 2.3 14 11.7l-2.4 2.4L4 6.5V3.7c0-.6.2-1.1.6-1.4z"/><path fill="#FBBC04" d="M17.6 9.3 14 11.7l2.4 2.4 3.4-1.9c.9-.5.9-1.8 0-2.3l-2.2-1.2z"/><path fill="#EA4335" d="M4.6 2.3 16.4 9l-2.4 2.7L4.6 2.3z"/><path fill="#4285F4" d="M4.6 21.1 14 11.7l2.4 2.4L4.6 21.1z"/></svg>
            <span class="yazi"><span class="ust-yazi">Yakında</span><span class="alt-yazi">Google Play'de</span></span>
          </span>
        </div>

        <div class="slogan-satir">
          <p class="slogan">Aynı yerdesiniz.<br />Birbirinizi fark edin.</p>
          <img class="isaret" src="/marka-isareti.png" alt="" aria-hidden="true" />
        </div>
      </div>

      <div class="telefonlar">
        <Telefon konum="arka" gorsel="/ekran-mekan.png" alt="Slooin mekan sayfası" />
        <Telefon konum="on" gorsel="/ekran-kesfet.png" alt="Slooin check-in ekranı" />
      </div>
    </div>
  </header>

  <AltSerit />
</Duzen>
```

Stil blogu `tasarim/site-ana-sayfa-maketi.html` icindeki `.kahraman`,
`.dalga`, `.ust`, `.giris`, `.govde`, `.sol`, `.rozetler`, `.rozet`,
`.slogan-satir`, `.slogan`, `.isaret`, `.filigran`, `.telefonlar`
kurallarindan birebir kopyalanir.

- [ ] **Step 4: Derle ve dogrula**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: `/` icin 1280 ve 390 pikselde yatay tasma YOK, marka ve radar
kontrolleri GECTI.

- [ ] **Step 5: Gozle kontrol**

Run:
```bash
npm --prefix site run preview
```
Tarayicida `http://localhost:4321` acilir ve `tasarim/site-ana-sayfa-maketi.html`
ile yan yana karsilastirilir. Telefon goruntuleri disinda gorunur bir
fark olmamalidir.

- [ ] **Step 6: Commit**

```bash
git add site
git commit -m "feat(site): ana sayfa - Swarm duzeni, gercek ekran goruntuleri"
```

---

### Task 4: Gizlilik politikasi sayfasi

**Files:**
- Create: `site/src/duzen/Metin.astro`
- Create: `site/src/pages/gizlilik.astro`
- Modify: `docs/gizlilik-metni.md`

**Interfaces:**
- Consumes: `Duzen.astro`, `AltSerit.astro`, `MarkaLockup.astro`.
- Produces: `Metin.astro` - props: `baslik: string`,
  `aciklama: string`, `guncelleme: string`. Hukuki sayfalarin ortak
  kabugu: ust seritte kucuk marka, tek sutun okunabilir metin (65
  karakter genisliginde), altta `AltSerit`.

- [ ] **Step 1: Metin kabugunu yaz**

`site/src/duzen/Metin.astro`:

```astro
---
import Duzen from './Duzen.astro'
import AltSerit from './AltSerit.astro'
import MarkaLockup from '../ortak/MarkaLockup.astro'

interface Props {
  baslik: string
  aciklama: string
  guncelleme: string
}
const { baslik, aciklama, guncelleme } = Astro.props
---

<Duzen baslik={`${baslik} · Slooin`} aciklama={aciklama}>
  <header class="ust-serit">
    <a href="/" aria-label="Slooin ana sayfa">
      <MarkaLockup genislik="128px" radar={false} />
    </a>
  </header>

  <main class="metin">
    <h1>{baslik}</h1>
    <p class="guncelleme">Son güncelleme: {guncelleme}</p>
    <slot />
  </main>

  <AltSerit />
</Duzen>

<style>
  .ust-serit {
    background: var(--turuncu);
    padding: 20px 28px;
  }

  .metin {
    max-width: 68ch;
    margin: 0 auto;
    padding: 44px 28px 64px;
  }

  .metin h1 {
    font-size: clamp(28px, 4vw, 38px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 8px;
    text-wrap: balance;
  }

  .guncelleme { color: var(--soluk); font-size: 14px; margin: 0 0 32px; }

  .metin :global(h2) {
    font-size: 21px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 34px 0 10px;
  }

  .metin :global(p),
  .metin :global(li) { color: var(--metin); font-size: 16.5px; }

  .metin :global(ul) { padding-left: 22px; }
  .metin :global(li) { margin-bottom: 7px; }

  .metin :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
    margin: 14px 0;
  }

  .metin :global(th),
  .metin :global(td) {
    border: 1px solid var(--cizgi);
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
  }

  .metin :global(.kutu) {
    border-left: 3px solid var(--turuncu);
    background: #fff8f2;
    padding: 14px 16px;
    border-radius: 0 10px 10px 0;
    margin: 20px 0;
  }
</style>
```

- [ ] **Step 2: `docs/gizlilik-metni.md` dosyasina veri sorumlusu bolumu ekle**

Belgenin BASINA, ilk basliktan hemen sonra su bolum eklenir.
**Posta adresi YAZILMAZ** (kullanicinin karari).

```markdown
## Veri sorumlusu

Bu uygulamanın veri sorumlusu, gerçek kişi olarak Orçun Özdemir'dir.
KVKK kapsamındaki başvurularını destek@slooin.com adresine
iletebilirsin; başvurun en geç 30 gün içinde yanıtlanır.
```

- [ ] **Step 3: Saklama suresi ifadesini kontrol et**

`docs/gizlilik-metni.md` icinde saklama suresinden bahseden uc ifade
bugun somut sure YERINE "check-in suresi dolunca" diyor. **Bu bilincli
bir eksiklik** (spec bolum 9, acik karar 1): gorunurluk suresi
kullanicinin secebilecegi bir ayara donusecek ama hangi surelerin
sunulacagi kararlastirilmadi.

Bu adimda ifadeler DEGISTIRILMEZ; yalnizca sayfanin sonuna su kutu
eklenir:

```html
<p class="kutu">
  Check-in görünürlük süresi yakında senin seçebileceğin bir ayara
  dönüşecek. O değişiklik yayınlandığında bu metindeki süreler
  güncellenecek ve sana uygulama içinde bildirilecek.
</p>
```

- [ ] **Step 4: Sayfayi yaz**

`site/src/pages/gizlilik.astro` icine `docs/gizlilik-metni.md`
icerigi HTML olarak tasinir. Markdown dosyasi tek dogruluk kaynagi
DEGILDIR - iki yerde durur ve ikisi de guncellenir; bunun sebebi
uygulamanin metni kendi ekraninda gostermesi.

```astro
---
import Metin from '../duzen/Metin.astro'
---

<Metin
  baslik="Gizlilik Politikası"
  aciklama="Slooin'in hangi kişisel verileri, hangi amaçla işlediğini ve ne kadar süreyle sakladığını anlatan gizlilik politikası."
  guncelleme="7 Eylül 2026"
>
  <h2>Veri sorumlusu</h2>
  <p>
    Bu uygulamanın veri sorumlusu, gerçek kişi olarak
    <strong>Orçun Özdemir</strong>'dir. KVKK kapsamındaki
    başvurularını <a href="mailto:destek@slooin.com">destek@slooin.com</a>
    adresine iletebilirsin; başvurun en geç 30 gün içinde yanıtlanır.
  </p>

  <!-- Kalan bolumler docs/gizlilik-metni.md icinden birebir tasinir:
       hangi veriler, hangi amaçla, kimlerle paylaşılır, ne kadar
       saklanır, haklarin neler, harita sağlayıcısına giden veri. -->

  <p class="kutu">
    Check-in görünürlük süresi yakında senin seçebileceğin bir ayara
    dönüşecek. O değişiklik yayınlandığında bu metindeki süreler
    güncellenecek ve sana uygulama içinde bildirilecek.
  </p>
</Metin>
```

- [ ] **Step 5: Derle ve dogrula**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: `/gizlilik` 200 GECTI, JS'siz metin uzunlugu > 400 GECTI,
yatay tasma yok GECTI.

- [ ] **Step 6: Commit**

```bash
git add site docs/gizlilik-metni.md
git commit -m "feat(site): gizlilik politikasi sayfasi ve veri sorumlusu bolumu"
```

---

### Task 5: Kullanim kosullari sayfasi

**Files:**
- Create: `docs/kullanim-kosullari.md`
- Create: `site/src/pages/kosullar.astro`

**Interfaces:**
- Consumes: `Metin.astro` (Task 4).
- Produces: `/kosullar` sayfasi. Uygulamadaki kayit ekraninin atif
  yaptigi belge artik var oluyor.

- [ ] **Step 1: Belgeyi yaz**

`docs/kullanim-kosullari.md`. Elimizde HIC yok; sifirdan yazilir.
Kapsanacak bolumler ve her birinin tasimasi gereken bilgi:

| Bolum | Icerik |
|---|---|
| Taraflar | Veri sorumlusu gercek kisi; hizmetin adi Slooin |
| Yas siniri | **18 yas alti kullanamaz** (spec karari, 2026-08-12: 16-17 bandi ve veli onayi tamamen kaldirildi) |
| Hesap | Bir kisi bir hesap; kullanici adi kurallari; parola sorumlulugu |
| Konum | Uygulamanin calismasi icin konum gerekiyor; check-in kullanicinin kendi eylemi |
| Yasak davranis | Taciz, tehdit, sahte hesap, baskasini taklit, baskasinin konumunu izinsiz paylasma, ticari amacli toplu mesaj |
| Icerik | Kullanici yazdigi notun ve yukledigi fotografin sahibi; uygulamaya gosterme izni verir |
| Moderasyon | Sikayet uzerine icerik gizlenebilir; hesap askiya alinabilir ya da yasaklanabilir; itiraz destek@slooin.com |
| Hesap kapatma | Kullanici hesabini dondurabilir ya da kalici silebilir; silme geri alinamaz |
| Sorumluluk siniri | Kullanicilarin birbirleriyle bulusmasindan dogan sonuclardan uygulama sorumlu degildir; mekan verisi ucuncu taraf kaynaklardan gelir ve hatali olabilir |
| Degisiklik | Kosullar degisirse uygulama icinde bildirilir |
| Uygulanacak hukuk | Turkiye Cumhuriyeti hukuku |

**Mekan verisinin hatali olabilecegi maddesi bos bir feragat degil:**
spec bolum 10'da olculen gercek bir durum var - Foursquare kaynagindan
gelen bozuk koordinatli kopyalar mevcut.

- [ ] **Step 2: Sayfayi yaz**

`site/src/pages/kosullar.astro`:

```astro
---
import Metin from '../duzen/Metin.astro'
---

<Metin
  baslik="Kullanım Koşulları"
  aciklama="Slooin'i kullanırken geçerli olan kurallar: yaş sınırı, hesap kuralları, yasak davranışlar ve sorumluluk sınırları."
  guncelleme="7 Eylül 2026"
>
  <!-- Bolumler docs/kullanim-kosullari.md icinden birebir tasinir. -->
</Metin>
```

- [ ] **Step 3: Derle ve dogrula**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: `/kosullar` 200 GECTI, JS'siz okunuyor GECTI.

- [ ] **Step 4: Commit**

```bash
git add site docs/kullanim-kosullari.md
git commit -m "feat(site): kullanim kosullari - belge ve sayfa"
```

---

### Task 6: Destek sayfasi

**Files:**
- Create: `site/src/pages/destek.astro`

**Interfaces:**
- Consumes: `Metin.astro` (Task 4).
- Produces: `/destek` sayfasi. Apple'in Support URL alanina yazilacak
  adres.

- [ ] **Step 1: Sayfayi yaz**

Apple Kilavuz 1.5 "gercek bir yardim yolu" istiyor; yalnizca bir
e-posta adresi zayif kalir. Sik sorulanlar, uygulamanin GERCEK
davranisini anlatir - vaat degil.

`site/src/pages/destek.astro`:

```astro
---
import Metin from '../duzen/Metin.astro'
---

<Metin
  baslik="Destek"
  aciklama="Slooin hakkında sık sorulan sorular ve destek iletişimi."
  guncelleme="7 Eylül 2026"
>
  <p>
    Sorun, sorusun ya da bildirmek istediğin bir hata varsa
    <a href="mailto:destek@slooin.com">destek@slooin.com</a> adresine
    yaz. Mesajlar en geç üç iş günü içinde yanıtlanır.
  </p>

  <h2>Sık sorulan sorular</h2>

  <h2>Konumum sürekli paylaşılıyor mu?</h2>
  <p>
    Hayır. Konumun yalnızca sen check-in yaptığında ve seçtiğin
    görünürlük kademesine göre paylaşılır. Check-in'in süresi
    dolduğunda konum bilgisi silinir; geriye yalnızca "şurada oldum"
    kaydı kalır.
  </p>

  <h2>Beni kimler görebilir?</h2>
  <p>
    Her check-in'de üç seçenekten birini seçersin: herkese açık
    (aynı mekandakiler ve arkadaşların), sadece arkadaşlarım, ya da
    gizli (kimse görmez).
  </p>

  <h2>Birinden rahatsız oldum, ne yapabilirim?</h2>
  <p>
    Kişiyi profilinden engelleyebilirsin. Engelleme çift taraflıdır ve
    aranızdaki konuşmayı siler; engellenen kişi bunu bir hata mesajı
    olarak görmez. Ayrıca kişiyi ya da tek bir mesajı şikâyet
    edebilirsin.
  </p>

  <h2>Hesabımı nasıl silerim?</h2>
  <p>
    Uygulama içinde Ayarlar &rsaquo; Hesabımı sil adımından, ya da
    uygulamayı silmiş olsan bile <a href="/hesap-sil">hesap silme
    sayfasından</a> silebilirsin.
  </p>

  <h2>Uygulama neden benim şehrimde az mekan gösteriyor?</h2>
  <p>
    Mekan verisi Foursquare ve OpenStreetMap katkıcılarından geliyor.
    Bir mekan eksikse uygulama içinden kendin ekleyebilirsin.
  </p>
</Metin>
```

- [ ] **Step 2: Derle ve dogrula**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: `/destek` 200 GECTI, JS'siz okunuyor GECTI, `/hesap-sil`
baglantisi henuz KALDI (Task 7'de gelecek).

- [ ] **Step 3: Commit**

```bash
git add site
git commit -m "feat(site): destek sayfasi ve sik sorulanlar"
```

---

### Task 7: Hesap silme sayfasi

**Files:**
- Create: `site/src/betik/hesap-sil.ts`
- Create: `site/src/pages/hesap-sil.astro`
- Modify: `site/araclar/dogrula.mjs`

**Interfaces:**
- Consumes: `Metin.astro` (Task 4), `PUBLIC_SUPABASE_URL` ve
  `PUBLIC_SUPABASE_ANON_KEY` ortam degiskenleri.
- Produces: `/hesap-sil` sayfasi. Google Play'in zorunlu tuttugu web
  silme adresi. `hesap-sil` Edge Function'i DEGISTIRILMEZ.

**DIKKAT - askidaki ve dondurulmus hesaplar da silebilmeli.** Silme
kullanicinin yasal hakki; moderasyon durumu buna engel olmamali.
`hesap-sil` fonksiyonu bugun hesap durumuna BAKMIYOR ve bu dogru
davranis - bu sayfaya ya da fonksiyona "hesabin askida, silemezsin"
turu bir kontrol EKLENMEZ.

- [ ] **Step 1: Dogrulama aracina JS'siz erisilebilirlik kontrolu ekle**

Sayfa giris duvarinin arkasinda OLMAMALI: uygulamayi silmis biri de
nasil silecegini okuyabilmeli. `dogrula.mjs` icindeki
`JSSIZ_OKUNMALI` dizisine `/hesap-sil` **eklenmez** (formu JS
calistiriyor), onun yerine ayri bir kontrol eklenir - "Ic baglantilar"
blogunun ONUNE:

```js
  // 6) Hesap silme sayfasi JS kapaliyken de ANLATIYOR mu
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
```

- [ ] **Step 2: Araci calistir, kontrollerin kaldigini gor**

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: "Hesap silme erisilebilirligi" kontrolleri KALDI.

- [ ] **Step 3: Istemci betigini yaz**

`site/src/betik/hesap-sil.ts`:

```ts
/**
 * Web uzerinden hesap silme.
 *
 * Google Play, uygulamayi silmis kullanicinin da hesabini
 * silebilmesini sart kosuyor; bu sayfa o sarti karsiliyor.
 *
 * Sunucuda DEGISIKLIK YOK: `hesap-sil` Edge Function'inda CORS
 * `Access-Control-Allow-Origin: *` ve `verify_jwt` acik, yani bu
 * sayfadan cagrilabiliyor.
 *
 * Guvenlik: bu sayfanin hicbir yetkisi yok. Service-role anahtari
 * BURAYA GIRMEZ. Silme karari tamamen sunucuda veriliyor - fonksiyon
 * parolayi kendisi yeniden dogruluyor.
 */
import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.PUBLIC_SUPABASE_URL
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

const istemci = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const form = document.getElementById('silme-formu') as HTMLFormElement
const durum = document.getElementById('durum') as HTMLParagraphElement
const dugme = document.getElementById('sil-dugmesi') as HTMLButtonElement

function bildir(mesaj: string, tur: 'hata' | 'bilgi' | 'basari') {
  durum.textContent = mesaj
  durum.className = 'durum ' + tur
}

form.addEventListener('submit', async (olay) => {
  olay.preventDefault()

  const veri = new FormData(form)
  const eposta = String(veri.get('eposta') || '').trim()
  const parola = String(veri.get('parola') || '')

  if (!eposta || !parola) {
    bildir('E-posta ve parolanı gir.', 'hata')
    return
  }

  dugme.disabled = true
  bildir('Hesabın kontrol ediliyor…', 'bilgi')

  // 1) Oturum ac - JWT olmadan Edge Function cagrilamaz.
  const { data: oturum, error: girisHatasi } =
    await istemci.auth.signInWithPassword({ email: eposta, password: parola })

  if (girisHatasi || !oturum.session) {
    // Parolasi olmayan hesaplar da buraya duesuer (kayit e-posta koduyla
    // basliyor, parola profil olusturma adiminda belirleniyor). Mesaj
    // bu ihtimali de soyluyor.
    bildir(
      'Giriş yapılamadı. E-posta ya da parola yanlış olabilir. ' +
        'Hesabını hiç parola belirlemeden açtıysan destek@slooin.com adresine yaz.',
      'hata',
    )
    dugme.disabled = false
    return
  }

  bildir('Hesabın siliniyor…', 'bilgi')

  // 2) Silme. Parola GOVDEDE de gonderiliyor; fonksiyon onu sunucuda
  // yeniden dogruluyor, yani calinmis bir oturum jetonu tek basina
  // yetmiyor.
  const { data, error } = await istemci.functions.invoke('hesap-sil', {
    body: { parola },
  })

  if (error) {
    bildir(
      'Hesap silinemedi. Biraz sonra tekrar dene; sorun sürerse ' +
        'destek@slooin.com adresine yaz.',
      'hata',
    )
    dugme.disabled = false
    return
  }

  if (data?.silindi) {
    form.hidden = true
    bildir(
      'Hesabın silindi. Bu işlem geri alınamaz. ' +
        'Uygulama hâlâ telefonundaysa onu da kaldırabilirsin.',
      'basari',
    )
    return
  }

  bildir('Beklenmeyen bir yanıt alındı. destek@slooin.com adresine yaz.', 'hata')
  dugme.disabled = false
})
```

- [ ] **Step 4: Sayfayi yaz**

Aciklama metni formun USTUNDE ve JavaScript'ten BAGIMSIZ; boylece
betik hic calismasa bile kullanici ne yapacagini ogreniyor.

`site/src/pages/hesap-sil.astro`:

```astro
---
import Metin from '../duzen/Metin.astro'
---

<Metin
  baslik="Hesabını sil"
  aciklama="Slooin hesabını ve hesabına bağlı verileri kalıcı olarak silme."
  guncelleme="7 Eylül 2026"
>
  <p>
    Hesabını uygulama içinden <strong>Ayarlar &rsaquo; Hesabımı sil</strong>
    adımından silebilirsin. Uygulamayı telefonundan kaldırdıysan bu
    sayfadan da silebilirsin — uygulamayı yeniden kurman gerekmez.
  </p>

  <h2>Ne silinir?</h2>
  <ul>
    <li>Hesabın ve profilin (adın, kullanıcı adın, biyografin, doğum tarihin)</li>
    <li>Profil fotoğrafın ve check-in fotoğrafların</li>
    <li>Bütün check-in'lerin ve anıların</li>
    <li>Arkadaşlıkların, istekler, engellemeler ve bildirim kayıtların</li>
  </ul>

  <h2>Ne kalır?</h2>
  <p>
    Başkalarına gönderdiğin mesajlar ve gönderdiğin şikâyetler
    <strong>silinmez, anonimleşir</strong> — gönderen bilgisi kaldırılır.
    Mesajları silmek karşı tarafın konuşma geçmişini de silmek anlamına
    geleceği için bu tercih edildi.
  </p>

  <p class="kutu">
    Silme işlemi <strong>geri alınamaz</strong>. Aynı e-posta ile yeniden
    kayıt olabilirsin ama eski verilerin geri gelmez. Hesabını geçici
    olarak kapatmak istiyorsan, uygulama içindeki
    <strong>hesabı dondurma</strong> seçeneğini kullan — tekrar giriş
    yaptığında hesabın kendiliğinden açılır.
  </p>

  <h2>Sil</h2>
  <p>
    Güvenlik için parolan isteniyor. Parolan sunucuda doğrulanır;
    bu sayfanın hesabın üzerinde hiçbir yetkisi yoktur.
  </p>

  <form id="silme-formu">
    <label>
      E-posta
      <input type="email" name="eposta" autocomplete="email" required />
    </label>
    <label>
      Parola
      <input type="password" name="parola" autocomplete="current-password" required />
    </label>
    <button id="sil-dugmesi" type="submit">Hesabımı kalıcı olarak sil</button>
  </form>

  <p id="durum" class="durum" role="status" aria-live="polite"></p>

  <p>
    Hesabını telefon numarasıyla açtıysan ya da hiç parola
    belirlemediysen bu form çalışmaz. O durumda
    <a href="mailto:destek@slooin.com">destek@slooin.com</a> adresine
    yaz; silme talebini oradan alırız.
  </p>
</Metin>

<script>
  import '../betik/hesap-sil.ts'
</script>

<style>
  form { display: flex; flex-direction: column; gap: 14px; margin: 18px 0 10px; max-width: 380px; }

  label { display: flex; flex-direction: column; gap: 6px; font-size: 14px; font-weight: 600; }

  input {
    font: inherit;
    font-weight: 400;
    padding: 10px 12px;
    border: 1px solid var(--cizgi);
    border-radius: 10px;
    background: var(--beyaz);
    color: var(--metin);
  }

  input:focus-visible { outline: 2px solid var(--turuncu); outline-offset: 1px; }

  button {
    font: inherit;
    font-weight: 600;
    padding: 12px 18px;
    border: 0;
    border-radius: 10px;
    background: #c0392b;
    color: var(--beyaz);
    cursor: pointer;
  }

  button:disabled { opacity: 0.6; cursor: default; }
  button:focus-visible { outline: 3px solid var(--metin); outline-offset: 2px; }

  .durum { font-size: 15px; margin: 6px 0 0; min-height: 1.5em; }
  .durum.hata { color: #c0392b; }
  .durum.bilgi { color: var(--ikincil); }
  .durum.basari { color: #1f7a4d; font-weight: 600; }
</style>
```

- [ ] **Step 5: Ortam degiskenlerini ayarla ve derle**

`site/.env` olusturulur (gitignored). Degerler `mobil/.env` icindeki
`EXPO_PUBLIC_SUPABASE_URL` ve `EXPO_PUBLIC_SUPABASE_ANON_KEY` ile ayni.

Run: `npm --prefix site run build && node site/araclar/dogrula.mjs`
Expected: butun kontroller GECTI, cikis kodu 0.

- [ ] **Step 6: Commit**

```bash
git add site
git commit -m "feat(site): hesap silme sayfasi - Play'in web silme sarti"
```

---

### Task 8: Hesap silmenin canli uctan uca dogrulanmasi

**Files:**
- Create: `araclar/site-silme-test-hesabi.py`
- Create: `site/araclar/silme-canli-test.mjs`

**Interfaces:**
- Consumes: Task 7'nin `/hesap-sil` sayfasi.
- Produces: Atilabilir bir hesabin site uzerinden gercekten
  silindigini kaniti.

**Neden ayri gorev:** jest ve `dogrula.mjs` Supabase'i gercekten
cagirmiyor. Bu sinif hata daha once yasandi - 66 test yesilken ekran
canlida hic calismiyordu. Silme akisi ancak GERCEK bir hesapla
dogrulanabilir.

- [ ] **Step 1: Atilabilir hesap acan betigi yaz**

`araclar/site-silme-test-hesabi.py`:

```python
"""Site silme testi icin atilabilir hesap acar.

Idempotent DEGIL: her kosumda YENI bir hesap acar, cunku testin
kendisi hesabi siliyor. Cikti olarak e-posta ve parolayi yazar.

`.test` uzanti IANA tarafindan rezerve; hicbir zaman gercek birine
ait olamaz, yani yanlislikla kimseye posta gitmez.
"""

import os
import secrets
import sys

import httpx

URL = os.environ["SUPABASE_URL"]
SERVIS = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

eposta = "silme-testi-%s@slooin.test" % secrets.token_hex(4)
parola = secrets.token_urlsafe(16)

yanit = httpx.post(
    "%s/auth/v1/admin/users" % URL,
    headers={"apikey": SERVIS, "Authorization": "Bearer %s" % SERVIS},
    json={"email": eposta, "password": parola, "email_confirm": True},
    timeout=30,
)

if yanit.status_code >= 300:
    sys.exit("hesap acilamadi: %s %s" % (yanit.status_code, yanit.text))

print(eposta)
print(parola)
```

- [ ] **Step 2: Canli test betigini yaz**

`site/araclar/silme-canli-test.mjs`:

```js
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
```

- [ ] **Step 3: Testi calistir**

`mobil/.env` yuklu bir kabukta:

```bash
npm --prefix site run build
python araclar/site-silme-test-hesabi.py > /tmp/hesap.txt
export SILME_TEST_EPOSTA=$(sed -n 1p /tmp/hesap.txt)
export SILME_TEST_PAROLA=$(sed -n 2p /tmp/hesap.txt)
node site/araclar/silme-canli-test.mjs
rm /tmp/hesap.txt
```

Expected: uc kontrol de GECTI, cikis kodu 0.

- [ ] **Step 4: Commit**

```bash
git add araclar/site-silme-test-hesabi.py site/araclar/silme-canli-test.mjs
git commit -m "test(site): hesap silme uctan uca canli dogrulama"
```

---

### Task 9: Dagitim

**Files:**
- Create: `site/README.md`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: Task 1-8'in tamami.
- Produces: `slooin.com` adresinde yayindaki site.

**Kullaniciya bagli adimlar:** alan adi satin alma ve Cloudflare hesabi
etkilesimli; ajan yapamaz.

- [ ] **Step 1: Alan adini al (KULLANICI)**

`slooin.com` satin alinir. RDAP ile bosta oldugu dogrulanmisti; aradan
zaman gectiyse tekrar kontrol edilir:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L https://rdap.org/domain/slooin.com
```
404 = bosta, 200 = alinmis.

- [ ] **Step 2: Cloudflare Pages projesini kur (KULLANICI)**

Cloudflare panelinde Pages projesi olusturulur, GitHub deposu baglanir:

```
Kok dizin      : site
Derleme komutu : npm run build
Cikti klasoru  : dist
```

Ortam degiskenleri panelde tanimlanir: `PUBLIC_SUPABASE_URL` ve
`PUBLIC_SUPABASE_ANON_KEY`. **Bu degerler depoya yazilmaz.**

Ozel alan adi `slooin.com` baglanir.

- [ ] **Step 3: `destek@slooin.com` adresini kur (KULLANICI)**

Alan adina posta yonlendirmesi tanimlanir. Ayni alan adi Resend SMTP
icin de kullanilacak - bu, Supabase'in yerlesik e-posta servisiyle
ilgili bekleyen borcu da cozuyor.

- [ ] **Step 4: Yayin sonrasi dogrulama**

Run:
```bash
for y in / /gizlilik /kosullar /destek /hesap-sil; do
  echo -n "$y -> "
  curl -s -o /dev/null -w "%{http_code}\n" "https://slooin.com$y"
done
```
Expected: bes adres de 200.

Ardindan `/hesap-sil` sayfasi gercek tarayicida acilir ve Task 8'deki
canli test bir kez de **yayindaki adrese karsi** kosulur (betikteki
`http://127.0.0.1:4322` yerine `https://slooin.com`).

- [ ] **Step 5: `site/README.md` yaz**

Icerigi: neden Astro, neden Cloudflare Pages (EAS Hosting'de ozel alan
adi ucretli), hangi ortam degiskenleri gerekli, `dogrula.mjs` ne
kontrol ediyor, canli silme testi nasil kosulur, ve ekran
goruntulerinin nasil yenilenecegi.

- [ ] **Step 6: `CLAUDE.md`e yayin bilgisi ekle**

"Proje durumu" bolumune site eklenir: adres, hangi klasor, hangi
komutla yayinlanir, ve **uc ayri yayin yolunun karistirilmamasi
gerektigi**:

| Hedef | Komut |
|---|---|
| Site (`slooin.com`) | Cloudflare Pages, `main` dala push ile otomatik |
| Uygulamanin web surumu (`slooin.expo.app`) | `cd mobil && npm run yayinla` |
| Telefon / TestFlight | `eas update --channel production` |

- [ ] **Step 7: Commit**

```bash
git add site/README.md CLAUDE.md
git commit -m "docs(site): dagitim rehberi ve proje durumu"
```

---

## Acik borclar (plan disi, kayda geciyor)

1. **Saklama suresi.** Gorunurluk suresi karari verilince
   `docs/gizlilik-metni.md`, `site/src/pages/gizlilik.astro` ve
   uygulamadaki gizlilik ekranindaki ifadeler somut sureyle
   guncellenmeli.
2. **Mağaza rozetleri.** Uygulama yayinlanınca ana sayfadaki
   "Yakında" rozetleri gercek baglantiya donusturuluecek.
3. **Mekan verisindeki bozuk kopyalar.** Spec bolum 10'da olculen
   sorun; siteyi degil uygulamanin arama sonuclarini etkiliyor, ayri
   is kalemi.
4. **`ekran-goruntusu.mjs` e-posta girisine gecmeli.** Task 3 Step
   1'de guncelleniyor; arac bugun telefon numarasiyla giris yapiyor
   olabilir.
5. ~~Veri sorumlusunun adi~~ **KAPANDI (2026-09-07):** kullanici adini
   verdi. Hukuki metinlerde veri sorumlusu olarak
   **Orçun Özdemir** yazacak, iletisim `destek@slooin.com`.
   Posta adresi YAYINLANMAZ (kullanicinin karari).
