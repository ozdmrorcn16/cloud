/**
 * Hukuki metinleri uygulamadan siteye KOPYALAR (derleme oncesi).
 *
 * Neden kopya, neden dogrudan import degil: site once
 * `../../mobil/lib/hukuki/...` yolunu dogrudan iceri aliyordu ve Vite o
 * dosyalar icin `mobil/tsconfig.json`u okuyup `expo/tsconfig.base`e
 * uzaniyordu. Cloudflare Pages'te `mobil/node_modules` kurulmadigi icin
 * derleme "Tsconfig not found expo/tsconfig.base" ile kirildi
 * (2026-09-13). Kopya, siteyi mobil'in arac zincirinden tamamen
 * ayiriyor; KAYNAK yine tek yerde (`mobil/lib/hukuki`), burasi uretilmis
 * dosya ve git'e girmiyor (`src/hukuki/` gitignored).
 *
 * `npm run build` oncesi `prebuild` olarak kendiliginden calisir.
 */
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const burasi = dirname(fileURLToPath(import.meta.url))
const kaynak = join(burasi, '..', '..', 'mobil', 'lib', 'hukuki')
const hedef = join(burasi, '..', 'src', 'hukuki')

mkdirSync(hedef, { recursive: true })
let sayi = 0
for (const ad of readdirSync(kaynak)) {
  if (!ad.endsWith('.ts') || ad.endsWith('.test.ts')) continue
  copyFileSync(join(kaynak, ad), join(hedef, ad))
  sayi += 1
}
console.log(`hukuki: ${sayi} dosya kopyalandi -> src/hukuki/`)
