/**
 * Web giris (2026-09-14). Sifre dogrudan Supabase'e gider; bu sayfa ve
 * Cloudflare hicbir zaman gormez. Basarili giriste oturum, uygulamanin
 * web surumune adres cubugunun `#` (fragment) kismiyla tasinir:
 *
 *   https://slooin.expo.app/#access_token=...&refresh_token=...&expires_in=...&token_type=bearer
 *
 * Fragment sunucuya HIC gitmez (tarayici gondermez); supabase-js'in
 * `detectSessionInUrl` mekanizmasi (uygulamada web'de acik) onu okuyup
 * oturumu kaydediyor ve adres cubugundan siliyor. Iki alan adi farkli
 * oldugu icin (slooin.com / slooin.expo.app) oturum baska yolla
 * tasinamiyor.
 *
 * Bu sayfa oturumu KENDI tarafinda saklamiyor (`persistSession: false`):
 * kullaniciyi uygulamaya gonderdikten sonra burada tutacak bir sey yok.
 */
import { createClient } from '@supabase/supabase-js'
import { sozluk } from '../i18n/sozlukler'

const t = sozluk(document.documentElement.lang).giris.betik
const URL = import.meta.env.PUBLIC_SUPABASE_URL
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const UYGULAMA = 'https://slooin.expo.app/'

const istemci = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

const form = document.getElementById('giris-formu') as HTMLFormElement
const durum = document.getElementById('durum') as HTMLParagraphElement
const dugme = document.getElementById('giris-dugmesi') as HTMLButtonElement

function bildir(mesaj: string, tur: 'hata' | 'bilgi' | 'basari') {
  durum.textContent = mesaj
  durum.className = 'durum ' + tur
}

form.addEventListener('submit', async (olay) => {
  olay.preventDefault()
  const veri = new FormData(form)
  const eposta = String(veri.get('eposta') || '').trim()
  const sifre = String(veri.get('sifre') || '')
  if (!eposta || !sifre) {
    bildir(t.eksik, 'hata')
    return
  }
  dugme.disabled = true
  bildir(t.giriliyor, 'bilgi')

  const { data, error } = await istemci.auth.signInWithPassword({ email: eposta, password: sifre })
  if (error || !data.session) {
    dugme.disabled = false
    // Yanlis parola ile olmayan hesap AYNI metni alir: hesabin varligi sizmasin.
    bildir(/invalid|credentials/i.test(error?.message || '') ? t.yanlis : t.basarisiz, 'hata')
    return
  }

  bildir(t.yonlendiriliyor, 'basari')
  const s = data.session
  const parcalar = new URLSearchParams({
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_in: String(s.expires_in),
    expires_at: String(s.expires_at ?? ''),
    token_type: s.token_type,
    type: 'web_giris',
  })
  window.location.replace(UYGULAMA + '#' + parcalar.toString())
})
