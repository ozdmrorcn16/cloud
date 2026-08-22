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

Deno.test('fotografYollari: profil ve check-in yollarini ayirir', () => {
  const sonuc = fotografYollari('kullanici-1', ['a.jpg', 'b.jpg'], ['c.jpg'])
  assertEquals(sonuc.profil, ['a.jpg', 'b.jpg'])
  assertEquals(sonuc.checkIn, ['c.jpg'])
})

Deno.test('fotografYollari: bos girdilerde bos dizi doner', () => {
  const sonuc = fotografYollari('kullanici-1', [], [])
  assertEquals(sonuc.profil, [])
  assertEquals(sonuc.checkIn, [])
})

Deno.test('fotografYollari: null ve bos metinleri eler', () => {
  const sonuc = fotografYollari('kullanici-1', ['a.jpg', ''], [null, 'c.jpg'])
  assertEquals(sonuc.profil, ['a.jpg'])
  assertEquals(sonuc.checkIn, ['c.jpg'])
})
