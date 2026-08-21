# Bildirimler - kalan isler (2026-08-21)

Bu dosya bildirimler mini-fazinin kapanisinda derlendi. SDD calisma
dizini faz kapaninca siliniyor; bu maddeler orada kalmasin diye buraya
tasindi. Hicbiri Critical degil; hicbiri sunucu tarafinin canli
calismasini engellemiyor.

## Elle / cihaz dogrulamasi (karar 51'in borcu)

1. **Gercek cihazda ilk bildirim hic gorulmedi.** Expo Go (SDK 53+) ve
   web uzak push'u desteklemiyor; uctan uca teslim yalnizca EAS
   development/production derlemesinde gorulebilir. Sunucu yolu canli
   dogrulandi (tetikleyici -> pg_net -> Edge Function -> sir dogru ->
   kaynak dogru -> Expo cagrisi -> DeviceNotRegistered temizligi; bkz.
   net._http_response id=39). Eksik olan tek halka: gercek bir telefonun
   jeton uretip bildirimi almasi. Cihaz derlemesi isine devredildi.
2. `getExpoPushTokenAsync` su an projectId'siz cagriliyor (Constants
   fallback). EAS projectId `app.json`'a girince cihazda saglamlasir.
3. `app.json`'a `expo-notifications` config plugin'i (ozel ikon/ses)
   eklenmedi - basit push icin gereksiz, ama EAS derlemesinde ozellestirme
   istenirse gerekli.

## Guvenlik / altyapi

4. **`net` semasi kilidi platform yuzunden zorlanamiyor.** `net` semasi
   ve kuyruk tablolarinin sahibi `supabase_admin`; `postgres` onun uyesi
   degil, bu yuzden anon/authenticated'in kuyruk tablosu SELECT yetkisi
   MCP/migrasyon uzerinden geri alinamiyor. Sir kuyruga cleartext
   yaziliyor ve tek koruma PostgREST'in `net` semasini expose etmemesi.
   Katmanli telafi ve kalici cozum secenekleri:
   `mobil/supabase/migrations/README-net-kilidi.md`. Kalici cozum icin ya
   Supabase destegiyle supabase_admin olarak revoke, ya da sirri baslikta
   hic tasimayip kisa omurlu imzali jetona gecmek gerekiyor.
5. **`grant all on all tables in schema net to postgres` gereginden
   genis** (en az ayricalik): `bildirim.olay_gonder` yalnizca INSERT
   kullaniyor. `grant insert`e daraltilabilir. Bugun zararsiz.
6. **`public.bildirim_kurulum_ozeti()`** brief'te istenmeyen bir ekstra:
   yalnizca test:sema dogrulamasi icin var (bildirim semasi PostgREST'e
   kapali oldugu icin baska turlu dogrulanamiyor). `security invoker`,
   sir dondurmuyor, EXECUTE yalnizca service_role. Kalici bir production
   RPC yuzeyi olmasi istenmiyorsa ileride kaldirilip yerine gecici bir
   dogrulama yolu konabilir. Ayrica `'bildirim.olay_gonder()'::regprocedure`
   cast'i bildirim semasi ileride dusurulurse ozeti patlatir (to_regclass
   gibi null donmez).

## Kucuk kusurlar / borclar

7. **Bildirim ayarlari ekrani yok** (ac/kapa tercihi). Bugun kullanici
   bildirimleri yalnizca isletim sistemi izniyle kapatabiliyor;
   uygulama ici "takip istegi bildirimleri kapali" gibi ince ayar yok.
   Spec bunu kapsam disi birakti; gelecek is.
8. **Rozet sayisi senkronu yok.** Uygulama simgesindeki sayi (badge)
   bildirimlerle guncellenmiyor; yalnizca uygulama ici okunmamis rozetleri
   var.
9. Kismi Expo basarisizliginda Edge Function 500 donuyor ama pg_net
   yeniden denemiyor ve trigger cagriyi coktan birakmis; 500'un pratik
   bir tuketicisi yok (yalnizca net._http_response ve loglarda gorunur).
   Yeniden deneme istenirse ayri bir is.
10. `bildirimleriBaslat(_kullaniciId)` parametresi kullanilmiyor
    (kullanici sunucuda auth.uid()'den cikiyor); imza okunakliligi icin
    birakildi.

## Ertelenmesi dogru (baska fazin isi)

- Grup konusmalari (Faz 3c) gelince: Edge Function'in `konusmaDigerUyeleri`
  cogul okuma + cogul gonderme zaten hazir; ama `mesajlari_getir`'in
  engelleme kontrolu hala tek uyeli (Faz 3b takip isleri madde 1a). Ikisi
  birlikte gozden gecirilmeli.

11. **Sir rotasyonunun ~60 sn korluk penceresi.** `index.ts siriOku`'da
    `tazele=true` cagrisi bile 60 sn'lik tazeleme kisitina takiliyor;
    yani Vault'ta sir dondurulduginde ~1 dakika boyunca gelen bildirimler
    eslesmeyip 401 alip dusuyor. DoS korumasi acisindan istenen davranis,
    ama rotasyonun bir dakikalik korluk penceresi oldugu bilinmeli. Zorunlu
    tazelemeyi kisittan muaf tutmak (yalnizca eslesmeyen-sir yolunda, istek
    basina degil olay basina) bu pencereyi kapatabilir - ama o zaman DoS
    yuzeyi biraz acilir. Nihai dal incelemesi minor olarak isaretledi.
