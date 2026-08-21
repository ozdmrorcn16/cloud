// Bildirimler Task 3: "bildirim-gonder" Edge Function (Deno).
//
// Akis: Postgres tetikleyicisi (bildirim.olay_gonder) pg_net ile buraya
// POST atar; govde yalnizca isaretci (id'ler) tasir. Bu fonksiyon
//   1) `X-Bildirim-Sir` basligini Vault'taki sirla karsilastirir,
//   2) olayin KAYNAK SATIRINI veritabaninda dogrular,
//   3) aliciyi cikarir (mesajda konusmanin diger uyelerini okur),
//   4) karsi tarafin adini `profiller`den alir,
//   5) alicinin butun jetonlarini Expo Push API'ye yollar,
//   6) "DeviceNotRegistered" donen jetonlari siler.
//
// (2) NEDEN VAR - guvenlik: payload'daki id'ler tek basina hicbir sey
// kanitlamiyor. Sir sizarsa (net kilidi platform yuzunden zorlanamiyor,
// bkz. migrations/README-net-kilidi.md) payload'a guvenen bir fonksiyon
// "X seni takip etmek istiyor" gibi HIC OLMAMIS bir olayi kurbanin kilit
// ekranina dusurebilirdi - belirli birini adiyla taklit eden taciz ya da
// oltalama. Kaynak satiri dogrulaninca saldirganin yapabilecegi en fazla
// sey, gercekten olmus cok yeni bir olayi yinelemek (zararsiz tekrar).
//
// GIZLILIK: bildirim metni ICERIK TASIMAZ (karar 48) - yalnizca ad.
// Log'a sir, jeton degeri ya da mesaj icerigi YAZILMAZ; yalnizca olay
// turu, alici id'si ve sayilar.
//
// DEPLOY NOTU: `verify_jwt` KAPALI olmali. Cagriyi pg_net yapiyor ve
// elinde bir kullanici JWT'si yok; yetkilendirme tamamen asagidaki sir
// dogrulamasina dayaniyor. Beyan `mobil/supabase/config.toml` icinde
// (`[functions.bildirim-gonder] verify_jwt = false`), boylece
// `supabase functions deploy` de ayni ayarla dagitir.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  bildirimGovdesi,
  govdeyiCozumle,
  hedefleriBelirle,
  ozBildirimMi,
  VARSAYILAN_AD,
  type Olay,
} from './saf.ts'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Expo tek istekte en fazla 100 bildirim aliyor. Pratikte bir kullanicinin
// jeton sayisi bunun cok altinda, ama sinir kodda dursun.
const EXPO_PARTI_BOYU = 100

// ---------------------------------------------------------------------
// Sir dogrulama
// ---------------------------------------------------------------------

// Sir modul kapsaminda onbellekleniyor: her istekte veritabanina gitmek
// bildirim yolunu gereksiz yavaslatir ve pg_net'in sirali kuyrugunda
// birikmeye yol acar. Onbellek fonksiyon ornegi yasadigi surece durur.
let sirOnbellek: string | null = null
let sonSirOkumasi = 0

// Onbellek en fazla bu araliga bir kez tazeleniyor - hem soguk yolda
// (onbellek bos) hem de eslesmeyen bir sir gorulunce. Iki sey birden
// gerekiyordu: (a) sir Vault'ta donduruldugunde fonksiyon yeniden
// dagitilmadan kendini toparlayabilsin, (b) rastgele baslikla gelen bir
// saldirgan - ya da veritabani gecici olarak okunamazken gelen bir yigin
// istek - her cagrida bir veritabani sorgusu tetikleyemesin.
const SIR_TAZELEME_ARALIGI_MS = 60_000

async function siriOku(yonetici: SupabaseClient, tazele: boolean): Promise<string | null> {
  if (sirOnbellek !== null && !tazele) return sirOnbellek

  // Kisit HER IKI yola da uygulaniyor: soguk yolda da (onbellek bos)
  // ard arda gelen istekler veritabanini dovmemeli.
  const simdi = Date.now()
  if (sonSirOkumasi !== 0 && simdi - sonSirOkumasi < SIR_TAZELEME_ARALIGI_MS) return sirOnbellek

  const { data, error } = await yonetici.rpc('bildirim_siri_oku')
  sonSirOkumasi = simdi

  if (error) {
    // Hata METNI basilmiyor: cagri baglami sirri tasiyabilir.
    console.error('bildirim-gonder: sir okunamadi', { kod: error.code })
    return sirOnbellek
  }

  // Bos/null okuma CALISAN onbellegi SILMEZ. Vault'ta gecici bir aksaklik
  // ya da yanlislikla bosaltilmis bir satir, yasayan ornegin dogrulama
  // yetenegini yok etmemeli; sir gercekten degistiyse zaten yeni deger
  // gelir ve buraya yazilir.
  if (typeof data === 'string' && data.length > 0) {
    sirOnbellek = data
  } else {
    console.error('bildirim-gonder: sir bos donduruldu')
  }
  return sirOnbellek
}

