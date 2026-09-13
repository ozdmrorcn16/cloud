// Hesap durumu ve haklari Task 15: "hesap-sil" saf mantiginin birim
// testleri.
//
// Kosum: `cd mobil/supabase/functions && deno test --allow-net --allow-env`
// (ya da `deno task test`). Bu dosya `saf.ts`i test ediyor, `index.ts`i
// DEGIL: index.ts yuklendigi anda `Deno.serve` cagirip sunucu ayaga
// kaldirir. Veritabanina ve auth admin API'sine bakan kisim burada
// kapsanmiyor.

import { assertEquals } from '@std/assert'
import { fotografYollari, girisTazeMi, TAZELIK_DAKIKA } from './saf.ts'

// Yollar gercek duzeni izliyor: `<kullaniciId>/<dosya>` (bkz.
// lib/fotograf-yukle.ts, lib/checkin-fotograf-yukle.ts).
Deno.test('fotografYollari: profil ve check-in yollarini ayirir', () => {
  const sonuc = fotografYollari('kullanici-1', ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'], ['kullanici-1/c.jpg'])
  assertEquals(sonuc.profil, ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'])
  assertEquals(sonuc.checkIn, ['kullanici-1/c.jpg'])
  assertEquals(sonuc.yabanciElenen, 0)
})

Deno.test('fotografYollari: bos girdilerde bos dizi doner', () => {
  const sonuc = fotografYollari('kullanici-1', [], [])
  assertEquals(sonuc.profil, [])
  assertEquals(sonuc.checkIn, [])
  assertEquals(sonuc.yabanciElenen, 0)
})

Deno.test('fotografYollari: null ve bos metinleri eler', () => {
  const sonuc = fotografYollari('kullanici-1', ['kullanici-1/a.jpg', ''], [null, 'kullanici-1/c.jpg'])
  assertEquals(sonuc.profil, ['kullanici-1/a.jpg'])
  assertEquals(sonuc.checkIn, ['kullanici-1/c.jpg'])
  assertEquals(sonuc.yabanciElenen, 0)
})

// C2 duzeltmesi: kontrolor incelemesinde bulundu. profiller.fotograflar
// kullanici tarafindan dogrudan yazilabiliyor ve DEGERI dogrulanmiyor;
// bu fonksiyon kendi klasoru disindaki hicbir yolu Storage silmesine
// vermemeli.
Deno.test('fotografYollari: baskasinin klasorundeki yollari eler', () => {
  const sonuc = fotografYollari('kullanici-1', ['baskasi-2/x.jpg'], ['baskasi-3/y.jpg'])
  assertEquals(sonuc.profil, [])
  assertEquals(sonuc.checkIn, [])
  assertEquals(sonuc.yabanciElenen, 2)
})

Deno.test('fotografYollari: kendi klasorundekiler kalir', () => {
  const sonuc = fotografYollari(
    'kullanici-1',
    ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'],
    ['kullanici-1/c.jpg']
  )
  assertEquals(sonuc.profil, ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'])
  assertEquals(sonuc.checkIn, ['kullanici-1/c.jpg'])
  assertEquals(sonuc.yabanciElenen, 0)
})

Deno.test('fotografYollari: karisik dizide yalnizca kendi yollari gecer', () => {
  const sonuc = fotografYollari(
    'kullanici-1',
    ['kullanici-1/a.jpg', 'saldirgan-9/kurban.jpg', '', 'kullanici-1/b.jpg'],
    ['baskasi-4/z.jpg', 'kullanici-1/c.jpg', null]
  )
  assertEquals(sonuc.profil, ['kullanici-1/a.jpg', 'kullanici-1/b.jpg'])
  assertEquals(sonuc.checkIn, ['kullanici-1/c.jpg'])
  // Iki dolu-ama-yabanci yol elendi: 'saldirgan-9/kurban.jpg' ve
  // 'baskasi-4/z.jpg'. Bos/null degerler sayilmiyor - onlar zaten
  // normal (fotografsiz check-in/profil).
  assertEquals(sonuc.yabanciElenen, 2)
})

// ----- girisTazeMi: silme kapisi (sifre yerine, 2026-09-13) -----

Deno.test('girisTazeMi: az once yapilan giris tazedir', () => {
  const simdi = new Date('2026-09-13T10:00:00Z')
  assertEquals(girisTazeMi('2026-09-13T09:58:00Z', simdi), true)
})

Deno.test('girisTazeMi: sinirin tam ustu taze, bir saniye otesi degil', () => {
  const simdi = new Date('2026-09-13T10:00:00Z')
  const sinir = new Date(simdi.getTime() - TAZELIK_DAKIKA * 60 * 1000)
  assertEquals(girisTazeMi(sinir.toISOString(), simdi), true)
  assertEquals(girisTazeMi(new Date(sinir.getTime() - 1000).toISOString(), simdi), false)
})

Deno.test('girisTazeMi: null, bos ve bozuk deger TAZE DEGIL (belirsizlikte kapi kapali)', () => {
  assertEquals(girisTazeMi(null), false)
  assertEquals(girisTazeMi(undefined), false)
  assertEquals(girisTazeMi(''), false)
  assertEquals(girisTazeMi('dun'), false)
})

Deno.test('girisTazeMi: gelecekteki bir zaman taze degil (saat kaymasi kapiyi acmasin)', () => {
  const simdi = new Date('2026-09-13T10:00:00Z')
  assertEquals(girisTazeMi('2026-09-13T10:05:00Z', simdi), false)
})
