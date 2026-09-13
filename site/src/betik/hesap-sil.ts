/**
 * Web uzerinden hesap silme.
 *
 * Google Play, uygulamayi silmis kullanicinin da hesabini
 * silebilmesini sart kosuyor; bu sayfa o sarti karsiliyor.
 *
 * Sunucuda DEGISIKLIK YOK: `hesap-sil` Edge Function'inda CORS
 * `Access-Control-Allow-Origin: *` ve `verify_jwt` acik, yani bu
 * sayfadan cagrilabiliyor.
 *
 * Guvenlik: bu sayfanin hicbir yetkisi yok. Service-role anahtari
 * BURAYA GIRMEZ. Silme karari tamamen sunucuda veriliyor - fonksiyon
 * parolayi kendisi yeniden dogruluyor.
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
const dugme = document.getElementById('sil-dugmesi') as HTMLButtonElement

function bildir(mesaj: string, tur: 'hata' | 'bilgi' | 'basari') {
  durum.textContent = mesaj
  durum.className = 'durum ' + tur
}

form.addEventListener('submit', async (olay) => {
  olay.preventDefault()

  const veri = new FormData(form)
  const eposta = String(veri.get('eposta') || '').trim()
  const parola = String(veri.get('parola') || '')

  if (!eposta || !parola) {
    bildir(t.eksik, 'hata')
    return
  }

  dugme.disabled = true
  bildir(t.kontrol, 'bilgi')

  // 1) Oturum ac - JWT olmadan Edge Function cagrilamaz.
  const { data: oturum, error: girisHatasi } =
    await istemci.auth.signInWithPassword({ email: eposta, password: parola })

  if (girisHatasi || !oturum.session) {
    // Uc dal ayriliyor - `hesap-sil` Edge Function'indaki "DUZELTME
    // TURU 1" ile ayni gerekce: rate limit ya da ag/sunucu hatasinda
    // "parolan yanlis" demek dogru parolayi yazan birini bile tekrar
    // tekrar denemeye ve kilitlenmeyi derinlestirmeye iter. Yalnizca
    // GERCEK bir gecersiz kimlik bilgisi (`code === 'invalid_credentials'`,
    // `code` yoksa `status === 400`) "yanlis parola" diyor - sunucudaki
    // ayni ayrimin birebir aynisi.
    if (
      girisHatasi &&
      (girisHatasi.code === 'invalid_credentials' || girisHatasi.status === 400)
    ) {
      // Parolasi olmayan hesaplar da buraya duesuer (kayit e-posta
      // koduyla basliyor, parola profil olusturma adiminda
      // belirleniyor). Mesaj bu ihtimali de soyluyor.
      bildir(t.girisHatasi, 'hata')
    } else if (girisHatasi?.status === 429) {
      bildir(t.cokDeneme, 'hata')
    } else {
      bildir(t.girisTamamlanamadi, 'hata')
    }
    dugme.disabled = false
    return
  }

  bildir(t.siliniyor, 'bilgi')

  // 2) Silme. Parola GOVDEDE de gonderiliyor; fonksiyon onu sunucuda
  // yeniden dogruluyor, yani calinmis bir oturum jetonu tek basina
  // yetmiyor.
  const { data, error } = await istemci.functions.invoke('hesap-sil', {
    body: { parola },
  })

  if (error) {
    bildir(t.silinemedi, 'hata')
    dugme.disabled = false
    return
  }

  if (data?.silindi) {
    form.hidden = true
    bildir(t.silindi, 'basari')
    return
  }

  bildir(t.beklenmeyen, 'hata')
  dugme.disabled = false
})
