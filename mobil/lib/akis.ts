import { supabase } from './supabase'
import { takipcilerimiGetir } from './bag-listeleri'
import { checkInFotografiUrlHaritasi, profilFotografiUrlHaritasi } from './fotograf-url'
import type { AniGorunumu } from './checkin'
import { hataMetni } from './hata-metni'
import { etiketleriGetir, type Etiket } from './etiket'
import { kimligiZorunluOku } from './kimlik'

/**
 * Ana sayfa akisi.
 *
 * Akista iki kaynak var: kullanicinin KENDI check-in'leri ve karsilikli
 * bag kurdugu kisilerin check-in'leri. Ikisi tek listede, en yeniden
 * eskiye dogru.
 *
 * Gorunurluk burada YENIDEN HESAPLANMAZ. `check_inler` uzerindeki RLS
 * politikasi zaten kimin neyi gorebilecegine karar veriyor (gizli
 * check-in, ani gorunurlugu, engelleme, askidaki hesap, moderasyon
 * gizlemesi). Bu modul yalnizca "kimlerin satirlarini istiyorum"
 * sorusunu daraltiyor; sunucu ayrica "gorebilir misin" diye eliyor.
 * Kural olarak: buraya bir gorunurluk kosulu eklemek gerekiyorsa yeri
 * istemci degil, politikadir.
 */

/**
 * Bir ani satirini (kendi check-in'lerim) kartin bekledigi bicime
 * cevirir. Profil onizlemesi ve Anilarim ekrani ayni karti kullaniyor
 * (kullanicinin karari 2026-08-30); cevirici tek yerde dursun.
 */
export function anidanAkisOgesi(
  ani: AniGorunumu,
  secenekler: {
    kullaniciId: string
    avatarUrl: string | null
    rumuz: string | null
    /**
     * Kart kimin? Varsayilan `true` (kendi profil). Baskasinin profili
     * (2026-09-13) ayni karti `false` ile ciziyor: menu (duzenle/sil)
     * gorunmuyor, ad ve avatar o kisinin profiline gidiyor.
     */
    benimMi?: boolean
  }
): AkisOgesi {
  return {
    id: ani.id,
    kullaniciId: secenekler.kullaniciId,
    kullaniciAdi: ani.kullaniciAdi,
    mekanId: ani.mekanId,
    mekanAdi: ani.mekanAdi,
    mekanSemti: ani.mekanSemti,
    notMetni: ani.notMetni,
    ifade: ani.ifade,
    // Eski kayitlarda/testlerde alan eksik olabiliyor; kart dizi bekliyor.
    fotograflar: ani.fotograflar ?? [],
    fotografUrller: ani.fotografUrller ?? [],
    olusturmaZamani: ani.olusturmaZamani,
    canliMi: ani.canliMi,
    benimMi: secenekler.benimMi ?? true,
    // Eski kayitlarda/testlerde alan eksik olabiliyor; kart bos liste bekliyor.
    etiketler: ani.etiketler ?? [],
    avatarUrl: secenekler.avatarUrl,
    rumuz: secenekler.rumuz,
  }
}

