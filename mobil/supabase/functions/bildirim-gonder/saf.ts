// Bildirimler Task 3: "bildirim-gonder" fonksiyonunun SAF mantigi.
//
// Neden ayri dosya: `index.ts` yuklendigi anda `Deno.serve` cagiriyor,
// yani onu import eden bir test bir sunucu ayaga kaldirirdi. Sozlesme
// cozumleme, alici cikarimi, oz-bildirim kurali ve metin uretimi
// veritabanina da aga da dokunmuyor; buraya alinip `index_test.ts`
// tarafindan dogrudan test ediliyor.
//
// Buraya YALNIZCA saf kod girer. Veritabani okuyan her sey (ozellikle
// `kaynakDogrula`) `index.ts` icinde kalir.

// ---------------------------------------------------------------------
// Olay sozlesmesi (bildirim.olay_gonder'in urettigi yedi bicim)
// ---------------------------------------------------------------------

export type Olay =
  | { olay: 'mesaj'; mesaj_id: string; konusma_id: string; gonderen_id: string; aktor_id: string | null }
  | { olay: 'takip_istegi'; takip_eden_id: string; takip_edilen_id: string; aktor_id: string | null }
  | { olay: 'takip_kabul'; takip_eden_id: string; takip_edilen_id: string; aktor_id: string | null }
  // DOGRUDAN EKLEME (2026-09-18): acik profilde "Arkadas ekle" istek
  // gondermez, bagi hemen kurar; eklenen kisiye bu olay gider.
  | { olay: 'takip_eklendi'; takip_eden_id: string; takip_edilen_id: string; aktor_id: string | null }
  | { olay: 'sohbet_istegi'; gonderen_id: string; hedef_id: string; aktor_id: string | null }
  | { olay: 'sohbet_kabul'; gonderen_id: string; hedef_id: string; aktor_id: string | null }
  // ETIKET (kullanicinin istegi 2026-09-06). Iki ayri olay, cunku
  // metin farkli: onay bekleyen etiket bir ISTEK, onaylanmis olan
  // bir BILGI. Ikisini tek olay yapip metni durumdan turetmek
  // Edge Function'a is dusururdu; sozlesme zaten olay adiyla
  // ayriliyor.
  | {
      olay: 'etiket_istegi'
      check_in_id: string
      etiketlenen_id: string
      etiketleyen_id: string
      aktor_id: string | null
    }
  | {
      olay: 'etiket_eklendi'
      check_in_id: string
      etiketlenen_id: string
      etiketleyen_id: string
      aktor_id: string | null
    }
  // ANI HATIRLATMASI (2026-09-19): gunluk cron, "bir yil once bugun".
  // Aktor yok; alici check-in'in sahibi. Metin mekan adiyla kurulur.
  | { olay: 'ani_hatirlatma'; kullanici_id: string; check_in_id: string; aktor_id: string | null }

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
 * Bu YALNIZCA bicim dogrulamasi - olayin gercekten olup olmadigini
 * `kaynakDogrula` soruyor.
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
    case 'takip_eklendi':
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

    case 'etiket_istegi':
    case 'etiket_eklendi':
      if (
        !uuidMi(k.check_in_id) ||
        !uuidMi(k.etiketlenen_id) ||
        !uuidMi(k.etiketleyen_id)
      ) {
        return null
      }
      return {
        olay: k.olay,
        check_in_id: k.check_in_id,
        etiketlenen_id: k.etiketlenen_id,
        etiketleyen_id: k.etiketleyen_id,
        aktor_id: aktor,
      }

    case 'ani_hatirlatma':
      if (!uuidMi(k.kullanici_id) || !uuidMi(k.check_in_id)) return null
      return { olay: 'ani_hatirlatma', kullanici_id: k.kullanici_id, check_in_id: k.check_in_id, aktor_id: aktor }

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
 * Olaydan alicilari ve karsi tarafi cikarir.
 *
 * `mesaj` olayinda alici konusmanin DIGER uyeleridir ve bu bilgi
 * payload'da yok; cagiran once veritabanindan okuyup
 * `konusmaDigerUyeleri` ile verir. Bugun konusmalar birebir, yani liste
 * tek elemanli; grup konusmasi gelirse ayni kod dogru calisir. Diger
 * dort olayda parametre kullanilmaz.
 *
 * Kurallar (kontrolor karari):
 *   mesaj         -> alici: konusmanin diger uyeleri, karsi taraf: gonderen
 *   takip_istegi  -> alici: takip_edilen, karsi taraf: takip_eden
 *   takip_kabul   -> alici: takip_eden (istegi gonderen), karsi taraf: takip_edilen
 *   takip_eklendi -> alici: takip_edilen (eklenen), karsi taraf: takip_eden (ekleyen)
 *   sohbet_istegi -> alici: hedef,      karsi taraf: gonderen
 *   sohbet_kabul  -> alici: gonderen,   karsi taraf: hedef
 *
 * Saf fonksiyon.
 */
