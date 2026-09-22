import { sistemPaylasimi } from './paylasim'
import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { profilOzetleriniGetir } from './akis'
import { kimligiZorunluOku } from './kimlik'

/**
 * BEGENI, YORUM VE PAYLASMA.
 *
 * Kullanicinin istegi (2026-09-02) ve verdigi uc karar:
 *   1. Yorumu, PAYLASIMI GOREBILEN yazar. Ayri bir yetki kavrami YOK -
 *      gorunurluk kurallari (gizli profil dahil) yorumlar icin de
 *      kendiliginden gecerli, cunku sunucudaki kontroller ayni
 *      check-in gorunurlugune dayaniyor.
 *   2. Paylasim sahibi kendi paylasimindaki yorumu silebilir.
 *   3. Sikayet edilen yorum ANINDA gizlenir.
 */

export type EtkilesimOzeti = {
  begeni: number
  yorum: number
  begendim: boolean
}

export type Yorum = {
  id: string
  kullaniciId: string | null
  kullaniciAdi: string | null
  ad: string | null
  metin: string
  olusturuldu: string
  silebilirMi: boolean
}

async function kendiId(): Promise<string> {
  return kimligiZorunluOku()
}

/**
 * Bircok paylasimin ozetini TEK CAGRIDA getirir.
 *
 * Akista satir basina ayri sorgu atmak otuz gidis-donus demekti;
 * etiketlerde de ayni desen kullaniliyor.
 */
export async function etkilesimOzetleriniGetir(
  checkInIdleri: string[]
): Promise<Record<string, EtkilesimOzeti>> {
  if (checkInIdleri.length === 0) return {}

  const { data, error } = await supabase.rpc('etkilesim_ozetleri', {
    p_check_in_ids: checkInIdleri,
  })
  if (error) throw new Error(hataMetni(error))

  const sonuc: Record<string, EtkilesimOzeti> = {}
  for (const satir of (data ?? []) as {
    check_in_id: string
    begeni: number
    yorum: number
    begendim: boolean
  }[]) {
    sonuc[satir.check_in_id] = {
      begeni: satir.begeni,
      yorum: satir.yorum,
      begendim: satir.begendim,
    }
  }
  return sonuc
}

export async function begen(checkInId: string): Promise<void> {
  const id = await kendiId()
  const { error } = await supabase
    .from('begeniler')
    .insert({ check_in_id: checkInId, kullanici_id: id })
  if (error) throw new Error(hataMetni(error))
}

export async function begeniyiKaldir(checkInId: string): Promise<void> {
  const id = await kendiId()
  const { error } = await supabase
    .from('begeniler')
    .delete()
    .eq('check_in_id', checkInId)
    .eq('kullanici_id', id)
  if (error) throw new Error(hataMetni(error))
}

/**
 * Yorumlar RPC ile getiriliyor, dogrudan tablodan DEGIL.
 *
 * Sebep: `profiller` uzerinde "yalnizca kendi profilini oku" kurali var,
 * yani istemci join ile yazarin adini okuyamiyor. Ayni sinif hata Faz
 * 2a'da yasandi - mekan detay ekrani 66 test yesilken canlida hic
 * calismiyordu.
 */
export async function yorumlariGetir(checkInId: string): Promise<Yorum[]> {
  const { data, error } = await supabase.rpc('yorumlari_getir', {
    p_check_in_id: checkInId,
  })
  if (error) throw new Error(hataMetni(error))

  return ((data ?? []) as {
    id: string
    kullanici_id: string | null
    kullanici_adi: string | null
    ad: string | null
    metin: string
    olusturuldu: string
    silebilir_mi: boolean
  }[]).map((s) => ({
    id: s.id,
    kullaniciId: s.kullanici_id,
    kullaniciAdi: s.kullanici_adi,
    ad: s.ad,
    metin: s.metin,
    olusturuldu: s.olusturuldu,
    silebilirMi: s.silebilir_mi,
  }))
}

export const YORUM_EN_FAZLA = 500

export async function yorumEkle(checkInId: string, metin: string): Promise<void> {
  const id = await kendiId()
  const { error } = await supabase
    .from('yorumlar')
    .insert({ check_in_id: checkInId, kullanici_id: id, metin: metin.trim() })
  if (error) throw new Error(hataMetni(error))
}

/** Yorumu yazan ya da paylasimin sahibi silebilir; kural sunucuda. */
export async function yorumSil(yorumId: string): Promise<void> {
  const { error } = await supabase.from('yorumlar').delete().eq('id', yorumId)
  if (error) throw new Error(hataMetni(error))
}

/**
 * Sikayet, yorumu ANINDA gizler (kullanicinin karari).
 *
 * Tek basina bir sansur araci olmasin diye sunucuda iki kisit var: ayni
 * kisi ayni yorumu bir kez sikayet edebilir ve gunluk bir tavan
 * uygulanir.
 */
export async function yorumuSikayetEt(
  yorumId: string,
  sebep: string,
  aciklama?: string
): Promise<void> {
  const { error } = await supabase.rpc('yorumu_sikayet_et', {
    p_yorum_id: yorumId,
    p_sebep: sebep,
    p_aciklama: aciklama ?? null,
  })
  if (error) throw new Error(hataMetni(error))
}

/**
 * Sistem paylasim sayfasini acar.
 *
 * Uygulamanin herkese acik bir web adresi HENUZ YOK, bu yuzden metin
 * paylasiliyor. Alan adi alinip paylasim sayfalari yapilinca buraya
 * gercek bir baglanti girer.
 */
