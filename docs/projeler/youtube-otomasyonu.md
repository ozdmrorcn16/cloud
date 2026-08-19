# Proje: YouTube Otomasyonu

> Bu, "uygulama fikri" projesinden **ayri** bir istir. Ikisi karistirilmamali.
> Diger projeler: [`uygulama-fikri.md`](uygulama-fikri.md)

Fikirden yayina kadar her adimi kendi yapan video uretim hatti.
Kullanim rehberi: [`../../README.md`](../../README.md)

## Durum

| | |
|---|---|
| **Asama** | Calisir durumda; uctan uca video uretiyor |
| **Dal** | `claude/youtube-automation-setup-m1blri` |
| **Bekleyen** | YouTube OAuth yetkilendirmesi (kullanicinin bir kerelik yapmasi gerekiyor) |
| **Test** | 49 test geciyor (`pytest -q`), gercek mp4 ureten tumlesim testi dahil |

## Kapsam

konu sec -> senaryo yaz -> seslendir -> gorsel bul -> altyazili montaj ->
kapak uret -> YouTube'a yukle. Tek komut: `python -m otomasyon tam-akis`.

- **Nerede calisir:** hem yerel hem GitHub Actions
  (`.github/workflows/video-uret.yml`, gunluk cron). Ayni CLI'yi cagiriyorlar.
- **Teknoloji:** Python 3.11, ffmpeg, argparse tabanli CLI.
- **Saglayici zinciri** (calisma aninda basarisiz olan atlanir):

  | Katman | Sira |
  |---|---|
  | metin | Claude -> sablon |
  | ses | ElevenLabs -> edge-tts -> espeak-ng -> sessiz |
  | gorsel | Pexels -> klasor -> yerel degrade |
  | yukleme | YouTube Data API v3 -> kuru |

- **Anahtarlar:** `.env` (ornegi `.env.ornek`). Hicbiri zorunlu degil.

## Kod haritasi

| Yol | Rolu |
|---|---|
| `otomasyon/akis.py` | Adimlarin orkestrasyonu; her adim tek basina da calisir |
| `otomasyon/montaj.py` | ffmpeg islemleri, kapak uretimi |
| `otomasyon/altyazi.py` | SRT (yan dosya) + ASS (goruntuye gomulen) |
| `otomasyon/saglayicilar/` | metin, ses, gorsel, yukleme adaptorleri |
| `otomasyon/gecmis.py` | Islenen konularin kaydi (tekrar engelleme) |
| `konfig/kanal.yaml` | Tum ayarlar |
| `scripts/youtube-yetki.py` | Bir kerelik OAuth, refresh token uretir |

## Kararlar

- **2026-08-19** — Kapsam fikirden yuklemeye tam otomatik olacak.
- **2026-08-19** — Calisma yeri (yerel mi Actions mi) kararsiz kaldi; ikisini de
  destekleyen tek bir CLI yazildi.
- **2026-08-19** — Saglayicilar takilabilir yapildi ve her katmana anahtarsiz bir
  yedek konuldu; boru hatti API anahtari olmadan da uctan uca calisiyor.
- **2026-08-19** — Altyazi ffmpeg'in `subtitles` suzgeciyle degil, kendi
  urettigimiz ASS dosyasiyla gomuluyor: PlayRes videonun cozunurlugu olsun diye
  (aksi halde libass 384x288 varsayip yaziyi ~6 kat buyutuyor).
- **2026-08-19** — Ilk yuklemeler `private`; kalite elle onaylandiktan sonra
  `konfig/kanal.yaml` icinden `public` yapilacak.
- **2026-08-19** — Kuru (deneme) kosular konu havuzunu tuketmiyor; gecmise
  `kuru: true` olarak yaziliyor.

## Acik isler

- [ ] YouTube yetkilendirmesi: `python scripts/youtube-yetki.py <client_secret.json>`
- [ ] Pexels anahtari `.env` dosyasina (ve Actions Secrets'a) eklenecek
- [ ] Gercek ag uzerinden bir kez uctan uca kosu (bu konteynerde dis API'ler kapali)
- [ ] Ilk videolar elle gozden gecirilip gizlilik `public` yapilacak

## Notlar

- Bu konteynerin ag politikasi `api.pexels.com` ve edge-tts'i engelliyor;
  adaptorler sahte HTTP yanitlariyla test edildi. Kullanicinin bilgisayarinda
  boyle bir kisit yok.
- **2026-08-19 guvenlik:** sir gizleme testine kullanicinin gercek Pexels
  anahtari ornek veri olarak konmus ve public depoya push edilmisti; uydurma
  degerle degistirildi (`4f1b9d6`). Anahtar gecmiste kaldigi icin kullaniciya
  yenilemesi soylendi. Testlere asla gercek anahtar yazilmayacak.
