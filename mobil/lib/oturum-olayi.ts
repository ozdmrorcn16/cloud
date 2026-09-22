import { supabase } from './supabase'

/**
 * OTURUM DEGISIMINE ABONE OLMANIN TEK KAPISI (2026-09-22).
 *
 * Onbellek tutan moduller (kimlik, imza, ekran verisi) giris/cikista
 * kendilerini dusurmek zorunda: aksi halde baska bir hesaba girildiginde
 * onceki hesabin verisi bir an gorunur. Abonelik MODUL YUKLENIRKEN
 * kuruluyor, yani `supabase.auth` o anda hazir olmak zorunda.
 *
 * Neden savunmali (`?.` ve try/catch): testlerde `supabase` dar bir
 * mock'la degistiriliyor (yalnizca `rpc`, `from`, `storage` gibi o
 * testin ihtiyaci kadar). Modul yuklenirken duz bir cagri yapilirsa o
 * paketlerin TAMAMI "auth is not a function" ile cokuyor - 16 test
 * paketinde yasandi. Onbellek dusurme bir EK GUVENLIK; kurulamadiginda
 * uygulamanin calismasi degil, yalnizca o ek guvenlik kaybolur ve bu
 * testlerde zararsizdir (her test kendi modulunu taze yukluyor).
 */
export function oturumDegisinceSifirla(sifirla: () => void): void {
  try {
    supabase.auth?.onAuthStateChange?.((olay) => {
      if (olay === 'SIGNED_OUT' || olay === 'SIGNED_IN' || olay === 'USER_UPDATED') sifirla()
    })
  } catch {
    // Abonelik kurulamadi (dar mock): onbellek yalnizca elle sifirlanir.
  }
}
