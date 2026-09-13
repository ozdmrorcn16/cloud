/**
 * OTOMATIK DIL ALGILAMA (Cloudflare Pages Function, 2026-09-14).
 *
 * Site statik; dil yollari `/`, `/en/...`, `/de/...` diye ayri
 * sayfalar. Bu ara katman SUNUCUDA calisir: tarayicinin
 * `Accept-Language` basligina bakip oneksiz bir yola (Turkce) gelen
 * ziyaretciyi kendi diline yonlendirir. JavaScript kapali olsa da
 * calisir (Apple'in gizlilik sayfasi sarti).
 *
 * Kurallar:
 *  - Yalnizca ONEKSIZ yollarda (Turkce sayfalar) devreye girer; `/en/..`
 *    gibi acikca secilmis bir dil hic dokunulmaz.
 *  - Kullanici alt seritteki dil secicisiyle bir dil sectiyse o secim
 *    `dil` cerezine yazilir ve algilama bir daha araya girmez - aksi
 *    halde Turkce'yi bilerek secen Almanca tarayicili biri her seferinde
 *    /de'ye atilirdi.
 *  - Tarayicinin dili Turkce ya da listede yoksa hicbir sey yapilmaz.
 *  - Dosya istekleri (`.png`, `.js`, `_astro/...`) atlanir.
 *
 * `DILLER` listesi `src/i18n/diller.ts` ile AYNI tutulmali; Pages
 * Function'lari `src/` icinden import edemedigi icin kopya.
 */
const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar']
const KOK_DIL = 'tr'
const CEREZ = 'dil'
const BIR_YIL = 60 * 60 * 24 * 365

function cerezOku(baslik, ad) {
  if (!baslik) return null
  for (const parca of baslik.split(';')) {
    const [k, ...v] = parca.trim().split('=')
    if (k === ad) return decodeURIComponent(v.join('='))
  }
  return null
}

/** Accept-Language'i q agirligina gore sirala, listedeki ilk dili don. */
function tarayiciDili(baslik) {
  if (!baslik) return null
  const adaylar = baslik
    .split(',')
    .map((p, i) => {
      const [etiket, ...ops] = p.trim().split(';')
      const q = ops.map((o) => o.trim()).find((o) => o.startsWith('q='))
      return { dil: etiket.toLowerCase().split('-')[0], q: q ? parseFloat(q.slice(2)) : 1, i }
    })
    .sort((a, b) => b.q - a.q || a.i - b.i)
  for (const a of adaylar) if (DILLER.includes(a.dil)) return a.dil
  return null
}

export async function onRequest({ request, next }) {
  const url = new URL(request.url)
  const yol = url.pathname
  const ilkParca = yol.split('/')[1] || ''
  const onekliDil = DILLER.includes(ilkParca) && ilkParca !== KOK_DIL ? ilkParca : null

  // Onekli bir dil yolu: kullanicinin secimi. Cerezi tazele, gec.
  if (onekliDil) {
    const yanit = await next()
    const y = new Response(yanit.body, yanit)
    y.headers.append('Set-Cookie', `${CEREZ}=${onekliDil}; Path=/; Max-Age=${BIR_YIL}; SameSite=Lax; Secure`)
    return y
  }

  // Dosya istekleri ve Astro varliklari: dokunma.
  if (/\.[a-z0-9]+$/i.test(yol) || yol.startsWith('/_astro/') || yol.startsWith('/posta/')) return next()

  // Alt seritten "Turkce" secildi (`?dil=tr`): cerezi yaz, sorguyu at.
  if (url.searchParams.get('dil') === KOK_DIL) {
    url.searchParams.delete('dil')
    const y = new Response(null, { status: 302, headers: { Location: url.pathname + (url.search || '') } })
    y.headers.append('Set-Cookie', `${CEREZ}=${KOK_DIL}; Path=/; Max-Age=${BIR_YIL}; SameSite=Lax; Secure`)
    return y
  }

  const secim = cerezOku(request.headers.get('Cookie'), CEREZ)
  if (secim) {
    // Turkce'yi bilerek secmis ya da onekli bir dil secmis: onekli dil
    // seciliyse oraya yonlendir, Turkce'yse oldugu gibi birak.
    if (secim !== KOK_DIL && DILLER.includes(secim)) {
      return Response.redirect(`${url.origin}/${secim}${yol === '/' ? '/' : yol}`, 302)
    }
    return next()
  }

  const algilanan = tarayiciDili(request.headers.get('Accept-Language'))
  if (!algilanan || algilanan === KOK_DIL) {
    const yanit = await next()
    if (!algilanan) return yanit
    // Turkce tarayici: secimi cerezle sabitle ki dil degistirince de tutarli kalsin.
    const y = new Response(yanit.body, yanit)
    y.headers.append('Set-Cookie', `${CEREZ}=${KOK_DIL}; Path=/; Max-Age=${BIR_YIL}; SameSite=Lax; Secure`)
    return y
  }
  const hedef = `${url.origin}/${algilanan}${yol === '/' ? '/' : yol}${url.search}`
  const y2 = new Response(null, { status: 302, headers: { Location: hedef } })
  y2.headers.append('Set-Cookie', `${CEREZ}=${algilanan}; Path=/; Max-Age=${BIR_YIL}; SameSite=Lax; Secure`)
  y2.headers.append('Vary', 'Accept-Language, Cookie')
  return y2
}
