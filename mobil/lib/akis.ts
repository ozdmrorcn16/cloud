import { supabase } from './supabase'
import { takipcilerimiGetir } from './bag-listeleri'
import { checkInFotografiUrl, profilFotografiUrl } from './fotograf-url'
import type { AniGorunumu } from './checkin'
import { hataMetni } from './hata-metni'
import { etiketleriGetir, type Etiket } from './etiket'

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
  secenekler: { kullaniciId: string; avatarUrl: string | null; rumuz: string | null }
): AkisOgesi {
  return {
    id: ani.id,
    kullaniciId: secenekler.kullaniciId,
    kullaniciAdi: ani.kullaniciAdi,
    mekanId: ani.mekanId,
    mekanAdi: ani.mekanAdi,
    mekanSemti: ani.mekanSemti,
    notMetni: ani.notMetni,
    fotografUrl: ani.fotografUrl,
    olusturmaZamani: ani.olusturmaZamani,
    canliMi: ani.canliMi,
    benimMi: true,
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
  /** Imzalanmis fotograf adresi; fotograf yoksa ya da imzalanamadiysa null. */
  fotografUrl: string | null
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
  fotograf: string | null
  olusturma_zamani: string
  konum: string | null
  mekanlar: { ad: string; semt: string | null } | null
}

export const AKIS_SAYFA_BOYU = 30

export async function akisiGetir(adet: number = AKIS_SAYFA_BOYU): Promise<AkisOgesi[]> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const benimId = kullaniciVerisi.user?.id
  if (!benimId) throw new Error('Oturum bulunamadı')

  const baglar = await takipcilerimiGetir()
  const kimlikler = [benimId, ...baglar.map((k) => k.id)]

  const { data, error } = await supabase
    .from('check_inler')
    .select(
      'id, kullanici_id, kullanici_adi, mekan_id, not_metni, fotograf, olusturma_zamani, konum, mekanlar(ad, semt)'
    )
    .in('kullanici_id', kimlikler)
    .order('olusturma_zamani', { ascending: false })
    .limit(adet)
  if (error) throw new Error(hataMetni(error))

  const satirlar = data as unknown as AkisSatiri[]

  // Etiketler TEK SORGUDA: satir basina sorgu atmak 30 gidis-donus
  // demekti. Etiketler okunamazsa akis yine ciziliyor - etiket
  // yuzunden butun akisi kaybetmek yanlis olur.
  const etiketler: Record<string, Etiket[]> = await etiketleriGetir(
    satirlar.map((s) => s.id)
  ).catch(() => ({}))

  // Profil ozetleri (kullanici adi + avatar) TEK CAGRIDA, kisi basina
  // bir kere - ayni kisinin birden fazla kaydi olabilir.
  const ozetler = await profilOzetleriniGetir([
    ...new Set(satirlar.map((s) => s.kullanici_id)),
  ]).catch(() => ({}) as Record<string, ProfilOzeti>)

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
      fotografUrl: satir.fotograf ? await checkInFotografiUrl(satir.fotograf) : null,
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
export async function profilOzetleriniGetir(
  kimlikler: string[]
): Promise<Record<string, ProfilOzeti>> {
  if (kimlikler.length === 0) return {}

  const { data, error } = await supabase.rpc('akis_profilleri', {
    p_kimlikler: kimlikler,
  })
  if (error) return {}

  const satirlar = (data ?? []) as {
    id: string
    kullanici_adi: string
    ad: string
    fotograf: string | null
  }[]
  const eslesme: Record<string, ProfilOzeti> = {}
  await Promise.all(
    satirlar.map(async (s) => {
      eslesme[s.id] = {
        rumuz: s.kullanici_adi,
        ad: s.ad,
        avatarUrl: s.fotograf ? await profilFotografiUrl(s.fotograf) : null,
      }
    })
  )
  return eslesme
}

/** Yalnizca avatar adresleri (bildirim ekrani). */
export async function avatarlariGetir(kimlikler: string[]): Promise<Record<string, string | null>> {
  const ozetler = await profilOzetleriniGetir(kimlikler)
  return Object.fromEntries(Object.entries(ozetler).map(([id, o]) => [id, o.avatarUrl]))
}
