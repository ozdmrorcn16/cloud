import { Share } from 'react-native'
import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

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
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadı')
  return id
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
  await Share.share({
    message: `${kim}, Slooin'de ${mekanAdi} mekanında.`,
  })
}
