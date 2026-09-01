// Bildirimler Task 3: "bildirim-gonder" saf mantiginin birim testleri.
//
// Kosum: `cd mobil/supabase/functions && deno test --allow-net --allow-env`
// (ya da `deno task test`). Bu dosya `saf.ts`i test ediyor, `index.ts`i
// DEGIL: index.ts yuklendigi anda `Deno.serve` cagirip sunucu ayaga
// kaldirir. Veritabanina bakan kisim (`kaynakDogrula`, jeton/ad okumalari)
// burada kapsanmiyor; onlar canli yolla dogrulaniyor.

import { assertEquals } from '@std/assert'
import {
  bildirimGovdesi,
  govdeyiCozumle,
  hedefleriBelirle,
  ozBildirimMi,
  type Olay,
} from './saf.ts'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const MESAJ = '44444444-4444-4444-8444-444444444444'
const KONUSMA = '55555555-5555-4555-8555-555555555555'

// ---------------------------------------------------------------------
// govdeyiCozumle
// ---------------------------------------------------------------------

Deno.test('govdeyiCozumle: bes olayin hepsini cozuyor', () => {
  assertEquals(
    govdeyiCozumle({ olay: 'mesaj', mesaj_id: MESAJ, konusma_id: KONUSMA, gonderen_id: A, aktor_id: A }),
    { olay: 'mesaj', mesaj_id: MESAJ, konusma_id: KONUSMA, gonderen_id: A, aktor_id: A }
  )
  assertEquals(
    govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B, aktor_id: A }),
    { olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B, aktor_id: A }
  )
  assertEquals(
    govdeyiCozumle({ olay: 'takip_kabul', takip_eden_id: A, takip_edilen_id: B, aktor_id: B }),
    { olay: 'takip_kabul', takip_eden_id: A, takip_edilen_id: B, aktor_id: B }
  )
  assertEquals(
    govdeyiCozumle({ olay: 'sohbet_istegi', gonderen_id: A, hedef_id: B, aktor_id: A }),
    { olay: 'sohbet_istegi', gonderen_id: A, hedef_id: B, aktor_id: A }
  )
  assertEquals(
    govdeyiCozumle({ olay: 'sohbet_kabul', gonderen_id: A, hedef_id: B, aktor_id: B }),
    { olay: 'sohbet_kabul', gonderen_id: A, hedef_id: B, aktor_id: B }
  )
})

Deno.test('govdeyiCozumle: aktor_id yoklugu ve null ayni sayiliyor', () => {
  assertEquals(govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B })?.aktor_id, null)
  assertEquals(
    govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B, aktor_id: null })?.aktor_id,
    null
  )
})

Deno.test('govdeyiCozumle: bozuk girdiyi reddediyor', () => {
  // Bilinmeyen olay.
  assertEquals(govdeyiCozumle({ olay: 'engelleme', takip_eden_id: A, takip_edilen_id: B }), null)
  // Olay alani hic yok.
  assertEquals(govdeyiCozumle({ takip_eden_id: A, takip_edilen_id: B }), null)
  // Eksik alan.
  assertEquals(govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: A }), null)
  // UUID olmayan id.
  assertEquals(govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: 'abc', takip_edilen_id: B }), null)
  // UUID olmayan aktor.
  assertEquals(
    govdeyiCozumle({ olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B, aktor_id: 'abc' }),
    null
  )
  // Nesne olmayan govdeler.
  assertEquals(govdeyiCozumle(null), null)
  assertEquals(govdeyiCozumle('mesaj'), null)
  assertEquals(govdeyiCozumle([{ olay: 'mesaj' }]), null)
})

Deno.test('govdeyiCozumle: mesaj olayinda uc id de zorunlu', () => {
  assertEquals(govdeyiCozumle({ olay: 'mesaj', konusma_id: KONUSMA, gonderen_id: A }), null)
  assertEquals(govdeyiCozumle({ olay: 'mesaj', mesaj_id: MESAJ, gonderen_id: A }), null)
  assertEquals(govdeyiCozumle({ olay: 'mesaj', mesaj_id: MESAJ, konusma_id: KONUSMA }), null)
})

// ---------------------------------------------------------------------
// hedefleriBelirle
// ---------------------------------------------------------------------

