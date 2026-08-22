// Hesap durumu ve haklari Task 15: "hesap-sil" fonksiyonunun SAF mantigi.
//
// Neden ayri dosya: `index.ts` yuklendigi anda `Deno.serve` cagiriyor,
// yani onu import eden bir test bir sunucu ayaga kaldirirdi. Onay metni
// karsilastirmasi ve silinecek dosya yollarinin ayiklanmasi veritabanina
// da aga da dokunmuyor; buraya alinip `index_test.ts` tarafindan dogrudan
// test ediliyor.
//
// Buraya YALNIZCA saf kod girer. Veritabani, Storage ya da auth admin
// API'sine dokunan her sey `index.ts` icinde kalir.

// Onay metni kullanici adiyla BIREBIR eslesmeli. Buyuk/kucuk harf
// esnekligi YOK: kullanici adlari zaten hep kucuk harf saklaniyor ve
// bu bir yikici islemin son kapisi - esneklik burada guvenlik degil
// risk.
export function onayGecerliMi(kullaniciAdi: string, onay: string | null): boolean {
  if (onay === null) return false
  return onay.trim() === kullaniciAdi
}

export type Yollar = {
  profil: string[]
  checkIn: string[]
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
  checkInFotograflari: (string | null)[]
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
    yabanciElenen,
  }
}
