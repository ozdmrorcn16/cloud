// Bildirimler Task 3: "bildirim-gonder" Edge Function (Deno).
//
// Akis: Postgres tetikleyicisi (bildirim.olay_gonder) pg_net ile buraya
// POST atar; govde yalnizca isaretci (id'ler) tasir. Bu fonksiyon
//   1) `X-Bildirim-Sir` basligini Vault'taki sirla karsilastirir,
//   2) olaydan aliciyi cikarir (mesajda konusmanin diger uyesini okur),
//   3) gonderenin adini `profiller`den alir,
//   4) alicinin butun jetonlarini Expo Push API'ye yollar,
//   5) "DeviceNotRegistered" donen jetonlari siler.
//
// GIZLILIK: bildirim metni ICERIK TASIMAZ (karar 48) - yalnizca ad.
// Log'a sir, jeton degeri ya da mesaj icerigi YAZILMAZ; yalnizca olay
// turu, alici id'si ve sayilar.
//
// DEPLOY NOTU: `verify_jwt` KAPALI olmali. Cagriyi pg_net yapiyor ve
// elinde bir kullanici JWT'si yok; yetkilendirme tamamen asagidaki sir
// dogrulamasina dayaniyor.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

// Expo tek istekte en fazla 100 bildirim aliyor. Pratikte bir kullanicinin
// jeton sayisi bunun cok altinda, ama sinir kodda dursun.
const EXPO_PARTI_BOYU = 100

// ---------------------------------------------------------------------
// Olay sozlesmesi (bildirim.olay_gonder'in urettigi bes bicim)
// ---------------------------------------------------------------------

export type Olay =
  | { olay: 'mesaj'; mesaj_id: string; konusma_id: string; gonderen_id: string; aktor_id: string | null }
  | { olay: 'takip_istegi'; takip_eden_id: string; takip_edilen_id: string; aktor_id: string | null }
  | { olay: 'takip_kabul'; takip_eden_id: string; takip_edilen_id: string; aktor_id: string | null }
  | { olay: 'sohbet_istegi'; gonderen_id: string; hedef_id: string; aktor_id: string | null }
  | { olay: 'sohbet_kabul'; gonderen_id: string; hedef_id: string; aktor_id: string | null }

const UUID_DESENI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function uuidMi(deger: unknown): deger is string {
  return typeof deger === 'string' && UUID_DESENI.test(deger)
}

/** `aktor_id` yoklugu ile null'i ayni sayiyoruz: ikisi de "aktor bilinmiyor". */
function aktoruOku(kayit: Record<string, unknown>): string | null | undefined {
  const ham = kayit.aktor_id
  if (ham === null || ham === undefined) return null
  return uuidMi(ham) ? ham : undefined // undefined = bicim hatasi
}

/**
 * Ham govdeyi sozlesmeye gore dogrular. Bicim bozuksa ya da olay
 * taninmiyorsa `null` doner (cagiran 400 verir).
 *
 * Saf fonksiyon: veritabanina ya da aga dokunmuyor.
 */
export function govdeyiCozumle(ham: unknown): Olay | null {
  if (typeof ham !== 'object' || ham === null || Array.isArray(ham)) return null
  const k = ham as Record<string, unknown>

  const aktor = aktoruOku(k)
  if (aktor === undefined) return null

  switch (k.olay) {
    case 'mesaj':
      if (!uuidMi(k.mesaj_id) || !uuidMi(k.konusma_id) || !uuidMi(k.gonderen_id)) return null
      return {
        olay: 'mesaj',
        mesaj_id: k.mesaj_id,
        konusma_id: k.konusma_id,
        gonderen_id: k.gonderen_id,
        aktor_id: aktor,
      }

    case 'takip_istegi':
    case 'takip_kabul':
      if (!uuidMi(k.takip_eden_id) || !uuidMi(k.takip_edilen_id)) return null
      return {
        olay: k.olay,
        takip_eden_id: k.takip_eden_id,
        takip_edilen_id: k.takip_edilen_id,
        aktor_id: aktor,
      }

    case 'sohbet_istegi':
    case 'sohbet_kabul':
      if (!uuidMi(k.gonderen_id) || !uuidMi(k.hedef_id)) return null
      return {
        olay: k.olay,
        gonderen_id: k.gonderen_id,
        hedef_id: k.hedef_id,
        aktor_id: aktor,
      }

    default:
      return null
  }
}

