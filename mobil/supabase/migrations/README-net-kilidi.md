# `net` semasi kilidi: 20260821150000 neden no-op ve yerine ne kondu

> Bu bir migrasyon DEGIL. Yanindaki `.sql` dosyalarindan biri yaniltici
> bir sey iddia ettigi icin buraya bir not birakildi. Tarih: 2026-08-21.

## Kisa hikaye

`bildirim.olay_gonder()` tetikleyicisi Edge Function'a `pg_net` ile POST
atiyor ve paylasilan sirri `X-Bildirim-Sir` basliginda tasiyor. pg_net
istekleri kuyruklarken **butun basliklari** `net.http_request_queue`
tablosunun `headers` sutununa **duz metin** yaziyor. Yani sir, gonderim
tamamlanana kadar veritabaninda okunabilir bir satirda duruyor.

`20260821150000_bildirim_sertlestirme.sql` bunu su satirlarla kapatmaya
calisti:

```sql
revoke all on all tables in schema net from public;
revoke usage on schema net from public, anon, authenticated;
```

**Bu satirlar hicbir sey yapmadi.** Migrasyon hatasiz uygulandi, ama
etkisi sifir.

## Neden no-op

Canli katalogdan olculdu (2026-08-21):

```
net semasi acl:
  {supabase_admin=UC/supabase_admin, =U/supabase_admin,
   supabase_functions_admin=U/supabase_admin, postgres=U/supabase_admin,
   anon=U/supabase_admin, authenticated=U/supabase_admin,
   service_role=U/supabase_admin}

net.http_request_queue acl:
  {supabase_admin=arwdDxtm/supabase_admin, =arwdDxtm/supabase_admin}
```

ACL girdilerindeki `/supabase_admin` kismi **yetkiyi kimin verdigini**
soyluyor: hepsini `supabase_admin` vermis. Migrasyonlar ise `postgres`
olarak calisiyor ve `postgres`, `supabase_admin` rolunun uyesi degil.

PostgreSQL'de **kendi vermedigin bir yetkiyi revoke etmek hata degil,
uyaridir** (`WARNING: no privileges could be revoked for ...`). Komut
basariyla doner, hicbir sey degismez, migrasyon yesil gorunur. Tam
olarak burada olan bu.

Sonuc: `anon` ve `authenticated` rollerinin `net` semasinda USAGE ve
`net.http_request_queue` ile `net._http_response` tablolarinda SELECT
yetkisi **hala var** ve bu depodan geri alinamaz.

## Yerine konan: katmanli telafi

Yetki katmani zorlanamadigi icin koruma dort ayri yere dagitildi.
Hicbiri tek basina yeterli degil; birlikte pratik riski kucultuyorlar.

1. **PostgREST expose listesi.** `net` semasi PostgREST'e acik degil,
   yani REST uzerinden o tabloya ulasilamiyor - yetki dursa bile.
   Bugun sirri gizleyen ASIL katman bu. Tek bir yapilandirma dugmesi
   oldugu icin artik **test ediliyor**: `test:sema` icindeki
   `netSemasiExposeDegilMi` probu, hem kimliksiz hem oturum acmis
   istemciyle `Accept-Profile: net` basligi atip `PGRST106` bekliyor
   (yaninda bir de pozitif kontrol var: ayni prob `public` semasinda
   200 donuyor, yani mekanizmanin kendisi calisiyor).

   Bu probun **koruyamadigi** sey: REST disi yollar. Veritabanina
   dogrudan baglanan (psql, connection pooler) bir `anon`/`authenticated`
   rolu kuyrugu yine okuyabilir.

2. **Edge Function tarafindaki dogrulama.** Sirri ele geciren biri yine
   de yalnizca "bildirim gonder" cagrisi yapabilir; fonksiyon aliciyi
   payload'a degil veritabanina soruyor, bildirim metnine icerik
   koymuyor (karar 48) ve oz-bildirim kuralini uyguluyor. Yani sirrin
   sizmasi veri sizmasi degil, en fazla bildirim gurultusu demek.

3. **Sir rotasyonu ucuz.** Sir Vault'ta tek bir satir
   (`bildirim_siri`); degistirmek icin kod dagitimi gerekmiyor. Edge
   Function sir eslesmedigi zaman onbellegini en fazla 60 saniyede bir
   tazeliyor (`SIR_TAZELEME_ARALIGI_MS`), yani rotasyon bir dakika
   icinde kendiliginden oturuyor. Sizma suphesinde yapilacak sey tek
   bir `vault` guncellemesi.

4. **Kuyrukta maruziyet saniyelik.** pg_net kuyruk satirlarini
   gonderimden sonra budaniyor (`net` extension'inin kendi temizligi);
   sir orada kalici olarak durmuyor. Pencere dar, ama sifir degil -
   bu yuzden tek basina bir koruma sayilmiyor.

## Kalici cozum (bu depodan yapilamaz)

Iki secenek var, ikisi de bu depodaki bir migrasyonla degil, disaridan:

- **Platform destegi.** Revoke'lari `supabase_admin` olarak calistirmak
  (Supabase destek talebi ya da platformun ilerideki bir surumunde bu
  ACL'in duzeltilmesi). O gun geldiginde `test:sema` ciktisindaki
  "BILGI net ACL bayraklari" satiri bunu hemen gosterir - bayraklar
  bilerek raporda birakildi, iddia olmaktan cikarilip izleme satirina
  cevrildi.
- **Sirri baslikta hic tasimamak.** pg_net cagrisini paylasilan sir
  yerine kisa omurlu/imzali bir jetona (ornegin gonderim aninda uretilen
  ve birkac saniye gecerli bir HMAC) tasimak. O zaman kuyrukta duran sey
  ele gecse bile ise yaramaz. Daha buyuk bir degisiklik; bugun icin
  gerekcesi yok ama sir bir kez sizarsa dogru cevap bu.
