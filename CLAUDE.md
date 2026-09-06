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
  tasarim becerisi. Hem market hem eklenti `.claude/settings.json` icinde
  proje kapsaminda tanimli, yani yeni konteynerde kendiliginden geri gelir.

## Kararlar

- 2026-08-09 — Butun konusmalar repoya otomatik kaydedilecek; hafiza katmani
  olarak `CLAUDE.md` + `docs/konusma-gunlugu.md` + otomatik oturum dokumleri
  kullanilacak.
- 2026-08-09 — `frontend-design` eklentisi kuruldu. Istenen `claude-plugins-official`
  adiyla bir market bu ortamda kayitli degildi; eklenti `anthropics/claude-code`
  deposundaki resmi markette bulundu ve `claude-code-plugins` adiyla eklendi.

## Agent Reach

Internet erisimi icin `agent-reach` (v1.5.0) kuruldu. **Konteyner gecici oldugu
icin her yeni oturumda yeniden kurulmasi gerekir:**

```bash
python3 -m venv ~/.agent-reach-venv
~/.agent-reach-venv/bin/pip install "git+https://github.com/Panniantong/agent-reach.git@main"
export PATH="$HOME/.agent-reach-venv/bin:$PATH"
agent-reach install --env=auto --system --channels=all
apt-get install -y ffmpeg
```

Not: `pipx` yok ve `https://github.com/.../archive/main.zip` egress politikasi
tarafindan 403 ile engelleniyor; bu yuzden venv + git kaynagi kullaniliyor.

### Bu ortamda calisan kanallar (4/15)

YouTube (yt-dlp), RSS/Atom, Web (Jina Reader), Bilibili (bili-cli).

### Calismayanlar ve nedenleri

| Kanal | Neden |
|---|---|
| Facebook, Instagram, OpenCLI, kismen 小红书 | Masaustu Chrome + OpenCLI eklentisi gerekiyor; konteynerde tarayici yok |
| Exa semantik arama | `mcporter` tarayici uzerinden OAuth istiyor, headless ortamda zaman asimina ugruyor |
| V2EX | Egress politikasi hostu engelliyor (403) |
| Twitter/X, Reddit, 雪球 | CLI'lar kurulu; kullanicinin Cookie-Editor ile disari aktardigi cerezleri bekliyor |
| 小宇宙 podcast | Script + ffmpeg hazir; ucretsiz Groq API key bekliyor |
| LinkedIn | `mcporter` kaydi yapildi; ilk giris tarayici gerektiriyor |
| GitHub (`gh`) | CLI kurulu; oturumun kendi GitHub MCP araclari zaten kullanilabilir |
