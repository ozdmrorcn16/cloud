import { supabase } from './supabase'
import { hataMetni } from './hata-metni'
import { dosyayiOku } from './dosya-oku'
import { profilOzetleriniGetir } from './akis'
import { hikayeMedyasiUrlHaritasi } from './fotograf-url'
import { ANAHTAR, onbellekOku, onbellekSil, onbellekYaz } from './onbellek'
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

export type HikayeEtiketi = { kullaniciId: string; kullaniciAdi: string }

/**
 * Hikaye basina gorunurluk (kullanicinin karari, 2026-09-22):
 * `arkadaslar` varsayilan, `herkese_acik` ise profil gizli olsa da
 * herkese acilir - secim o icerik icin verilmis acik bir karardir.
 * Engel her iki halde de mutlak (sunucu).
 */
export type HikayeGorunurlugu = 'arkadaslar' | 'herkese_acik'
export const HIKAYE_GORUNURLUKLERI: HikayeGorunurlugu[] = ['arkadaslar', 'herkese_acik']

/**
 * Bir etiketin fotograf uzerindeki yeri. x/y ORANSAL (0..1, ogenin
 * MERKEZI), olcek 1 = varsayilan boy. Oransal olmasi sart: hikayeyi
 * baska boyda bir telefon aciyor ve etiket ayni yerde durmali.
 */
export type HikayeKonum = { x: number; y: number; olcek: number }
export type HikayeYerlesimi = {
  yazi?: HikayeKonum
  ifade?: HikayeKonum
  mekan?: HikayeKonum
  /** Arkadas etiketleri kullanici kimligine gore. */
  etiketler?: Record<string, HikayeKonum>
}

export const VARSAYILAN_KONUM: Record<'yazi' | 'ifade' | 'mekan', HikayeKonum> = {
  yazi: { x: 0.5, y: 0.66, olcek: 1 },
  mekan: { x: 0.5, y: 0.76, olcek: 1 },
  ifade: { x: 0.5, y: 0.4, olcek: 1 },
}

/** Sunucudan gelen yerlesim cizilmeden once temizlenir: bozuk/eksik
 *  deger varsayilana duser, konumlar ekranin disina tasamaz. */
export function konumuDuzelt(konum: unknown, varsayilan: HikayeKonum): HikayeKonum {
  const k = konum as Partial<HikayeKonum> | null | undefined
  const sayi = (deger: unknown, yedek: number, alt: number, ust: number) =>
    typeof deger === 'number' && Number.isFinite(deger) ? Math.min(ust, Math.max(alt, deger)) : yedek
  return {
    x: sayi(k?.x, varsayilan.x, 0, 1),
    y: sayi(k?.y, varsayilan.y, 0, 1),
    olcek: sayi(k?.olcek, varsayilan.olcek, 0.5, 3),
  }
}

