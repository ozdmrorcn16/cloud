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
    bildir('E-posta ve parolanı gir.', 'hata')
    return
  }

  dugme.disabled = true
  bildir('Hesabın kontrol ediliyor…', 'bilgi')

  // 1) Oturum ac - JWT olmadan Edge Function cagrilamaz.
  const { data: oturum, error: girisHatasi } =
    await istemci.auth.signInWithPassword({ email: eposta, password: parola })

  if (girisHatasi || !oturum.session) {
    // Parolasi olmayan hesaplar da buraya duesuer (kayit e-posta koduyla
    // basliyor, parola profil olusturma adiminda belirleniyor). Mesaj
    // bu ihtimali de soyluyor.
    bildir(
      'Giriş yapılamadı. E-posta ya da parola yanlış olabilir. ' +
        'Hesabını hiç parola belirlemeden açtıysan destek@slooin.com adresine yaz.',
      'hata',
    )
    dugme.disabled = false
    return
  }

  bildir('Hesabın siliniyor…', 'bilgi')

  // 2) Silme. Parola GOVDEDE de gonderiliyor; fonksiyon onu sunucuda
  // yeniden dogruluyor, yani calinmis bir oturum jetonu tek basina
  // yetmiyor.
  const { data, error } = await istemci.functions.invoke('hesap-sil', {
    body: { parola },
  })

  if (error) {
    bildir(
      'Hesap silinemedi. Biraz sonra tekrar dene; sorun sürerse ' +
        'destek@slooin.com adresine yaz.',
      'hata',
    )
    dugme.disabled = false
    return
  }

  if (data?.silindi) {
    form.hidden = true
    bildir(
      'Hesabın silindi. Bu işlem geri alınamaz. ' +
        'Uygulama hâlâ telefonundaysa onu da kaldırabilirsin.',
      'basari',
    )
    return
  }

  bildir('Beklenmeyen bir yanıt alındı. destek@slooin.com adresine yaz.', 'hata')
  dugme.disabled = false
})
