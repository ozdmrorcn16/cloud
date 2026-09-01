import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

export type Konusma = {
  konusmaId: string
  kisiId: string | null
  kullaniciAdi: string | null
  ad: string | null
  sonMesaj: string | null
  sonMesajZamani: string | null
  okunmamis: number
  yazilabilirMi: boolean
}

export type Mesaj = {
  id: string
  gonderenId: string | null
  metin: string
  olusturuldu: string
}

type KonusmaSatiri = {
  konusma_id: string
  kisi_id: string | null
  kullanici_adi: string | null
  ad: string | null
  son_mesaj: string | null
  son_mesaj_zamani: string | null
  okunmamis: number
  yazilabilir_mi: boolean
}

type MesajSatiri = {
  id: string
  gonderen_id: string | null
  metin: string
  olusturuldu: string
}

function konusmaCevir(satir: KonusmaSatiri): Konusma {
  return {
    konusmaId: satir.konusma_id,
    kisiId: satir.kisi_id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    sonMesaj: satir.son_mesaj,
    sonMesajZamani: satir.son_mesaj_zamani,
    okunmamis: satir.okunmamis,
    yazilabilirMi: satir.yazilabilir_mi,
  }
}

function mesajCevir(satir: MesajSatiri): Mesaj {
  return {
    id: satir.id,
    gonderenId: satir.gonderen_id,
    metin: satir.metin,
    olusturuldu: satir.olusturuldu,
  }
}

async function rpcCagir(ad: string, parametreler: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.rpc(ad, parametreler)
  if (error) throw new Error(hataMetni(error))
}

export async function mesajGonder(kullaniciId: string, metin: string): Promise<string> {
  const { data, error } = await supabase.rpc('mesaj_gonder', {
    p_kullanici_id: kullaniciId,
    p_metin: metin,
  })
  if (error) throw new Error(hataMetni(error))
  return data as string
}

export async function konusmalarimiGetir(): Promise<Konusma[]> {
  const { data, error } = await supabase.rpc('konusmalarim', {})
  if (error) throw new Error(hataMetni(error))
  return (data as KonusmaSatiri[]).map(konusmaCevir)
}

export async function mesajlariGetir(
  konusmaId: string,
  once: string | null = null,
  limit: number = 50
): Promise<Mesaj[]> {
  const { data, error } = await supabase.rpc('mesajlari_getir', {
    p_konusma_id: konusmaId,
    p_once: once,
    p_limit: limit,
  })
  if (error) throw new Error(hataMetni(error))
  return (data as MesajSatiri[]).map(mesajCevir)
}

export async function konusmayiOkunduIsaretle(konusmaId: string): Promise<void> {
  await rpcCagir('konusmayi_okundu_isaretle', { p_konusma_id: konusmaId })
}

export async function konusmayiGizle(konusmaId: string): Promise<void> {
  await rpcCagir('konusmayi_gizle', { p_konusma_id: konusmaId })
}

/**
 * MESAJ ISTEGI: arkadasin olmayan birinden gelen ilk mesaj.
 *
 * Kullanicinin karari (2026-09-01): boyle bir mesaj Mesajlar kutusuna
 * DUSMEZ, ayri bir "Istekler" bolumunde bekler. Okumak kabul etmez -
 * kabul ya cevap yazmakla ya da Kabul dugmesiyle olur. Gonderen, kabul
 * edilene kadar IKINCI bir mesaj yazamaz (taciz yuzeyini daraltiyor).
 */
export type MesajIstegi = {
  gonderenId: string
  kullaniciAdi: string | null
  ad: string | null
  konusmaId: string | null
  sonMesaj: string | null
  sonMesajZamani: string | null
}

type MesajIstegiSatiri = {
  gonderen_id: string
  kullanici_adi: string | null
  ad: string | null
  konusma_id: string | null
  son_mesaj: string | null
  son_mesaj_zamani: string | null
}

export async function mesajIsteklerimiGetir(): Promise<MesajIstegi[]> {
  const { data, error } = await supabase.rpc('mesaj_isteklerim', {})
  if (error) throw new Error(hataMetni(error))
  return (data as MesajIstegiSatiri[]).map((satir) => ({
    gonderenId: satir.gonderen_id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    konusmaId: satir.konusma_id,
    sonMesaj: satir.son_mesaj,
    sonMesajZamani: satir.son_mesaj_zamani,
  }))
}

export async function mesajIsteginiKabulEt(gonderenId: string): Promise<void> {
  await rpcCagir('mesaj_istegini_kabul_et', { p_gonderen_id: gonderenId })
}

/** Istegi siler ve konusmayi YALNIZCA benim kutumdan kaldirir. */
export async function mesajIsteginiReddet(gonderenId: string): Promise<void> {
  await rpcCagir('mesaj_istegini_reddet', { p_gonderen_id: gonderenId })
}

export function mesajlaraAbonelOl(
  konusmaId: string,
  geldi: (m: Mesaj) => void
): () => void {
  const kanal = supabase
    .channel(`mesajlar:${konusmaId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mesajlar',
        filter: `konusma_id=eq.${konusmaId}`,
      },
      (olay) => {
        const s = olay.new as MesajSatiri
        geldi(mesajCevir(s))
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(kanal)
  }
}