export type Hikaye = {
  id: string
  kullaniciId: string
  /** Kovadaki yol. */
  fotograf: string
  /** Imzali adres; imzalanamadiysa null (cagiran kareyi atlar). */
  fotografUrl: string | null
  yazi: string | null
  /** `public.ifadeler` slug'i; check-in ile ayni sozluk. */
  ifade: string | null
  /** ONAYLANMIS etiketler (onay bekleyen sunucudan hic gelmiyor). */
  etiketler: HikayeEtiketi[]
  mekanId: string | null
  mekanAdi: string | null
  olusturuldu: string
  bitis: string
  gordum: boolean
  /** Yalnizca sahibine anlamli; baskasinda sunucu 0 verir. */
  goruntulenmeSayisi: number
  gorunurluk: HikayeGorunurlugu
  /** Etiketlerin fotograf uzerindeki yerleri; yoksa varsayilan dizilim. */
  yerlesim: HikayeYerlesimi | null
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
  ifade: string | null
  etiketler: HikayeEtiketi[] | null
  mekan_id: string | null
  mekan_adi: string | null
  olusturuldu: string
  bitis: string
  gordum: boolean
  goruntulenme_sayisi: number
  gorunurluk: HikayeGorunurlugu | null
  yerlesim: HikayeYerlesimi | null
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
 *
 * `kullaniciId` verilirse YALNIZCA o kisinin hikayeleri gelir (profil
 * halkasi). Serit modunda sunucu kendim + arkadaslarimla siniri kendi
 * ciziyor: yabancinin "herkese acik" hikayesi ana sayfaya DUSMEZ, ancak
 * profilinden acilir.
 */
export async function hikayeAkisiniGetir(kullaniciId?: string): Promise<HikayeGrubu[]> {
  const [{ data, error }, benimId] = await Promise.all([
    supabase.rpc('hikaye_akisi', kullaniciId ? { p_kullanici: kullaniciId } : {}),
    kullaniciKimligi(),
  ])
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
      ifade: s.ifade ?? null,
      etiketler: s.etiketler ?? [],
      mekanId: s.mekan_id,
      mekanAdi: s.mekan_adi,
      olusturuldu: s.olusturuldu,
      bitis: s.bitis,
      gordum: s.gordum,
      goruntulenmeSayisi: s.goruntulenme_sayisi ?? 0,
      gorunurluk: s.gorunurluk ?? 'arkadaslar',
      yerlesim: s.yerlesim ?? null,
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
export async function hikayeEkle(
  yerelUri: string,
  yazi: string | null,
  mekanId: string | null,
  ifade: string | null = null,
  etiketler: string[] = [],
  gorunurluk: HikayeGorunurlugu = 'arkadaslar',
  yerlesim: HikayeYerlesimi | null = null
): Promise<string> {
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
    p_ifade: ifade,
    p_etiketler: etiketler.length > 0 ? etiketler : null,
    p_gorunurluk: gorunurluk,
    p_yerlesim: yerlesim,
  })
  if (error) {
    await supabase.storage.from(KOVA).remove([yukleme.data.path])
    throw new Error(hataMetni(error))
  }
  // Serit artik eski: bir sonraki okuma sunucudan gelsin, yoksa
  // izleyici bir hikaye EKSIK aciliyor (kullanicinin bildirimi).
  seritOnbelleginiDusur()
  return (data as { id: string }).id
}

/** Goruntuleme kaydi; sunucu kendi hikayemde ve gorunmeyen hikayede sessizce atlar. */
/** Gorme kaydi; izleyenin bu aniya DAHA ONCE attigi ifadeyi doner
 *  (yoksa, ya da kendi animsa null). */