export type AkisOgesi = {
  id: string
  kullaniciId: string
  /** check_inler'de denormalize duran AD (karar #18); bas harf bundan. */
  kullaniciAdi: string | null
  /**
   * KULLANICI ADI ("byorcun"). Kartta kalin yazilan bu (kullanicinin
   * karari 2026-08-30: kartta kullanici adi, bildirimde ad-soyad).
   * `akis_profilleri` RPC'sinden geliyor; okunamazsa null ve kart
   * ada duser.
   */
  rumuz: string | null
  mekanId: string
  mekanAdi: string
  /** Mekanin semti; zaman tunelindeki alt satirda kullaniliyor. */
  mekanSemti: string | null
  notMetni: string | null
  /** Check-in'de secilen ifade slug'i (lib/ifadeler.ts); yoksa null. */
  ifade: string | null
  /** Kovadaki yollar (duzenleme sayfasi "kalanlar"i bununla bildirir). */
  fotograflar: string[]
  /** Imzalanmis adresler, `fotograflar` sirasiyla; imzalanamayan atlanir. */
  fotografUrller: string[]
  olusturmaZamani: string
  /** Konum sutunu doluysa kisi su an orada. */
  canliMi: boolean
  benimMi: boolean
  /** Bu check-in'de etiketlenen arkadaslar. */
  etiketler: Etiket[]
  /**
   * Kaydi atan kisinin GUNCEL profil fotografi; yoksa null.
   *
   * Kullanicinin karari (2026-08-28): akista kimin kaydiysa onun
   * profil resmi gorunur, fotografi yoksa ADININ bas harfi. Yol
   * `profil_fotograflari` RPC'sinden geliyor - `profiller` tablosu
   * yalnizca kendi satirini okumaya izin verdigi icin dogrudan
   * okunamiyor. Engelleme o RPC'de iki yonlu kesiliyor.
   */
  avatarUrl: string | null
}

type AkisSatiri = {
  id: string
  kullanici_id: string
  kullanici_adi: string | null
  mekan_id: string
  not_metni: string | null
  ifade: string | null
  fotograflar: string[] | null
  olusturma_zamani: string
  konum: string | null
  mekanlar: { ad: string; semt: string | null } | null
}

export const AKIS_SAYFA_BOYU = 30

/**
 * Akisin bir SAYFASI.
 *
 * `oncesi` verilirse yalnizca o andan eski kayitlar gelir - sayfalama
 * imleci budur. Imlec OFFSET degil ZAMAN: `range` ile sayfalarken iki
 * istek arasinda yeni bir check-in eklenirse pencere bir satir kayar
 * ve ayni kayit iki kez gelir ya da bir kayit hic gelmez. Zaman imleci
 * sabit bir noktadan geriye bakiyor, akis buyudukce kaymiyor.
 */
export async function akisiGetir(
  adet: number = AKIS_SAYFA_BOYU,
  oncesi?: string
): Promise<AkisOgesi[]> {
  const benimId = await kimligiZorunluOku()

  const baglar = await takipcilerimiGetir()
  const kimlikler = [benimId, ...baglar.map((k) => k.id)]

  let sorgu = supabase
    .from('check_inler')
    .select(
      'id, kullanici_id, kullanici_adi, mekan_id, not_metni, ifade, fotograflar, olusturma_zamani, konum, mekanlar(ad, semt)'
    )
    .in('kullanici_id', kimlikler)
  if (oncesi) sorgu = sorgu.lt('olusturma_zamani', oncesi)

  const { data, error } = await sorgu
    .order('olusturma_zamani', { ascending: false })
    .limit(adet)
  if (error) throw new Error(hataMetni(error))

  const satirlar = data as unknown as AkisSatiri[]

  // UCU BIRDEN PARALEL (2026-09-22 performans turu): etiketler, profil
  // ozetleri ve imzali adresler birbirini beklemiyor. Onceden `await`
  // zinciriyle siralı gidiyorlardi, yani akis uc gidis-donus daha
  // bekliyordu. Her biri kendi `catch`ine sahip: biri okunamazsa akis
  // yine ciziliyor (etiket yuzunden butun akisi kaybetmek yanlis olur).
  const [etiketler, ozetler, urlHaritasi] = await Promise.all([
    // Etiketler TEK SORGUDA: satir basina sorgu atmak 30 gidis-donus demekti.
    etiketleriGetir(satirlar.map((s) => s.id)).catch(() => ({}) as Record<string, Etiket[]>),
    // Profil ozetleri (kullanici adi + avatar) TEK CAGRIDA, kisi basina
    // bir kere - ayni kisinin birden fazla kaydi olabilir.
    profilOzetleriniGetir([...new Set(satirlar.map((s) => s.kullanici_id))]).catch(
      () => ({}) as Record<string, ProfilOzeti>
    ),
    // Butun fotograflar TEK imza istegiyle (coklu fotograf, 2026-09-21).
    checkInFotografiUrlHaritasi(satirlar.flatMap((s) => s.fotograflar ?? [])),
  ])

  return Promise.all(
    satirlar.map(async (satir) => ({
      id: satir.id,
      kullaniciId: satir.kullanici_id,
      kullaniciAdi: satir.kullanici_adi,
      mekanId: satir.mekan_id,
      // Mekan satiri okunamazsa (silinmis ya da gizlenmis) akis ogesi
      // yine de gosterilir; adsiz bir satir, kaybolan bir satirdan iyidir.
      mekanAdi: satir.mekanlar?.ad ?? '',
      mekanSemti: satir.mekanlar?.semt ?? null,
      notMetni: satir.not_metni,
      ifade: satir.ifade ?? null,
      fotograflar: satir.fotograflar ?? [],
      fotografUrller: (satir.fotograflar ?? []).map((y) => urlHaritasi[y]).filter((u): u is string => Boolean(u)),
      olusturmaZamani: satir.olusturma_zamani,
      canliMi: satir.konum !== null,
      benimMi: satir.kullanici_id === benimId,
      etiketler: etiketler[satir.id] ?? [],
      avatarUrl: ozetler[satir.kullanici_id]?.avatarUrl ?? null,
      rumuz: ozetler[satir.kullanici_id]?.rumuz ?? null,
    }))
  )
}

