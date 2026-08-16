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
    const { error: signUpError } = await istemci.auth.signUp({ phone: telefon, password: sifre })
    if (signUpError) {
      console.error(`  [${telefon}] signUp hatasi: ${signUpError.message}`)
    }
    const { error: otpError } = await istemci.auth.verifyOtp({ phone: telefon, token: '123456', type: 'sms' })
    if (otpError) {
      console.error(`  [${telefon}] verifyOtp hatasi: ${otpError.message}`)
    }
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

/**
 * Bir betik calismasi sirasinda olusturulan, betigin sonunda silinmesi
 * gereken kayitlari biriktirir.
 *
 * Mekanlar kasitli olarak burada yok: `mekanlar` tablosunda hicbir rol
 * icin delete politikasi tanimli degil (sadece "herkes mekanlari
 * okuyabilir" var), yani authenticated bir istemci kendi olusturdugu
 * mekani silemez — service role anahtari da bu ortamda tanimli degil.
 * Bu yuzden test mekanlari silinmek uzere degil, `mekanGetirVeyaOlustur`
 * ile ad'a gore aranip yeniden kullanilmak uzere tasarlandi: bir kere
 * olusturulur, sonraki calismalarda ayni satir bulunur.
 */
export type Temizlenecekler = {
  checkInler: { istemci: SupabaseClient; id: string }[]
  engellemeler: { istemci: SupabaseClient; engellenenId: string }[]
}

export function bosTemizlenecekler(): Temizlenecekler {
  return { checkInler: [], engellemeler: [] }
}

/**
 * Betigin olusturdugu check-in ve engelleme kayitlarini, olusturan
 * kullanicinin kendi istemcisiyle (RLS'e uyarak) siler. Bir kayit
 * silinemezse betigi durdurmaz; hatayi log'lar ve devam eder — boylece
 * kismi bir temizlik, sessizce yutulan bir temizlikten iyidir ve
 * cikan hata acikca goruluyor olur.
 */
export async function temizle(t: Temizlenecekler) {
  console.log('\nTemizlik basliyor...')

  for (const { istemci, id } of t.checkInler) {
    const { error } = await istemci.from('check_inler').delete().eq('id', id)
    if (error) {
      console.error(`  temizlik: check-in ${id} silinemedi: ${error.message}`)
    }
  }

  for (const { istemci, engellenenId } of t.engellemeler) {
    const { error } = await istemci.rpc('engeli_kaldir', { p_kullanici_id: engellenenId })
    if (error) {
      console.error(`  temizlik: engelleme (-> ${engellenenId}) kaldirilamadi: ${error.message}`)
    }
  }

  console.log(
    '  Not: test mekanlari silinmedi (mekanlar tablosunda delete politikasi yok, kalicidirlar ve yeniden kullanilirlar).'
  )
  console.log('Temizlik bitti.')
}
