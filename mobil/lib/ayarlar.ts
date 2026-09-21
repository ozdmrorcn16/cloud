import { supabase } from './supabase'
import type { Bulunurluk, AniGorunurlugu } from './checkin'
import { hataMetni } from './hata-metni'

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadı')
  return id
}

export async function varsayilanBulunurluguGetir(): Promise<Bulunurluk> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('varsayilan_bulunurluk')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return (data?.varsayilan_bulunurluk ?? 'herkese_acik') as Bulunurluk
}

export async function aramadaGorunsunGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('aramada_gorunsun')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return data?.aramada_gorunsun ?? true
}

export async function aramadaGorunsunAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ aramada_gorunsun: deger })
    .eq('id', id)
  if (error) throw new Error(hataMetni(error))
}

/**
 * PROFIL GIZLILIGI (kullanicinin istegi 2026-09-02).
 *
 * Acikken paylasimlar - anilar ve check-in'ler, GECMIS DAHIL - yalnizca
 * arkadaslara gorunur. Ad, kullanici adi ve fotograf herkese acik kalir:
 * kisi seni bulup arkadaslik istegi gonderebilsin diye.
 *
 * `aramada_gorunsun` AYRI bir ayar: o aramada cikip cikmayacagini
 * belirliyor, bu ise paylasimlarin kime gorunecegini.
 */
export async function profilGizliGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('profil_gizli')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return data?.profil_gizli ?? false
}

export async function profilGizliAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ profil_gizli: deger })
    .eq('id', id)
  if (error) throw new Error(hataMetni(error))
}


/**
 * ETIKET ONAYI (kullanicinin karari 2026-09-06).
 *
 * false (varsayilan): karsilikli arkadasin seni DIREK etiketler.
 * true: etiket once sana soruluyor, onaylayana kadar kimseye
 * gorunmuyor.
 *
 * Karar sunucuda uygulaniyor - `check_in_etiketleri` uzerindeki
 * `etiket_durumu` tetikleyicisi durumu bu ayara gore yaziyor ve
 * istemciden gelen degeri EZIYOR.
 */
export async function etiketOnayiGerekliGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('etiket_onayi_gerekli')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return data?.etiket_onayi_gerekli ?? false
}

export async function etiketOnayiGerekliAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ etiket_onayi_gerekli: deger })
    .eq('id', id)
  if (error) throw new Error(hataMetni(error))
}

// 24 saat (kullanicinin karari 2026-09-21; 30 gundu).
const BEKLEME_MS = 24 * 60 * 60 * 1000

export async function kullaniciAdiDurumunuGetir(): Promise<{
  kullaniciAdi: string
  sonrakiDegisimTarihi: Date | null
}> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('kullanici_adi, kullanici_adi_degistirildi')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))

  const satir = data as
    | { kullanici_adi: string; kullanici_adi_degistirildi: string | null }
    | null

  const sonrakiDegisimTarihi = satir?.kullanici_adi_degistirildi
    ? new Date(new Date(satir.kullanici_adi_degistirildi).getTime() + BEKLEME_MS)
    : null

  return { kullaniciAdi: satir?.kullanici_adi ?? '', sonrakiDegisimTarihi }
}

// ---------------------------------------------------------------------
// GIZLILIK VE ETKILESIM (kullanicinin referans gorselleri 2026-09-18)
// ---------------------------------------------------------------------

export type MesajIzni = 'herkes' | 'arkadaslar' | 'hic_kimse'

/**
 * "Sana kimler mesaj gonderebilir?" - 'herkes' (varsayilan: yabanci tek
 * mesajla istek acar), 'arkadaslar' (yeni istek yolu kapali) ya da
 * 'hic_kimse' (arkadas bile yeni konusma acamaz; mevcut konusmalar
 * surer). Kural sunucuda (`mesaj_gonder`, migrasyon 20260918234000).
 */
export async function mesajIzniGetir(): Promise<MesajIzni> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase.from('profiller').select('mesaj_izni').eq('id', id).maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return (data?.mesaj_izni ?? 'herkes') as MesajIzni
}

export async function mesajIzniAyarla(deger: MesajIzni): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase.from('profiller').update({ mesaj_izni: deger }).eq('id', id)
  if (error) throw new Error(hataMetni(error))
}

export type BildirimTercihleri = {
  /** Ana anahtar - "Anlik bildirimler". Kapaliysa hicbir push gitmez. */
  anlik: boolean
  /** Mesajlar: yeni mesaj + mesaj istekleri. */
  mesaj: boolean
  /** Arkadaslik istekleri: istek, kabul, dogrudan ekleme. */
  arkadas: boolean
  /** Etiketler: etiket istegi ve onayi. */
  ani: boolean
  /** Ani hatirlatmalari: "bir yil once bugun" (gunluk cron). */
  aniHatirlatma: boolean
  /** Gece sessize al: 22.00-08.00 yerel saat. */
  sessizGece: boolean
}

const TERCIH_SUTUNU: Record<keyof BildirimTercihleri, string> = {
  anlik: 'bildirim_anlik',
  mesaj: 'bildirim_mesaj',
  arkadas: 'bildirim_arkadas',
  ani: 'bildirim_ani',
  aniHatirlatma: 'bildirim_ani_hatirlatma',
  sessizGece: 'sessiz_gece',
}

/**
 * Push tercihleri (referans ekran 2026-09-19). Edge Function
 * `bildirim-gonder` gondermeden once okur (surum 7). Uygulama ici
 * Bildirimler sekmesi etkilenmez.
 */
export async function bildirimTercihleriniGetir(): Promise<BildirimTercihleri> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('bildirim_anlik, bildirim_mesaj, bildirim_arkadas, bildirim_ani, bildirim_ani_hatirlatma, sessiz_gece')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(hataMetni(error))
  return {
    anlik: data?.bildirim_anlik ?? true,
    mesaj: data?.bildirim_mesaj ?? true,
    arkadas: data?.bildirim_arkadas ?? true,
    ani: data?.bildirim_ani ?? true,
    aniHatirlatma: data?.bildirim_ani_hatirlatma ?? false,
    sessizGece: data?.sessiz_gece ?? false,
  }
}

/**
 * Tek anahtari yazar. Gece sessizi acilirken cihazin SAAT DILIMI de
 * yazilir (ekrandaki not: "cihazinin yerel saatine gore calisir") -
 * Edge Function yerel saati bununla hesaplar.
 */
export async function bildirimTercihiAyarla(anahtar: keyof BildirimTercihleri, deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const guncelleme: Record<string, unknown> = { [TERCIH_SUTUNU[anahtar]]: deger }
  if (anahtar === 'sessizGece' && deger) {
    try {
      guncelleme.saat_dilimi = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
    } catch {
      guncelleme.saat_dilimi = null
    }
  }
  const { error } = await supabase.from('profiller').update(guncelleme).eq('id', id)
  if (error) throw new Error(hataMetni(error))
}

/**
 * Varsayilan bulunurlugu yazar (Konum ve check-in > "Mekanda
 * gorunurluk"). 2026-09-12'de ayar ekrani kalkmisti; 2026-09-18
 * referansiyla geri geldi - bu kez "Konum ve check-in" altinda.
 */
export async function varsayilanBulunurluguAyarla(deger: Bulunurluk): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase.from('profiller').update({ varsayilan_bulunurluk: deger }).eq('id', id)
  if (error) throw new Error(hataMetni(error))
}
