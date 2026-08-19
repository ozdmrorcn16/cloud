# YouTube Otomasyonu

Fikirden yayina kadar her adimi kendisi yapan bir video uretim hatti.
Tek komutla: konu secer, senaryoyu yazar, seslendirir, gorselleri bulur,
altyazili videoyu monte eder, kapak uretir ve YouTube'a yukler.

```
konu -> senaryo -> seslendirme -> gorsel -> montaj -> kapak -> YouTube
```

Ayni kod hem kendi bilgisayarinda hem de GitHub Actions'ta (sunucusuz, zamanlanmis)
calisir. **API anahtari olmadan da calisir**: anahtar yoksa ucretsiz/yerel
saglayicilara duser, videoyu yine de uretir.

---

## Hizli baslangic

```bash
# 1. Sistem araclari
sudo apt install ffmpeg espeak-ng        # macOS: brew install ffmpeg espeak-ng

# 2. Python ortami
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 3. Ortami kontrol et (neyin hazir oldugunu gosterir)
.venv/bin/python -m otomasyon dogrula

# 4. Yuklemeden bir video uret (deneme)
.venv/bin/python -m otomasyon tam-akis --kuru --konu "Telefon sarji neden cabuk bitiyor"
```

Sonuc `cikti/<tarih>-<konu>/` altinda: `*.mp4`, `kapak.jpg`, `altyazi.srt`,
`senaryo.txt`, `durum.json`.

---

## API anahtarlari

`.env.ornek` dosyasini `.env` olarak kopyalayip doldur. Hicbiri zorunlu degil;
hangisi varsa kalite o kadar artar.

| Anahtar | Ne icin | Yoksa ne olur | Ucret |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Senaryo, baslik, aciklama, etiket, kapak metni | Sablon senaryo (iskelet metin) | kullandikca |
| `PEXELS_API_KEY` | Telifsiz stok video/foto | Uretilmis degrade arka plan | **ucretsiz** |
| `ELEVENLABS_API_KEY` | Dogal Turkce seslendirme | edge-tts (ucretsiz, yine dogal) | ucretli |
| `HIGGSFIELD_API_*` | AI ile sahne gorseli (deneysel) | Pexels ya da yerel gorsel | kredi |
| `YT_CLIENT_ID` / `YT_CLIENT_SECRET` / `YT_REFRESH_TOKEN` | YouTube'a yukleme | Yukleme yapilmaz, dosya diskte kalir | ucretsiz |

**Onerilen minimum:** `ANTHROPIC_API_KEY` + `PEXELS_API_KEY`. Bu ikisiyle
Claude senaryoyu yazar, gercek stok goruntu kullanilir, seslendirme
edge-tts ile ucretsiz yapilir.

### Saglayici zinciri

Her katman icin bir sira tanimlidir ve **calisma aninda basarisiz olan saglayici
atlanir**:

| Katman | Sira |
|---|---|
| metin | `claude` -> `sablon` |
| ses | `elevenlabs` -> `edge` -> `espeak` -> `sessiz` |
| gorsel | `pexels` -> `klasor` -> `yerel` |

Sirayi `konfig/kanal.yaml` icinden degistirebilirsin.

---

## YouTube yetkilendirmesi (bir kerelik)

