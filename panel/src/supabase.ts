import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  throw new Error(
    'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanimli olmali (panel/.env)'
  )
}

// Panelde service-role anahtari YOKTUR (spec karar 55). Butun erisim
// moderator hesabinin oturumu uzerinden, security definer RPC'lerle
// olur ve yetki kapisi veritabanindadir: moderatorler tablosunda satir
// + JWT'nin aal talebi 'aal2'. Bu yuzden panelin paketinde hicbir sir
// yok ve barinma sorusu bir guvenlik sorusu degil.
export const supabase = createClient(url, anon)