Deno.test('hedefleriBelirle: istek aliciya, kabul istegi GONDERENE gider', () => {
  // Bu iki satirin yonu ters cevrilirse bildirim yanlis kisiye gider ve
  // hicbir sey patlamaz; asil korunan iddia bu.
  const istek: Olay = { olay: 'takip_istegi', takip_eden_id: A, takip_edilen_id: B, aktor_id: A }
  assertEquals(hedefleriBelirle(istek, []), [{ aliciId: B, karsiTarafId: A }])

  const kabul: Olay = { olay: 'takip_kabul', takip_eden_id: A, takip_edilen_id: B, aktor_id: B }
  assertEquals(hedefleriBelirle(kabul, []), [{ aliciId: A, karsiTarafId: B }])

  const sIstek: Olay = { olay: 'sohbet_istegi', gonderen_id: A, hedef_id: B, aktor_id: A }
  assertEquals(hedefleriBelirle(sIstek, []), [{ aliciId: B, karsiTarafId: A }])

  const sKabul: Olay = { olay: 'sohbet_kabul', gonderen_id: A, hedef_id: B, aktor_id: B }
  assertEquals(hedefleriBelirle(sKabul, []), [{ aliciId: A, karsiTarafId: B }])
})

Deno.test('hedefleriBelirle: mesaj konusmanin BUTUN diger uyelerine gider', () => {
  const mesaj: Olay = {
    olay: 'mesaj',
    mesaj_id: MESAJ,
    konusma_id: KONUSMA,
    gonderen_id: A,
    aktor_id: A,
  }
  assertEquals(hedefleriBelirle(mesaj, [B]), [{ aliciId: B, karsiTarafId: A }])
  // Grup konusmasi geldigi gun hicbiri sessizce dusmemeli.
  assertEquals(hedefleriBelirle(mesaj, [B, C]), [
    { aliciId: B, karsiTarafId: A },
    { aliciId: C, karsiTarafId: A },
  ])
  // Uye okunamadiysa hedef yok - cagiran bunu "alici yok" diye isliyor.
  assertEquals(hedefleriBelirle(mesaj, []), [])
})

// ---------------------------------------------------------------------
// ozBildirimMi
// ---------------------------------------------------------------------

Deno.test('ozBildirimMi: kendi eylemi susar, baskasininki susmaz', () => {
  assertEquals(ozBildirimMi(A, A), true)
  assertEquals(ozBildirimMi(A, B), false)
})

Deno.test('ozBildirimMi: aktor bilinmiyorsa (null) gonderilir', () => {
  // Service role ya da dogrudan SQL yazmasi. Susmak, mesru bildirimleri
  // sessizce yutmak demek olurdu.
  assertEquals(ozBildirimMi(A, null), false)
})

Deno.test('ozBildirimMi: karsilikli takipteki ayna gecisi susuyor', () => {
  // B, A'nin istegini kabul edince ayna satir (takip_eden_id = B) da
  // 'kabul'e gecer; o olayin alicisi B'nin KENDISI olur.
  const ayna: Olay = { olay: 'takip_kabul', takip_eden_id: B, takip_edilen_id: A, aktor_id: B }
  const hedefler = hedefleriBelirle(ayna, [])
  assertEquals(hedefler, [{ aliciId: B, karsiTarafId: A }])
  assertEquals(ozBildirimMi(hedefler[0].aliciId, ayna.aktor_id), true)
})

// ---------------------------------------------------------------------
// bildirimGovdesi
// ---------------------------------------------------------------------

Deno.test('bildirimGovdesi: bes kalip', () => {
  // Metinler KULLANICIYA GORUNUYOR: duzgun Turkce yazilirlar (karar 74)
  // ve iliski "bag/takip" degil ARKADASLIK diye anilir (kullanicinin
  // karari 2026-09-01). Kilit ekraninda "takip istegi" yaziyordu.
  assertEquals(bildirimGovdesi('mesaj', 'Deniz'), 'Deniz sana mesaj gönderdi')
  assertEquals(
    bildirimGovdesi('takip_istegi', 'Deniz'),
    'Deniz sana arkadaşlık isteği gönderdi'
  )
  assertEquals(
    bildirimGovdesi('takip_kabul', 'Deniz'),
    'Deniz arkadaşlık isteğini kabul etti'
  )
  assertEquals(
    bildirimGovdesi('sohbet_istegi', 'Deniz'),
    'Deniz sana sohbet isteği gönderdi'
  )
  assertEquals(
    bildirimGovdesi('sohbet_kabul', 'Deniz'),
    'Deniz sohbet isteğini kabul etti'
  )
})

Deno.test('bildirimGovdesi: hicbir metin mesaj icerigi tasimiyor (karar 48)', () => {
  // Kalip degistirilip icerik eklenirse bu iddia duser. Metinlerde
  // yalnizca ad ve sabit ifade olmali.
  const govde = bildirimGovdesi('mesaj', 'Deniz')
  assertEquals(govde.includes('Deniz'), true)
  assertEquals(govde, 'Deniz sana mesaj gönderdi')
})
