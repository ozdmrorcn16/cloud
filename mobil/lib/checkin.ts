import { supabase } from './supabase'
import { noktayiCoz } from './konum'
import { hataMetni } from './hata-metni'
import { etiketleriGetir, type Etiket } from './etiket'
import { checkInFotografiUrl } from './fotograf-url'

export type Bulunurluk = 'herkese_acik' | 'takipcilerim' | 'gizli'
export type AniGorunurlugu = 'herkese_acik' | 'takipcilerim' | 'kimse'

export type CheckIn = {
  id: string
  mekanId: string
  notMetni: string | null
  fotograf: string | null
  olusturmaZamani: string
  bitisZamani: string
  canliMi: boolean
  bulunurluk: Bulunurluk
}

type CheckInSatiri = {
  id: string
  mekan_id: string
  not_metni: string | null
  fotograf: string | null
  olusturma_zamani: string
  bitis_zamani: string
  konum: string | null
  bulunurluk: Bulunurluk
}

function satiriCheckInACevir(satir: CheckInSatiri): CheckIn {
  return {
    id: satir.id,
    mekanId: satir.mekan_id,
    notMetni: satir.not_metni,
    fotograf: satir.fotograf,
    olusturmaZamani: satir.olusturma_zamani,
    bitisZamani: satir.bitis_zamani,
    canliMi: satir.konum !== null,
    bulunurluk: satir.bulunurluk,
  }
}

export async function checkInYap(
  mekanId: string,
  lat: number,
  lng: number,
  notMetni: string | null = null,
  fotograf: string | null = null,
  bulunurluk: Bulunurluk = 'herkese_acik'
): Promise<CheckIn> {
  const { data, error } = await supabase.rpc('check_in_yap', {
    p_mekan_id: mekanId,
    p_lat: lat,
    p_lng: lng,
    p_not_metni: notMetni,
    p_fotograf: fotograf,
    p_bulunurluk: bulunurluk,
  })
  if (error) throw new Error(hataMetni(error))
  return satiriCheckInACevir(data as CheckInSatiri)
}

export async function checkIndenAyril(checkInId: string): Promise<void> {
  const { error } = await supabase.rpc('check_inden_ayril', { p_check_in_id: checkInId })
  if (error) throw new Error(hataMetni(error))
}

export type CheckInGorunumu = CheckIn & { kullaniciId: string; kullaniciAdi: string | null }

type CheckInSatiriProfilli = CheckInSatiri & { kullanici_id: string; kullanici_adi: string | null }

function satiriGorunumeCevir(satir: CheckInSatiriProfilli): CheckInGorunumu {
  return {
    ...satiriCheckInACevir(satir),
    kullaniciId: satir.kullanici_id,
    kullaniciAdi: satir.kullanici_adi,
  }
}

export async function suAnBurdakileriGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, kullanici_adi, bulunurluk')
    .not('konum', 'is', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(hataMetni(error))
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}

export async function mekanAnilariniGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, kullanici_adi, bulunurluk')
    .is('konum', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(hataMetni(error))
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}

export type AniGorunumu = CheckIn & {
  mekanAdi: string
  /** Mekanin semti; bilinmiyorsa null. */
  mekanSemti: string | null
  mekanKonumu: { lat: number; lng: number }
  /** check_inler'de denormalize duran ad (karar #18). */
  kullaniciAdi: string | null
  /** Imzalanmis fotograf adresi; yoksa null. */
  fotografUrl: string | null
  etiketler: Etiket[]
}

type CheckInSatiriMekanli = CheckInSatiri & {
  mekanlar: { ad: string; konum: string; semt: string | null }
  kullanici_adi: string | null
}

export async function kullanicininAnilariniGetir(kullaniciId: string): Promise<AniGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select(
      'id, mekan_id, kullanici_adi, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, bulunurluk, mekanlar(ad, konum, semt)'
    )
    .eq('kullanici_id', kullaniciId)
    // KONUM FILTRESI KALDIRILDI (kullanicinin bildirdigi eksik,
    // 2026-08-29): `.is('konum', null)` yalnizca ANILARI getiriyordu,
    // yani yeni yapilan bir check-in profil listesinde 30 dakika
    // boyunca HIC gorunmuyordu ve "Anı" sayaci da artmiyordu.
    // Artik canli check-in de listede; tunel onu "şu an burada"
    // rozetiyle ciziyor. Gorunurluk yine RLS'in isi.
    .order('olusturma_zamani', { ascending: false })
  if (error) throw new Error(hataMetni(error))
  const satirlar = data as unknown as CheckInSatiriMekanli[]

  // Etiketler TEK SORGUDA; okunamazsa anilar yine gosteriliyor.
  const etiketler: Record<string, Etiket[]> = await etiketleriGetir(
    satirlar.map((s) => s.id)
  ).catch(() => ({}))

  return Promise.all(
    satirlar.map(async (satir) => ({
      ...satiriCheckInACevir(satir),
      mekanAdi: satir.mekanlar.ad,
      // Semt zaman tunelindeki alt satirda kullaniliyor.
      mekanSemti: satir.mekanlar.semt,
      mekanKonumu: noktayiCoz(satir.mekanlar.konum),
      kullaniciAdi: satir.kullanici_adi,
      fotografUrl: satir.fotograf ? await checkInFotografiUrl(satir.fotograf) : null,
      etiketler: etiketler[satir.id] ?? [],
    }))
  )
}

/**
 * Bir check-in'i KALICI olarak siler.
 *
 * Ad 2026-08-26'da `aniyiSil`den degistirildi: ayni satir hem CANLI
 * check-in hem de ani olabiliyor ve kullanici ikisini de silebilmeli
 * (kullanicinin istegi). Silme politikasi zaten `kullanici_id =
 * auth.uid()`, yani durum ayrimi yapmiyor.
 *
 * Silinen satir tek yerde duruyor, dolayisiyla akistan da profildeki
 * anilardan da ayni anda kalkar.
 */
export async function checkIniSil(checkInId: string): Promise<void> {
  const { error } = await supabase.from('check_inler').delete().eq('id', checkInId)
  if (error) throw new Error(hataMetni(error))
}

export type AktifCheckIn = CheckIn & { mekanAdi: string }

/**
 * Kullanicinin su an canli olan check-in'i (varsa).
 *
 * Canlilik tek bir seye bagli: `konum` sutunu dolu mu. Sure dolunca ya
 * da "ayrildim" denince sunucu o sutunu bosaltiyor ve kayit aniya
 * donusuyor. Ayni anda birden fazla canli check-in olamaz; yine de
 * `limit 1` var, cunku bu ekran tek bir satiri gosteriyor.
 */
export async function aktifCheckInimiGetir(): Promise<AktifCheckIn | null> {
  const { data: kullaniciVerisi } = await supabase.auth.getUser()
  const kullaniciId = kullaniciVerisi.user?.id
  if (!kullaniciId) throw new Error('Oturum bulunamadı')

  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, bulunurluk, mekanlar(ad)')
    .eq('kullanici_id', kullaniciId)
    .not('konum', 'is', null)
    .order('olusturma_zamani', { ascending: false })
    .limit(1)
  if (error) throw new Error(hataMetni(error))

  const satirlar = data as unknown as (CheckInSatiri & { mekanlar: { ad: string } })[]
  if (satirlar.length === 0) return null

  return { ...satiriCheckInACevir(satirlar[0]), mekanAdi: satirlar[0].mekanlar.ad }
}
