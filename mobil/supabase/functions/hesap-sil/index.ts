// Hesap silme (spec karar 67, 68). auth.users satirini silmek Admin API
// gerektiriyor, bu yuzden Edge Function.
//
// Akis:
//   1) Cagiranin JWT'si dogrulanir - KENDI hesabindan baskasini silemez;
//      kimlik VE telefon buradan cikar.
//   2) Govdeden gelen parola, cagiranin KENDI telefonuyla
//      `signInWithPassword` denenerek SUNUCUDA dogrulanir. Bu istemci
//      tarafinda ATLANAMAZ - fonksiyonun kendisi zorluyor.
//   3) Silinecek Storage yollari TOPLANIR (henuz silinmez).
//   4) auth.admin.deleteUser cagrilir; cascade kalani goturur.
//   5) (4) basariliysa Storage'daki profil ve check-in fotograflari
//      silinir.
//
// TASARIM DEGISIKLIGI (kullanici karari): onceki surumde onay metni
// kullanici adiyla karsilastiriliyordu. Kullanici adi HERKESE ACIK
// (baskasinin_profili, kisi_ara RPC'leri donduruyor), yani o kontrol
// pratikte hicbir sey korumuyordu - yalnizca yanlislikla tiklamaya
// karsi surtunmeydi. Parola dogrulamasi GERCEK bir guvenlik kapisi:
// parolayi bilmeyen biri (ornegin calinmis bir oturum jetonuyla) hesabi
// silemez. Kullanicinin gerekcesi: "silme islemi kullanici adina gerek
// yok zaten kendi hesabi icerisinden yapacagi icin ama sifre istensin
// guvenlik amacli."
//
// (3) NEDEN (4)'TEN ONCE: kullanici satiri gidince check_inler de
// cascade ile gider ve fotograf yollarini bir daha okuyamayiz. Yollar
// once toplanmali.
//
// (5) NEDEN (4)'TEN SONRA: kontrolor incelemesinde bulunan Onemli
// bulgu (I1). Once bu sirayla yazilmisti (Storage sil, sonra
// deleteUser); `deleteUser` basarisiz olursa (ornegin I2'deki gibi bir
// FK ihlaliyle) kullanici hata gorur, hesap DURUYOR ama fotograflari
// zaten kalici silinmis olur - `profiller.fotograflar` olu yollar
// tasir, uygulama kirik gorseller gosterir. Simdi Storage silme yalnizca
// `deleteUser` basarili DONDUKTEN SONRA calisiyor; auth satiri hala
// duruyorken fotograf kaybi olmuyor.
//
// NOT: kullanici adi rezervasyonu kullanici karariyla tamamen
// kaldirildi; `moderasyon.kullanici_adini_rezerve_et` artik
// veritabaninda YOK. Silinen kullanici adi aninda serbest kalir - bu
// bilincli.
//
// DEPLOY NOTU: `verify_jwt` ACIK olmali - bildirim-gonder'in tersine.
// Cagriyi gercek bir kullanici yapiyor ve yetkilendirmenin tamami onun
// JWT'sine dayaniyor. Beyan `mobil/supabase/config.toml` icinde.
//
// CORS: bu uc nokta web'de (`expo start --web`) tarayicidan cagriliyor.
// `Authorization` + `Content-Type: application/json` capraz kaynak
// istegi bir OPTIONS preflight tetikler; asagida hem OPTIONS'a hem
// gercek yanitlara CORS basliklari eklendi. bildirim-gonder'de CORS
// YOK cunku onu pg_net cagiriyor (tarayici degil) - o kalip burada
// gecerli degil.
//
// LOG: parola, telefon ya da mesaj icerigi YAZILMAZ; yalnizca islem
// sonucu ve silinen/elenen dosya sayilari. Govde de loglanmaz.
//
// DUZELTME TURU 1 (kod incelemesi Important): parola dogrulamasindaki
// HER hata "Parola yanlis" donduruluyordu - rate limit, ag hatasi ya
// da GoTrue kesintisi de dahil. Sonuc: dogru parolasini yazan bir
// kullaniciya "Parola yanlis" denip tekrar tekrar denetmesi
// istenebiliyordu. Simdi hata turu ayriliyor: GERCEK bir gecersiz
// kimlik bilgisi (`code === 'invalid_credentials'`, ya da `code` yoksa
// `status === 400` - duzeltme turu 2, Kismi 1) "Parola yanlis" (400)
// donduruyor; her sey (rate limit, ag, 5xx, bilinmeyen) "su anda
// dogrulanamadi" (503) donduruyor - bkz. asagidaki (2).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { fotografYollari } from './saf.ts'

