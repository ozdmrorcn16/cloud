import { dosyayiOku } from './dosya-oku'
import { hataMetni } from './hata-metni'
import { supabase } from './supabase'

/**
 * MEKAN DUZENLEME TALEBI - kullanicinin istegi (2026-09-09):
 * "konumlara duzenleme talebi gonder ekle; talebe basan kisi konum
 * ismi, adresi, kapak fotografi, turunu secebilsin, moderatore
 * talebini gondersin."
 *
 * NEDEN GEREKLI: dis kaynakli mekanlarin turu guvenilir degil ve bu
 * OLCULDU - Bursa'daki 6.105 "Kafe" kaydinin 5.992'si Foursquare'in
 * tek bir genel "Café" kategorisinden geliyor; ayni kategoride pub,
 * yurt kantini ve waffle'ci var. Ad kalibiyla duzeltmek yanlis
 * sonuc uretiyor. Orada bulunan insan hepsinden iyi biliyor.
 *
 * TALEP DOGRUDAN UYGULANMIYOR: moderator onaylayana kadar mekan kaydi
 * degismiyor. Kural sunucuda (`mekan_duzenleme_talebi_gonder`), yani
 * istemci atlayamiyor.
 */

/** Bir alanin en fazla uzunlugu; sunucudaki kisitlarla AYNI olmali. */
export const AD_EN_FAZLA = 120
export const ADRES_EN_FAZLA = 200
export const MAHALLE_EN_FAZLA = 80
export const IL_ILCE_EN_FAZLA = 40

export type DuzenlemeTalebi = {
  ad?: string | null
  /**
   * MAHALLE (2026-09-09). `mekanlar.mahalle` sutunu 2026-08-31'de
   * TURETILMIS veri oldugu icin dusuruImustu; buradaki mahalle
   * turetilmiyor - orada bulunan kisi yaziyor, moderator onayliyor.
   */
  mahalle?: string | null
  adres?: string | null
  il?: string | null
  ilce?: string | null
  tur?: string | null
  /** Storage yolu; `mekanFotografiYukle` donduruyor. */
  fotograf?: string | null
  /**
   * "BURASI KALICI OLARAK KAPANDI" (2026-09-11).
   *
   * Kullanicinin sorusu: "kapali, gercekte olmayan yerler var, bunlari
   * tespit etmek mumkun mu?" OTOMATIK tespit olculdu ve elendi -
   * Foursquare'in `date_closed` alani indirme sirasinda zaten
   * filtrelenmis, elimizdeki tek dolayli sinyal olan `date_refreshed`
   * ise zayif (%61'i 2020 oncesi; "guncellenmemis" ile "kapandi" ayni
   * sey degil). Orada bulunan kisi bunu her sinyalden iyi biliyor.
   *
   * Tek basina da gonderilebiliyor: digerleri gibi "en az bir alan"
   * sartini karsiliyor.
   */
  kapali?: boolean
}

/**
 * Fotografi kovaya yukler ve YOLUNU dondurur.
 *
 * Dosya kisinin KENDI klasorune giriyor: hem storage politikasi hem
 * de talep RPC'si bunu ayrica dogruluyor - baskasinin yukledigi bir
 * dosyayi kendi talebine iliştirmek mumkun olmamali.
 */
export async function mekanFotografiYukle(
  kullaniciId: string,
  yerelUri: string
): Promise<string> {
  const baytlar = await dosyayiOku(yerelUri)
  const yol = `${kullaniciId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('mekan-fotograflari')
    .upload(yol, baytlar, { contentType: 'image/jpeg' })
  if (error) throw error
  return data.path
}

/**
 * Onaylanmis kapak fotografinin adresi.
 *
 * Kova private: genel URL ise yaramiyor, imzali adres gerekiyor
 * (ayni tuzak profil fotografinda yasanmisti). Imzalama basarisiz
 * olursa null doner ve ekran fotografsiz cizer.
 */
export async function mekanFotografiUrl(yol: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('mekan-fotograflari')
    .createSignedUrl(yol, 60 * 60)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function duzenlemeTalebiGonder(
  mekanId: string,
  talep: DuzenlemeTalebi
): Promise<string> {
  const { data, error } = await supabase.rpc('mekan_duzenleme_talebi_gonder', {
    p_mekan_id: mekanId,
    p_ad: talep.ad?.slice(0, AD_EN_FAZLA) ?? null,
    p_adres: talep.adres?.slice(0, ADRES_EN_FAZLA) ?? null,
    p_tur: talep.tur ?? null,
    p_fotograf: talep.fotograf ?? null,
    p_mahalle: talep.mahalle?.slice(0, MAHALLE_EN_FAZLA) ?? null,
    p_il: talep.il?.slice(0, IL_ILCE_EN_FAZLA) ?? null,
    p_ilce: talep.ilce?.slice(0, IL_ILCE_EN_FAZLA) ?? null,
    p_kapali: talep.kapali ?? false,
  })
  if (error) throw new Error(hataMetni(error))
  return data as string
}

/**
 * Bu mekan icin BEKLEYEN bir talebim var mi?
 *
 * Ekran bunu bilmek zorunda: sunucu ikinci talebi reddediyor ve
 * kullaniciya formu doldurtup sonunda hata gostermek "bosa is
 * yaptirma" kuralina aykiri olurdu.
 */
export async function bekleyenTalebimVarMi(mekanId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('mekan_duzenleme_talepleri')
    .select('id')
    .eq('mekan_id', mekanId)
    .eq('durum', 'beklemede')
    .limit(1)
  if (error) return false
  return (data ?? []).length > 0
}
