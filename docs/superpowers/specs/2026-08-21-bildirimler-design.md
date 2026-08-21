# Bildirimler - tasarim (2026-08-21)

## Amac

Uygulama kapaliyken kullanicinin telefonuna dusen push bildirimleri.
Mesajlar su an yalnizca uygulama acikken Realtime ile goruluyor; bir
tanisma uygulamasi icin bu olumcul eksik.

## Kararlar

- **Karar 48 - bildirim icerigi (kullanicinin karari, 2026-08-21):**
  bildirimde GONDERENIN ADI VAR, MESAJ ICERIGI YOK. "Deniz sana mesaj
  gonderdi" - kilit ekranina mesaj metni asla dusmez. Uygulamanin
  gizlilik duruyusuyla tutarli.
- **Karar 49 - dort olay:** yeni mesaj; takip istegi; sohbet istegi;
  istek kabulu. Baska hicbir olay bildirim uretmez.
- **Karar 50 - engelleme icin ikinci kontrol katmani YOK:** engellenen
  kisi zaten mesaj/istek gonderemiyor (bag.yazabilir_mi ve
  istek_on_kontrol yazma kapilari). Bildirim ureten her olay o
  kapilardan gecmis bir INSERT/UPDATE oldugu icin fonksiyon yeniden
  kontrol etmez.
- **Karar 51 - dogrulama siniri:** uctan uca teslim (telefonun gercekten
  titremesi) GERCEK CIHAZ gerektirir; Expo Go'da (SDK 53+) ve web'de
  uzak push calismiyor. Bu faz sunucu yolunu canli dogrular (webhook ->
  Edge Function -> Expo API cagrisinin loglari), istemci birim testli
  kalir. Gercek cihaz dogrulamasi cihaz derlemesi isine devredilir ve
  bu borc acikca yazilir.

## Mimari

```
mesajlar / takipler / sohbet_istekleri tablosuna INSERT-UPDATE
  -> Postgres trigger (pg_net) --- X-Bildirim-Sir basligi --->
     Edge Function "bildirim-gonder"
       - siri dogrular (Vault'taki degerle)
       - aliciyi ve gonderen adini service role ile okur
       - bildirim_jetonlari'ndan alicinin jetonlarini ceker
       - Expo Push API'ye iletir (exp.host/--/api/v2/push/send)
       - "DeviceNotRegistered" donen jetonlari siler
```

- **Sir yonetimi:** trigger'in gonderdigi paylasimli sir Supabase
  Vault'ta durur (`vault.decrypted_secrets` yalnizca ayricalikli
  rollerce okunabilir; authenticated pg_proc kaynagindan okuyamaz).
  Ayni sir Edge Function'a `supabase secrets` ile verilir.
- **Jeton tablosu:** `bildirim_jetonlari(kullanici_id, jeton, platform,
  guncellendi)`. RLS: kullanici yalnizca kendi satirlarini SELECT
  edebilir; INSERT/UPDATE/DELETE authenticated'dan geri alinir, yazma
  yalnizca `jeton_kaydet` RPC'siyle (upsert) ve `jeton_sil` ile.
  Jeton benzersiz (ayni cihaz iki kullaniciya kayitliysa son giris
  kazanir - cihazi devralan hesap eskisinin bildirimini almamali).
- **Istemci:** `lib/bildirim.ts` - izin isteme, jeton alma,
  `jeton_kaydet` cagrisi (giris sonrasi ve her acilista), cikista
  `jeton_sil`. Bildirime dokununca ilgili ekrana yonlendirme
  (mesaj -> /sohbet/[kullaniciId], istekler -> /baglar).
- **Metinler:** dort kalip, hepsi Turkce, icerik tasimaz. Gonderen adi
  `profiller.ad`.

## Kapsam disi

Gercek cihaz derlemesi, bildirim ayarlari ekrani (ac/kapa tercihi -
takip isi), rozet sayisi senkronu, e-posta bildirimi.
