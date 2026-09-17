import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

// Bicim veritabaninda da ayni sekilde kisitli
// (profiller_kullanici_adi_bicim). Buradaki kopya yalnizca kullaniciya
// sunucuya gitmeden hizli geri bildirim vermek icin var; asil zorlayici
// olan veritabani kisitidir.
const DESEN = /^[a-z0-9._]{3,20}$/

export const KULLANICI_ADI_KURALI =
  'Kullanıcı adı 3-20 karakter olmalı; sadece küçük harf, rakam, nokta ve alt çizgi kullanılabilir.'

export function kullaniciAdiniNormallestir(ham: string): string {
  return ham.trim().toLowerCase()
}

/**
 * YASAKLI ADLAR (2026-09-18): `slooin.com/<ad>` artik profil sayfasi;
 * sitenin kendi yollariyla cakisan adlar alinamaz. Asil zorlayici
 * veritabani kisiti (`profiller_kullanici_adi_yasakli`); buradaki liste
 * onunla AYNI tutulur ve yalnizca erken geri bildirim icin.
 */
const YASAKLI = new Set([
  'gizlilik', 'kosullar', 'destek', 'posta', '_astro', 'slooin', 'admin', 'moderasyon',
  'api', 'www', 'giris', 'kayit', 'mekan', 'mekanlar', 'kullanici', 'profil', 'ayarlar',
  'hakkinda', 'iletisim', 'indir', 'uygulama', 'app', '404', 'robots', 'sitemap',
  'hesap_sil', 'kesfet', 'mesajlar', 'bildirimler',
])

export function kullaniciAdiGecerliMi(ad: string): boolean {
  return DESEN.test(ad) && !YASAKLI.has(ad)
}

export async function kullaniciAdiMusaitMi(ad: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('kullanici_adi_musait_mi', {
    p_ad: kullaniciAdiniNormallestir(ad),
  })
  if (error) throw new Error(hataMetni(error))
  return data as boolean
}

export async function kullaniciAdiniDegistir(yeniAd: string): Promise<void> {
  const { error } = await supabase.rpc('kullanici_adi_degistir', {
    p_yeni_ad: kullaniciAdiniNormallestir(yeniAd),
  })
  if (error) {
    // Sunucudaki on kontrol yarisi kaybederse ham Postgres kisit hatasi
    // (ornegin "duplicate key value violates unique constraint ...")
    // kullaniciya sizmasin diye kod'a gore anlasilir mesaja ceviriyoruz.
    if (error.code === '23505') {
      throw new Error('Bu kullanıcı adı alınmış, başka bir tane dene.')
    }
    if (error.code === '23514') {
      throw new Error(KULLANICI_ADI_KURALI)
    }
    throw new Error(hataMetni(error))
  }
}
