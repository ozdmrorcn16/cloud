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

- `frontend-design@claude-plugins-official` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Market: `anthropics/claude-plugins-official`. Hem market hem
  eklenti `.claude/settings.json` icinde proje kapsaminda tanimli.
  **Dikkat:** bu tanim tek basina yeterli olmayabiliyor — uzak (web) oturumlarinda
  eklenti indirilmeden kalabiliyor. Oturum basinda `claude plugin list` ile
  dogrula, eksikse Kararlar bolumundeki iki komutu calistir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Ilk denemede `claude-plugins-official`
  marketi bulunamadi sanilip `anthropics/claude-code` deposundaki `claude-code-plugins`
  marketi kullanilmisti; bu yanlisti. Market gercekte `anthropics/claude-plugins-official`
  deposu olarak mevcut ve `frontend-design` icinde yer aliyor. Ayar
  `frontend-design@claude-plugins-official` olarak duzeltildi.
- 2026-08-09 — Eklenti kurulumu yeni konteynerde kendiliginden gelmiyor. Oturuma
  baslarken `claude plugin list` ile dogrula; eksikse su iki komutu calistir:
  `claude plugin marketplace add anthropics/claude-plugins-official` ve
  `claude plugin install frontend-design@claude-plugins-official`.
