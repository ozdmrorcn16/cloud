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
- **Calisma dali:** `claude/app-design-mikcti` (tasarim oturumu; onceki dal: `claude/uygulama-fikri-o3tuda`)
- **Asama:** Tasarim asamasi. Fikir kaydedildi, ekran tasarimlari yapiliyor.

## Uygulama fikri

**Check-in tabanli sosyal uygulama** (2026-08-25'te anlatildi):

- Kullanici bulundugu mekana **check-in** yapiyor.
- Ayni mekana check-in yapmis **diger insanlari gorebiliyor**.
- Begendigi kisileri **ekleyip onlarla mesajlasabiliyor**.
- Ozetle: ayni mekandaki insanlari tanistiran, konuma dayali bir sosyallesme uygulamasi.
- **Platform: mobil.**
- Gorsel stil tercihleri netlestikce buraya eklenecek.

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.
