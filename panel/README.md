# Slooin moderasyon paneli

Uygulamanin disinda calisan yonetim konsolu. Sikayetleri karara baglar,
kullanicilari ve icerigi yonetir, ve her hassas erisimi silinemez bir
denetim izine yazar.

Tasarim: `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`
Plan: `docs/superpowers/plans/2026-08-23-plan2-moderasyon-paneli.md`

## Calistirma

```bash
cd panel
npm install
cp .env.example .env     # icini doldur (asagida)
npm run dev              # http://localhost:5173
```

`.env` iki deger ister:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Ikisi de `mobil/.env` icindeki `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` ile aynidir.

## Neden service-role anahtari YOK

Bu, panelin en onemli tasarim karari (spec karar 55) ve ilerideki bir
oturum "panel yavas/kisitli, service-role koyalim" diye dusunebilir.
Koymayin. Gerekce:

1. Service-role butun RLS'i atlayan **tek** bir kimlik bilgisidir.
   Sizarsa veritabaninin tamami gider; kademe yoktur.
2. Service-role ile `auth.uid()` bos olur. O zaman denetim izindeki
   "kim yapti" bilgisini panelin kendisi doldurur - yani iz, panelin
   durustluguna dayanir. Bugun iz'i veritabani dolduruyor ve panel
   yalan soyleyemiyor.
3. Anahtar pakete girerse panel bir daha asla yerelin disina cikamaz.

Bunun yerine moderator **siradan bir Supabase kullanicisi** olarak giris
yapar, panel yalnizca herkese acik `anon` anahtarini tasir, ve butun
erisim `public.moderasyon_*` `security definer` RPC'lerinden gecer.
Her RPC'nin ilk ifadesi `moderasyon.yetkili_mi_zorla()` cagrisidir.

## Yetki kapisi

Iki kosul **birlikte** aranir:

1. `public.moderatorler` tablosunda o kullanicinin satiri var mi
2. JWT'nin `aal` talebi `aal2` mi (yani TOTP ile dogrulanmis oturum mu)

Kontrol arayuzde degil **veritabanindadir**. Panelin MFA ekranini
gostermeyi atlamasi hicbir sey degistirmez; istemcinin cagirmayi
secebilecegi bir kural, kural degildir.

## Ilk moderator nasil eklenir

Panel kendi moderatorunu ekleyemez (tavuk-yumurta). Supabase SQL
Editor'den, o hesabin `auth.users.id` degeriyle:

```sql
insert into public.moderatorler (kullanici_id, rol)
values ('<auth-user-id>', 'yonetici');
```

Moderator hesabi uygulamada kullanilan hesaptan **ayri** olmali ve
`profiller` satiri **olmamali** (spec karar 56): profili olan bir
moderator kisi aramasinda cikar, sikayet edilebilir ve bag grafigine
karisir.

## ONCE YAPILMASI GEREKEN: TOTP'yi ac

Bugun projede TOTP MFA **kapali**; `mfa.enroll` cagrisi
`MFA enroll is disabled for TOTP` donuyor. Panel bu ayar acilmadan
giris yaptirmaz.

Supabase Dashboard -> Authentication -> Multi-Factor Authentication ->
TOTP (Authenticator app) acilir. Bu bir proje ayaridir, migrasyonla
yapilamaz.

## Konusma erisimi iki kademelidir (karar 75)

- **Kademe 1 - sikayet baglami (varsayilan):** bir mesaj sikayetinden
  acilir, yalnizca o mesajin oncesindeki ve sonrasindaki 20 mesaji
  getirir. Ize `mesaj_baglami` olarak duser.
- **Kademe 2 - tum konusma:** ayri bir gerekce ve ayri bir onay adimi
  ister. Ize `konusma_tam` olarak duser. Kullanici detayindan acilan
  her konusma daima kademe 2'dir, cunku ortada sikayet baglami yoktur.

Amac erisimi kesmek degil (yetki tam), **kazara ve aliskanliktan**
yapilmasini engellemek ve izde ayirt edilebilir kilmak. KVKK m.4
olcululuk ilkesinin karsiligi budur.

Ekran salt-okunurdur: panel mesaj silemez, duzenleyemez, gizleyemez.

## Denetim izi

`public.moderasyon_kayitlari` **ekleme-only**. `update` ve `delete`
hicbir role verilmemistir - moderator dahil kimse kendi izini silemez.
Iz kayitlari 2 yil sonra gunluk bir `pg_cron` isiyle budanir.

Ize yazilanlar: butun yazma islemleri, kullanici detayinin
goruntulenmesi ve mesaj icerigi okunmasi. Liste ekranlarinda gezinme
kaydedilmez (aksi halde iz gurultuye bogulur).
