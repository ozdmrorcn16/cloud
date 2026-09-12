import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { checkInFotografiUrl } from './fotograf-url'

/**
 * MEKAN SAYFASININ VERISI (kullanicinin istegi 2026-09-06).
 *
 * Konum ekrani bir mekan sayfasina donustu: ustte uc sayi, altinda
 * "su an burada" seridi ve iki sekme.
 *
 * IKI REJIM VAR ve bu ayrim sunucuda kuruluyor (migrasyon
 * 20260906120000):
 *
 *   SAYILAR `security definer` - butun check-in'leri sayiyorlar,
 *   cunku bir sayi kimseyi tanimlamiyor. Mevcut yogunluk sayaciyla
 *   ayni sinifta.
 *
 *   KISI LISTELERI `security invoker` - `check_inler` RLS'i aynen
 *   isliyor. Yani listeler cagirana gore DEGISIR: canli bir
 *   check-in'de "herkese acik" bile ancak ayni mekanda canliysan ya da
 *   arkadasinsa gorunuyor.
 *
 * Bu yuzden ustteki sayi ile asagidaki liste UYUSMAYABILIR - ekran bunu
 * "+N diger" ile anlatiyor. Uyusmalari icin listeyi definer yapmak
 * gerekirdi, o da butun gorunurluk modelini delerdi.
 */

export type MekanIstatistikleri = {
  /** Su an orada olan kisi sayisi (canli check-in). */
  suAnKisi: number
  bugunCheckIn: number
  toplamCheckIn: number
  /** Ilcedeki sirasi; ilce bilinmiyorsa ya da hic check-in yoksa null. */
  ilceSirasi: number | null
  /** Ilcede check-in almis mekan sayisi - siranin paydasi. */
  ilceMekanSayisi: number
  ilce: string | null
}

type IstatistikSatiri = {
  su_an_kisi: number
  bugun_check_in: number
  toplam_check_in: number
  ilce_sirasi: number | null
  ilce_mekan_sayisi: number
  ilce: string | null
}

export async function mekanIstatistikleriniGetir(
  mekanId: string
): Promise<MekanIstatistikleri> {
  const { data, error } = await supabase.rpc('mekan_istatistikleri', {
    p_mekan_id: mekanId,
  })
  if (error) throw new Error(hataMetni(error))

  // RPC `returns table` oldugu icin tek satirlik bir dizi doner.
  const satir = (data as IstatistikSatiri[] | null)?.[0]
  if (!satir) {
    return {
      suAnKisi: 0,
      bugunCheckIn: 0,
      toplamCheckIn: 0,
      ilceSirasi: null,
      ilceMekanSayisi: 0,
      ilce: null,
    }
  }
  return {
    suAnKisi: satir.su_an_kisi ?? 0,
    bugunCheckIn: satir.bugun_check_in ?? 0,
    toplamCheckIn: satir.toplam_check_in ?? 0,
    ilceSirasi: satir.ilce_sirasi ?? null,
    ilceMekanSayisi: satir.ilce_mekan_sayisi ?? 0,
    ilce: satir.ilce ?? null,
  }
}

export type LiderlikSatiri = {
  kullaniciId: string
  kullaniciAdi: string | null
  checkInSayisi: number
}

/**
 * Mekanin liderlik tablosu: EN COK CHECK-IN YAPAN 3 KISI.
 *
 * Kullanicinin karari (2026-09-07): "liderlik tablosu en cok o
 * konumda check-in yapan 3 kisi sabit kalir her zaman". Sunucu da
 * ust siniri 3'te kilitliyor, yani buradan daha genis bir liste
 * istenemiyor - sayi iki tarafta da ayni.
 */
export async function mekanLiderligiGetir(
  mekanId: string,
  limit = 3
): Promise<LiderlikSatiri[]> {
  const { data, error } = await supabase.rpc('mekan_liderlik', {
    p_mekan_id: mekanId,
    p_limit: limit,
  })
  if (error) throw new Error(hataMetni(error))
  return (
    (data as { kullanici_id: string; kullanici_adi: string | null; check_in_sayisi: number }[]) ??
    []
  ).map((s) => ({
    kullaniciId: s.kullanici_id,
    kullaniciAdi: s.kullanici_adi,
    checkInSayisi: s.check_in_sayisi,
  }))
}

export type SonCheckIn = {
  id: string
  kullaniciId: string
  kullaniciAdi: string | null
  olusturmaZamani: string
  notMetni: string | null
  /** Hala orada mi, yoksa artik bir ani mi. */
  canliMi: boolean
}

export async function mekanSonCheckInleriGetir(
  mekanId: string,
  limit = 10
): Promise<SonCheckIn[]> {
  const { data, error } = await supabase.rpc('mekan_son_check_inler', {
    p_mekan_id: mekanId,
    p_limit: limit,
  })
  if (error) throw new Error(hataMetni(error))
  return (
    (data as {
      id: string
      kullanici_id: string
      kullanici_adi: string | null
      olusturma_zamani: string
      not_metni: string | null
      canli_mi: boolean
    }[]) ?? []
  ).map((s) => ({
    id: s.id,
    kullaniciId: s.kullanici_id,
    kullaniciAdi: s.kullanici_adi,
    olusturmaZamani: s.olusturma_zamani,
    notMetni: s.not_metni,
    canliMi: s.canli_mi,
  }))
}

export type MekanFotografi = {
  /** Check-in kimligi - galeri anahtari ve tekrar elemesi icin. */
  id: string
  kullaniciId: string
  kullaniciAdi: string | null
  olusturmaZamani: string
  /** Imzali adres; imzalanamayan fotograf listeye HIC girmiyor. */
  url: string
}

/** Galeri sayfa boyu. Sunucu ust siniri 60. */
export const MEKAN_FOTOGRAF_SAYFA = 30

/**
 * MEKANIN FOTOGRAF ALANI (kullanicinin istegi 2026-09-13).
 *
 * O mekanda yapilmis check-in'lerin fotograflari, yeniden eskiye.
 * Dis kaynak YOK - veri check-in'lerden geliyor.
 *
 * RPC `security invoker`: `check_inler` RLS'i aynen isliyor, yani
 * kisi ancak zaten gorebildigi check-in'in fotografini alir. Kova
 * politikasi da ayni satira bagli oldugu icin imzalama da ayni kapidan
 * geciyor; imzalanamayan bir dosya (nadir bir yaris durumu) sessizce
 * atlanir - kirik resim gostermektense hic gostermemek dogru.
 */
export async function mekanFotograflariniGetir(
  mekanId: string,
  ofset = 0,
  limit = MEKAN_FOTOGRAF_SAYFA
): Promise<MekanFotografi[]> {
  const { data, error } = await supabase.rpc('mekan_fotograflari', {
    p_mekan_id: mekanId,
    p_limit: limit,
    p_ofset: ofset,
  })
  if (error) throw new Error(hataMetni(error))

  const satirlar =
    (data as {
      id: string
      kullanici_id: string
      kullanici_adi: string | null
      olusturma_zamani: string
      fotograf: string
    }[]) ?? []

  const imzali = await Promise.all(
    satirlar.map(async (s) => ({ satir: s, url: await checkInFotografiUrl(s.fotograf) }))
  )
  return imzali
    .filter((x): x is { satir: (typeof satirlar)[number]; url: string } => x.url !== null)
    .map(({ satir, url }) => ({
      id: satir.id,
      kullaniciId: satir.kullanici_id,
      kullaniciAdi: satir.kullanici_adi,
      olusturmaZamani: satir.olusturma_zamani,
      url,
    }))
}
