# Proje Hafizasi

Bu dosya her Claude Code oturumunda otomatik olarak yuklenir. Oturumlar arasinda
tasinmasini istedigimiz her sey buraya yazilir.

## Nasil calisiyor

Claude'un kendi basina oturumlar arasi hafizasi yoktur; her oturum sifirdan
baslar. Sureklilik su uc dosyayla saglanir:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Kalici hafiza. Her oturum basinda otomatik okunur. Kararlar, tercihler, proje durumu. |
| `docs/konusma-gunlugu.md` | Oturum indeksi + karar defteri. |
| `docs/oturumlar/` | Her oturumun tam dokumu (hook tarafindan otomatik yazilir). |

Oturum dokumleri `.claude/hooks/oturum-kaydet.py` tarafindan otomatik uretilir;
ayrintilar `docs/konusma-gunlugu.md` icinde.

## Claude icin kurallar

- Oturuma baslarken `docs/konusma-gunlugu.md` dosyasindaki son girdileri oku.
- Kalici bir karar alindiginda (teknoloji secimi, kapsam, isim, mimari) bu
  dosyayi veya konusma gunlugunu guncelle ve commit'le.
- Konteyner gecicidir: push edilmeyen hicbir sey kalmaz. Onemli her seyi
  `claude/jolly-fermi-pthav7` dalina push et.
- Kullaniciyla Turkce konus.

## Proje durumu

- **Depo:** `ozdmrorcn16/cloud`
- **Calisma dali:** `claude/jolly-fermi-pthav7`
- **Asama:** Fikir netlesti, gelistirme basliyor. Uygulama kodu `vpn-uygulamasi/`
  klasorunde, ayri bir oturumda gelistirilecek.

## Uygulama fikri

**VPN uygulamasi.** Kullanicinin internet trafigini yurt disindaki kendi
sunucumuzdan gecirir.

- **Platform:** Once Android. iOS sonraya birakildi (Apple onayi daha zor).
- **Protokol:** WireGuard.
- **Trafik sunucusu:** Yurt disinda (Almanya/Hollanda) kiralik VPS, aylik ~5$.
  Supabase bu isi yapamaz; yalnizca arka uc olarak kullanilir.
- **Arka uc (Supabase):** kullanici girisi, abonelik kaydi, sunucu listesi,
  WireGuard anahtar dagitimi (Edge Function).
- **Mimari:** Uygulama Supabase'e giris yapar -> sunucu adresi ve anahtari
  alir -> dogrudan VPS'teki WireGuard'a baglanir. Trafik Supabase'e ugramaz.
- **Alan adi:** Baslangicta gerekmiyor; sunucu adresleri Supabase'de tutulur.
  Magazaya yuklemeye yakin alinacak.
- **Bilinen zorluklar:** magaza gizlilik politikasi, Apple Network Extension
  izni, Turkiye'de IP engelleme (yurt disi sunucu + yedek adres listesi).
- **Kullanicinin yapacaklari:** gelistirici hesaplari, VPS kiralama, alan adi.

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Kararlar

- 2026-09-10 — Uygulama fikri VPN olarak netlesti (ayrintilar yukarida).
- 2026-09-10 — Ayri GitHub deposu acilamadi (entegrasyon yetkisi yok). Kod
  bu depoda `vpn-uygulamasi/` klasorunde gelistirilecek; kullanici ayri depo
  isterse GitHub'da kendisi acacak.

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
