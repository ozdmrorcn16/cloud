# Tasarim - bekleyen isler

Gorsel kimlik: karar 73-74 (`docs/konusma-gunlugu.md`), kanvas
`tasarim/slooin-kanvas/` ve "Slooin Tasarim" Artifact'i.

## Bekleyen: mekan ikonlarinin yerlesimi

Kullanicinin son istegi (2026-08-23), henuz UYGULANMADI - kullanicinin
karariyla uygulamanin genel tasarim turuna birakildi:

> "Beyaz zemin, ikonun goruntusunun arkasi turuncu, renkli de ikonun
> kendisi."

Yani hedef duzen: **beyaz kapak + ortada turuncu bir sekil (daire ya da
yuvarlak kare) + icinde BEYAZ ikon.** Bugunku hal: beyaz kapak +
dogrudan turuncu ikon (arkada sekil yok).

Dokunulacak dosya: `mobil/src/tasarim/MekanGorseli.tsx`. Kart yazisi ve
canli rozeti beyaz zemine gore zaten ayarlandi; yalnizca ikonun arkasina
turuncu bir daire eklenip ikon rengi beyaza cevrilecek.

## Kimlige tasinmis ekranlar

- Giris (`(auth)/giris.tsx`)
- Ana ekran (`index.tsx`)
- Kesfet / mekan listesi (`mekanlar/index.tsx`)
- Mekan ekleme, kismen (`mekanlar/ekle.tsx` - tur secici)

## Kimlige HENUZ tasinmamis ekranlar

Hepsi calisiyor ama eski duz gorunumde:

- Mekan detayi (`mekanlar/[id].tsx`)
- Check-in (`check-in/[mekanId].tsx`)
- Baskasinin profili (`kullanici/[id].tsx`)
- Sohbet (`sohbet/[kullaniciId].tsx`) ve mesaj kutusu (`mesajlar.tsx`)
- Baglar (`baglar.tsx`)
- Kisi arama (`kisiler.tsx`)
- Anilar (`profil/anilar.tsx`)
- Ayarlar (`profil/ayarlar.tsx`), hesap silme, gizlilik metni
- Kayit ve dogrulama (`(auth)/kayit.tsx`, `(auth)/dogrula.tsx`)
- Askidaki hesap (`hesap-durumu.tsx`), sikayet (`sikayet.tsx`)

## Kanvasta tasarlanmis ama koda tasinmamis yapisal ogeler

- **Yuzer gezinme cubugu** (cam efektli, ortasinda buyuk turuncu
  check-in dugmesi). Butun ekranlari etkiledigi icin ayri bir is;
  bugunku uygulamada ana ekran bir menu listesi.
- Mekan kartinda **avatar yigini** - BILEREK yapilmadi ve
  yapilmayacak: yogunluk sayaci kac kisi oldugunu gosterir, KIM
  oldugunu gostermez. Avatar koymak gizli check-in yapani ifsa ederdi.