export type ProfilOzeti = {
  /** Kullanici adi ("byorcun"). */
  rumuz: string
  ad: string
  /** Imzalanmis guncel profil fotografi; yoksa null. */
  avatarUrl: string | null
}

/**
 * Kimlik -> kullanici adi, ad ve imzalanmis profil fotografi.
 *
 * `akis_profilleri` RPC'si (2026-08-30): engellenen ya da askidaki
 * kisi sonucta HIC gorunmuyor; cagiran taraf bunu "bilgi yok" diye
 * okuyup ada ve bas harfe duser. Okuma basarisiz olursa akis yine
 * ciziliyor - ozet yuzunden butun akisi kaybetmek yanlis olur.
 *
 * Disari acik: bildirim ekrani da ayni yardimciyla avatar cekiyor,
 * boylece "kim gorunur" kurali tek yerde (RPC) kaliyor.
 */
/**
 * RPC tek cagrida en fazla bu kadar kimlik kabul ediyor (sunucuda
 * `Cok fazla kimlik istendi`). Ustunde parcalanip paralel soruluyor -
 * 200'den fazla arkadasi olan birinin listesi bastan hata veriyordu
 * (2026-09-22 olcumu).
 */
const KIMLIK_SINIRI = 200

export async function profilOzetleriniGetir(
  kimlikler: string[],
  secenekler: { hatayiFirlat?: boolean } = {}
): Promise<Record<string, ProfilOzeti>> {
  if (kimlikler.length === 0) return {}

  // 200'luk dilimler PARALEL; tek dilimde ekstra is yok.
  if (kimlikler.length > KIMLIK_SINIRI) {
    const dilimler: string[][] = []
    for (let i = 0; i < kimlikler.length; i += KIMLIK_SINIRI) {
      dilimler.push(kimlikler.slice(i, i + KIMLIK_SINIRI))
    }
    const parcalar = await Promise.all(dilimler.map((d) => profilOzetleriniGetir(d, secenekler)))
    return Object.assign({}, ...parcalar)
  }

  const { data, error } = await supabase.rpc('akis_profilleri', {
    p_kimlikler: kimlikler,
  })
  if (error) {
    // Varsayilan SESSIZ: akis ozet olmadan da cizilmeli. Bag listeleri
    // ise ozetin KENDISI oldugu icin hatayi gormek zorunda - bos liste
    // "kimse yok" gibi okunur ve yalan soyler.
    if (secenekler.hatayiFirlat) throw new Error(hataMetni(error))
    return {}
  }

  const satirlar = (data ?? []) as {
    id: string
    kullanici_adi: string
    ad: string
    fotograf: string | null
  }[]
  // Avatarlar TEK istekte imzalaniyor (2026-09-22 performans olcumu):
  // onceden kisi basina bir `createSignedUrl` gidiyordu ve ayni avatar
  // ekranda bes kez imzalaniyordu.
  const urller = await profilFotografiUrlHaritasi(
    satirlar.map((s) => s.fotograf).filter((f): f is string => Boolean(f))
  )
  const eslesme: Record<string, ProfilOzeti> = {}
  for (const s of satirlar) {
    eslesme[s.id] = {
      rumuz: s.kullanici_adi,
      ad: s.ad,
      avatarUrl: s.fotograf ? (urller[s.fotograf] ?? null) : null,
    }
  }
  return eslesme
}

