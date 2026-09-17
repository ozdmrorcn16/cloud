// PROFIL PAYLASIM KARTI (2026-09-18).
//
// `https://slooin.com/<kullanici_adi>` sayfasini Cloudflare Pages
// Function ciziyor; veriyi buradan aliyor. Bu fonksiyon KIMLIKSIZ
// cagriliyor (verify_jwt KAPALI) cunku istegi WhatsApp/iMessage'in
// onizleme robotu ya da uygulamasi olmayan bir tarayici atiyor.
//
// Neden RPC dogrudan degil de Edge Function: profil fotograflari OZEL
// kovada, imzali URL uretmek service role istiyor. O anahtar Supabase
// icinde kalsin, Cloudflare'e TASINMASIN diye imzalama burada yapiliyor.
// RPC `profil_karti` gizlilik kurallarini (aktif hesap, profil_gizli,
// aramada_gorunsun) zaten uyguluyor; burasi yalnizca fotografi imzalar.
//
// Cevap: { id, kullaniciAdi, ad, fotografUrl, gizli } ya da 404.

import { createClient } from 'npm:@supabase/supabase-js@2'

const FOTOGRAF_GECERLILIK_SANIYE = 24 * 60 * 60 // onizleme robotlari gorseli bir kez cekip saklar
const CACHE = 'public, max-age=300'

Deno.serve(async (istek: Request) => {
  if (istek.method !== 'GET') {
    return new Response('Yalnizca GET', { status: 405 })
  }
  const ad = new URL(istek.url).searchParams.get('ad') ?? ''
  if (!/^[a-z0-9._]{3,20}$/.test(ad)) {
    return Response.json({ hata: 'gecersiz_ad' }, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('profil_karti', { p_kullanici_adi: ad })
  if (error) {
    return Response.json({ hata: 'sunucu' }, { status: 500 })
  }
  const satir = Array.isArray(data) ? data[0] : null
  if (!satir) {
    return Response.json({ hata: 'bulunamadi' }, { status: 404, headers: { 'Cache-Control': CACHE } })
  }

  let fotografUrl: string | null = null
  if (satir.fotograf) {
    const { data: imza } = await supabase.storage
      .from('profil-fotograflari')
      .createSignedUrl(satir.fotograf, FOTOGRAF_GECERLILIK_SANIYE)
    fotografUrl = imza?.signedUrl ?? null
  }

  return Response.json(
    {
      id: satir.id,
      kullaniciAdi: satir.kullanici_adi,
      ad: satir.ad ?? null,
      fotografUrl,
      gizli: Boolean(satir.gizli),
    },
    { headers: { 'Cache-Control': CACHE } }
  )
})
