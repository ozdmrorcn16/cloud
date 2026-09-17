/**
 * PROFIL PAYLASIM SAYFASI - `slooin.com/<kullanici_adi>` (2026-09-18).
 *
 * Uygulamadaki "Profili paylas" bu adresi gonderiyor. Sayfa SUNUCUDA
 * ciziliyor (Cloudflare Pages Function), cunku WhatsApp / iMessage /
 * Telegram onizleme robotlari JavaScript calistirmaz: Open Graph
 * etiketleri ilk HTML'de olmak zorunda.
 *
 * Veri: Supabase Edge Function `profil-karti` (kimliksiz; gizlilik
 * kurallari RPC'de - aktif olmayan hesap 404, "Profilim gizli" ya da
 * "aramada gorunme" acikken ad ve fotograf gelmez).
 *
 * Sayfa yalnizca uc sey gosterir: fotograf, ad, kullanici adi. Bir de
 * "Uygulamada ac" (`slooin://kullanici/<id>` - uygulama yukluyse
 * dogrudan profil). Expo web surumune BAGLANTI YOK (2026-09-14 kurali).
 *
 * Dil: `Accept-Language`tan; `_middleware.js` bu yolu dil yonlendirmesinden
 * muaf tutuyor (aksi halde `/de/byorcun/`e atilirdi).
 */
const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar']
const KOK_DIL = 'tr'
const KULLANICI_ADI = /^[a-z0-9._]{3,20}$/
const SAGDAN_SOLA = ['ar']

const METIN = {
  tr: { baslik: 'Slooin', ac: 'Uygulamada aç', aciklama: "Slooin'de profilini gör, arkadaş ekle.", gizliAd: "Slooin'de bir kullanıcı", nedir: 'Slooin nedir?', yok: 'Bu profil bulunamadı', yokAciklama: 'Bağlantı yanlış olabilir ya da hesap artık yok.', indir: 'Uygulama yakında App Store ve Google Play’de.' },
  en: { baslik: 'Slooin', ac: 'Open in app', aciklama: 'See the profile on Slooin, add as a friend.', gizliAd: 'A Slooin user', nedir: 'What is Slooin?', yok: 'Profile not found', yokAciklama: 'The link may be wrong or the account no longer exists.', indir: 'The app is coming soon to the App Store and Google Play.' },
  de: { baslik: 'Slooin', ac: 'In der App öffnen', aciklama: 'Profil auf Slooin ansehen, als Freund hinzufügen.', gizliAd: 'Ein Slooin-Nutzer', nedir: 'Was ist Slooin?', yok: 'Profil nicht gefunden', yokAciklama: 'Der Link ist vielleicht falsch oder das Konto existiert nicht mehr.', indir: 'Die App erscheint bald im App Store und bei Google Play.' },
  es: { baslik: 'Slooin', ac: 'Abrir en la app', aciklama: 'Ver el perfil en Slooin, añadir como amigo.', gizliAd: 'Un usuario de Slooin', nedir: '¿Qué es Slooin?', yok: 'Perfil no encontrado', yokAciklama: 'El enlace puede ser incorrecto o la cuenta ya no existe.', indir: 'La app llegará pronto a App Store y Google Play.' },
  fr: { baslik: 'Slooin', ac: "Ouvrir dans l'app", aciklama: 'Voir le profil sur Slooin, ajouter en ami.', gizliAd: 'Un utilisateur Slooin', nedir: "Qu'est-ce que Slooin ?", yok: 'Profil introuvable', yokAciklama: "Le lien est peut-être erroné ou le compte n'existe plus.", indir: "L'app arrive bientôt sur l'App Store et Google Play." },
  ru: { baslik: 'Slooin', ac: 'Открыть в приложении', aciklama: 'Посмотреть профиль в Slooin, добавить в друзья.', gizliAd: 'Пользователь Slooin', nedir: 'Что такое Slooin?', yok: 'Профиль не найден', yokAciklama: 'Ссылка может быть неверной или аккаунт больше не существует.', indir: 'Приложение скоро появится в App Store и Google Play.' },
  ar: { baslik: 'Slooin', ac: 'افتح في التطبيق', aciklama: 'شاهد الملف الشخصي على Slooin وأضفه كصديق.', gizliAd: 'مستخدم على Slooin', nedir: 'ما هو Slooin؟', yok: 'لم يتم العثور على الملف الشخصي', yokAciklama: 'قد يكون الرابط خاطئًا أو الحساب لم يعد موجودًا.', indir: 'التطبيق قريبًا على App Store وGoogle Play.' },
}

function dilSec(istek) {
  const cerez = (istek.headers.get('Cookie') || '').split(';').map((p) => p.trim()).find((p) => p.startsWith('dil='))
  const secim = cerez ? cerez.slice(4) : null
  if (secim && DILLER.includes(secim)) return secim
  const baslik = istek.headers.get('Accept-Language') || ''
  for (const parca of baslik.split(',')) {
    const dil = parca.trim().split(';')[0].toLowerCase().split('-')[0]
    if (DILLER.includes(dil)) return dil
  }
  return KOK_DIL
}