/** Yalnizca avatar adresleri (bildirim ekrani). */
export async function avatarlariGetir(kimlikler: string[]): Promise<Record<string, string | null>> {
  const ozetler = await profilOzetleriniGetir(kimlikler)
  return Object.fromEntries(Object.entries(ozetler).map(([id, o]) => [id, o.avatarUrl]))
}

/**
 * Galeriler icin FOTOGRAF BIRIMI (coklu fotograf, 2026-09-21): profil
 * izgarasi, baskasinin profili ve gezgin "ani" degil "fotograf" sayar.
 * Iki fotografli bir ani iki birimdir; sira: anilar sirasi, ani icinde
 * fotograf sirasi.
 */
export type FotografBirimi<T> = { id: string; ani: T; indeks: number; url: string }

export function fotografBirimleri<T extends { id: string; fotografUrller: string[] }>(
  anilar: T[]
): FotografBirimi<T>[] {
  return anilar.flatMap((ani) =>
    (ani.fotografUrller ?? []).map((url, indeks) => ({ id: `${ani.id}-${indeks}`, ani, indeks, url }))
  )
}

/**
 * TEK PAYLASIM (Paylasim ekrani, 2026-09-22): bildirimden acilan
 * check-in. Akisla ayni alanlar, ayni donusum; RLS gormeye izin
 * vermiyorsa (silinmis, gizlenmis, arkadaslik kopmus) null doner.
 */
export async function checkInGetir(id: string): Promise<AkisOgesi | null> {
  const benimId = await kimligiZorunluOku()

  const { data, error } = await supabase
    .from('check_inler')
    .select(
      'id, kullanici_id, kullanici_adi, mekan_id, not_metni, ifade, fotograflar, olusturma_zamani, konum, mekanlar(ad, semt)'
    )
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  if (!data) return null

  const satir = data as unknown as AkisSatiri
  const [etiketler, ozetler, urlHaritasi] = await Promise.all([
    etiketleriGetir([satir.id]).catch(() => ({}) as Record<string, Etiket[]>),
    profilOzetleriniGetir([satir.kullanici_id]).catch(() => ({}) as Record<string, ProfilOzeti>),
    checkInFotografiUrlHaritasi(satir.fotograflar ?? []),
  ])
  return {
    id: satir.id,
    kullaniciId: satir.kullanici_id,
    kullaniciAdi: satir.kullanici_adi,
    mekanId: satir.mekan_id,
    mekanAdi: satir.mekanlar?.ad ?? '',
    mekanSemti: satir.mekanlar?.semt ?? null,
    notMetni: satir.not_metni,
    ifade: satir.ifade ?? null,
    fotograflar: satir.fotograflar ?? [],
    fotografUrller: (satir.fotograflar ?? []).map((y) => urlHaritasi[y]).filter((u): u is string => Boolean(u)),
    olusturmaZamani: satir.olusturma_zamani,
    canliMi: satir.konum !== null,
    benimMi: satir.kullanici_id === benimId,
    etiketler: etiketler[satir.id] ?? [],
    avatarUrl: ozetler[satir.kullanici_id]?.avatarUrl ?? null,
    rumuz: ozetler[satir.kullanici_id]?.rumuz ?? null,
  }
}