/**
 * Sabit-zamanli karsilastirma - UZUNLUK HARIC. Ilk satir uzunluklar
 * farkliysa hemen doner, yani sirrin UZUNLUGU sizabilir; sizdirmadigi sey
 * icerik: dongude erken cikis yok. Sir sabit uzunlukta uretilen rastgele
 * bir dize oldugu icin uzunluk bilgisinin pratik degeri yok.
 */
function esitSir(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let fark = 0
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return fark === 0
}

// ---------------------------------------------------------------------
// Kaynak satiri dogrulama
// ---------------------------------------------------------------------

/**
 * Olayin gercekten olup olmadigini veritabanina sorar.
 *
 * Payload'a guvenmek bir kimlik taklidi acigidir: sir bilen biri, olmamis
 * bir takip istegini ya da baskasindan gelmis gibi gorunen bir mesaji
 * kurbanin kilit ekranina dusurebilir. Burada her olay icin KAYNAK SATIR
 * araniyor; bulunamazsa is yapilmiyor.
 *
 * Yarisma notu: pg_net cagriyi commit'ten sonra yaptigi icin satir bu
 * noktada gorunur olmali. Satir aradan gecen surede degistiyse (istek
 * geri cekildi, takip birakildi) dogrulama basarisiz olur ve bildirim
 * gitmez - bu dogru davranis, artik gecerli olmayan bir olay bildirilmez.
 */
async function kaynakDogrula(yonetici: SupabaseClient, olay: Olay): Promise<boolean> {
  try {
    if (olay.olay === 'mesaj') {
      const { data, error } = await yonetici
        .from('mesajlar')
        .select('id')
        .eq('id', olay.mesaj_id)
        .eq('konusma_id', olay.konusma_id)
        .eq('gonderen_id', olay.gonderen_id)
        .limit(1)
      if (error) throw error
      return (data ?? []).length > 0
    }

    if (olay.olay === 'takip_istegi' || olay.olay === 'takip_kabul') {
      const { data, error } = await yonetici
        .from('takipler')
        .select('durum')
        .eq('takip_eden_id', olay.takip_eden_id)
        .eq('takip_edilen_id', olay.takip_edilen_id)
        .eq('durum', olay.olay === 'takip_istegi' ? 'beklemede' : 'kabul')
        .limit(1)
      if (error) throw error
      return (data ?? []).length > 0
    }

    // sohbet_istegi / sohbet_kabul. Tablodaki sutun adi `alan_id`,
    // sozlesmedeki alan adi `hedef_id`.
    const { data, error } = await yonetici
      .from('sohbet_istekleri')
      .select('durum')
      .eq('gonderen_id', olay.gonderen_id)
      .eq('alan_id', olay.hedef_id)
      .eq('durum', olay.olay === 'sohbet_istegi' ? 'beklemede' : 'kabul')
      .limit(1)
    if (error) throw error
    return (data ?? []).length > 0
  } catch (e) {
    const kod = (e as { code?: string })?.code
    console.error('bildirim-gonder: kaynak satiri okunamadi', { olay: olay.olay, kod })
    // Okuyamiyorsak dogrulayamiyoruz; dogrulanmamis olay islenmez.
    return false
  }
}

// ---------------------------------------------------------------------
// Veritabani okumalari (service role; RLS atlanir)
// ---------------------------------------------------------------------

/**
 * Konusmadaki gonderen DISINDAKI butun uyeler.
 *
 * `limit(1)` bilerek YOK: bugun konusmalar birebir oldugu icin liste tek
 * elemanli, ama sinir kodda kalirsa grup konusmasi geldigi gun bildirim
 * sessizce rastgele tek bir uyeye giderdi. Cogul okuyup cogul gondermek
 * bugun de dogru, yarin da.
 */
async function konusmaDigerUyeleri(
  yonetici: SupabaseClient,
  konusmaId: string,
  gonderenId: string
): Promise<string[]> {
  const { data, error } = await yonetici
    .from('konusma_uyeleri')
    .select('kullanici_id')
    .eq('konusma_id', konusmaId)
    .neq('kullanici_id', gonderenId)

  if (error) {
    console.error('bildirim-gonder: konusma uyeleri okunamadi', { kod: error.code })
    return []
  }
  return (data ?? []).map((s: { kullanici_id: string }) => s.kullanici_id)
}

