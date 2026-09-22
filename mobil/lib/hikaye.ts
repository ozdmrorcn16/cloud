import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { dosyayiOku } from './dosya-oku'
import { profilOzetleriniGetir } from './akis'
import { hikayeMedyasiUrlHaritasi } from './fotograf-url'
import { mesajGonder } from './sohbet'
import { kimligiZorunluOku, kullaniciKimligi } from './kimlik'

/**
 * HIKAYELER (2026-09-22): Instagram benzeri 24 saatlik tek fotograf +
 * yazi + mekan etiketi. Sunucu: migrasyon 20260922150000 (tablolar
 * `hikayeler`, `hikaye_goruntulemeler`, kova `hikaye-medyalari`, RPC'ler).
 * Gorunurluk check-in ile ayni: sahibi + arkadaslar, engel iki yonlu,
 * moderasyonla gizlenen kimseye gorunmez - hepsi RLS/RPC'de, istemci
 * yalnizca sunucunun verdigini cizer.
 */

export const KOVA = 'hikaye-medyalari'
export const HIKAYE_YAZI_SINIRI = 200
export const EN_FAZLA_AKTIF_HIKAYE = 10
/** Her hikaye izleyicide bu kadar kalir (ms). */
export const HIKAYE_SURESI_MS = 5000

export type Hikaye = {
  id: string
  kullaniciId: string
  /** Kovadaki yol. */
  fotograf: string
  /** Imzali adres; imzalanamadiysa null (cagiran kareyi atlar). */
  fotografUrl: string | null
  yazi: string | null
  mekanId: string | null
  mekanAdi: string | null
  olusturuldu: string
  bitis: string
  gordum: boolean
  /** Yalnizca sahibine anlamli; baskasinda sunucu 0 verir. */
  goruntulenmeSayisi: number
}

export type HikayeGrubu = {
  kullaniciId: string
  ad: string
  kullaniciAdi: string
  avatarUrl: string | null
  benimMi: boolean
  /** Eskiden yeniye (izleme sirasi). */
  hikayeler: Hikaye[]
  /** Grupta en az bir gorulmemis hikaye var mi. */
  gorulmemisVar: boolean
}

type AkisSatiri = {
  id: string
  kullanici_id: string
  fotograf: string
  yazi: string | null
  mekan_id: string | null
  mekan_adi: string | null
  olusturuldu: string
  bitis: string
  gordum: boolean
  goruntulenme_sayisi: number
}

/**
 * Yol -> imzali adres; imzalanamayan haritada yok.
 *
 * ORTAK IMZA ONBELLEGINDEN geciyor (2026-09-22): daha once burada ayri
 * bir `createSignedUrls` cagrisi vardi ve her akis cekilisinde ayni
 * dosya icin YENI adres uretiyordu. Adres degisince gorsel onbellegi
 * iskaliyor ve fotograf yeniden iniyordu.
 */
export async function hikayeFotografiUrlHaritasi(yollar: string[]): Promise<Record<string, string>> {
  return hikayeMedyasiUrlHaritasi(yollar)
}

/**
 * Serit siralamasi (spec): kendi grubum HER ZAMAN ilk; sonra gorulmemisi
 * olanlar (en yeni hikayesi once), sonra tamamen gorulmusler (yine en
 * yeni once). Saf fonksiyon - test edilebilir.
 */
export function hikayeGruplariniSirala(gruplar: HikayeGrubu[]): HikayeGrubu[] {
  const enYeni = (g: HikayeGrubu) => g.hikayeler[g.hikayeler.length - 1]?.olusturuldu ?? ''
  return [...gruplar].sort((a, b) => {
    if (a.benimMi !== b.benimMi) return a.benimMi ? -1 : 1
    if (a.gorulmemisVar !== b.gorulmemisVar) return a.gorulmemisVar ? -1 : 1
    return enYeni(b).localeCompare(enYeni(a))
  })
}

/**
 * Ana sayfa seridi: gorunur hikayeler kisi kisi gruplanmis, profil
 * ozetleri (akis_profilleri - engellenen/askidaki kisi gelmez, grubu
 * atlanir) ve toplu imzali adreslerle. Kendi profilim akis_profilleri'nde
 * de var (RPC kendini de donduruyor).
 */
export async function hikayeAkisiniGetir(): Promise<HikayeGrubu[]> {
  const [{ data, error }, benimId] = await Promise.all([supabase.rpc('hikaye_akisi'), kullaniciKimligi()])
  if (error) throw new Error(hataMetni(error))
  const satirlar = (data ?? []) as AkisSatiri[]
  if (satirlar.length === 0) return []

  const kimlikler = [...new Set(satirlar.map((s) => s.kullanici_id))]
  const [ozetler, urller] = await Promise.all([
    profilOzetleriniGetir(kimlikler),
    hikayeFotografiUrlHaritasi(satirlar.map((s) => s.fotograf)),
  ])

  const gruplar = new Map<string, HikayeGrubu>()
  for (const s of satirlar) {
    const ozet = ozetler[s.kullanici_id]
    if (!ozet) continue
    let grup = gruplar.get(s.kullanici_id)
    if (!grup) {
      grup = {
        kullaniciId: s.kullanici_id,
        ad: ozet.ad,
        kullaniciAdi: ozet.rumuz,
        avatarUrl: ozet.avatarUrl,
        benimMi: s.kullanici_id === benimId,
        hikayeler: [],
        gorulmemisVar: false,
      }
      gruplar.set(s.kullanici_id, grup)
    }
    grup.hikayeler.push({
      id: s.id,
      kullaniciId: s.kullanici_id,
      fotograf: s.fotograf,
      fotografUrl: urller[s.fotograf] ?? null,
      yazi: s.yazi,
      mekanId: s.mekan_id,
      mekanAdi: s.mekan_adi,
      olusturuldu: s.olusturuldu,
      bitis: s.bitis,
      gordum: s.gordum,
      goruntulenmeSayisi: s.goruntulenme_sayisi ?? 0,
    })
  }
  for (const grup of gruplar.values()) {
    grup.hikayeler.sort((a, b) => a.olusturuldu.localeCompare(b.olusturuldu))
    // Kendi hikayelerimde "gorulmemis" halkasi anlamsiz - sunucu gordum'u
    // sahibi icin true veriyor ama burada da acikca kapatiyoruz.
    grup.gorulmemisVar = !grup.benimMi && grup.hikayeler.some((h) => !h.gordum)
  }
  return hikayeGruplariniSirala([...gruplar.values()])
}