function kacir(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function basHarf(ad) {
  return (ad || '?').trim().charAt(0).toUpperCase() || '?'
}

function sayfa({ dil, baslik, aciklama, gorsel, govde, durum = 200, kanonik }) {
  const rtl = SAGDAN_SOLA.includes(dil) ? ' dir="rtl"' : ''
  const html = `<!doctype html>
<html lang="${dil}"${rtl}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${kacir(baslik)}</title>
<meta name="description" content="${kacir(aciklama)}">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon-isaret.png">
${kanonik ? `<link rel="canonical" href="${kacir(kanonik)}">` : ''}
<meta property="og:type" content="profile">
<meta property="og:site_name" content="Slooin">
<meta property="og:title" content="${kacir(baslik)}">
<meta property="og:description" content="${kacir(aciklama)}">
<meta property="og:image" content="${kacir(gorsel)}">
${kanonik ? `<meta property="og:url" content="${kacir(kanonik)}">` : ''}
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${kacir(baslik)}">
<meta name="twitter:description" content="${kacir(aciklama)}">
<meta name="twitter:image" content="${kacir(gorsel)}">
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FFFFFF;color:#17130F;font-family:"Instrument Sans",-apple-system,"Segoe UI",Roboto,sans-serif;padding:24px 16px}
.kart{width:100%;max-width:380px;text-align:center}
.marka{display:inline-flex;align-items:center;gap:8px;font-weight:800;color:#FE7813;font-size:18px;margin-bottom:28px;text-decoration:none}
.marka img{width:28px;height:28px;border-radius:8px}
.avatar{width:148px;height:148px;border-radius:50%;object-fit:cover;box-shadow:0 8px 28px rgba(23,19,15,.14);background:#FFF3E8}
.bos{display:inline-flex;align-items:center;justify-content:center;font-size:56px;font-weight:700;color:#FE7813}
h1{font-size:26px;letter-spacing:-.4px;margin:18px 0 4px;text-wrap:balance}
.rumuz{color:#6E6660;font-size:16px;margin:0 0 6px}
.aciklama{color:#6E6660;font-size:15px;margin:0 0 26px;line-height:1.45}
.dugme{display:block;width:100%;padding:15px 18px;border-radius:16px;background:#FE7813;color:#fff;font-weight:700;font-size:16px;text-decoration:none}
.ikincil{display:block;margin-top:14px;color:#17130F;font-weight:600;text-decoration:none;font-size:15px}
.not{color:#A39B93;font-size:13px;margin-top:22px}
</style>
</head>
<body>
<main class="kart">
<a class="marka" href="/"><img src="/marka-isareti.png" alt=""> Slooin</a>
${govde}
</main>
</body>
</html>`
  return new Response(html, {
    status: durum,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      Vary: 'Accept-Language, Cookie',
    },
  })
}

export async function onRequestGet({ request, params, env }) {
  // STATIK DOSYA ONCE. Cloudflare Pages'te fonksiyon rotasi statik
  // varliktan ONCE eslesir (ilk yayinda olculdu: /gizlilik/ ve
  // /og-slooin.png bu fonksiyona dusup 404 oldu). Varlik varsa o
  // doner; ancak yoksa (404) profil aranir.
  if (env.ASSETS) {
    const varlik = await env.ASSETS.fetch(request)
    if (varlik.status !== 404) return varlik
  }

  const ad = String(params.ad || '').toLowerCase()
  const dil = dilSec(request)
  const t = METIN[dil]
  const kok = new URL(request.url).origin
  const genelGorsel = `${kok}/og-slooin.png`

  const yok = () =>
    sayfa({
      dil,
      baslik: `${t.yok} · Slooin`,
      aciklama: t.yokAciklama,
      gorsel: genelGorsel,
      durum: 404,
      govde: `<div class="bos avatar">?</div><h1>${kacir(t.yok)}</h1><p class="aciklama">${kacir(t.yokAciklama)}</p><a class="ikincil" href="/">${kacir(t.nedir)}</a>`,
    })

  if (!KULLANICI_ADI.test(ad)) return yok()

  const tabanAdres = env.PUBLIC_SUPABASE_URL
  if (!tabanAdres) return yok()

  let kart
  try {
    const yanit = await fetch(`${tabanAdres}/functions/v1/profil-karti?ad=${encodeURIComponent(ad)}`, {
      headers: { apikey: env.PUBLIC_SUPABASE_ANON_KEY || '' },
      cf: { cacheTtl: 300 },
    })
    if (!yanit.ok) return yok()
    kart = await yanit.json()
  } catch {
    return yok()
  }

  const gosterilenAd = kart.gizli || !kart.ad ? t.gizliAd : kart.ad
  const rumuz = `@${kart.kullaniciAdi}`
  const baslik = kart.gizli || !kart.ad ? `${rumuz} · Slooin` : `${kart.ad} (${rumuz}) · Slooin`
  const gorsel = kart.fotografUrl || genelGorsel
  const kanonik = `${kok}/${kart.kullaniciAdi}`
  const avatar = kart.fotografUrl
    ? `<img class="avatar" src="${kacir(kart.fotografUrl)}" alt="">`
    : `<div class="bos avatar">${kacir(basHarf(kart.gizli ? kart.kullaniciAdi : kart.ad))}</div>`

  return sayfa({
    dil,
    baslik,
    aciklama: t.aciklama,
    gorsel,
    kanonik,
    govde: `${avatar}
<h1>${kacir(gosterilenAd)}</h1>
<p class="rumuz">${kacir(rumuz)}</p>
<p class="aciklama">${kacir(t.aciklama)}</p>
<a class="dugme" href="slooin://kullanici/${kacir(kart.id)}">${kacir(t.ac)}</a>
<a class="ikincil" href="/">${kacir(t.nedir)}</a>
<p class="not">${kacir(t.indir)}</p>`,
  })
}
