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

export type Yollar = { profil: string[]; checkIn: string[] }

// Storage'dan silinecek dosya yollari. Bos ve null degerler eleniyor:
// fotografsiz check-in'ler ve profiller normal.
export function fotografYollari(
  _kullaniciId: string,
  profilFotograflari: (string | null)[],
  checkInFotograflari: (string | null)[]
): Yollar {
  const temizle = (liste: (string | null)[]) =>
    liste.filter((y): y is string => typeof y === 'string' && y.length > 0)
  return {
    profil: temizle(profilFotograflari),
    checkIn: temizle(checkInFotograflari),
  }
}