/**
 * Hikaye paylas: fotograf once kovaya (`<uid>/<zaman>.jpg`; sunucu yol
 * sahipligini dogruluyor), sonra `hikaye_ekle`. RPC reddederse (10
 * siniri, yazi uzun, askida hesap) yuklenen dosya geri silinir.
 */
export async function hikayeEkle(yerelUri: string, yazi: string | null, mekanId: string | null): Promise<string> {
  const uid = await kimligiZorunluOku('Oturum bulunamadi')
  const baytlar = await dosyayiOku(yerelUri)
  const yol = `${uid}/${Date.now()}.jpg`
  const yukleme = await supabase.storage.from(KOVA).upload(yol, baytlar, { contentType: 'image/jpeg' })
  if (yukleme.error) throw new Error(hataMetni(yukleme.error))

  const temiz = yazi?.trim() ? yazi.trim() : null
  const { data, error } = await supabase.rpc('hikaye_ekle', {
    p_fotograf: yukleme.data.path,
    p_yazi: temiz,
    p_mekan_id: mekanId,
  })
  if (error) {
    await supabase.storage.from(KOVA).remove([yukleme.data.path])
    throw new Error(hataMetni(error))
  }
  return (data as { id: string }).id
}

/** Goruntuleme kaydi; sunucu kendi hikayemde ve gorunmeyen hikayede sessizce atlar. */
export async function hikayeGoruntulendi(hikayeId: string): Promise<void> {
  const { error } = await supabase.rpc('hikaye_goruntulendi', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
}

export type HikayeGoruntuleyen = {
  id: string
  ad: string
  kullaniciAdi: string
  avatarUrl: string | null
  goruldu: string
}

/** Yalnizca sahibine (sunucu baskasina bos doner). En yeni izleyen once. */
export async function hikayeGoruntuleyenleriGetir(hikayeId: string): Promise<HikayeGoruntuleyen[]> {
  const { data, error } = await supabase.rpc('hikaye_goruntuleyenler', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
  const satirlar = (data ?? []) as { kullanici_id: string; goruldu: string }[]
  const ozetler = await profilOzetleriniGetir(satirlar.map((s) => s.kullanici_id))
  return satirlar
    .filter((s) => ozetler[s.kullanici_id])
    .sort((a, b) => b.goruldu.localeCompare(a.goruldu))
    .map((s) => ({
      id: s.kullanici_id,
      ad: ozetler[s.kullanici_id].ad,
      kullaniciAdi: ozetler[s.kullanici_id].rumuz,
      avatarUrl: ozetler[s.kullanici_id].avatarUrl,
      goruldu: s.goruldu,
    }))
}

/** Sahibi siler: RPC satiri siler ve yolu doner, dosya kovadan istemcice silinir. */
export async function hikayeSil(hikayeId: string): Promise<void> {
  const { data, error } = await supabase.rpc('hikaye_sil', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
  const yol = data as string | null
  if (yol) await supabase.storage.from(KOVA).remove([yol])
}

/** Hikaye yanit on eki (sohbette gorunur; 7 dile cevrilmez - gonderen kendi dilinde yazar). */
export function hikayeYanitMetni(onEk: string, metin: string): string {
  return `${onEk} ${metin.trim()}`
}

/**
 * Baskasinin hikayesine yanit = normal sohbet mesaji (`mesaj_gonder`,
 * mesaj izni ve engel kurallari aynen). Konusma kimligi doner.
 */
export async function hikayeyeYanitVer(sahipId: string, onEk: string, metin: string): Promise<string> {
  return mesajGonder(sahipId, hikayeYanitMetni(onEk, metin))
}

export type HikayeSeridiVerisi = {
  gruplar: HikayeGrubu[]
  /** Kendi dairem icin kimlik ve gorunum; profil okunamadiysa null. */
  ben: { id: string; ad: string; kullaniciAdi: string; avatarUrl: string | null } | null
}

/**
 * Ana sayfa seridinin tek cagrilik verisi: gruplar + kendi gorunumum
 * (hikayem yokken de kendi dairem cizildigi icin ayrica gerekiyor;
 * grubum varsa oradan alinir, ikinci istek atilmaz).
 */
export async function hikayeSeridiVerisiniGetir(): Promise<HikayeSeridiVerisi> {
  const gruplar = await hikayeAkisiniGetir()
  const benimGrubum = gruplar.find((g) => g.benimMi)
  if (benimGrubum) {
    return {
      gruplar,
      ben: { id: benimGrubum.kullaniciId, ad: benimGrubum.ad, kullaniciAdi: benimGrubum.kullaniciAdi, avatarUrl: benimGrubum.avatarUrl },
    }
  }
  const uid = await kullaniciKimligi()
  if (!uid) return { gruplar, ben: null }
  const ozet = (await profilOzetleriniGetir([uid]))[uid]
  return { gruplar, ben: ozet ? { id: uid, ad: ozet.ad, kullaniciAdi: ozet.rumuz, avatarUrl: ozet.avatarUrl } : null }
}
