/**
 * Web uzerinden hesap silme - E-POSTA ONAY KODUYLA (2026-09-13).
 *
 * Google Play, uygulamayi silmis kullanicinin da hesabini
 * silebilmesini sart kosuyor; bu sayfa o sarti karsiliyor.
 *
 * Akis: e-posta -> `signInWithOtp` (shouldCreateUser: false, yani hesap
 * yoksa acilmaz) -> 6 haneli kod -> `verifyOtp` (yeni oturum, taze
 * giris) -> `hesap-sil` Edge Function'i parolasiz cagrilir; fonksiyon
 * son girisin 10 dakikadan taze oldugunu SUNUCUDA dogrular.
 *
 * Onceki akis parolaydi (2026-09-07). Kullanicinin karari: "hesap silme
 * adimina e-postaya onaylama kodu getirilsin".
 *
 * Guvenlik: bu sayfanin hicbir yetkisi yok. Service-role anahtari
 * BURAYA GIRMEZ. Silme karari tamamen sunucuda veriliyor.
 */
import { createClient } from '@supabase/supabase-js'
import { sozluk } from '../i18n/sozlukler'

// Durum metinleri sayfanin diline gore (`<html lang>`); yedi dil.
const t = sozluk(document.documentElement.lang).hesapSil.betik

const URL = import.meta.env.PUBLIC_SUPABASE_URL
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

const istemci = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const form = document.getElementById('silme-formu') as HTMLFormElement
const durum = document.getElementById('durum') as HTMLParagraphElement
const kodDugmesi = document.getElementById('kod-dugmesi') as HTMLButtonElement
const kodAlani = document.getElementById('kod-alani') as HTMLDivElement
const silDugmesi = document.getElementById('sil-dugmesi') as HTMLButtonElement

function bildir(mesaj: string, tur: 'hata' | 'bilgi' | 'basari') {
  durum.textContent = mesaj
  durum.className = 'durum ' + tur
}

function eposta(): string {
  return String(new FormData(form).get('eposta') || '').trim()
}

// 1) KOD GONDER. `shouldCreateUser: false`: silme sayfasi hesap ACMAZ;
// olmayan adres icin GoTrue `otp_disabled` / "Signups not allowed"
// donuyor ve bunu "hesap bulunamadi" diye gosteriyoruz.
kodDugmesi.addEventListener('click', async () => {
  const adres = eposta()
  if (!adres) {
    bildir(t.eksik, 'hata')
    return
  }
  kodDugmesi.disabled = true
  bildir(t.kontrol, 'bilgi')

  const { error } = await istemci.auth.signInWithOtp({
    email: adres,
    options: { shouldCreateUser: false },
  })

  if (error) {
    const kod = (error as { code?: string }).code
    if (kod === 'otp_disabled' || /signups not allowed/i.test(error.message)) {
      bildir(t.hesapYok, 'hata')
    } else if (error.status === 429) {
      bildir(t.cokDeneme, 'hata')
    } else {
      bildir(t.gonderilemedi, 'hata')
    }
    kodDugmesi.disabled = false
    return
  }

  kodAlani.hidden = false
  kodDugmesi.disabled = false
  bildir(t.kodGonderildi, 'bilgi')
})

// 2) KODU DOGRULA VE SIL.
form.addEventListener('submit', async (olay) => {
  olay.preventDefault()

  const adres = eposta()
  const kod = String(new FormData(form).get('kod') || '').replace(/\D/g, '')
  if (!adres) {
    bildir(t.eksik, 'hata')
    return
  }
  if (kod.length !== 6) {
    bildir(t.kodEksik, 'hata')
    return
  }

  silDugmesi.disabled = true

  const { data: oturum, error: kodHatasi } = await istemci.auth.verifyOtp({
    email: adres,
    token: kod,
    type: 'email',
  })

  if (kodHatasi || !oturum.session) {
    bildir(kodHatasi?.status === 429 ? t.cokDeneme : t.kodHatasi, 'hata')
    silDugmesi.disabled = false
    return
  }

  bildir(t.siliniyor, 'bilgi')

  // Parola GONDERILMIYOR: sunucu bu durumda son girisin tazeligine
  // bakiyor - `verifyOtp` az once yeni bir giris yaptirdi.
  const { data, error } = await istemci.functions.invoke('hesap-sil', { body: {} })

  if (error) {
    bildir(t.silinemedi, 'hata')
    silDugmesi.disabled = false
    return
  }

  if (data?.silindi) {
    form.hidden = true
    bildir(t.silindi, 'basari')
    return
  }

  bildir(t.beklenmeyen, 'hata')
  silDugmesi.disabled = false
})