// ---------------------------------------------------------------------
// Alici cikarimi
// ---------------------------------------------------------------------

export type Hedef = {
  /** Bildirimi ALACAK kisi. */
  aliciId: string
  /** Adi metinde gecen ve istemcinin yonlendirmede kullandigi karsi taraf. */
  karsiTarafId: string
}

/**
 * Olaydan aliciyi ve karsi tarafi cikarir.
 *
 * `mesaj` olayinda alici konusmanin DIGER uyesidir ve bu bilgi payload'da
 * yok; cagiran once veritabanindan okuyup `konusmaDigerUyeId` ile verir.
 * Diger dort olayda parametre kullanilmaz.
 *
 * Kurallar (kontrolor karari):
 *   mesaj         -> alici: konusmanin diger uyesi, karsi taraf: gonderen
 *   takip_istegi  -> alici: takip_edilen, karsi taraf: takip_eden
 *   takip_kabul   -> alici: takip_eden (istegi gonderen), karsi taraf: takip_edilen
 *   sohbet_istegi -> alici: hedef,      karsi taraf: gonderen
 *   sohbet_kabul  -> alici: gonderen,   karsi taraf: hedef
 *
 * Saf fonksiyon.
 */
export function hedefiBelirle(olay: Olay, konusmaDigerUyeId: string | null): Hedef | null {
  switch (olay.olay) {
    case 'mesaj':
      if (!konusmaDigerUyeId) return null
      return { aliciId: konusmaDigerUyeId, karsiTarafId: olay.gonderen_id }
    case 'takip_istegi':
      return { aliciId: olay.takip_edilen_id, karsiTarafId: olay.takip_eden_id }
    case 'takip_kabul':
      return { aliciId: olay.takip_eden_id, karsiTarafId: olay.takip_edilen_id }
    case 'sohbet_istegi':
      return { aliciId: olay.hedef_id, karsiTarafId: olay.gonderen_id }
    case 'sohbet_kabul':
      return { aliciId: olay.gonderen_id, karsiTarafId: olay.hedef_id }
  }
}

/**
 * Oz-bildirim kurali: kisi kendi eyleminin bildirimini almamali.
 *
 * Somut vaka: karsilikli takipte kabul eden tarafin ayna gecisi, kabul
 * edenin kendisini `takip_eden_id` yapiyor - o gecis icin alici == aktor
 * olur ve bildirim susmalidir.
 *
 * `aktorId` null ise (service role ya da dogrudan SQL yazmasi) aktor
 * bilinmiyordur; bu durumda gonderilir.
 *
 * Saf fonksiyon.
 */
export function ozBildirimMi(aliciId: string, aktorId: string | null): boolean {
  return aktorId !== null && aktorId === aliciId
}

// ---------------------------------------------------------------------
// Metinler (karar 48: icerik yok, yalnizca ad)
// ---------------------------------------------------------------------

/** Profili okunamayan/olmayan kisi icin notr karsilik. */
export const VARSAYILAN_AD = 'Biri'

/**
 * Bildirim govdesini uretir. Mesaj olayinda bile mesajin KENDISI gecmez;
 * kilit ekranina yalnizca "kim" duser.
 *
 * Saf fonksiyon.
 */
export function bildirimGovdesi(olay: Olay['olay'], ad: string): string {
  switch (olay) {
    case 'mesaj':
      return `${ad} sana mesaj gonderdi`
    case 'takip_istegi':
      return `${ad} seni takip etmek istiyor`
    case 'takip_kabul':
      return `${ad} takip istegini kabul etti`
    case 'sohbet_istegi':
      return `${ad} sana sohbet istegi gonderdi`
    case 'sohbet_kabul':
      return `${ad} sohbet istegini kabul etti`
  }
}

// ---------------------------------------------------------------------
// Sir dogrulama
// ---------------------------------------------------------------------

// Sir modul kapsaminda onbellekleniyor: her istekte veritabanina gitmek
// bildirim yolunu gereksiz yavaslatir ve pg_net'in sirali kuyrugunda
// birikmeye yol acar. Onbellek fonksiyon ornegi yasadigi surece durur.
let sirOnbellek: string | null = null
let sonSirOkumasi = 0

// Eslesmeyen bir sir gorulunce onbellek en fazla bu araliga bir kez
// tazeleniyor. Iki sey birden gerekiyordu: (a) sir Vault'ta donduruldugunde
// fonksiyon yeniden dagitilmadan kendini toparlayabilsin, (b) rastgele
// baslikla gelen bir saldirgan her istekte bir veritabani cagrisi
// tetikleyemesin.
const SIR_TAZELEME_ARALIGI_MS = 60_000

