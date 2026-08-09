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

  **Dikkat:** ayarin geri gelmesi eklentinin yuklu olmasi demek degil.
  Claude Code on the web (bulut) konteynerlerinde `SKIP_PLUGIN_MARKETPLACE=true`
  ortam degiskeni tanimli oldugu icin market klonlanmaz ve eklenti otomatik
  kurulmaz; oturum acildiginda `claude plugin list` bos gelir. Yerel CLI'da
  boyle bir kisit yok, ayar oldugu gibi calisir.

  Bulut oturumunda elle kurmak icin:

  ```bash
  claude plugin marketplace add anthropics/claude-code
  claude plugin install frontend-design@claude-code-plugins
  ```

  Kurulum `/root/.claude/...` altina yazilir, yani konteyner ile birlikte
  silinir; her yeni bulut oturumunda tekrarlanmasi gerekir. Beceri, ortamda
  hazir gelen `/mnt/skills/public/frontend-design` kopyasindan farklidir.

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