export async function hikayeGoruntulendi(hikayeId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('hikaye_goruntulendi', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
  return typeof data === 'string' ? data : null
}

/** Ani karti oran (en/boy): paylasan ve izleyen AYNI kareyi gorur. */
export const ANI_KART_ORANI = 0.88

/**
 * ANIYA IFADE (2026-09-24, kullanicinin karari): izleyen, fotografin
 * altindaki listeden bir ifade atar; paylasan onu "Gorenler"de gorur.
 * Kisi basina ani basina TEK ifade; null kaldirir. Kurallar sunucuda
 * (goremeyen atamaz, kendi anina atamazsin, sozluk disi slug red).
 */
export async function hikayeIfadesiGonder(hikayeId: string, ifade: string | null): Promise<void> {
  const { error } = await supabase.rpc('hikaye_ifadesi_gonder', { p_hikaye_id: hikayeId, p_ifade: ifade })
  if (error) throw new Error(hataMetni(error))
}

export type HikayeGoruntuleyen = {
  id: string
  ad: string
  kullaniciAdi: string
  avatarUrl: string | null
  goruldu: string
  /** Attigi ifade (slug) ya da null. */
  ifade: string | null
}

/** Yalnizca sahibine (sunucu baskasina bos doner). En yeni izleyen once. */
export async function hikayeGoruntuleyenleriGetir(hikayeId: string): Promise<HikayeGoruntuleyen[]> {
  const { data, error } = await supabase.rpc('hikaye_goruntuleyenler', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
  const satirlar = (data ?? []) as { kullanici_id: string; goruldu: string; ifade?: string | null }[]
  const ozetler = await profilOzetleriniGetir(satirlar.map((s) => s.kullanici_id))
  return satirlar
    .filter((s) => ozetler[s.kullanici_id])
    // Ifade atanlar ONCE (tepkiler gozden kacmasin), sonra en yeni.
    .sort((a, b) => Number(!a.ifade) - Number(!b.ifade) || b.goruldu.localeCompare(a.goruldu))
    .map((s) => ({
      id: s.kullanici_id,
      ad: ozetler[s.kullanici_id].ad,
      kullaniciAdi: ozetler[s.kullanici_id].rumuz,
      avatarUrl: ozetler[s.kullanici_id].avatarUrl,
      goruldu: s.goruldu,
      ifade: s.ifade ?? null,
    }))
}

/** Sahibi siler: RPC satiri siler ve yolu doner, dosya kovadan istemcice silinir. */
export async function hikayeSil(hikayeId: string): Promise<void> {
  const { data, error } = await supabase.rpc('hikaye_sil', { p_hikaye_id: hikayeId })
  if (error) throw new Error(hataMetni(error))
  const yol = data as string | null
  if (yol) await supabase.storage.from(KOVA).remove([yol])
  seritOnbelleginiDusur()
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

/**
 * SERIT ONBELLEGI BURADA YONETILIYOR (2026-09-22).
 *
 * Kullanicinin bildirimi: "burda iki hikaye var bir tane varmis gibi
 * cubuk ilerliyor, ustte ikinci sonradan beliriyor." Sebep BAYAT
 * ONBELLEK: izleyici seridin onbellegiyle aninda aciliyor ama hikaye
 * eklendiginde/silindiginde o onbellek dusurulmuyordu. Ekran bir
 * hikayelik eski veriyle acilip taze veri gelince cubuk sayisi
 * degisiyordu.
 *
 * Artik yazma da dusurme de bu dosyada: `hikayeEkle` / `hikayeSil`
 * onbellegi dusuruyor ve bir sonraki okuma sunucudan geliyor. Ayrica
 * YASLI onbellek hic kullanilmiyor (uygulama acik unutulmus olabilir).
 */
export const SERIT_ONBELLEK_OMRU_MS = 90 * 1000

type SeritOnbellegi = { veri: HikayeSeridiVerisi; zaman: number }

/** Seritin son okunan hali; yasli ya da yoksa null. */
export function seritOnbelleginiOku(): HikayeSeridiVerisi | null {
  const kayit = onbellekOku<SeritOnbellegi>(ANAHTAR.hikayeSeridi)
  if (!kayit) return null
  if (Date.now() - kayit.zaman > SERIT_ONBELLEK_OMRU_MS) return null
  return kayit.veri
}

function seritOnbellegineYaz(veri: HikayeSeridiVerisi) {
  onbellekYaz<SeritOnbellegi>(ANAHTAR.hikayeSeridi, { veri, zaman: Date.now() })
}

/** Hikaye eklendi/silindi: bir sonraki okuma sunucudan gelsin. */
export function seritOnbelleginiDusur() {
  onbellekSil(ANAHTAR.hikayeSeridi)
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
    const veri: HikayeSeridiVerisi = {
      gruplar,
      ben: { id: benimGrubum.kullaniciId, ad: benimGrubum.ad, kullaniciAdi: benimGrubum.kullaniciAdi, avatarUrl: benimGrubum.avatarUrl },
    }
    seritOnbellegineYaz(veri)
    return veri
  }
  const uid = await kullaniciKimligi()
  const ozet = uid ? (await profilOzetleriniGetir([uid]))[uid] : undefined
  const veri: HikayeSeridiVerisi = {
    gruplar,
    ben: uid && ozet ? { id: uid, ad: ozet.ad, kullaniciAdi: ozet.rumuz, avatarUrl: ozet.avatarUrl } : null,
  }
  seritOnbellegineYaz(veri)
  return veri
}

/**
 * ANLIK ARSIVI (2026-09-24, kullanicinin karari): kisinin KENDI butun
 * anliklari (suresi dolmuslar dahil), en yeni once. Yalnizca sahibi
 * gorur (RLS "kendi anlik arsivi"); 24 saat sonra baskalari artik
 * goremez. Gorenler ve ifadeler 24 saatte silindigi icin arsivde
 * yalnizca fotograf, mekan ve zaman var. Izleyici bunu TEK GRUP olarak
 * acar (`/hikaye/izle?arsiv=<id>`).
 */
export async function anlikArsiviniGetir(): Promise<HikayeGrubu | null> {
  const uid = await kullaniciKimligi()
  if (!uid) return null
  const { data, error } = await supabase.rpc('anlik_arsivim', { p_adet: 200 })
  if (error) throw new Error(hataMetni(error))
  type Satir = {
    id: string
    fotograf: string
    mekan_id: string | null
    mekan_adi: string | null
    olusturuldu: string
    bitis: string
    gorunurluk: HikayeGorunurlugu
  }
  const satirlar = (data ?? []) as Satir[]
  const [urller, ozetler] = await Promise.all([
    hikayeMedyasiUrlHaritasi(satirlar.map((s) => s.fotograf)),
    profilOzetleriniGetir([uid]),
  ])
  const ozet = ozetler[uid]
  return {
    kullaniciId: uid,
    ad: ozet?.ad ?? '',
    kullaniciAdi: ozet?.rumuz ?? '',
    avatarUrl: ozet?.avatarUrl ?? null,
    benimMi: true,
    gorulmemisVar: false,
    hikayeler: satirlar.map((s) => ({
      id: s.id,
      kullaniciId: uid,
      fotograf: s.fotograf,
      fotografUrl: urller[s.fotograf] ?? null,
      yazi: null,
      ifade: null,
      etiketler: [],
      mekanId: s.mekan_id,
      mekanAdi: s.mekan_adi,
      olusturuldu: s.olusturuldu,
      bitis: s.bitis,
      gordum: true,
      goruntulenmeSayisi: 0,
      gorunurluk: s.gorunurluk,
      yerlesim: null,
    })),
  }
}

/** Anlik hala seritte mi (24 saati dolmadi mi)? */
export function anlikAktifMi(bitis: string, simdi: number = Date.now()): boolean {
  return new Date(bitis).getTime() > simdi
}

export type BekleyenHikayeEtiketi = {
  hikayeId: string
  fotograf: string
  mekanAdi: string | null
  etiketleyenId: string
  etiketleyenAd: string
  etiketleyenKullaniciAdi: string
  olusturuldu: string
}

/**
 * Onayimi bekleyen HIKAYE etiketleri (2026-09-22). Kural check-in ile
 * ayni: `profiller.etiket_onayi_gerekli` aciksa etiket once onaya
 * duesuer ve onaylanana kadar izleyicide GORUNMEZ.
 */
export async function bekleyenHikayeEtiketleriniGetir(): Promise<BekleyenHikayeEtiketi[]> {
  const { data, error } = await supabase.rpc('bekleyen_hikaye_etiketlerim')
  if (error) throw new Error(hataMetni(error))
  type Satir = {
    hikaye_id: string
    fotograf: string
    mekan_adi: string | null
    etiketleyen_id: string
    etiketleyen_ad: string
    etiketleyen_kullanici_adi: string
    olusturuldu: string
  }
  return (data as Satir[]).map((s) => ({
    hikayeId: s.hikaye_id,
    fotograf: s.fotograf,
    mekanAdi: s.mekan_adi,
    etiketleyenId: s.etiketleyen_id,
    etiketleyenAd: s.etiketleyen_ad,
    etiketleyenKullaniciAdi: s.etiketleyen_kullanici_adi,
    olusturuldu: s.olusturuldu,
  }))
}

export async function hikayeEtiketiniYanitla(hikayeId: string, onay: boolean): Promise<void> {
  const { error } = await supabase.rpc('hikaye_etiketini_yanitla', {
    p_hikaye_id: hikayeId,
    p_onay: onay,
  })
  if (error) throw new Error(hataMetni(error))
  seritOnbelleginiDusur()
}
