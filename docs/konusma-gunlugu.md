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

- 2026-08-14 — [2026-08-14-0b7b3a17.md](oturumlar/2026-08-14-0b7b3a17.md) — En son açık olan oturumum kapandımı bulamıyorum
- 2026-08-09 — [2026-08-09-9b839baa.md](oturumlar/2026-08-09-9b839baa.md) — daha önce bir uygulama fikrinden bahsettim hatırlıyormusun

<!-- oturumlar:bitis -->

## Kararlar

- **2026-08-09** — Depo bos halde bulundu; onceki oturumdan kalan hicbir kayit
  yoktu (commit, dal, issue, PR yok). Bu yuzden kalici hafiza katmani kuruldu.
- **2026-08-09** — Uygulama fikri henuz yazili degil. Anlatildiginda
  `CLAUDE.md` icindeki "Uygulama fikri" bolumu doldurulacak.

## Senkronize olmamis yerel calisma (2026-08-12 → 08-14)

Bu bolum, buluttaki oturum listesinden kurtarilan bilgidir; tam dokum degil.
12–14 Agustos arasindaki oturumlar kullanicinin kendi makinesinde
(`~/projects/cloud`) calisti ve commit izni onaylanmadigi icin **hicbiri
depoya girmedi**. Asagidakiler, takili kalan izin isteginin commit mesajindan
okundu — kararlarin basliklari var, ayrintilari yok.

**Bekleyen oturumlar (baglantisi kopuk, silinmis degil):**

| Oturum | ID | Durum | Bekledigi sey |
|---|---|---|---|
| Kaldigimiz yere geri ac | `session_01YJfquzYTjGG1ySrpkkwnXN` | PENDING, disconnected | "Bu bolum dogru mu, bir sey eklemek ister misin?" |
| Yerel kurulum tamamlama | `session_01Kr9VVGeBPJkcmSkH2zf7op` | REQUIRES_ACTION | Faz 2 notlarini commit'leyecek `git commit` izni |

**Faz 2 beyin firtinasinda alindigi bildirilen kararlar** (dokuz karar
alinmis; commit mesajinda adi gecen alti tanesi):

1. Mekan verisi kaynagi secildi.
2. Check-in iki katmanli olacak.
3. Medya kapsami belirlendi.
4. "Mekan odasi" kavrami kaldirildi.
5. Kullanici kendisi mekan ekleyebilecek.
6. Faz 2, 2a ve 2b olarak ikiye bolundu.

**Cevaplanmamis soru:** Check-in icin mekana yakinlik sarti olsun mu, yoksa
check-in her yerden serbest mi olsun?

**Kaybolan oturum:** `semraor-un-cryptic-sunset`
(`session_01WdoVq46xjegpDxEDJtweCC`, 2026-08-13 20:46) — ortami silindigi icin
durumu geri getirilemiyor.

**Sonraki adim:** Bilgisayara donuldugunde Claude Code'u ac; iki oturum da
baglanip kaldigi yerden devam eder. Bekleyen commit onaylanip bu dala push
edilirse kararlarin ayrintilari da depoya girer.
