import { supabase } from './supabase'
import type { BagKisi } from './bag'
import { hataMetni } from './hata-metni'

type SunucuKisi = { id: string; kullanici_adi: string; ad: string }

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadı')
  return id
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

  return (data as SunucuKisi[]).map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
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

  const takipKimlikleri = await kimlikleriOku(
    'takipler', 'takip_eden_id', 'takip_edilen_id', benimId, 'beklemede'
  )
  const sohbetKimlikleri = await kimlikleriOku(
    'sohbet_istekleri', 'gonderen_id', 'alan_id', benimId, 'beklemede'
  )

  return {
    takip: await kisileriCoz(takipKimlikleri),
    sohbet: await kisileriCoz(sohbetKimlikleri),
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