/** Karsi tarafin gorunen adi; profil yoksa notr karsilik. */
async function adiOku(yonetici: SupabaseClient, kullaniciId: string): Promise<string> {
  const { data, error } = await yonetici
    .from('profiller')
    .select('ad')
    .eq('id', kullaniciId)
    .maybeSingle()

  if (error) {
    console.error('bildirim-gonder: ad okunamadi', { kod: error.code })
    return VARSAYILAN_AD
  }
  const ad = data?.ad as string | undefined
  return ad && ad.trim().length > 0 ? ad : VARSAYILAN_AD
}

async function jetonlariOku(yonetici: SupabaseClient, aliciId: string): Promise<string[]> {
  const { data, error } = await yonetici
    .from('bildirim_jetonlari')
    .select('jeton')
    .eq('kullanici_id', aliciId)

  if (error) {
    console.error('bildirim-gonder: jetonlar okunamadi', { kod: error.code })
    return []
  }
  return (data ?? []).map((s: { jeton: string }) => s.jeton)
}

/**
 * Expo'nun "bu jeton artik gecerli degil" dedigi kayitlari temizler.
 *
 * `kullanici_id` filtresi SART: jeton global olarak benzersiz oldugu icin
 * filtresiz bir delete, arada cihazi devralmis olan YENI sahibin taze
 * satirini silerdi (jeton_kaydet devir sirasinda eski satiri silip
 * yenisini yaziyor).
 */
async function olecekJetonlariSil(
  yonetici: SupabaseClient,
  aliciId: string,
  jetonlar: string[]
): Promise<void> {
  if (jetonlar.length === 0) return
  const { error } = await yonetici
    .from('bildirim_jetonlari')
    .delete()
    .eq('kullanici_id', aliciId)
    .in('jeton', jetonlar)
  if (error) {
    console.error('bildirim-gonder: olu jeton silinemedi', { kod: error.code })
  }
}

// ---------------------------------------------------------------------
// Expo Push
// ---------------------------------------------------------------------

type ExpoSonuc = { status?: string; details?: { error?: string } }

function parcala<T>(dizi: T[], boy: number): T[][] {
  const parcalar: T[][] = []
  for (let i = 0; i < dizi.length; i += boy) parcalar.push(dizi.slice(i, i + boy))
  return parcalar
}

/**
 * Jetonlara bildirimi gonderir; kayitli olmayan (DeviceNotRegistered)
 * jetonlarin listesini doner. Basarisizlikta firlatmaz, `hata` bayragi
 * ile bildirir - cagiran durum kodunu ona gore secer.
 */
async function expoyaGonder(
  jetonlar: string[],
  govde: string,
  data: Record<string, string>
): Promise<{ hata: boolean; olu: string[] }> {
  const olu: string[] = []
  let hata = false

  for (const parca of parcala(jetonlar, EXPO_PARTI_BOYU)) {
    const mesajlar = parca.map((jeton) => ({ to: jeton, body: govde, data, sound: 'default' }))

    let yanit: Response
    try {
      yanit = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(mesajlar),
      })
    } catch {
      // Hata nesnesi basilmiyor: istek govdesini (jetonlari) tasiyabilir.
      console.error('bildirim-gonder: Expo cagrisi yapilamadi')
      hata = true
      continue
    }

    if (!yanit.ok) {
      console.error('bildirim-gonder: Expo hata durumu', { durum: yanit.status })
      hata = true
      continue
    }

    let govdeJson: { data?: ExpoSonuc[] }
    try {
      govdeJson = await yanit.json()
    } catch {
      console.error('bildirim-gonder: Expo yaniti cozulemedi')
      hata = true
      continue
    }

    const sonuclar = govdeJson.data ?? []
    if (sonuclar.length !== parca.length) {
      // Sonuc dizisi jeton dizisiyle KONUM ESLESIR; boy tutmuyorsa hangi
      // sonucun hangi jetona ait oldugu bilinemez. Yanlis jetonu silmektense
      // hicbirini silmemek dogrusu.
      console.error('bildirim-gonder: Expo sonuc sayisi eslesmiyor', {
        beklenen: parca.length,
        gelen: sonuclar.length,
      })
      hata = true
      continue
    }

    sonuclar.forEach((sonuc, i) => {
      if (sonuc?.status === 'error') {
        if (sonuc.details?.error === 'DeviceNotRegistered') olu.push(parca[i])
        else hata = true
      }
    })
  }

  return { hata, olu }
}

