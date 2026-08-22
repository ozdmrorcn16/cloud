// Hesap silme (spec karar 67, 68). auth.users satirini silmek Admin API
// gerektiriyor, bu yuzden Edge Function.
//
// Akis:
//   1) Cagiranin JWT'si dogrulanir - KENDI hesabindan baskasini silemez.
//   2) Onay metni kullanici adiyla karsilastirilir (yanlislikla silmeye
//      karsi surtunme; spec karar 67'de bekleme suresi yerine bu var).
//   3) Silinecek Storage yollari TOPLANIR (henuz silinmez).
//   4) auth.admin.deleteUser cagrilir; cascade kalani goturur.
//   5) (4) basariliysa Storage'daki profil ve check-in fotograflari
//      silinir.
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
// NOT: kullanici adi rezervasyonu (eski adim 3) kullanici karariyla
// tamamen kaldirildi; `moderasyon.kullanici_adini_rezerve_et` artik
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
// LOG: kullanici adi, telefon ya da mesaj icerigi YAZILMAZ; yalnizca
// islem sonucu ve silinen/elenen dosya sayilari.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { fotografYollari, onayGecerliMi } from './saf.ts'

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
  if (!url || !servisAnahtari) {
    console.error('hesap-sil: ortam degiskenleri eksik')
    return yanit({ hata: 'Sunucu yapilandirmasi eksik' }, 500)
  }

  const yonetici = createClient(url, servisAnahtari, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Cagiran kim? Jeton service-role istemcisiyle dogrulaniyor. Govdeden
  // gelen bir kimlige ASLA guvenilmiyor - silinecek hesap yalnizca JWT'den
  // cikan kimlik.
  const jeton = yetkiBasligi.replace(/^Bearer\s+/i, '')
  const { data: kullaniciVerisi, error: kullaniciHata } =
    await yonetici.auth.getUser(jeton)
  const kimlik = kullaniciVerisi?.user?.id
  if (kullaniciHata || !kimlik) {
    return yanit({ hata: 'Kimlik dogrulamasi gecersiz' }, 401)
  }

  // 2) Onay metni.
  let onay: string | null = null
  try {
    const govde = await istek.json()
    onay = typeof govde?.onay === 'string' ? govde.onay : null
  } catch {
    onay = null
  }

  const { data: profil, error: profilHata } = await yonetici
    .from('profiller')
    .select('kullanici_adi, fotograflar')
    .eq('id', kimlik)
    .maybeSingle()

  if (profilHata) {
    console.error('hesap-sil: profil okunamadi')
    return yanit({ hata: 'Hesap okunamadi' }, 500)
  }

  // Profili olmayan bir hesap (kayit yarida kalmis) da silinebilmeli;
  // o durumda onay metni beklenmiyor.
  if (profil && !onayGecerliMi(profil.kullanici_adi, onay)) {
    return yanit({ hata: 'Onay metni kullanici adinla eslesmiyor' }, 400)
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
