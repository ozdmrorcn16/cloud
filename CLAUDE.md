# Proje Hafizasi

Bu dosya her Claude Code oturumunda otomatik olarak yuklenir. Depoda birden
fazla proje var; her birinin **kendi kayit dosyasi** vardir, bu dosya yalnizca
indeks ve ortak kurallardir.

## Projeler

| Proje | Klasor | Kayit | Durum |
|---|---|---|---|
| YouTube otomasyonu | `youtube-otomasyonu/` | [`docs/projeler/youtube-otomasyonu.md`](docs/projeler/youtube-otomasyonu.md) | Calisiyor; YouTube yetkilendirmesi bekleniyor |
| Uygulama | `uygulama/` | [`docs/projeler/uygulama-fikri.md`](docs/projeler/uygulama-fikri.md) | Beklemede; fikrin icerigi henuz anlatilmadi |

Her proje **kendi klasorunde** durur: kendi kodu, bagimliliklari, ayarlari ve
`.env` dosyasi. Birinin dosyalarina digerinden dokunulmaz. Depo kokunde yalnizca
ortak seyler bulunur: `CLAUDE.md`, `docs/`, `.claude/`, `.github/`.

**Onemli:** Bu ikisi ayri islerdir. YouTube otomasyonu, kullanicinin anlatacagi
uygulama fikrinin karsiligi *degildir*. Yeni bir is baslarsa ona da
`docs/projeler/` altinda kendi dosyasi acilir ve bu tabloya eklenir.

## Nasil calisiyor

Claude'un kendi basina oturumlar arasi hafizasi yoktur; her oturum sifirdan
baslar. Sureklilik su dosyalarla saglanir:

| Dosya | Rolu |
|---|---|
| `CLAUDE.md` (bu dosya) | Indeks + ortak kurallar. Her oturum basinda otomatik okunur. |
| `docs/projeler/<proje>.md` | Projeye ozel durum, kapsam, kararlar, acik isler. |
| `docs/konusma-gunlugu.md` | Oturum indeksi (hangi oturum ne zaman, ne hakkinda). |
| `docs/oturumlar/` | Her oturumun tam dokumu (hook tarafindan otomatik yazilir). |

Oturum dokumleri `.claude/hooks/oturum-kaydet.py` tarafindan uretilir; betik
yazmadan once API anahtari bicimlerini ve `.env` degerlerini maskeler.

## Claude icin kurallar

- Oturuma baslarken once bu tabloyu, sonra calisilan projenin kayit dosyasini
  ve `docs/konusma-gunlugu.md` icindeki son girdileri oku.
- **Hangi proje uzerinde calisildigini basta netlestir.** Belirsizse sor;
  projeleri birbirine karistirma.
- Kalici bir karar alindiginda (teknoloji secimi, kapsam, isim, mimari) **ilgili
  proje dosyasinin "Kararlar" bolumune** yaz ve commit'le. Ortak/altyapi
  kararlari (hafiza katmani, eklentiler) bu dosyaya yazilir.
- Konteyner gecicidir: push edilmeyen hicbir sey kalmaz. Onemli her seyi
  calisilan projenin dalina push et.
- Sirlar asla depoya girmez: gercek API anahtari ne teste, ne ornege, ne
  belgeye yazilir. `.env` ve `konfig/token.json` `.gitignore` icinde.
- Kullaniciyla Turkce konus.

## Depo

- **Depo:** `ozdmrorcn16/cloud` (public)
- **Ana dal:** `main` — iki proje de burada. Yeni oturumlar bu dali klonlar.
- Gelistirme dallari `main`'den cikar ve `main`'e doner. Projeleri ayri
  dallarda tutma: yeni oturum yalnizca birini gorur (2026-08-19'da bu yasandi).

## Eklentiler

- `frontend-design@claude-code-plugins` — arayuz gelistirmede kullanilacak
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Ortak kararlar

- **2026-08-09** — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- **2026-08-09** — `frontend-design` eklentisi kuruldu. Istenen
  `claude-plugins-official` adiyla bir market bu ortamda kayitli degildi;
  eklenti `anthropics/claude-code` deposundaki resmi markette bulundu ve
  `claude-code-plugins` adiyla eklendi.
- **2026-08-19** — Hafiza katmani proje basina ayrildi: her is icin
  `docs/projeler/` altinda ayri kayit dosyasi, `CLAUDE.md` indeks oldu.
- **2026-08-19** — Oturum kayit hook'u yazmadan once sirlari maskeliyor.