// ---------------------------------------------------------------------
// Istek isleyici
// ---------------------------------------------------------------------

function yanit(durum: number, govde: Record<string, unknown>): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return yanit(405, { hata: 'yalnizca POST' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const servisAnahtari = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !servisAnahtari) {
    console.error('bildirim-gonder: ortam degiskenleri eksik')
    return yanit(500, { hata: 'yapilandirma eksik' })
  }

  const yonetici = createClient(supabaseUrl, servisAnahtari, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Sir. Dogrulanmadan HICBIR sey yapilmiyor - govde bile ayristirilmiyor.
  const gelenSir = req.headers.get('X-Bildirim-Sir')
  if (!gelenSir) return yanit(401, { hata: 'yetkisiz' })

  let sir = await siriOku(yonetici, false)
  if (sir === null) {
    // Onbellek bos ve okuma da basarisiz: sir bilinmiyorsa istegi
    // dogrulayamayiz. "Bilmiyorum" 401 degil 500'dur.
    return yanit(500, { hata: 'sir okunamadi' })
  }
  if (!esitSir(gelenSir, sir)) {
    // Sir dondurulmus olabilir: sinirli sikliktaki bir tazelemeyle bir kez
    // daha bak, sonra pes et.
    sir = await siriOku(yonetici, true)
    if (sir === null || !esitSir(gelenSir, sir)) {
      console.warn('bildirim-gonder: sir eslesmedi')
      return yanit(401, { hata: 'yetkisiz' })
    }
  }

  // 2) Govde BICIMI.
  let ham: unknown
  try {
    ham = await req.json()
  } catch {
    return yanit(400, { hata: 'govde cozulemedi' })
  }

  const olay = govdeyiCozumle(ham)
  if (!olay) return yanit(400, { hata: 'gecersiz olay' })

  // 3) Olay GERCEKTEN oldu mu. Sirdan sonraki ikinci kapi: sir sizsa bile
  //    uydurma bir olay buradan gecemez.
  if (!(await kaynakDogrula(yonetici, olay))) {
    console.warn('bildirim-gonder: olay dogrulanamadi', { olay: olay.olay })
    return yanit(200, { gonderildi: 0, neden: 'olay dogrulanamadi' })
  }

  // 4) Alicilar.
  const digerUyeler =
    olay.olay === 'mesaj'
      ? await konusmaDigerUyeleri(yonetici, olay.konusma_id, olay.gonderen_id)
      : []

  const hedefler = hedefleriBelirle(olay, digerUyeler)
  if (hedefler.length === 0) {
    console.log('bildirim-gonder: alici bulunamadi', { olay: olay.olay })
    return yanit(200, { gonderildi: 0, neden: 'alici yok' })
  }

  const gonderilecekler = hedefler.filter((h) => !ozBildirimMi(h.aliciId, olay.aktor_id))
  if (gonderilecekler.length === 0) {
    console.log('bildirim-gonder: oz-bildirim atlandi', { olay: olay.olay })
    return yanit(200, { gonderildi: 0, neden: 'oz-bildirim' })
  }

  // 5) Metin. Karsi taraf butun hedeflerde ayni kisi, ad bir kez okunuyor.
  const ad = await adiOku(yonetici, gonderilecekler[0].karsiTarafId)
  const govde = bildirimGovdesi(olay.olay, ad)

  let toplamJeton = 0
  let toplamOlu = 0
  let hataVar = false

  for (const hedef of gonderilecekler) {
    const jetonlar = await jetonlariOku(yonetici, hedef.aliciId)
    if (jetonlar.length === 0) {
      console.log('bildirim-gonder: jeton yok', { olay: olay.olay, alici: hedef.aliciId })
      continue
    }

    const { hata, olu } = await expoyaGonder(jetonlar, govde, {
      tur: olay.olay,
      kullaniciId: hedef.karsiTarafId,
    })
    await olecekJetonlariSil(yonetici, hedef.aliciId, olu)

    toplamJeton += jetonlar.length
    toplamOlu += olu.length
    hataVar = hataVar || hata

    console.log('bildirim-gonder: alici islendi', {
      olay: olay.olay,
      alici: hedef.aliciId,
      jeton: jetonlar.length,
      olu: olu.length,
      hata,
    })
  }

  if (toplamJeton === 0) return yanit(200, { gonderildi: 0, neden: 'jeton yok' })
  if (hataVar) return yanit(500, { gonderildi: toplamJeton - toplamOlu, hata: 'kismi basarisizlik' })
  return yanit(200, { gonderildi: toplamJeton - toplamOlu, olu: toplamOlu })
})
