// EMOJI VERISI URETICI (2026-09-26). Anlik izleyicideki emoji sayfasi
// ("Onerilenler" + "Tumu" + "Ara") icin tam liste ve 7 dilde arama
// kelimeleri uretir. Kaynaklar YALNIZCA uretimde gerekir, uygulamaya
// girmez:
//   npm install --no-save emojibase-data@17 cldr-annotations-full
//   node araclar/emoji-veri-uret.mjs
// Cikti: lib/emoji-veri/liste.json (emojiler, sirali) ve
// lib/emoji-veri/<dil>.json (ayni sirada, bosluklu arama metni).
// Lisanslar: emojibase-data MIT, CLDR Unicode License (atif README'de).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const veri = require('emojibase-data/en/data.json')

// iOS 16.4 / Android 13 Unicode 15.0'i cizer; daha yenisi kutu olur.
const EN_YUKSEK_SURUM = 15.0
// Grup 2 = ten rengi/sac bilesenleri (tek basina emoji degil).
const liste = veri
  .filter((e) => e.group !== undefined && e.group !== 2 && Number(e.version) <= EN_YUKSEK_SURUM)
  .sort((a, b) => a.order - b.order)
const etiketler = liste.map((e) => e.label.toLowerCase())

mkdirSync('lib/emoji-veri', { recursive: true })
writeFileSync('lib/emoji-veri/liste.json', JSON.stringify(liste.map((e) => e.emoji)))

const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar']
const temizle = (e) => e.replace(/️/g, '')
for (const dil of DILLER) {
  const a = JSON.parse(readFileSync(require.resolve(`cldr-annotations-full/annotations/${dil}/annotations.json`), 'utf8'))
    .annotations.annotations
  const bul = (e) => a[e] ?? a[temizle(e)]
  // CLDR'de karsiligi olmayan (bayraklar, tuslar) icin Ingilizce ad.
  const metinler = liste.map(({ emoji: e }, i) => {
    const k = bul(e)
    if (!k) return etiketler[i]
    return [...new Set([...(k.tts ?? []), ...(k.default ?? [])])].join(' ').toLocaleLowerCase(dil)
  })
  writeFileSync(`lib/emoji-veri/${dil}.json`, JSON.stringify(metinler))
}
console.log(`${liste.length} emoji, ${DILLER.length} dil`)
