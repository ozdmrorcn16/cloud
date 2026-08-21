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
      return [{ aliciId: olay.takip_edilen_id, karsiTarafId: olay.takip_eden_id }]
    case 'takip_kabul':
      return [{ aliciId: olay.takip_eden_id, karsiTarafId: olay.takip_edilen_id }]
    case 'sohbet_istegi':
      return [{ aliciId: olay.hedef_id, karsiTarafId: olay.gonderen_id }]
    case 'sohbet_kabul':
      return [{ aliciId: olay.gonderen_id, karsiTarafId: olay.hedef_id }]
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
