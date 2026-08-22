// Hesap durumu ve haklari Task 15: "hesap-sil" saf mantiginin birim
// testleri.
//
// Kosum: `cd mobil/supabase/functions && deno test --allow-net --allow-env`
// (ya da `deno task test`). Bu dosya `saf.ts`i test ediyor, `index.ts`i
// DEGIL: index.ts yuklendigi anda `Deno.serve` cagirip sunucu ayaga
// kaldirir. Veritabanina ve auth admin API'sine bakan kisim burada
// kapsanmiyor.

import { assertEquals } from '@std/assert'
import { fotografYollari, onayGecerliMi } from './saf.ts'

Deno.test('onayGecerliMi: kullanici adi birebir eslesmeli', () => {
  assertEquals(onayGecerliMi('deniz.k', 'deniz.k'), true)
  assertEquals(onayGecerliMi('deniz.k', 'Deniz.K'), false)
  assertEquals(onayGecerliMi('deniz.k', ' deniz.k '), true)
  assertEquals(onayGecerliMi('deniz.k', 'baskasi'), false)
  assertEquals(onayGecerliMi('deniz.k', ''), false)
  assertEquals(onayGecerliMi('deniz.k', null), false)
})

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