export function hedefleriBelirle(olay: Olay, konusmaDigerUyeleri: string[]): Hedef[] {
  switch (olay.olay) {
    case 'mesaj':
      return konusmaDigerUyeleri.map((uye) => ({ aliciId: uye, karsiTarafId: olay.gonderen_id }))
    case 'takip_istegi':
    case 'takip_eklendi':
      return [{ aliciId: olay.takip_edilen_id, karsiTarafId: olay.takip_eden_id }]
    case 'takip_kabul':
      return [{ aliciId: olay.takip_eden_id, karsiTarafId: olay.takip_edilen_id }]
    case 'sohbet_istegi':
      return [{ aliciId: olay.hedef_id, karsiTarafId: olay.gonderen_id }]
    case 'sohbet_kabul':
      return [{ aliciId: olay.gonderen_id, karsiTarafId: olay.hedef_id }]
    case 'etiket_istegi':
    case 'etiket_eklendi':
      return [{ aliciId: olay.etiketlenen_id, karsiTarafId: olay.etiketleyen_id }]
    case 'ani_hatirlatma':
      // Karsi taraf yok; ad yerine mekan adi yazilir (index.ts).
      return [{ aliciId: olay.kullanici_id, karsiTarafId: olay.kullanici_id }]
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
      return `${ad} sana mesaj gönderdi`
    case 'takip_istegi':
      return `${ad} sana arkadaşlık isteği gönderdi`
    case 'takip_kabul':
      return `${ad} arkadaşlık isteğini kabul etti`
    case 'takip_eklendi':
      return `${ad} seni arkadaş olarak ekledi`
    case 'sohbet_istegi':
      return `${ad} sana sohbet isteği gönderdi`
    case 'sohbet_kabul':
      return `${ad} sohbet isteğini kabul etti`
    case 'etiket_istegi':
      return `${ad} seni etiketlemek istiyor`
    case 'etiket_eklendi':
      return `${ad} seni bir check-in'de etiketledi`
    case 'ani_hatirlatma':
      // `ad` burada MEKAN ADI. Bulunma eki YOK (2026-09-13 karari: ek
      // uretimi tutturulamiyor) - iki nokta ile.
      return `Bir yıl önce bugün: ${ad}`
  }
}

// ---------------------------------------------------------------------
// Bildirim tercihleri (2026-09-18; 2026-09-19 referans ekranla genisledi)
// ---------------------------------------------------------------------

export type BildirimTercihleri = {
  /** Ana anahtar: kapaliysa HICBIR push gitmez. */
  bildirim_anlik: boolean
  bildirim_mesaj: boolean
  bildirim_arkadas: boolean
  bildirim_ani: boolean
  bildirim_ani_hatirlatma: boolean
  sessiz_gece: boolean
  /** IANA saat dilimi (Europe/Istanbul); istemci yazar. Yoksa Europe/Istanbul. */
  saat_dilimi: string | null
}

/**
 * Olayin hangi tercih anahtarina bagli oldugu (referans ekran):
 *   mesaj, sohbet_* ("Mesajlar - yeni mesajlar ve mesaj istekleri") -> bildirim_mesaj
 *   takip_* ("Arkadaslik istekleri")                                 -> bildirim_arkadas
 *   etiket_* ("Etiketler - istek ve onaylar")                        -> bildirim_ani
 *   ani_hatirlatma                                                   -> bildirim_ani_hatirlatma
 * Saf fonksiyon.
 */
export function tercihAnahtari(olay: Olay['olay']): keyof BildirimTercihleri {
  switch (olay) {
    case 'mesaj':
    case 'sohbet_istegi':
    case 'sohbet_kabul':
      return 'bildirim_mesaj'
    case 'etiket_istegi':
    case 'etiket_eklendi':
      return 'bildirim_ani'
    case 'ani_hatirlatma':
      return 'bildirim_ani_hatirlatma'
    default:
      return 'bildirim_arkadas'
  }
}

/** Alicinin YEREL saati (0-23); saat dilimi bilinmiyorsa Istanbul. */
export function yerelSaat(saatDilimi: string | null, simdi: Date = new Date()): number {
  const dilim = saatDilimi && saatDilimi.length > 0 ? saatDilimi : 'Europe/Istanbul'
  try {
    const parca = new Intl.DateTimeFormat('en-US', { timeZone: dilim, hour: 'numeric', hour12: false }).formatToParts(simdi)
    const saat = Number(parca.find((p) => p.type === 'hour')?.value ?? '0')
    return saat === 24 ? 0 : saat
  } catch {
    return simdi.getUTCHours()
  }
}

/** Gece sessizi: 22.00-08.00 yerel. */
export function sessizSaatteMi(tercih: BildirimTercihleri, simdi: Date = new Date()): boolean {
  if (!tercih.sessiz_gece) return false
  const saat = yerelSaat(tercih.saat_dilimi, simdi)
  return saat >= 22 || saat < 8
}

/**
 * Tercih okunamadiysa (null) GONDERILIR - varsayilan acik. Sira: ana
 * anahtar -> olayin anahtari -> gece sessizi.
 */
export function gonderilsinMi(olay: Olay['olay'], tercih: BildirimTercihleri | null, simdi: Date = new Date()): boolean {
  if (!tercih) return true
  if (tercih.bildirim_anlik === false) return false
  if (tercih[tercihAnahtari(olay)] === false) return false
  if (sessizSaatteMi(tercih, simdi)) return false
  return true
}
