# Plan 2 (moderasyon paneli) - kalan isler

Plan: `docs/superpowers/plans/2026-08-23-plan2-moderasyon-paneli.md`
Spec: `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`

## BLOKE - once bu yapilmali

### 1. Supabase'de TOTP MFA acilmali

Panel giris yaptirmiyor. `supabase.auth.mfa.enroll({ factorType: 'totp' })`
cagrisi su hatayi donuyor:

```
MFA enroll is disabled for TOTP
```

Bu bir **proje ayaridir**, migrasyonla yapilamaz ve Supabase MCP
uzerinden de degistirilemez (MCP'de auth yapilandirma araci yok).

Yapilmasi gereken: Supabase Dashboard -> Authentication ->
Multi-Factor Authentication -> TOTP (Authenticator app) etkinlestirilir.

Bu acilana kadar **panelin pozitif yonu dogrulanamaz**: yani "dogru
kimlik kapiyi aciyor mu" sorusu acikta. Negatif yon (yanlis kimlik
giremiyor) tam olarak dogrulandi - hem `test:gorunurluk` senaryo 59'da
13 RPC icin, hem de gercek bir moderator hesabiyla `aal1` oturumda
(moderatorler satiri VAR ama TOTP yok -> `Yetkisiz`).

## Yapildi ama elle gozle dogrulanmadi

### 2. Panelin uctan uca akisi

Su akis TOTP acilinca bastan sona gezilmeli (spec bunu ertelemiyor):

1. TOTP ile giris (ilk kurulumda QR kaydi dahil)
2. Uygulamada bir mesaji sikayet et (mesaja uzun bas)
3. Panelde o sikayeti ac; sikayet edilen mesaji **baglamiyla** gor
   (kademe 1)
4. Gerekce girip konusmanin tamamini ac (kademe 2, ayri onay)
5. Hedefi askiya al
6. Uygulamada o hesabin yazamadigini ve baskalarina gorunmedigini gor
7. Askiyi kaldir
8. Denetim izinde butun satirlari gor - `mesaj_baglami` ve
   `konusma_tam` AYRI turde gorunmeli

Panelin kendisi derleniyor (`npm run build` temiz, `tsc` 0 hata) ama
hicbir ekran gercek veriyle gozle gorulmedi.

### 3. Test moderator hesabi duruyor

Dogrulama sirasinda su hesap olusturuldu ve `moderatorler` tablosuna
`yonetici` olarak eklendi:

- Telefon: `+905550000009`
- Parola: `moderator-test-1234`
- `profiller` satiri YOK (karar 56 geregi dogru)

Kullanici kendi moderator hesabini kurunca bu test hesabi silinmeli
ya da parolasi degistirilmelidir. Parola bu belgede duruyor, yani
**gercek moderator hesabi olarak kullanilmamalidir**.

## Spec'te `[SONRA]` olarak isaretlenenler (bu plana girmedi)

- Kalici silme (bugun yalnizca **gizleme** var, karar 60)
- Gizlenen icerigin fotografinin Storage'da da kapatilmasi
- Sikayet edeni degerlendirme (kotu niyetli ihbar sayaci)
- Profil alani temizleme (hakaret iceren kullanici adi / fotograf)
- Pano: canli sayilar
- Panelin bir adrese cikarilmasi (bugun yalnizca `npm run dev`)
- Askiya alinan kullanicinin oturumunun ANINDA iptali. Bugun elindeki
  erisim jetonu suresi dolana kadar (varsayilan 1 saat) gecerli kalir;
  o sure boyunca hicbir sey yazamaz ve kimseye gorunmez, yalnizca kendi
  verisini okur. Hemen iptal icin service-role tasiyan kucuk bir Edge
  Function gerekir.

## Bu plan sirasinda bulunan ve duzeltilen kusurlar

1. **Mesaj sikayeti hic calismiyordu.** `sikayetler` tablosunun CHECK
   kisiti `'mesaj'` turunu tanimadigi icin insert `23514` ile
   patliyordu - yani Faz 3b'den beri bir mesaj sikayeti gonderilemiyordu.
   Task 3'te duzeltildi.
2. **Sohbet ekrani konusma id'sini mesaj id'si diye gonderiyordu.**
   Moderator "hangi mesaj" sorusunu cevaplayamazdi. Task 6'da mesaj
   basina sikayet yolu acildi.
3. **`sikayet_gonder` uyelik ve sahiplik dogrulamiyordu.** Uydurma bir
   mesaj id'siyle sahte sikayet uretilebilir, kisi kendi mesajini
   sikayet edebilirdi. Task 5'te uc koruma eklendi.
4. **Spec'in `check_inler` okuyucu listesi eskimisti.** Spec
   `public.baskasinin_profili`'ni sayiyordu ama o fonksiyon artik
   `check_inler`'e hic dokunmuyor; buna karsilik listede olmayan
   `gizli.ayni_mekanda_canli_mi` gercek bir okuyucu. Liste canlida
   yeniden uretildi (Task 4).

## Bilerek yapilmayanlar

- **Panel icin otomatik test yok.** Mevcut dort kosum veritabani
  tarafini kapsiyor (senaryo 59 yetki kapisini 13 RPC'de, senaryo 60
  gizlemeyi uc yolda dogruluyor). Panel arayuzu icin ayri bir test
  altyapisi kurulmadi; ilk dilimde maliyeti degerinden yuksek gorundu.
  Panel buyurse bu karar gozden gecirilmeli.
- **Kademe 1 pencere genisligi (20 mesaj) sunucuda sabit.** Panel bir
  genislik soyleyemez. Bilincli: istemcinin secebilecegi bir sinir,
  sinir degildir.
