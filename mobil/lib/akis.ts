import { supabase } from './supabase'
import { takipcilerimiGetir } from './bag-listeleri'
import { checkInFotografiUrl } from './fotograf-url'

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

export type AkisOgesi = {
  id: string
  kullaniciId: string
  /** check_inler'de denormalize duran ad (karar #18). */
  kullaniciAdi: string | null
  mekanId: string
  mekanAdi: string
  notMetni: string | null
  /** Imzalanmis fotograf adresi; fotograf yoksa ya da imzalanamadiysa null. */
  fotografUrl: string | null
  olusturmaZamani: string
  /** Konum sutunu doluysa kisi su an orada. */
  canliMi: boolean
  benimMi: boolean
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
  mekanlar: { ad: string } | null
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
      'id, kullanici_id, kullanici_adi, mekan_id, not_metni, fotograf, olusturma_zamani, konum, mekanlar(ad)'
    )
    .in('kullanici_id', kimlikler)
    .order('olusturma_zamani', { ascending: false })
    .limit(adet)
  if (error) throw new Error(error.message)

  const satirlar = data as unknown as AkisSatiri[]

  return Promise.all(
    satirlar.map(async (satir) => ({
      id: satir.id,
      kullaniciId: satir.kullanici_id,
      kullaniciAdi: satir.kullanici_adi,
      mekanId: satir.mekan_id,
      // Mekan satiri okunamazsa (silinmis ya da gizlenmis) akis ogesi
      // yine de gosterilir; adsiz bir satir, kaybolan bir satirdan iyidir.
      mekanAdi: satir.mekanlar?.ad ?? '',
      notMetni: satir.not_metni,
      fotografUrl: satir.fotograf ? await checkInFotografiUrl(satir.fotograf) : null,
      olusturmaZamani: satir.olusturma_zamani,
      canliMi: satir.konum !== null,
      benimMi: satir.kullanici_id === benimId,
    }))
  )
}