async function siriOku(yonetici: SupabaseClient, tazele: boolean): Promise<string | null> {
  const simdi = Date.now()
  if (sirOnbellek !== null && !tazele) return sirOnbellek
  if (tazele && simdi - sonSirOkumasi < SIR_TAZELEME_ARALIGI_MS) return sirOnbellek

  const { data, error } = await yonetici.rpc('bildirim_siri_oku')
  sonSirOkumasi = simdi

  if (error) {
    // Hata METNI basilmiyor: cagri baglami sirri tasiyabilir.
    console.error('bildirim-gonder: sir okunamadi', { kod: error.code })
    return sirOnbellek
  }

  sirOnbellek = typeof data === 'string' && data.length > 0 ? data : null
  return sirOnbellek
}

/** Uzunluk sizdirmayan sabit-zamanli karsilastirma. */
function esitSir(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let fark = 0
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return fark === 0
}

// ---------------------------------------------------------------------
// Veritabani okumalari (service role; RLS atlanir)
// ---------------------------------------------------------------------

/** Birebir konusmada gonderen disindaki tek uye. */
async function konusmaDigerUyesi(
  yonetici: SupabaseClient,
  konusmaId: string,
  gonderenId: string
): Promise<string | null> {
  const { data, error } = await yonetici
    .from('konusma_uyeleri')
    .select('kullanici_id')
    .eq('konusma_id', konusmaId)
    .neq('kullanici_id', gonderenId)
    .limit(1)

  if (error) {
    console.error('bildirim-gonder: konusma uyesi okunamadi', { kod: error.code })
    return null
  }
  return (data?.[0]?.kullanici_id as string | undefined) ?? null
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

/** Expo'nun "bu jeton artik gecerli degil" dedigi kayitlari temizler. */
async function olecekJetonlariSil(yonetici: SupabaseClient, jetonlar: string[]): Promise<void> {
  if (jetonlar.length === 0) return
  const { error } = await yonetici.from('bildirim_jetonlari').delete().in('jeton', jetonlar)
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

  // 2) Govde.
  let ham: unknown
  try {
    ham = await req.json()
  } catch {
    return yanit(400, { hata: 'govde cozulemedi' })
  }

  const olay = govdeyiCozumle(ham)
  if (!olay) return yanit(400, { hata: 'gecersiz olay' })

  // 3) Alici.
  const digerUye =
    olay.olay === 'mesaj'
      ? await konusmaDigerUyesi(yonetici, olay.konusma_id, olay.gonderen_id)
      : null

  const hedef = hedefiBelirle(olay, digerUye)
  if (!hedef) {
    console.log('bildirim-gonder: alici bulunamadi', { olay: olay.olay })
    return yanit(200, { gonderildi: 0, neden: 'alici yok' })
  }

  if (ozBildirimMi(hedef.aliciId, olay.aktor_id)) {
    console.log('bildirim-gonder: oz-bildirim atlandi', { olay: olay.olay, alici: hedef.aliciId })
    return yanit(200, { gonderildi: 0, neden: 'oz-bildirim' })
  }

  // 4) Jetonlar.
  const jetonlar = await jetonlariOku(yonetici, hedef.aliciId)
  if (jetonlar.length === 0) {
    console.log('bildirim-gonder: jeton yok', { olay: olay.olay, alici: hedef.aliciId })
    return yanit(200, { gonderildi: 0, neden: 'jeton yok' })
  }

  // 5) Metin ve gonderim.
  const ad = await adiOku(yonetici, hedef.karsiTarafId)
  const govde = bildirimGovdesi(olay.olay, ad)
  const { hata, olu } = await expoyaGonder(jetonlar, govde, {
    tur: olay.olay,
    kullaniciId: hedef.karsiTarafId,
  })

  await olecekJetonlariSil(yonetici, olu)

  console.log('bildirim-gonder: tamam', {
    olay: olay.olay,
    alici: hedef.aliciId,
    jeton: jetonlar.length,
    olu: olu.length,
    hata,
  })

  if (hata) return yanit(500, { gonderildi: jetonlar.length - olu.length, hata: 'kismi basarisizlik' })
  return yanit(200, { gonderildi: jetonlar.length - olu.length, olu: olu.length })
})
