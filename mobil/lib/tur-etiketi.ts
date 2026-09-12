import { cevir } from './dil'

/**
 * MEKAN TURU ETIKETI (i18n turu 2026-09-13).
 *
 * Tur adlari VERITABANI DEGERI (Turkce: "Kafe", "Çay evi"); suzgec ve
 * RPC'ler o degerle calisiyor, degismez. Ekranda gorunen etiket ise
 * dile gore: `turler.<ad>` anahtari. Karsiligi olmayan bir tur (eski
 * bir kayit, yeni eklenmis bir deger) OLDUGU GIBI gosterilir - bos ya
 * da ham anahtar yerine Turkce ad.
 *
 * Turkce sozlukte her tur kendisine esleniyor; diger diller cevirisini
 * tasiyor. Grup basliklari icin `turGruplari.<baslik>`.
 */
export function turEtiketi(tur: string): string {
  const anahtar = `turler.${tur}`
  const sonuc = cevir(anahtar)
  return sonuc === anahtar || sonuc.includes(anahtar) ? tur : sonuc
}

export function turGrupEtiketi(baslik: string): string {
  const anahtar = `turGruplari.${baslik}`
  const sonuc = cevir(anahtar)
  return sonuc === anahtar || sonuc.includes(anahtar) ? baslik : sonuc
}
