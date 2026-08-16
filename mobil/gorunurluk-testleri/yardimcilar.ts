import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const TEST_A = { telefon: '+905550000000', sifre: 'test1234' }
const TEST_B = { telefon: '+905550000001', sifre: 'test1234' }

async function kullaniciIleBaglan(telefon: string, sifre: string) {
  const istemci = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let { data, error } = await istemci.auth.signInWithPassword({ phone: telefon, password: sifre })

  if (error) {
    await istemci.auth.signUp({ phone: telefon, password: sifre })
    await istemci.auth.verifyOtp({ phone: telefon, token: '123456', type: 'sms' })
    ;({ data, error } = await istemci.auth.signInWithPassword({ phone: telefon, password: sifre }))
    if (error) throw new Error(`${telefon} ile giris yapilamadi: ${error.message}`)
  }

  return { istemci, id: data.user!.id }
}

export async function ikiKullaniciIleBaglan() {
  const a = await kullaniciIleBaglan(TEST_A.telefon, TEST_A.sifre)
  const b = await kullaniciIleBaglan(TEST_B.telefon, TEST_B.sifre)
  return { a: a.istemci, b: b.istemci, aId: a.id, bId: b.id }
}

let basarisiz = 0

export function esitMi(gercek: unknown, beklenen: unknown, mesaj: string) {
  const gercekMetin = JSON.stringify(gercek)
  const beklenenMetin = JSON.stringify(beklenen)
  if (gercekMetin === beklenenMetin) {
    console.log(`  OK   ${mesaj}`)
  } else {
    basarisiz += 1
    console.error(`  HATA ${mesaj}\n       beklenen: ${beklenenMetin}\n       gercek:   ${gercekMetin}`)
  }
}

export function sonucuBildirVeCik() {
  if (basarisiz > 0) {
    console.error(`\n${basarisiz} dogrulama basarisiz.`)
    process.exit(1)
  }
  console.log('\nButun gorunurluk dogrulamalari gecti.')
  process.exit(0)
}