1. [Google Cloud Console](https://console.cloud.google.com/) > yeni proje olustur.
2. **APIs & Services > Library** > "YouTube Data API v3" > **Enable**.
3. **OAuth consent screen**: External sec, uygulama adini yaz, kendi e-postani
   "Test users" listesine ekle (uygulamayi yayinlamana gerek yok).
4. **Credentials > Create credentials > OAuth client ID > Desktop app** >
   JSON'u indir.
5. Kendi bilgisayarinda calistir:

```bash
.venv/bin/python scripts/youtube-yetki.py ~/Downloads/client_secret_....json
```

Tarayici acilir, kanali secersin. Betik `konfig/token.json` yazar (git'e girmez)
ve GitHub Actions icin gereken uc degeri ekrana basar.

> Yeni olusturulan API projeleri "denenmemis" sayilir; ilk yuklemeler
> **her zaman `private` (gizli)** olarak yapilir. Kanal dogrulandiktan sonra
> `konfig/kanal.yaml` icindeki `yukleme.gizlilik` degerini `public` yapabilirsin.

---

## Komutlar

```bash
python -m otomasyon dogrula                     # ortam + saglayici raporu
python -m otomasyon konular -n 5                # konu onerisi
python -m otomasyon tam-akis                    # uret + yukle
python -m otomasyon tam-akis --kuru             # uret, yukleme
python -m otomasyon tam-akis --konu "..."       # konuyu kendin ver
python -m otomasyon gecmis                      # islenen konular / yuklenen videolar
python -m otomasyon sesler                      # Turkce edge-tts sesleri
```

Adimlar tek tek de calisir; hepsi son uretim dizini uzerinde is gorur
(`--uretim <dizin>` ile baskasini secebilirsin):

```bash
python -m otomasyon senaryo --konu "..."
python -m otomasyon ses
python -m otomasyon gorsel
python -m otomasyon montaj      # or. sadece altyaziyi degistirip yeniden monte et
python -m otomasyon kapak
python -m otomasyon yukle
```

Tek seferlik ayar ezmesi:

```bash
python -m otomasyon tam-akis --ayar video.bicim=yatay --ayar video.hedef_sure=90
```

---

## Yapilandirma

Her sey `konfig/kanal.yaml` icinde. Sik kullanilanlar:

| Ayar | Anlami |
|---|---|
| `video.bicim` | `shorts` (1080x1920) veya `yatay` (1920x1080) |
| `video.hedef_sure` | Senaryonun hedefledigi uzunluk (saniye) |
| `video.sahne_sayisi` | Kac gorsel/sahne olsun |
| `ses.edge_ses` | `tr-TR-AhmetNeural` / `tr-TR-EmelNeural` |
| `ses.muzik_yolu` | Arka plan muzigi (or. `varliklar/muzik/fon.mp3`) |
| `altyazi.kelime_sayisi` | Bir altyazi satirindaki kelime sayisi |
| `yukleme.gizlilik` | `private` / `unlisted` / `public` |
| `yukleme.yayin_zamani` | ISO 8601 verirsen planli yayin (or. `2026-09-01T18:00:00Z`) |

Konu havuzu `konfig/konular.txt` icinde. Kullanilan konular
`gecmis/uretimler.json` dosyasina islenir ve bir daha secilmez.

### Kendi gorsellerini kullanmak

`varliklar/gorseller/` klasorune resim ya da video birak; `klasor` saglayicisi
bunlari sahnelere sirayla dagitir. Higgsfield / Midjourney gibi araclarla
uretilen sahneleri kullanmanin en guvenilir yolu budur:

```yaml
gorsel:
  saglayici_sirasi: [klasor, pexels, yerel]
```

---

## GitHub Actions ile zamanlanmis uretim

`.github/workflows/video-uret.yml` her gun 06:00 UTC'de (Turkiye saatiyle 09:00)
calisir. Kurulumu:

1. **Settings > Secrets and variables > Actions** altina anahtarlari ekle:
   `ANTHROPIC_API_KEY`, `PEXELS_API_KEY`, `YT_CLIENT_ID`, `YT_CLIENT_SECRET`,
   `YT_REFRESH_TOKEN` (varsa `ELEVENLABS_API_KEY`, `HIGGSFIELD_API_*`).
2. **Settings > Actions > General > Workflow permissions**: "Read and write"
   sec (gecmis dosyasi geri commit'lenebilsin diye).
3. Actions sekmesinden **Run workflow** ile elle dene: `kuru` kutusunu isaretle,
   uretilen video "Artifacts" altinda iner.

Sikligi degistirmek icin `cron` satirini duzenle
(`0 6 * * 1,4` = pazartesi ve persembe).

---

## Sinirlar ve dikkat edilecekler

- **YouTube kotasi:** gunluk 10.000 birim; bir yukleme 1.600 birim. Yani gunde
  en fazla ~6 video. Otomasyon gunde 1 videoya ayarli.
- **Icerik sorumlulugu sende:** YouTube tekrar eden/otomatik uretilmis dusuk
  degerli icerigi cezalandirir. Senaryolari gozden gecirmek icin once
  `yukleme.gizlilik: private` ile calis, begendigini elle herkese ac.
- **Telif:** Pexels icerigi telifsizdir; kendi ekledigin muzik/gorsel icin
  lisansi sen kontrol etmelisin.
- **Claude'un yazdigi bilgi dogrulanmali:** senaryo iddialarini yayindan once
  okumakta fayda var (`cikti/<uretim>/senaryo.txt`).
- **edge-tts** bazi ag ortamlarinda (kurumsal proxy, bazi bulut konteynerleri)
  engellenir; boyle bir durumda otomatik olarak `espeak-ng`'ye duser. Kendi
  bilgisayarinda normalde sorunsuz calisir.

---

## Sorun giderme

| Belirti | Cozum |
|---|---|
| `ffmpeg bulunamadi` | `sudo apt install ffmpeg` |
| Altyazi cok buyuk/kucuk | `altyazi.punto` degerini ayarla (0 = otomatik) |
| Ses robotik cikiyor | edge-tts engellenmis demektir; `python -m otomasyon dogrula` ile bak |
| `Yeni konu bulunamadi` | `konfig/konular.txt` dosyasina satir ekle |
| Yukleme `quotaExceeded` | Gunluk kota dolmus, ertesi gunu bekle |
| Kapak yuklenmedi | Kanalin telefonla dogrulanmasi gerekiyor (YouTube kurali) |

---

## Testler

```bash
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -q
```

Uctan uca test gercek bir mp4 uretir (anahtarsiz saglayicilarla, ~20 saniye).

## Proje yapisi

```
otomasyon/
  cli.py            komut satiri
  akis.py           adimlarin orkestrasyonu
  ayarlar.py        yapilandirma + sirlar
  montaj.py         ffmpeg islemleri, kapak
  altyazi.py        SRT / ASS uretimi
  gecmis.py         islenen konularin kaydi
  saglayicilar/     metin, ses, gorsel, yukleme adaptorleri
konfig/kanal.yaml   tum ayarlar
scripts/            bir kerelik YouTube yetkilendirmesi
.github/workflows/  zamanlanmis uretim + testler
```
