import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Proje REST ucu ve anon anahtari. supabase-js'in kapsayamadigi
 * dogrulamalar icin disari veriliyor: istemci kutuphanesi `Accept-Profile`
 * gibi ham basliklari ayarlamaya izin vermiyor, o proplar `fetch` ile
 * atiliyor (bkz. sema-dogrula.ts, net semasi expose probu).
 */
export const PROJE_URL = URL
export const ANON_ANAHTAR = ANON

function testHesapSifresi(): string {
  const sifre = process.env.TEST_HESAP_SIFRESI
  if (!sifre) {
    throw new Error('TEST_HESAP_SIFRESI tanimli degil; mobil/.env dosyasina ekle')
  }
  return sifre
}

const TEST_A = { telefon: '+905550000000', sifre: testHesapSifresi() }
const TEST_B = { telefon: '+905550000001', sifre: testHesapSifresi() }
const TEST_C = { telefon: '+905550000002' }

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

/**
 * Oturum acmamis (kimliksiz) bir istemci. Yalnizca "kimliksiz cagri
 * reddediliyor" testleri icin: security definer fonksiyonlarin ilk
 * satirdaki `auth.uid() is null` kontrolunu gercekten calistirir.
 */
export function anonIstemciOlustur(): SupabaseClient {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Ucuncu hesap yalnizca "takipci olmayan ama ayni mekanda bulunan
 * yabanci" rolu icin gerekli: takipcilerim ve gizli kademelerinin
 * mekandaki yabanciyi disari birakip birakmadigi baska turlu
 * olculemiyor.
 */
export async function ucuncuKullaniciIleBaglan() {
  const c = await kullaniciIleBaglan(TEST_C.telefon, testHesapSifresi())

  // A ve B'nin profil satiri onceki fazlardan (kayit ekrani uzerinden)
  // zaten var; C bu betik disinda hic kayit olmadi, profil satirini
  // ilk kosumda burada olusturmamiz gerekiyor. `dogum_tarihi` sutunu
  // 18 yas kisitina tabi (bkz. profiller tablosu), sabit bir gecmis
  // tarih kullaniliyor.
  const { data: mevcut, error: selErr } = await c.istemci
    .from('profiller')
    .select('id')
    .eq('id', c.id)
    .limit(1)
  if (selErr) throw new Error(`C profil sorgu hatasi: ${selErr.message}`)

  if (!mevcut || mevcut.length === 0) {
    const { error: eklemeHatasi } = await c.istemci.from('profiller').insert({
      id: c.id,
      ad: 'Ucuncu Test Kullanici',
      kullanici_adi: `kullanici_${c.id.slice(0, 8)}`,
      dogum_tarihi: '2000-01-01',
    })
    if (eklemeHatasi) throw new Error(`C profil olusturma hatasi: ${eklemeHatasi.message}`)
  }

  return { c: c.istemci, cId: c.id }
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
  takipler: { istemci: SupabaseClient; hedefId: string }[]
  // Test hesaplarinin kullanici id'leri. checkInler/engellemeler/takipler
  // gibi tek tek biriktirilmiyor; calistir.ts basinda a/b, sonrasinda c
  // baglandikca dogrudan doldurulur. Tek amaci temizle()'nin sonunda
  // kotayiTemizle()'ye gecirilmek.
  hesapKimlikleri: string[]
}

export function bosTemizlenecekler(): Temizlenecekler {
  return { checkInler: [], engellemeler: [], takipler: [], hesapKimlikleri: [] }
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

  for (const { istemci, hedefId } of t.takipler) {
    const { error } = await istemci.rpc('takibi_birak', { p_kullanici_id: hedefId })
    if (error) {
      console.error(`  temizlik: takip (-> ${hedefId}) birakilamadi: ${error.message}`)
    }
  }

  console.log(
    '  Not: test mekanlari silinmedi (mekanlar tablosunda delete politikasi yok, kalicidirlar ve yeniden kullanilirlar).'
  )

  await kotayiTemizle(t.hesapKimlikleri.filter(Boolean))

  console.log('Temizlik bitti.')
}

// Yonetici istemcisi YALNIZCA test kosucusu icindir. Uygulama kodu bu
// anahtari hicbir yerde kullanmaz. Anahtar yoksa null doner ve cagiran
// taraf temizligi atlar - faz bloke olmaz, yalnizca uyari basilir.
export function yoneticiIstemcisi(): SupabaseClient | null {
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anahtar) return null
  return createClient(URL, anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Gorunurluk paketinin senaryolari gercek istek gonderiyor ve bunlar
// gunluk 50 istek tavanindan dusuyor. Tavan ekle-only `istek_gunlugu`
// tablosunu sayiyor; istemci o satirlari TASARIM GEREGI silemiyor
// (RLS acik, politika yok) - tavanin atlatilamaz olmasinin sebebi bu.
// Bu yuzden temizlik yonetici anahtariyla yapilir ve YALNIZCA test
// hesaplarinin satirlarini hedefler.
//
// Urun degismezligi bozulmuyor: ekle-only olmasi ISTEMCIYE karsi
// zorlanan bir kural ve o kural yerinde kaliyor.
export async function kotayiTemizle(kimlikler: string[]): Promise<void> {
  const yonetici = yoneticiIstemcisi()
  if (!yonetici) {
    console.warn(
      '\n  UYARI: SUPABASE_SERVICE_ROLE_KEY yok, istek kotasi temizlenmedi.\n' +
        '  Paket gunde ~8 kosumdan sonra kota yuzunden YANLIS ALARM verir.\n' +
        '  Bir dusme gorursen once kotayi kontrol et, kodu degil.\n'
    )
    return
  }
  const { error } = await yonetici
    .from('istek_gunlugu')
    .delete()
    .in('gonderen_id', kimlikler)
  if (error) {
    console.error('  Kota temizligi basarisiz:', error.message)
  }
}
