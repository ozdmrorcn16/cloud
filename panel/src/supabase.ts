import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// SAHTE KIP yalnizca gelistirmede ve acikca istenince (VITE_SAHTE=1):
// tasarim uzerinde calisirken TOTP'siz ornek veri. Uretim derlemesinde
// `import.meta.env.DEV` false oldugu icin bu dal derlemeden DUSER.
const sahte = import.meta.env.DEV && import.meta.env.VITE_SAHTE === '1'

if (!sahte && (!url || !anon)) {
  throw new Error(
    'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanimli olmali (panel/.env)'
  )
}

// Panelde service-role anahtari YOKTUR (spec karar 55). Butun erisim
// moderator hesabinin oturumu uzerinden, security definer RPC'lerle
// olur ve yetki kapisi veritabanindadir: moderatorler tablosunda satir
// + JWT'nin aal talebi 'aal2'. Bu yuzden panelin paketinde hicbir sir
// yok ve barinma sorusu bir guvenlik sorusu degil.
// Dinamik import: statik olsaydi ornek veri uretim paketine de girerdi
// (olculdu); `DEV` derlemede false oldugu icin bu dal hic uretilmiyor.
export const supabase: SupabaseClient = sahte
  ? ((await import('./sahte')).sahteIstemci() as unknown as SupabaseClient)
  : createClient(url, anon)
