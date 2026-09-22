import { supabase } from './supabase'
import type { BagKisi } from './bag'
import { hataMetni } from './hata-metni'
import { avatarlariGetir } from './akis'
import { kimligiZorunluOku } from './kimlik'

type SunucuKisi = { id: string; kullanici_adi: string; ad: string }

async function kendiKullaniciId(): Promise<string> {
  return kimligiZorunluOku()
}

/**
 * Kimlikleri ada cevirir. Join kullanilmiyor: takipler ile profiller
 * arasinda FK yok ve profiller'in RLS'i yalnizca kendi satirini
 * gosteriyor, dolayisiyla join canli veritabaninda sessizce bos donerdi
 * (Faz 2a'da tam bu yasandi, karar #18).
 */
async function kisileriCoz(kimlikler: string[]): Promise<BagKisi[]> {
  if (kimlikler.length === 0) return []

  const { data, error } = await supabase.rpc('bag_kisileri', { p_kimlikler: kimlikler })
  if (error) throw new Error(hataMetni(error))

  // Avatarlar ikincil bilgi: okunamazsa liste yine gelir, bas harf cizilir.
  const satirlar = data as SunucuKisi[]
  const avatarlar = await avatarlariGetir(satirlar.map((s) => s.id)).catch(() => ({}) as Record<string, string | null>)

  return satirlar.map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    avatarUrl: avatarlar[satir.id] ?? null,
  }))
}

async function kimlikleriOku(
  tablo: 'takipler' | 'sohbet_istekleri',
  sutun: string,
  kosulSutunu: string,
  kosulDegeri: string,
  durum: 'beklemede' | 'kabul'
): Promise<string[]> {
  const { data, error } = await supabase
    .from(tablo)
    .select(sutun)
    .eq(kosulSutunu, kosulDegeri)
    .eq('durum', durum)
  if (error) throw new Error(hataMetni(error))
  return (data as unknown as Record<string, string>[]).map((satir) => satir[sutun])
}

export async function gelenIstekleriGetir(): Promise<{ takip: BagKisi[]; sohbet: BagKisi[] }> {
  const benimId = await kendiKullaniciId()

  // IKI KIMLIK SORGUSU PARALEL, KISILER TEK TURDA (2026-09-22 performans
  // turu). Onceden dort adim SIRAYLA gidiyordu (takip kimlikleri ->
  // sohbet kimlikleri -> takip kisileri -> sohbet kisileri) ve son iki
  // adimin her biri kendi icinde iki istek daha atiyordu: bildirimler
  // ekrani alti gidis-donus bekliyordu. Artik iki tur:
  // (1) iki kimlik sorgusu paralel, (2) BUTUN kisiler tek `bag_kisileri`
  // + tek avatar cagrisiyla cozulup ayriliyor.
  const [takipKimlikleri, sohbetKimlikleri] = await Promise.all([
    kimlikleriOku('takipler', 'takip_eden_id', 'takip_edilen_id', benimId, 'beklemede'),
    kimlikleriOku('sohbet_istekleri', 'gonderen_id', 'alan_id', benimId, 'beklemede'),
  ])

  const hepsi = await kisileriCoz([...new Set([...takipKimlikleri, ...sohbetKimlikleri])])
  const kisiHaritasi = new Map(hepsi.map((k) => [k.id, k]))
  const ayir = (kimlikler: string[]) =>
    kimlikler.map((id) => kisiHaritasi.get(id)).filter((k): k is BagKisi => k !== undefined)

  return {
    takip: ayir(takipKimlikleri),
    sohbet: ayir(sohbetKimlikleri),
  }
}

/**
 * Benim gonderdigim, henuz yanitlanmamis istekler. gelenIstekleriGetir
 * ile ayni sutunlarin karsiligi kullanilir; yalnizca hangi sutun
 * "benim" tarafim, hangisi "karsi taraf" oldugu ters cevrilir.
 */
export async function gidenIstekleriGetir(): Promise<{ takip: BagKisi[]; sohbet: BagKisi[] }> {
  const benimId = await kendiKullaniciId()

  const takipKimlikleri = await kimlikleriOku(
    'takipler', 'takip_edilen_id', 'takip_eden_id', benimId, 'beklemede'
  )
  const sohbetKimlikleri = await kimlikleriOku(
    'sohbet_istekleri', 'alan_id', 'gonderen_id', benimId, 'beklemede'
  )

  return {
    takip: await kisileriCoz(takipKimlikleri),
    sohbet: await kisileriCoz(sohbetKimlikleri),
  }
}

// Takip artik karsilikli yazildigi icin (kabul iki yonu de yazar) "kimin
// beni takip ettigi" ve "kimi takip ettigim" ayni kume oldu. Eskiden
// bunlarin ayri fonksiyonu vardi (takipEttiklerimiGetir); tek liste
// kaldigi icin kaldirildi, ekran bu fonksiyonu kullaniyor.
export async function takipcilerimiGetir(): Promise<BagKisi[]> {
  const benimId = await kendiKullaniciId()
  const kimlikler = await kimlikleriOku(
    'takipler', 'takip_eden_id', 'takip_edilen_id', benimId, 'kabul'
  )
  return kisileriCoz(kimlikler)
}

/**
 * BASKASININ ARKADASLARI (2026-09-20): profil sayaclarindaki "Arkadas"
 * bolumu. Kapi sunucuda (`baskasinin_arkadaslari`): profil gizliyse
 * yalnizca arkadaslarina, engel varsa hic; liste pasif/engelli
 * kisileri eler. Avatar ikincil: okunamazsa bas harf.
 */
export async function baskasininArkadaslariniGetir(kullaniciId: string): Promise<BagKisi[]> {
  const { data, error } = await supabase.rpc('baskasinin_arkadaslari', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(hataMetni(error))
  const satirlar = (data ?? []) as SunucuKisi[]
  const avatarlar = await avatarlariGetir(satirlar.map((s) => s.id)).catch(() => ({}) as Record<string, string | null>)
  return satirlar.map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    avatarUrl: avatarlar[satir.id] ?? null,
  }))
}
