import { supabase } from './supabase'

/**
 * "Bu numarada zaten bir hesap var mi?" sorusunu SMS kodu
 * GONDERILMEDEN once cevaplar.
 *
 * Kullanicinin istegi (2026-08-27): kayitli bir numara girilirse hata
 * kayit ekraninda cikmali, bosuna kod gonderilmemeli.
 *
 * UC DEGER DONER, iki degil:
 *   true  -> numarada tamamlanmis bir hesap var (profil satiri da var)
 *   false -> yok; kayit akisi devam edebilir
 *   null  -> CEVAP ALINAMADI (ag hatasi ya da sunucudaki saatlik tavan)
 *
 * `null` onemli: bu durumda akis ESKI haline duesuyor, yani kod
 * gonderiliyor ve "zaten kayitli" kontrolu dogrulama ekranindaki son
 * kapida yapiliyor. Boylece ne mesru kullanici ekranda kilitleniyor,
 * ne de sunucu tavani asildiginda numara taramasina cevap veriliyor.
 *
 * Sunucu tarafi: `public.telefon_kayitli_mi` (security definer, IP
 * basina saatlik tavan, yalnizca boolean doner).
 */
export async function telefonKayitliMi(eFormatliTelefon: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('telefon_kayitli_mi', {
    p_telefon: eFormatliTelefon,
  })

  if (error) {
    // Tavan asildi, ag koptu ya da fonksiyon yok. Hicbiri kullaniciya
    // gosterilmiyor: bu kontrol bir HIZLI YOL, zorunlu bir adim degil.
    console.warn('telefon_kayitli_mi cevap vermedi:', error.message)
    return null
  }

  return data === true
}
