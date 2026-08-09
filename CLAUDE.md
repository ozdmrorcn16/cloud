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
- **Calisma dali:** `claude/uygulama-fikri-o3tuda`
- **Asama:** Fikir asamasi. Uygulama fikrinin icerigi henuz kayitli degil.

## Uygulama fikri

> Henuz doldurulmadi. Fikir anlatildiginda buraya yazilacak:
> ne ise yariyor, kime hitap ediyor, platform, teknoloji secimi.

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi (surum 1.1.0, tek dosya: `skills/frontend-design/SKILL.md`).
  Hem market hem eklenti `.claude/settings.json` icinde proje kapsaminda
  tanimli, yani **ayar** yeni konteynerde kendiliginden geri gelir.

  **Neden ek is gerekti:** ayarin geri gelmesi eklentinin yuklu olmasi demek
  degil. Claude Code on the web (bulut) konteynerlerinde
  `SKIP_PLUGIN_MARKETPLACE=true` tanimli oldugu icin market klonlanmaz ve
  eklenti otomatik kurulmaz; kurulum da `/root/.claude/...` altina yazildigi
  icin konteynerle birlikte silinir. Yerel CLI'da boyle bir kisit yok.

  **Cozum:** `.claude/hooks/eklenti-kur.py` betigi `SessionStart` hook'u
  olarak tanimli. Her oturum acilisinda eklentinin diskte olup olmadigina
  bakar; yoksa marketi ekleyip eklentiyi kurar ve `reloadSkills` bayragiyla
  cikarak beceriyi ayni oturumda kullanilabilir yapar. Yani elle komut
  calistirmak gerekmiyor.

  - Kurulum gerektiginde oturum acilisi ~35 sn uzar (market klonu).
  - Eklenti zatan kuruluysa hook 0.03 sn surer ve hicbir sey yazmaz.
  - Hook hicbir kosulda oturumu engellemez; kurulum basarisiz olursa yalnizca
    bilgilendirme metni birakir.

  Not: bu beceri, ortamda hazir gelen `/mnt/skills/public/frontend-design`
  kopyasindan farklidir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
- 2026-08-09 — Eklenti kurulumu dogrulandi: ayar dosyasi dogru, market girdisi
  gecerli, eklenti 1.1.0 olarak sorunsuz kuruluyor. Ancak bulut konteynerinde
  `SKIP_PLUGIN_MARKETPLACE=true` nedeniyle otomatik kurulum olmuyor; her bulut
  oturumunda iki komutla elle kurulmasi gerekiyor (bkz. "Eklentiler").
- 2026-08-09 — Eklenti kurulumu kalicilastirildi: `SessionStart` hook'u
  (`.claude/hooks/eklenti-kur.py`) her yeni konteynerde eklentiyi otomatik
  kuruyor. Elle kurulum adimina artik gerek yok.