// Bucket kimlikleri migrasyonlardan BIREBIR: dogrulama olmadan
// tahmin edilmemeli. Kontrolor incelemesinde bulunan Critical (C1):
// check-in bucket'inin gercek id'si TIRELI ('check-in-fotograflari'),
// 'checkin-fotograflari' degil (bkz.
// migrations/20260815042615_checkin_fotograflari_bucket.sql ve
// lib/checkin-fotograf-yukle.ts). Yanlis id `remove()`a "Bucket not
// found" dondururdu; hata BILEREK yutuldugu icin akis sessizce devam
// eder, ama check_inler cascade ile gittigi icin yollar bir daha
// okunamaz - fotograflar Storage'da SURESIZ kalirdi.
const PROFIL_BUCKET = 'profil-fotograflari'
const CHECKIN_BUCKET = 'check-in-fotograflari'

const CORS_BASLIKLARI: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function yanit(govde: unknown, durum: number): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json', ...CORS_BASLIKLARI },
  })
}

Deno.serve(async (istek: Request) => {
  // Tarayicinin preflight'i: govde yok, kimlik dogrulamasi yok, yalnizca
  // izin basliklarini donup gecmesine izin veriyoruz.
  if (istek.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_BASLIKLARI })
  }

  if (istek.method !== 'POST') {
    return yanit({ hata: 'Yalnizca POST' }, 405)
  }

  const yetkiBasligi = istek.headers.get('Authorization')
  if (!yetkiBasligi) {
    return yanit({ hata: 'Kimlik dogrulamasi gerekli' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const servisAnahtari = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonAnahtari = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !servisAnahtari || !anonAnahtari) {
    console.error('hesap-sil: ortam degiskenleri eksik')
    return yanit({ hata: 'Sunucu yapilandirmasi eksik' }, 500)
  }

  const yonetici = createClient(url, servisAnahtari, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Cagiran kim? Jeton service-role istemcisiyle dogrulaniyor. Govdeden
  // gelen bir kimlige ASLA guvenilmiyor - silinecek hesap yalnizca JWT'den
  // cikan kimlik. KIMLIK BILGISI de buradan cikar; (2)'de parola
  // dogrulamasi icin gerekli - govdeden gelen bir adrese guvenilmiyor.
  //
  // E-POSTA VE TELEFON, BU SIRAYLA: kayit 2026-09-01'de e-postaya
  // tasindi, ama telefonla acilmis ESKI hesaplar hala var ve onlar da
  // hesabini silebilmeli. Ikisi de yoksa parola dogrulamasi hic
  // denenmiyor.
  const jeton = yetkiBasligi.replace(/^Bearer\s+/i, '')
  const { data: kullaniciVerisi, error: kullaniciHata } =
    await yonetici.auth.getUser(jeton)
  const kimlik = kullaniciVerisi?.user?.id
  const eposta = kullaniciVerisi?.user?.email
  const telefon = kullaniciVerisi?.user?.phone
  if (kullaniciHata || !kimlik) {
    return yanit({ hata: 'Kimlik dogrulamasi gecersiz' }, 401)
  }

  // 2) Parola dogrulamasi - SUNUCUDA zorlanir, istemci atlayamaz.
  let parola: string | null = null
  try {
    const govde = await istek.json()
    parola = typeof govde?.parola === 'string' ? govde.parola : null
  } catch {
    parola = null
  }

  if (!parola || parola.length === 0) {
    return yanit({ hata: 'Parola gerekli' }, 400)
  }

  if (!eposta && !telefon) {
    // Savunmaci: hesap e-posta ya da telefonla kimliklendirilmis
    // olmali. JWT'den ikisi de cikmazsa parola dogrulamasi hic
    // denenmemeli.
    return yanit({ hata: 'Bu hesap parola ile dogrulanamiyor' }, 400)
  }

  // Ayri, ANON anahtarli bir istemci: cagiranin KENDI kimlik bilgisi ve
  // govdeden gelen parolayla signInWithPassword denenir. Basarili olursa
  // parola dogrudur. persistSession/autoRefreshToken kapali - bu
  // istemcinin tek isi bir defalik dogrulama, oturum tutmuyor.
  const dogrulamaIstemcisi = createClient(url, anonAnahtari, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: parolaHatasi } = await dogrulamaIstemcisi.auth.signInWithPassword(
    eposta ? { email: eposta, password: parola } : { phone: telefon!, password: parola }
  )
  if (parolaHatasi) {
    // Parola da govde de loglanmiyor; kod ve durum kodu (sir tasimayan
    // metadata) tanidamayi kolaylastirmak icin loglaniyor.
    console.error('hesap-sil: parola dogrulanamadi', {
      kod: parolaHatasi.code,
      durum: parolaHatasi.status,
    })

    // Yalnizca GERCEK bir gecersiz kimlik bilgisi "Parola yanlis"
    // donduruyor. GoTrue'nun `code`u bunu ayirt ediyor, ama her GoTrue
    // surumu/yani `code` alanini doldurmayabilir (duzeltme turu 2,
    // Kismi 1) - o durumda `status === 400`e de bakiliyor, cunku
    // signInWithPassword'da GoTrue'nun basit-dogrulama disinda 400
    // dondurdugu tek durum gecersiz kimlik bilgisidir. Rate limit
    // (429), ag hatasi ya da 5xx gibi durumlarda parolanin dogru olup
    // olmadigi BILINMIYOR - kullaniciya "yanlis" demek yanlis bir itham
    // olur ve onu tekrar tekrar denemeye iter; yon hep suphede kalmak:
    // belirsizlik 503'e duser, asla "yanlis" ithamina degil.
    if (parolaHatasi.code === 'invalid_credentials' || parolaHatasi.status === 400) {
      return yanit({ hata: 'Parola yanlis' }, 400)
    }
    return yanit({ hata: 'Su anda dogrulanamadi, biraz sonra tekrar dene' }, 503)
  }

  const { data: profil, error: profilHata } = await yonetici
    .from('profiller')
    .select('fotograflar')
    .eq('id', kimlik)
    .maybeSingle()

  if (profilHata) {
    console.error('hesap-sil: profil okunamadi')
    return yanit({ hata: 'Hesap okunamadi' }, 500)
  }

  // 3) Silinecek yollarin TOPLANMASI. Yollar auth.users silinmeden ONCE
  // toplanmali (yoksa check_inler cascade ile gider), ama asil SILME
  // (Storage remove()) asagida (5)'e, deleteUser basarili donene kadar
  // erteleniyor.
  const { data: checkInler, error: checkInHata } = await yonetici
    .from('check_inler')
    .select('fotograf')
    .eq('kullanici_id', kimlik)

  if (checkInHata) {
    console.error('hesap-sil: check-in fotograflari okunamadi')
    return yanit({ hata: 'Silme tamamlanamadi' }, 500)
  }

  // fotografYollari kendi klasoru DISINDAKI hicbir yolu doner (C2
  // duzeltmesi) - `profiller.fotograflar` kullanici tarafindan dogrudan
  // yazilabilen, DEGERI dogrulanmayan bir sutun oldugu icin.
  const yollar = fotografYollari(
    kimlik,
    (profil?.fotograflar ?? []) as string[],
    ((checkInler ?? []) as { fotograf: string | null }[]).map((c) => c.fotograf)
  )

  if (yollar.yabanciElenen > 0) {
    // Bu normalde SIFIR olmali. Sifir degilse ya bir veri tutarsizligi
    // ya da C2'de tarif edilen saldiri denemesi var - yolun kendisi
    // DEGIL, yalnizca sayisi loglaniyor.
    console.warn('hesap-sil: kendi klasoru disinda yol elendi', {
      sayi: yollar.yabanciElenen,
    })
  }

  // 4) Asil silme. Cascade profiller, check_inler, takipler,
  //    sohbet_istekleri, engellemeler, istek_gunlugu, bildirim_jetonlari,
  //    konusma_uyeleri ve hesap_durumlari satirlarini goturur; mesajlar
  //    ve sikayetler Task 13 sayesinde set null ile KALIR.
  const { error: silmeHata } = await yonetici.auth.admin.deleteUser(kimlik)
  if (silmeHata) {
    console.error('hesap-sil: auth kullanicisi silinemedi')
    return yanit({ hata: 'Silme tamamlanamadi' }, 500)
  }

  // 5) Storage temizligi - YALNIZCA (4) basarili donduyse. Hesap zaten
  // silindigi icin buradaki bir hata yanitin `silindi: true` olmasini
  // ENGELLEMIYOR; kalinti loglanip elle temizlenebilir (talimattaki
  // "hesabin silinmesi kullanicinin kanuni hakki, oksuz dosya yuzunden
  // engellenmemeli" kurali burada gecerli).
  if (yollar.profil.length > 0) {
    const { error } = await yonetici.storage.from(PROFIL_BUCKET).remove(yollar.profil)
    if (error) console.error('hesap-sil: profil fotograflari silinemedi')
  }
  if (yollar.checkIn.length > 0) {
    const { error } = await yonetici.storage.from(CHECKIN_BUCKET).remove(yollar.checkIn)
    if (error) console.error('hesap-sil: check-in fotograflari silinemedi')
  }

  console.log(
    `hesap-sil: tamamlandi, profil dosyasi=${yollar.profil.length}, checkin dosyasi=${yollar.checkIn.length}`
  )
  return yanit({ silindi: true }, 200)
})
