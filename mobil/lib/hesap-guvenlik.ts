import { supabase } from './supabase'
import { hataMetni } from './hata-metni'

/**
 * HESAP VE GUVENLIK (kullanicinin istegi 2026-09-18, referans gorseller):
 * ayarlarin en ustundeki "Hesap ve guvenlik" ekraninin arka plani.
 *   - e-posta degistirme (once mevcut adres, sonra yeni adres dogrulanir)
 *   - sifre degistirme
 *   - acik oturumlar (liste, tekil kapatma, digerlerinden cikis)
 */

// ---------------------------------------------------------------------
// E-posta
// ---------------------------------------------------------------------

/**
 * "or•••@example.com" - adresi ekranda maskeler (referans). Yerel
 * kismin ilk iki harfi, ardindan uc nokta, alan adi oldugu gibi.
 */
export function epostaMaskele(eposta: string): string {
  const at = eposta.indexOf('@')
  if (at <= 0) return eposta
  const yerel = eposta.slice(0, at)
  const alan = eposta.slice(at)
  return `${yerel.slice(0, 2)}•••${alan}`
}

export async function mevcutEposta(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.email ?? null
}

/**
 * ADIM 1 - mevcut adresi dogrula: mevcut adrese kod gonderir.
 * Magic Link sablonu `{{ .Token }}` tasidigi icin (2026-09-02) bugun
 * calisan yol bu; hesap silme de ayni yolu kullaniyor.
 */
export async function mevcutAdreseKodGonder(eposta: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: eposta,
    options: { shouldCreateUser: false },
  })
  if (error) throw new Error(hataMetni(error))
}

export async function mevcutAdresiDogrula(eposta: string, kod: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: eposta, token: kod, type: 'email' })
  if (error) throw new Error(hataMetni(error))
}

/**
 * ADIM 2 - yeni adrese kod gonderir (`updateUser({ email })`). Supabase
 * "Change Email Address" sablonunu kullanir; sablon `{{ .Token }}`
 * tasimali (panel isi - bkz. docs/posta-sablonu-eposta-degisikligi.html).
 * Giris adresi yeni adres dogrulanana kadar DEGISMEZ.
 */
export async function yeniAdreseKodGonder(yeniEposta: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: yeniEposta })
  if (error) throw new Error(hataMetni(error))
}

export async function yeniAdresiDogrula(yeniEposta: string, kod: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: yeniEposta,
    token: kod,
    type: 'email_change',
  })
  if (error) throw new Error(hataMetni(error))
}

// ---------------------------------------------------------------------
// Sifre
// ---------------------------------------------------------------------

/** Referans ekrandaki kural: yeni sifre en az 12 karakter (kayittaki 8'den siki). */
export const EN_AZ_YENI_SIFRE = 12

/**
 * Sifre degistirme (referans ekran): once MEVCUT sifre dogrulanir
 * (`signInWithPassword` - yanlissa "mevcut sifren yanlis"), sonra yeni
 * sifre yazilir, ardindan DIGER cihazlardaki oturumlar kapatilir
 * (ekrandaki not: "Sifren degistiginde diger cihazlardaki oturumlarin
 * kapatilir"). Bu cihaz acik kalir.
 */
export async function sifreDegistir(eposta: string, mevcutSifre: string, yeniSifre: string): Promise<void> {
  const giris = await supabase.auth.signInWithPassword({ email: eposta, password: mevcutSifre })
  if (giris.error) throw new Error('MEVCUT_SIFRE_YANLIS')
  const { error } = await supabase.auth.updateUser({ password: yeniSifre })
  if (error) throw new Error(hataMetni(error))
  // Diger cihazlar: basarisiz olsa da sifre degisti; hata yutulmuyor ama
  // ekran bunu "sifre degisti, diger cihazlar kapatilamadi" diye gosterir.
  const cikis = await supabase.auth.signOut({ scope: 'others' })
  if (cikis.error) throw new Error('DIGER_CIHAZLAR_KAPATILAMADI')
}

// ---------------------------------------------------------------------
// Oturumlar
// ---------------------------------------------------------------------

export type Oturum = {
  id: string
  olusturuldu: string
  sonEtkinlik: string
  /** Ham user-agent; ekran `cihazAdi` ile okunur hale getirir. */
  cihaz: string | null
  ip: string | null
  buCihaz: boolean
}

type SunucuOturum = {
  id: string
  olusturuldu: string
  son_etkinlik: string
  cihaz: string | null
  ip: string | null
  bu_cihaz: boolean
}

export async function oturumlarimiGetir(): Promise<Oturum[]> {
  const { data, error } = await supabase.rpc('oturumlarim')
  if (error) throw new Error(hataMetni(error))
  return ((data ?? []) as SunucuOturum[]).map((s) => ({
    id: s.id,
    olusturuldu: s.olusturuldu,
    sonEtkinlik: s.son_etkinlik,
    cihaz: s.cihaz,
    ip: s.ip,
    buCihaz: s.bu_cihaz,
  }))
}

export async function oturumuKapat(oturumId: string): Promise<void> {
  const { error } = await supabase.rpc('oturumu_kapat', { p_oturum_id: oturumId })
  if (error) throw new Error(hataMetni(error))
}

/** Bu cihaz haric butun oturumlari kapatir. */
export async function digerCihazlardanCik(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) throw new Error(hataMetni(error))
}

/**
 * User-agent'tan "iPhone · Slooin" / "Safari · Mac" gibi okunur ad
 * (referans). Uygulamanin kendi istekleri: iOS'ta "Slooin/13
 * CFNetwork/... Darwin/...", Android'de "okhttp/4.x"; tarayicilar
 * "Mozilla/5.0 (...)". Tam UA gosterilmiyor - kullanici icin anlamsiz.
 */
export function cihazAdi(ua: string | null, bilinmeyen: string): string {
  if (!ua) return bilinmeyen
  if (/CFNetwork|Darwin/i.test(ua) && !/Mozilla/i.test(ua)) return 'iPhone · Slooin'
  if (/okhttp|Dalvik/i.test(ua) && !/Mozilla/i.test(ua)) return 'Android · Slooin'
  if (/Mozilla/i.test(ua)) {
    const tarayici = /Edg\//i.test(ua)
      ? 'Edge'
      : /OPR\//i.test(ua)
        ? 'Opera'
        : /Firefox\//i.test(ua)
          ? 'Firefox'
          : /Chrome\//i.test(ua)
            ? 'Chrome'
            : /Safari\//i.test(ua)
              ? 'Safari'
              : bilinmeyen
    const sistem = /iPhone|iPad/i.test(ua)
      ? 'iPhone'
      : /Android/i.test(ua)
        ? 'Android'
        : /Macintosh|Mac OS/i.test(ua)
          ? 'Mac'
          : /Windows/i.test(ua)
            ? 'Windows'
            : /Linux/i.test(ua)
              ? 'Linux'
              : null
    return sistem ? `${tarayici} · ${sistem}` : tarayici
  }
  return bilinmeyen
}

/** Tarayici mi (dizustu ikonu) yoksa telefon mu. */
export function tarayiciMi(ua: string | null): boolean {
  return Boolean(ua && /Mozilla/i.test(ua) && !/iPhone|iPad|Android/i.test(ua))
}
