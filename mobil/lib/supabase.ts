import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // WEB'DE ACIK (2026-09-14): slooin.com/giris sayfasi giris yaptirip
    // oturumu buraya adres cubugunun `#` kismiyla tasiyor
    // (site/src/betik/giris.ts). supabase-js fragment'taki
    // access_token/refresh_token'i okuyup oturumu kaydeder ve adresi
    // temizler. Telefonda kapali: orada adres cubugu yok ve derin
    // baglanti akisi bu mekanizmayi kullanmiyor.
    detectSessionInUrl: Platform.OS === 'web',
  },
})

AppState.addEventListener('change', (durum) => {
  if (durum === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
