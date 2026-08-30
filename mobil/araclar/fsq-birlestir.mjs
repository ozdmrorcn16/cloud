// Foursquare hazirlik tablosu uzerinde dilim dilim RPC kosar. FSQ_RPC ile
// hangi adim: fsq_semt_doldur (ilce) ya da fsq_aktar (mekanlar'a aktarim).
// (Ilk surum fsq_birlestir'i cagiriyordu; kullanici tek kaynak karari
// verince o fonksiyon dusuruldu, 2026-08-30.)
//
// Neden dilim: 6 milyon satirlik tek bir birlestirme HTTP zaman
// asimina dusuyor (PostgREST/gateway ~60 sn). Dilim dar tutuluyor ve
// bir dilim zaman asimina duserse ikiye bolunup yeniden deneniyor;
// islenen satirlar `islendi = true` oldugu icin tekrar zararsiz.
//
// Kullanim (mobil/.env yuklu kabuk, mobil/ icinden - supabase-js orada):
//   node araclar/fsq-birlestir.mjs
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Paralel kosum: FSQ_LNG0/FSQ_LNG1 ile her surece ayri boylam araligi.
// Olcum (2026-08-30): 0.005 derecelik dilim Bursa merkezinde ~22 sn
// (17 bin Foursquare satiri); PostgREST/gateway siniri ~60 sn.
const LNG0 = Number(process.env.FSQ_LNG0 ?? '25.6'), LNG1 = Number(process.env.FSQ_LNG1 ?? '44.9')
const ADIM = Number(process.env.FSQ_DILIM ?? '0.05')
const RPC = process.env.FSQ_RPC ?? 'fsq_aktar'
let toplam = 0

async function dilim(a, b, derinlik = 0) {
  const t0 = Date.now()
  const { data, error } = await sb.rpc(RPC, { p_lng0: a, p_lng1: b })
  if (error) {
    if (derinlik < 4 && /timeout|canceling|57014|504|502/i.test(error.message)) {
      const orta = (a + b) / 2
      console.log(`  ${a.toFixed(3)}-${b.toFixed(3)} zaman asimi, ikiye bolunuyor`)
      await dilim(a, orta, derinlik + 1)
      await dilim(orta, b, derinlik + 1)
      return
    }
    // Gecici hatalar (kilit zaman asimi, PGRST002 sema onbellegi, JWT saat
    // kaymasi): bekle, ayni dilimi yeniden dene - islem idempotent.
    if (derinlik < 8) {
      console.log(`  ${a.toFixed(3)}-${b.toFixed(3)} hata: ${error.message.slice(0, 70)} - ${10 * (derinlik + 1)} sn sonra yeniden`)
      await new Promise((r) => setTimeout(r, 10000 * (derinlik + 1)))
      await dilim(a, b, derinlik + 1)
      return
    }
    throw new Error(`${a}-${b}: ${error.message}`)
  }
  const adet = Number(data)
  toplam += adet
  console.log(`${RPC} ${a.toFixed(3)}-${b.toFixed(3)}  ${adet}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)  toplam ${toplam}`)
}
for (let a = LNG0; a < LNG1 - 1e-9; a += ADIM) {
  await dilim(a, Math.min(a + ADIM, LNG1))
}
console.log(`BITTI ${RPC}: toplam ${toplam}`)
