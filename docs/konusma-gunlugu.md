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

### Redaksiyon

Uc cikti da (dokum, ham jsonl, yukaridaki oturum indeksi) diske yazilmadan
once `gizlileri_maskele()` fonksiyonundan gecer. Anahtar gorunumlu diziler
(`sk-ant-…`, `AKIA…`, `ghp_…`, `xoxb-…`, ozel anahtar bloklari ve digerleri;
tam liste betikteki `GIZLI_DESENLER`) `<REDACTED>` ile degistirilir.

Bu susleme degil: kayitlar repoya push edildigi icin maskeleme olmadan
GitHub'in push korumasi butun push'u reddediyor. Indeks ozeti de maskelendikten
**sonra** 80 karaktere kirpilir — tersi olsaydi ortadan kesilen bir anahtar
desene uymaz ve yarisi indekste kalirdi.

### Kapatmak istersen

`.claude/settings.json` dosyasindaki `hooks` blogunu sil, ya da Claude Code
icinde `/hooks` menusunden devre disi birak.

## Oturumlar

<!-- oturumlar:baslangic -->

- 2026-08-12 — [2026-08-12-bb3bdf55.md](oturumlar/2026-08-12-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-11 — [2026-08-11-bb3bdf55.md](oturumlar/2026-08-11-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-10 — [2026-08-10-bb3bdf55.md](oturumlar/2026-08-10-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-09 — [2026-08-09-bb3bdf55.md](oturumlar/2026-08-09-bb3bdf55.md) — # Code Review Plugin Automated code review for pull requests using multiple spec…
- 2026-08-09 — [2026-08-09-9b839baa.md](oturumlar/2026-08-09-9b839baa.md) — daha önce bir uygulama fikrinden bahsettim hatırlıyormusun

<!-- oturumlar:bitis -->

## Kararlar

- **2026-08-09** — Depo bos halde bulundu; onceki oturumdan kalan hicbir kayit
  yoktu (commit, dal, issue, PR yok). Bu yuzden kalici hafiza katmani kuruldu.
- **2026-08-09** — Uygulama fikri henuz yazili degil. Anlatildiginda
  `CLAUDE.md` icindeki "Uygulama fikri" bolumu doldurulacak.
- **2026-08-13** — Yas politikasi degisti: alt sinir 16'dan 18'e cikti, 16-17
  yas bandi ve veli onayi akisi tamamen kaldirildi. Gerekce: veli onayi
  mekanizmasinin (SMS/e-posta ile onay linki, ayri bir Edge Function)
  getirdigi karmasikliktan Faz 1'de kacinmak. Spec ve `CLAUDE.md` guncellendi.
- **2026-08-13** — SMS dogrulama icin Faz 1 boyunca ucretli bir saglayici
  kurulmuyor: Supabase'in hosted projede sundugu ucretsiz "test telefon
  numaralari" ozelligi kullanilacak (gercek SMS gonderilmez, ucret cikmaz).
  Gercek saglayici (Twilio) entegrasyonu izole bir goreve (Faz 1 planinin
  Task 14'u) konuldu; yalnizca magazaya cikmadan hemen once calistirilacak.
- **2026-08-13** — Faz 1 ("Hesap": kayit, telefon dogrulama, profil olusturma,
  oturum) uygulama plani yazildi:
  `docs/superpowers/plans/2026-08-13-faz1-hesap.md`. Tech stack: Expo (React
  Native + TypeScript, Expo Router) + Supabase (Auth, Postgres, Storage),
  proje `mobil/` altina kuruluyor. 14 gorev, TDD sirali.
