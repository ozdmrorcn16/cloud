import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

/**
 * `https://slooin.com/<kullanici_adi>` baglantisi uygulamada acildiginda
 * (Universal Link / App Link, 2026-09-18) kullanici adini kimlige
 * cevirir. RPC `profil_karti` anon'a acik ama burada oturumla cagriliyor;
 * gizlilik kurallari (aktif hesap) sunucuda. `null`: boyle biri yok.
 */
export async function kullaniciAdindanKimlik(kullaniciAdi: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('profil_karti', { p_kullanici_adi: kullaniciAdi })
  if (error) throw new Error(hataMetni(error))
  const satir = (data as { id: string }[] | null)?.[0]
  return satir?.id ?? null
}

/**
 * Sitenin kendi sayfalari: Android App Links `slooin.com/*`nin tamamini
 * uygulamaya getirdigi icin bu adlar profil DEGIL, sayfa - tarayicida
 * acilir. Liste `site/functions/_middleware.js` SITE_SAYFALARI ile ayni.
 */
export const SITE_SAYFALARI = new Set(['gizlilik', 'kosullar', 'destek', 'hesap-sil', '404'])