export async function paylas(mekanAdi: string, kim: string): Promise<void> {
  await sistemPaylasimi({
    message: `${kim}, Slooin'de ${mekanAdi} mekanında.`,
  })
}

// ---------------------------------------------------------------------
// BEGENENLER LISTESI + ETKILESIM BILDIRIMLERI (kullanicinin istegi 2026-09-22)
// ---------------------------------------------------------------------

export type Begenen = { id: string; ad: string; kullaniciAdi: string; avatarUrl: string | null }

/**
 * Bir paylasimi begenenler (en yeni once). `begeniler` RLS ile okunur
 * (check-in'i goren begenilerini de gorur); ad/avatar `akis_profilleri`
 * RPC'sinden gelir - engelleme iki yonlu orada kesildigi icin engellenen
 * kisi listede GORUNMEZ (ozet gelmeyen atilir).
 */
export async function begenenleriGetir(checkInId: string): Promise<Begenen[]> {
  const { data, error } = await supabase
    .from('begeniler')
    .select('kullanici_id, olusturuldu')
    .eq('check_in_id', checkInId)
    .order('olusturuldu', { ascending: false })
    .limit(200)
  if (error) throw new Error(hataMetni(error))
  const kimlikler = ((data ?? []) as { kullanici_id: string }[]).map((s) => s.kullanici_id)
  const ozetler = await profilOzetleriniGetir(kimlikler)
  return kimlikler
    .filter((id) => ozetler[id])
    .map((id) => ({ id, ad: ozetler[id].ad, kullaniciAdi: ozetler[id].rumuz, avatarUrl: ozetler[id].avatarUrl }))
}

export type EtkilesimBildirimi = {
  /** `begeni-<checkInId>-<aktorId>` ya da `yorum-<yorumId>`. */
  id: string
  tur: 'begeni' | 'yorum'
  checkInId: string
  aktorId: string
  aktorAd: string
  aktorKullaniciAdi: string
  avatarUrl: string | null
  mekanAdi: string
  /** Yorum metni (yalnizca tur = yorum). Kendi paylasimindaki yorum - zaten gorebiliyor. */
  metin: string | null
  zaman: string
}

type BegeniSatiri = {
  check_in_id: string
  kullanici_id: string
  olusturuldu: string
  check_inler: { kullanici_id: string; mekanlar: { ad: string } | null } | null
}
type YorumSatiri = BegeniSatiri & { id: string; metin: string }

/**
 * Uygulama ici "Etkilesimler" bolumu: KENDI paylasimlarima gelen begeni
 * ve yorumlar (kendi eylemlerim haric), en yeni once. Ayri bildirim
 * tablosu YOK: satirlar dogrudan begeniler/yorumlar'dan RLS ile okunur
 * (Bildirimler ekranindaki takip/etiket bolumleriyle ayni desen).
 * `check_inler!inner` + `check_inler.kullanici_id = ben` gomulu suzgeci:
 * yalnizca sahibi oldugum paylasimlar.
 */
export async function etkilesimBildirimleriniGetir(limit = 50): Promise<EtkilesimBildirimi[]> {
  const ben = await kendiId()
  const [begeniler, yorumlar] = await Promise.all([
    supabase
      .from('begeniler')
      .select('check_in_id, kullanici_id, olusturuldu, check_inler!inner(kullanici_id, mekanlar(ad))')
      .eq('check_inler.kullanici_id', ben)
      .neq('kullanici_id', ben)
      .order('olusturuldu', { ascending: false })
      .limit(limit),
    supabase
      .from('yorumlar')
      .select('id, check_in_id, kullanici_id, metin, olusturuldu, check_inler!inner(kullanici_id, mekanlar(ad))')
      .eq('check_inler.kullanici_id', ben)
      .neq('kullanici_id', ben)
      .order('olusturuldu', { ascending: false })
      .limit(limit),
  ])
  if (begeniler.error) throw new Error(hataMetni(begeniler.error))
  if (yorumlar.error) throw new Error(hataMetni(yorumlar.error))

  const b = (begeniler.data ?? []) as unknown as BegeniSatiri[]
  const y = (yorumlar.data ?? []) as unknown as YorumSatiri[]
  const kimlikler = [...new Set([...b, ...y].map((s) => s.kullanici_id))]
  const ozetler = await profilOzetleriniGetir(kimlikler)

  const mekanAdi = (s: BegeniSatiri) => s.check_inler?.mekanlar?.ad ?? ''
  const satirlar: EtkilesimBildirimi[] = [
    ...b.map((s) => ({
      id: `begeni-${s.check_in_id}-${s.kullanici_id}`,
      tur: 'begeni' as const,
      checkInId: s.check_in_id,
      aktorId: s.kullanici_id,
      mekanAdi: mekanAdi(s),
      metin: null,
      zaman: s.olusturuldu,
    })),
    ...y.map((s) => ({
      id: `yorum-${s.id}`,
      tur: 'yorum' as const,
      checkInId: s.check_in_id,
      aktorId: s.kullanici_id,
      mekanAdi: mekanAdi(s),
      metin: s.metin,
      zaman: s.olusturuldu,
    })),
  ]
    // Ozeti gelmeyen (engellenen / silinmis hesap) atlanir.
    .filter((s) => ozetler[s.aktorId])
    .map((s) => ({
      ...s,
      aktorAd: ozetler[s.aktorId].ad,
      aktorKullaniciAdi: ozetler[s.aktorId].rumuz,
      avatarUrl: ozetler[s.aktorId].avatarUrl,
    }))
    .sort((x, z) => (x.zaman < z.zaman ? 1 : -1))
  return satirlar.slice(0, limit)
}
