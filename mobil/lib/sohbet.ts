import { supabase } from './supabase'

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
  if (error) throw new Error(error.message)
}

export async function mesajGonder(kullaniciId: string, metin: string): Promise<string> {
  const { data, error } = await supabase.rpc('mesaj_gonder', {
    p_kullanici_id: kullaniciId,
    p_metin: metin,
  })
  if (error) throw new Error(error.message)
  return data as string
}

export async function konusmalarimiGetir(): Promise<Konusma[]> {
  const { data, error } = await supabase.rpc('konusmalarim', {})
  if (error) throw new Error(error.message)
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
  if (error) throw new Error(error.message)
  return (data as MesajSatiri[]).map(mesajCevir)
}

export async function konusmayiOkunduIsaretle(konusmaId: string): Promise<void> {
  await rpcCagir('konusmayi_okundu_isaretle', { p_konusma_id: konusmaId })
}

export async function konusmayiGizle(konusmaId: string): Promise<void> {
  await rpcCagir('konusmayi_gizle', { p_konusma_id: konusmaId })
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
