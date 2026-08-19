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
  `claude/uygulama-fikri-o3tuda` dalina push et.
- Kullaniciyla Turkce konus.

## Proje durumu

- **Depo:** `ozdmrorcn16/cloud`
- **Calisma dali:** `claude/youtube-automation-setup-m1blri`
  (onceki dal: `claude/uygulama-fikri-o3tuda` — hafiza katmani orada kuruldu)
- **Asama:** YouTube otomasyonu calisir durumda. Uctan uca video uretiyor;
  yukleme icin kullanicinin YouTube yetkilendirmesi bekleniyor.

## Uygulama: YouTube otomasyonu

Fikirden yayina kadar her adimi kendi yapan video uretim hatti.
Ayrintili kullanim rehberi: `README.md`.

- **Ne yapar:** konu sec -> senaryo yaz -> seslendir -> gorsel bul ->
  altyazili montaj -> kapak -> YouTube'a yukle.
- **Nerede calisir:** hem yerel (`python -m otomasyon ...`) hem GitHub Actions
  (`.github/workflows/video-uret.yml`, gunluk cron).
- **Dil/teknoloji:** Python 3.11, ffmpeg, ArgumentParser tabanli CLI; dis
  bagimlilik yok denecek kadar az.
- **Saglayici zinciri (calisma aninda basarisiz olan atlanir):**
  - metin: Claude -> sablon
  - ses: ElevenLabs -> edge-tts -> espeak-ng -> sessiz
  - gorsel: Pexels -> klasor (elle/AI ile hazirlanan) -> yerel degrade
  - yukleme: YouTube Data API v3 -> kuru (yalnizca rapor)
- **Anahtarlar:** `.env` (ornegi `.env.ornek`). Hicbiri zorunlu degil;
  anahtarsiz da video uretir.
- **Kod haritasi:** `otomasyon/akis.py` orkestrasyon, `otomasyon/montaj.py`
  ffmpeg, `otomasyon/saglayicilar/` adaptorler, `konfig/kanal.yaml` tum ayarlar.

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-19 — YouTube otomasyonu kuruldu. Kapsam: fikirden yuklemeye tam
  otomatik. Calisma yeri kararsiz kalindigi icin hem yerel hem GitHub Actions
  destekleyecek tek CLI yazildi.
- 2026-08-19 — Saglayicilar takilabilir yapildi ve her katmana anahtarsiz bir
  yedek konuldu; boylece boru hatti API anahtari olmadan da uctan uca calisiyor.
- 2026-08-19 — Altyazi ffmpeg'in `subtitles` suzgeciyle degil, kendi urettigimiz
  ASS dosyasiyla gomuluyor: PlayRes videonun cozunurlugu olsun diye
  (aksi halde libass 384x288 varsayip yaziyi ~6 kat buyutuyor).
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
