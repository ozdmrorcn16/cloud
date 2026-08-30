// Foursquare hazirlik tablosunu `mekanlar` ile birlestirir: boylam
// dilimleri halinde `fsq_birlestir(lng0, lng1)` RPC'sini cagirir.
//
// Neden dilim: 6 milyon satirlik tek bir birlestirme HTTP zaman
// asimina dusuyor (PostgREST/gateway ~60 sn). Dilim dar tutuluyor ve
// bir dilim zaman asimina duserse ikiye bolunup yeniden deneniyor;
// islenen satirlar `islendi = true` oldugu icin tekrar zararsiz.
//
// Kullanim (mobil/.env yuklu kabuk):  node araclar/fsq-birlestir.mjs
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const LNG0 = 25.6, LNG1 = 44.9
const ADIM = Number(process.env.FSQ_DILIM ?? '0.05')
let eslesen = 0, eklenen = 0

async function dilim(a, b, derinlik = 0) {
  const t0 = Date.now()
  const { data, error } = await sb.rpc('fsq_birlestir', { p_lng0: a, p_lng1: b })
  if (error) {
    if (derinlik < 4 && /timeout|canceling|57014|504|502/i.test(error.message)) {
      const orta = (a + b) / 2
      console.log(`  ${a.toFixed(3)}-${b.toFixed(3)} zaman asimi, ikiye bolunuyor`)
      await dilim(a, orta, derinlik + 1)
      await dilim(orta, b, derinlik + 1)
      return
    }
    throw new Error(`${a}-${b}: ${error.message}`)
  }
  const r = Array.isArray(data) ? data[0] : data
  eslesen += r.eslesen; eklenen += r.eklenen
  console.log(`${a.toFixed(2)}-${b.toFixed(2)}  eslesen ${r.eslesen}  eklenen ${r.eklenen}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)  toplam ${eslesen}/${eklenen}`)
}
for (let a = LNG0; a < LNG1 - 1e-9; a += ADIM) {
  await dilim(a, Math.min(a + ADIM, LNG1))
}
console.log(`BITTI: eslesen ${eslesen}, eklenen ${eklenen}`)
