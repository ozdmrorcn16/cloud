# Konusma Gunlugu

Butun oturumlarin kalici kaydi. Bu dosyanin indeks blogu hook tarafindan
otomatik guncellenir; "Kararlar" bolumu elle (Claude veya sen tarafindan)
yazilir.

## Otomatik kayit nasil calisiyor

`.claude/settings.json` icinde iki hook tanimli:

| Olay | Ne yapar |
|---|---|
| `Stop` (her yanit sonunda) | Oturum dokumunu `docs/oturumlar/` altina yazar. Arka planda calisir, yaniti bekletmez. |
| `SessionEnd` (oturum kapanirken) | Ayni dokumu yazar, sonra `docs/oturumlar` ve bu dosyayi commit'leyip dala push eder. |

Her ikisi de `.claude/hooks/oturum-kaydet.py` betigini calistirir. Betik
yalnizca kayit yollarini stage'ler, devam eden calismadaki dosyalara dokunmaz.

Uretilen dosyalar:

- `docs/oturumlar/<tarih>-<oturum>.md` — okunabilir konusma dokumu
- `docs/oturumlar/ham/<tarih>-<oturum>.jsonl` — ham transcript yedegi

### Kapatmak istersen

`.claude/settings.json` dosyasindaki `hooks` blogunu sil, ya da Claude Code
icinde `/hooks` menusunden devre disi birak.

## Oturumlar

<!-- oturumlar:baslangic -->

- 2026-09-18 — [2026-09-18-25faa7a8.md](oturumlar/2026-09-18-25faa7a8.md) — Yerelde oturumda login sorunu çıktı halledebiliyormusun
- 2026-08-09 — [2026-08-09-9b839baa.md](oturumlar/2026-08-09-9b839baa.md) — daha önce bir uygulama fikrinden bahsettim hatırlıyormusun

<!-- oturumlar:bitis -->

## Kararlar

- **2026-08-09** — Depo bos halde bulundu; onceki oturumdan kalan hicbir kayit
  yoktu (commit, dal, issue, PR yok). Bu yuzden kalici hafiza katmani kuruldu.
- **2026-08-09** — Uygulama fikri henuz yazili degil. Anlatildiginda
  `CLAUDE.md` icindeki "Uygulama fikri" bolumu doldurulacak.
- **2026-09-18** — Uygulama fikri bulundu: **Slooin**. Bu depoda degil,
  `ozdmrorcn16/slooin-projesi` deposunda (dal
  `claude/plan2-moderasyon-paneli`) ve canlida. Kullanici "Slooin
  projesine devam edicez" dedigine kadar bu depoda hicbir iz yoktu;
  hesabin depo listesinde bulundu. Bir daha aranmasin diye `CLAUDE.md`
  "Uygulama fikri" bolumune yazildi.
- **2026-09-18** — Yereldeki Claude Code giris sorunu icin
  `docs/sorun-giderme-login.md` eklendi (temiz yeniden giris, OAuth
  callback, token suresi, `ANTHROPIC_API_KEY` onceligi, kimlik bilgisi
  konumlari).
