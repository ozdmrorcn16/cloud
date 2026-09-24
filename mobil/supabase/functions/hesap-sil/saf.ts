// Hesap durumu ve haklari Task 15: "hesap-sil" fonksiyonunun SAF mantigi.
//
// Neden ayri dosya: `index.ts` yuklendigi anda `Deno.serve` cagiriyor,
// yani onu import eden bir test bir sunucu ayaga kaldirirdi. Silinecek
// dosya yollarinin ayiklanmasi veritabanina da aga da dokunmuyor; buraya
// alinip `index_test.ts` tarafindan dogrudan test ediliyor.
//
// Buraya YALNIZCA saf kod girer. Veritabani, Storage ya da auth admin
// API'sine dokunan her sey `index.ts` icinde kalir.

/**
 * SILMEDEN ONCE GIRIS NE KADAR TAZE OLMALI (dakika).
 *
 * ASIL KAPI (kullanicinin karari 2026-09-13: "hesap silme adimina
 * e-postaya onaylama kodu getirilsin, kodu giren biri hesabini
 * silebilecek"). Uygulama ve web formu silmeden hemen once e-postaya
 * gelen kodu `verifyOtp` ile dogruluyor (Apple/Google ile acilmis
 * hesaplar `signInWithIdToken` ile). Ikisi de `auth.users.last_sign_in_at`
 * degerini ilerletiyor; salt jeton yenileme (refresh) ILERLETMIYOR.
 * Sunucu bu alanin 10 dakikadan taze oldugunu dogruluyor - yani
 * calinmis bir oturum jetonu tek basina hesabi silemez. Parola yolu
 * sunucuda DURUYOR (canli test betikleri ve eski istemciler icin) ama
 * ekranlar artik kullanmiyor; giris icin parola yerinde.
 */
export const TAZELIK_DAKIKA = 10

/**
 * Son giris yeterince taze mi?
 *
 * `sonGiris` GoTrue'nun verdigi ISO metni; okunamazsa (null, bos,
 * gecersiz tarih) TAZE DEGIL sayilir - belirsizlikte kapi kapali.
 * `simdi` test edilebilirlik icin parametre.
 */
export function girisTazeMi(sonGiris: string | null | undefined, simdi: Date = new Date()): boolean {
  if (!sonGiris) return false
  const zaman = new Date(sonGiris).getTime()
  if (Number.isNaN(zaman)) return false
  const fark = simdi.getTime() - zaman
  return fark >= 0 && fark <= TAZELIK_DAKIKA * 60 * 1000
}

export type Yollar = {
  profil: string[]
  checkIn: string[]
  /** Anlik (hikaye) fotograflari - 2026-09-24'ten beri arsivde SURESIZ
   *  kaliyor, hesap silinince burada silinmeli. */
  anlik: string[]
  // Kullanicinin KENDI klasoru disinda kalip elenen yol sayisi (bkz.
  // asagidaki guvenlik notu). Yolun kendisi disariya asla tasinmaz,
  // yalnizca sayaci - cagiran bunu loglar.
  yabanciElenen: number
}

// Storage'dan silinecek dosya yollari.
//
// GUVENLIK - kontrolor incelemesinde bulunan Critical (C2): bu
// fonksiyon bir zamanlar kullaniciId parametresini KULLANMIYORDU, yani
// `profiller.fotograflar` sutunundaki her yol - kullanici tarafindan
// dogrudan yazilabilen, DEGERI dogrulanmayan bir sutun - oldugu gibi
// service-role'e, dolayisiyla Storage RLS'ini atlayan bir silmeye
// gidiyordu. Saldiri: biri kurbanin fotograf yolunu (baskasinin_profili
// RPC'sinden) okur, kendi `fotograflar` dizisine yazar, hesabini siler;
// fonksiyon service-role ile KURBANIN dosyasini kalici siler.
//
// Iki bucket'in da yol duzeni ayni: `<kullaniciId>/<dosya>` (bkz.
// lib/fotograf-yukle.ts, lib/checkin-fotograf-yukle.ts ve
// storage.objects politikalarindaki
// `(storage.foldername(name))[1] = auth.uid()::text` kaliplari). Bu
// yuzden yolun ILK segmenti `kullaniciId`ye esit DEGILSE yol elenir -
// hem yanlislikla hem kotu niyetle yazilmis "baskasinin klasoru"
// yollarina karsi.
//
// Bos ve null degerler de eleniyor: fotografsiz check-in'ler ve
// profiller normal.
export function fotografYollari(
  kullaniciId: string,
  profilFotograflari: (string | null)[],
  checkInFotograflari: (string | null)[],
  anlikFotograflari: (string | null)[] = []
): Yollar {
  const kendiKlasorundeMi = (y: string): boolean => y.split('/')[0] === kullaniciId

  let yabanciElenen = 0
  const ayikla = (liste: (string | null)[]): string[] => {
    const dolu = liste.filter((y): y is string => typeof y === 'string' && y.length > 0)
    const kendine = dolu.filter(kendiKlasorundeMi)
    yabanciElenen += dolu.length - kendine.length
    return kendine
  }

  return {
    profil: ayikla(profilFotograflari),
    checkIn: ayikla(checkInFotograflari),
    anlik: ayikla(anlikFotograflari),
    yabanciElenen,
  }
}
