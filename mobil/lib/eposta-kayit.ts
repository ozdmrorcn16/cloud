import { supabase } from './supabase'
import { cihazKimligi } from './cihaz'

/**
 * "Bu e-posta adresiyle zaten bir hesap var mi?" sorusunu dogrulama
 * postasi GONDERILMEDEN once cevaplar.
 *
 * Kullanicinin ilkesi (2026-08-27, telefon icin konmustu; e-postaya
 * gecerken korundu): kayitli bir adres girilirse hata kayit ekraninda
 * cikmali, bosuna posta gonderilmemeli.
 *
 * UC DEGER DONER, iki degil:
 *   true  -> adreste tamamlanmis bir hesap var (profil satiri da var)
 *   false -> yok; kayit akisi devam edebilir
 *   null  -> CEVAP ALINAMADI (ag hatasi ya da sunucudaki saatlik tavan)
 *
 * `null` onemli: bu durumda akis ESKI haline duesuyor, yani posta
 * gonderiliyor ve "zaten kayitli" kontrolu dogrulama ekranindaki son
 * kapida yapiliyor. Boylece ne mesru kullanici ekranda kilitleniyor,
 * ne de sunucu tavani asildiginda ADRES TARAMASINA cevap veriliyor.
 *
 * Sunucu tarafi: `public.eposta_kayitli_mi` (security definer, yalnizca
 * boolean doner). Hiz siniri telefon surumuyle AYNI iki katmanli
 * yapiyi ve ayni `hiz_limitleri` tablosunu kullaniyor.
 */
export async function epostaKayitliMi(eposta: string): Promise<boolean | null> {
  const cihaz = await cihazKimligi()

  const { data, error } = await supabase.rpc('eposta_kayitli_mi', {
    p_eposta: eposta,
    p_cihaz: cihaz,
  })

  if (error) {
    // Tavan asildi, ag koptu ya da fonksiyon yok. Hicbiri kullaniciya
    // gosterilmiyor: bu kontrol bir HIZLI YOL, zorunlu bir adim degil.
    console.warn('eposta_kayitli_mi cevap vermedi:', error.message)
    return null
  }

  return data === true
}
