// issue-config — giris yapmis kullaniciya WireGuard istemci yapilandirmasi uretir.
//
// Istek (POST, Authorization: Bearer <kullanici JWT>):
//   { "public_key": "<cihazin acik anahtari>",
//     "sunucu_id": "<uuid|opsiyonel>",
//     "cihaz_adi": "<opsiyonel>" }
//
// Yanit:
//   { "sunucu": {...}, "tunel_ip": "10.66.66.7/32", "conf": "[Interface]..." }
//
// Onemli: istemcinin OZEL anahtari buraya HIC gelmez. Cihaz anahtar ciftini
// kendisi uretir, yalnizca acik anahtari gonderir. Donen `conf` metnindeki
// PrivateKey alani bos birakilir; cihaz kendi anahtarini oraya yazar.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsBasliklari, hataYanit, jsonYanit } from "../_paylasilan/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// WireGuard acik anahtari: 32 bayt, base64 ile 44 karakter ve '=' ile biter.
const ANAHTAR_DESENI = /^[A-Za-z0-9+/]{42}[AEIMQUYcgkosw]=$/;

interface Istek {
  public_key?: string;
  sunucu_id?: string;
  cihaz_adi?: string;
}

Deno.serve(async (istek: Request) => {
  if (istek.method === "OPTIONS") {
    return new Response("ok", { headers: corsBasliklari });
  }
  if (istek.method !== "POST") {
    return hataYanit("Yalnizca POST kabul edilir.", 405);
  }

  // --- 1) Kullaniciyi dogrula -------------------------------------------
  const yetkiBasligi = istek.headers.get("Authorization");
  if (!yetkiBasligi) {
    return hataYanit("Authorization basligi eksik.", 401);
  }

  const kullaniciIstemcisi = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: yetkiBasligi } },
  });

  const { data: { user }, error: kullaniciHatasi } = await kullaniciIstemcisi
    .auth.getUser();
  if (kullaniciHatasi || !user) {
    return hataYanit("Gecersiz oturum.", 401);
  }

  // --- 2) Istegi oku ------------------------------------------------------
  let govde: Istek;
  try {
    govde = await istek.json();
  } catch {
    return hataYanit("Govde gecerli JSON degil.", 400);
  }

  const acikAnahtar = (govde.public_key ?? "").trim();
  if (!ANAHTAR_DESENI.test(acikAnahtar)) {
    return hataYanit("public_key gecerli bir WireGuard acik anahtari degil.", 400);
  }
  const cihazAdi = (govde.cihaz_adi ?? "Android").slice(0, 64);

  // Buradan sonrasi RLS'i baypas eder; her sorguda kullanici kimligini
  // acikca sartlara koy.
  const yonetim = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // --- 3) Abonelik gecerli mi? -------------------------------------------
  const { data: abonelikVar, error: abonelikHatasi } = await yonetim
    .rpc("abonelik_gecerli_mi", { p_kullanici_id: user.id });

  if (abonelikHatasi) {
    console.error("abonelik sorgusu basarisiz", abonelikHatasi);
    return hataYanit("Abonelik dogrulanamadi.", 500);
  }
  if (!abonelikVar) {
    return hataYanit("Aktif aboneligin yok.", 402);
  }

  // --- 4) Sunucuyu sec ----------------------------------------------------
  let sunucuSorgusu = yonetim
    .from("servers")
    .select("id, ulke, ulke_kodu, ad, endpoint, port, public_key, dns, kapasite")
    .eq("aktif", true);

  sunucuSorgusu = govde.sunucu_id
    ? sunucuSorgusu.eq("id", govde.sunucu_id)
    : sunucuSorgusu.order("siralama", { ascending: true });

  const { data: sunucu, error: sunucuHatasi } = await sunucuSorgusu
    .limit(1)
    .maybeSingle();

  if (sunucuHatasi) {
    console.error("sunucu sorgusu basarisiz", sunucuHatasi);
    return hataYanit("Sunucu bulunamadi.", 500);
  }
  if (!sunucu) {
    return hataYanit("Uygun sunucu yok.", 404);
  }

  // --- 5) Peer kaydini bul ya da olustur ---------------------------------
  const { data: mevcut, error: mevcutHatasi } = await yonetim
    .from("peers")
    .select("id, tunel_ip, kullanici_id")
    .eq("public_key", acikAnahtar)
    .maybeSingle();

  if (mevcutHatasi) {
    console.error("peer sorgusu basarisiz", mevcutHatasi);
    return hataYanit("Kayit okunamadi.", 500);
  }

  // Ayni acik anahtar baska bir kullaniciya aitse yeni kayit acma.
  if (mevcut && mevcut.kullanici_id !== user.id) {
    return hataYanit("Bu anahtar baska bir hesapta kayitli.", 409);
  }

  let tunelIp: string;

  if (mevcut) {
    tunelIp = mevcut.tunel_ip;
    const { error: guncelleHatasi } = await yonetim
      .from("peers")
      .update({ sunucu_id: sunucu.id, cihaz_adi: cihazAdi, aktif: true })
      .eq("id", mevcut.id);
    if (guncelleHatasi) {
      console.error("peer guncellenemedi", guncelleHatasi);
      return hataYanit("Kayit guncellenemedi.", 500);
    }
  } else {
    // Kapasite kontrolu
    const { count, error: sayimHatasi } = await yonetim
      .from("peers")
      .select("id", { count: "exact", head: true })
      .eq("sunucu_id", sunucu.id)
      .eq("aktif", true);

    if (sayimHatasi) {
      console.error("kapasite sayimi basarisiz", sayimHatasi);
      return hataYanit("Sunucu durumu okunamadi.", 500);
    }
    if ((count ?? 0) >= sunucu.kapasite) {
      return hataYanit("Sunucu dolu, baska bir sunucu sec.", 503);
    }

    const { data: yeniIp, error: ipHatasi } = await yonetim
      .rpc("sonraki_tunel_ip", { p_sunucu_id: sunucu.id });

    if (ipHatasi || !yeniIp) {
      console.error("IP ayrilamadi", ipHatasi);
      return hataYanit("Tunel adresi ayrilamadi.", 500);
    }
    tunelIp = yeniIp as string;

    const { error: ekleHatasi } = await yonetim.from("peers").insert({
      kullanici_id: user.id,
      sunucu_id: sunucu.id,
      cihaz_adi: cihazAdi,
      public_key: acikAnahtar,
      tunel_ip: tunelIp,
    });

    if (ekleHatasi) {
      console.error("peer eklenemedi", ekleHatasi);
      return hataYanit("Kayit olusturulamadi.", 500);
    }
  }

  // --- 6) Yapilandirmayi don ---------------------------------------------
  const adres = `${tunelIp.split("/")[0]}/32`;

  // PrivateKey bilerek bos: cihaz kendi ozel anahtarini yazar.
  const conf = [
    "[Interface]",
    "PrivateKey = ",
    `Address = ${adres}`,
    `DNS = ${sunucu.dns}`,
    "",
    "[Peer]",
    `PublicKey = ${sunucu.public_key}`,
    "AllowedIPs = 0.0.0.0/0, ::/0",
    `Endpoint = ${sunucu.endpoint}:${sunucu.port}`,
    "PersistentKeepalive = 25",
    "",
  ].join("\n");

  return jsonYanit({
    sunucu: {
      id: sunucu.id,
      ulke: sunucu.ulke,
      ulke_kodu: sunucu.ulke_kodu,
      ad: sunucu.ad,
      endpoint: sunucu.endpoint,
      port: sunucu.port,
      public_key: sunucu.public_key,
      dns: sunucu.dns,
    },
    tunel_ip: adres,
    conf,
  });
});
