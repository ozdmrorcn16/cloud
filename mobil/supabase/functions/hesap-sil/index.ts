// Hesap silme (spec karar 67, 68). auth.users satirini silmek Admin API
// gerektiriyor, bu yuzden Edge Function.
//
// Akis:
//   1) Cagiranin JWT'si dogrulanir - KENDI hesabindan baskasini silemez.
//   2) Onay metni kullanici adiyla karsilastirilir (yanlislikla silmeye
//      karsi surtunme; spec karar 67'de bekleme suresi yerine bu var).
//   3) Storage'daki profil ve check-in fotograflari silinir.
//   4) auth.admin.deleteUser cagrilir; cascade kalani goturur.
//
// (3) NEDEN (4)'TEN ONCE: kullanici satiri gidince check_inler de
// cascade ile gider ve fotograf yollarini bir daha okuyamayiz. Yollar
// once toplanmali.
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
// LOG: kullanici adi, telefon ya da mesaj icerigi YAZILMAZ; yalnizca
// islem sonucu ve silinen dosya sayilari.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { fotografYollari, onayGecerliMi } from './saf.ts'

const PROFIL_BUCKET = 'profil-fotograflari'
const CHECKIN_BUCKET = 'checkin-fotograflari'

function yanit(govde: unknown, durum: number): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (istek: Request) => {
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

  // 3) Storage temizligi. Yollar auth.users silinmeden ONCE toplanmali.
  const { data: checkInler, error: checkInHata } = await yonetici
    .from('check_inler')
    .select('fotograf')
    .eq('kullanici_id', kimlik)

  if (checkInHata) {
    console.error('hesap-sil: check-in fotograflari okunamadi')
    return yanit({ hata: 'Silme tamamlanamadi' }, 500)
  }

  const yollar = fotografYollari(
    kimlik,
    (profil?.fotograflar ?? []) as string[],
    ((checkInler ?? []) as { fotograf: string | null }[]).map((c) => c.fotograf)
  )

  if (yollar.profil.length > 0) {
    const { error } = await yonetici.storage.from(PROFIL_BUCKET).remove(yollar.profil)
    // Dosya silinemezse islemi DURDURMUYORUZ: hesabin silinmesi
    // kullanicinin kanuni hakki ve bir oksuz dosya yuzunden
    // engellenmemeli. Kalinti loglaniyor ve elle temizlenebilir.
    if (error) console.error('hesap-sil: profil fotograflari silinemedi')
  }
  if (yollar.checkIn.length > 0) {
    const { error } = await yonetici.storage.from(CHECKIN_BUCKET).remove(yollar.checkIn)
    if (error) console.error('hesap-sil: check-in fotograflari silinemedi')
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

  console.log(
    `hesap-sil: tamamlandi, profil dosyasi=${yollar.profil.length}, checkin dosyasi=${yollar.checkIn.length}`
  )
  return yanit({ silindi: true }, 200)
})
