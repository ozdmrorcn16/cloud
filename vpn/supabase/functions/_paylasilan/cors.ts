// Tum Edge Function'lar icin ortak CORS basliklari.
//
// Android istemcisi CORS'a takilmaz, ama tarayici tabanli bir yonetim paneli
// veya `supabase functions serve` ile yerel test icin gerekiyor.

export const corsBasliklari = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonYanit(govde: unknown, durum = 200): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...corsBasliklari, "Content-Type": "application/json" },
  });
}

export function hataYanit(mesaj: string, durum: number): Response {
  return jsonYanit({ hata: mesaj }, durum);
}
