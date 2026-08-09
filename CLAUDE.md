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

## Beceriler

- `frontend-design` — arayuz gelistirmede kullanilacak tasarim becerisi.
  Repoda: `.claude/skills/frontend-design/`. Her oturumda ag ve yukleyici
  olmadan otomatik yuklenir; ekstra kurulum gerekmez.
  Nereden geldigi ve nasil guncellendigi:
  `.claude/skills/frontend-design/KAYNAK.md`.

Eklenti (plugin) kurulumu **kullanilmiyor** — gerekcesi Kararlar bolumunde.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Ilk denemede `claude-plugins-official`
  marketi bulunamadi sanilip `anthropics/claude-code` deposundaki `claude-code-plugins`
  marketi kullanilmisti; bu yanlisti. Market gercekte `anthropics/claude-plugins-official`
  deposu olarak mevcut ve `frontend-design` icinde yer aliyor. Ayar
  `frontend-design@claude-plugins-official` olarak duzeltildi.
- 2026-08-09 — Eklenti yontemi birakildi, beceri repoya kopyalandi (vendor).
  Gerekce: `claude plugin install` eklentiyi `~/.claude/` altina kuruyor, o dizin
  konteynerle birlikte siliniyor; `.claude/settings.json` icindeki eklenti tanimi
  da uzak oturumda indirmeyi tetiklemedi, yani beceri hic yuklenmedi.
  `.claude/skills/` ise repoda oldugu icin her oturumda kosulsuz okunur.
  Bedeli: upstream guncellemeleri elle cekilir (bkz. `KAYNAK.md`).
