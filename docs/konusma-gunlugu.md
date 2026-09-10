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

- 2026-09-10 — [2026-09-10-a6f6d148.md](oturumlar/2026-09-10-a6f6d148.md) — vpn uygulaması kurmak ücretlimi kurulabilirmi
- 2026-09-09 — [2026-09-09-a6f6d148.md](oturumlar/2026-09-09-a6f6d148.md) — vpn uygulaması kurmak ücretlimi kurulabilirmi
- 2026-08-09 — [2026-08-09-9b839baa.md](oturumlar/2026-08-09-9b839baa.md) — daha önce bir uygulama fikrinden bahsettim hatırlıyormusun

<!-- oturumlar:bitis -->

## Kararlar

- **2026-08-09** — Depo bos halde bulundu; onceki oturumdan kalan hicbir kayit
  yoktu (commit, dal, issue, PR yok). Bu yuzden kalici hafiza katmani kuruldu.
- **2026-08-09** — Uygulama fikri henuz yazili degil. Anlatildiginda
  `CLAUDE.md` icindeki "Uygulama fikri" bolumu doldurulacak.

- **2026-09-10** — VPN projesinin iskeleti `claude/vpn` dalinda kuruldu:
  Supabase semasi + RLS, `issue-config` Edge Function'i ve VPS icin
  `kur.sh` / `istemci-ekle.sh` / `esitle.sh`. Android tarafinda yalnizca
  Gradle katmani var; kaldigi yer `vpn/android/DURUM.md` icinde yazili.
  Oturum, kullanicinin kendi bilgisayarinda "vpn projesi" adiyla acilan
  oturumdan devam edilmesi icin burada durduruldu.
- **2026-09-10** — Supabase'de ayri `vpn` projesi acilmadi: ikinci proje
  aylik 10$. Kullanici onaylamadi, hicbir ucret olusmadi.
