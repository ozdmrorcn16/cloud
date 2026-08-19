# Faz 3a — devam notu (2026-08-19)

Oturum token siniri yuzunden kesildi. Bu dosya yeni oturumun nereden
devam edecegini anlatir. **Once bunu oku, sonra asagidaki defteri.**

## Nerede kaldik

- **Dal:** `claude/faz3a-bag` (Faz 2c'nin ucundan, `a915b06` uzerine)
- **Spec:** `docs/superpowers/specs/2026-08-19-faz3a-bag-design.md`
- **Plan:** `docs/superpowers/plans/2026-08-19-faz3a-bag.md` (18 gorev)
- **SDD defteri:** `.superpowers/sdd/2026-08-19-faz3a-bag/progress.md`
  Bu dizin git'e girmiyor ama **diskte duruyor**; butun kararlar, brief'ler
  ve gorev raporlari orada. Yeni oturum onu okuyarak devam edebilir.

### Gorev durumu

| Gorev | Durum |
|---|---|
| 1 `takipler` tablosu | tamam, incelendi (`c5d79c2`) |
| 2 `sohbet_istekleri` tablosu | tamam, incelendi (`3676b6d`) |
| 3 `bag.takip_ediyor_mu` | tamam, incelendi (`71cd5b2`) |
| 4 `check_inler.bulunurluk` | tamam, incelendi (`dac7cd3`) |
| 5 `profiller.varsayilan_bulunurluk` | tamam, incelendi (`d73220c`) |
| 6 gorunurluk politikasi | tamam, incelendi (`8e04c3a`) |
| 7 alti istek RPC'si | tamam, incelendi (`edf8cbc`) |
| 8 `check_in_yap` + ani donusumu | **uygulandi (`9356f88`), INCELENMEDI** |
| 9-18 | baslanmadi |

**Devam noktasi: Task 8'in incelemesi.** Inceleme paketi soyle uretilir:

```bash
bash "C:/Users/orcns/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development/scripts/review-package" \
  docs/superpowers/plans/2026-08-19-faz3a-bag.md edf8cbc HEAD
```

Task 8'de ozellikle denetlenmesi gereken sey: ani donusumunun
"gorunurluk hicbir zaman genislemez" kurali **iki yerde birden** dogru
yazilmis mi — hem `check_inden_ayril` RPC'sinde hem pg_cron isinin
SQL'inde. Ikisi ayrilirsa iki donusum yolu farkli davranir.

## Testlerin su anki hali

Kendi olcumum (2026-08-19, Task 8 sonrasi):

- `npm run test:sema` → **38 iddia, hepsi gecti**
- `npm run test:gorunurluk` → 36 iddiadan **11'i HATA** — bu **beklenen**
- `npx jest --runInBand` → Faz 2c'nin sonunda 33 paket / 165 test yesildi;
  Faz 3a'nin istemci gorevleri (11-16) henuz baslamadigi icin su an
  `lib/ayarlar.ts` kaynakli dusmeler olabilir

Gorunurluk paketinin dusmesi bir kusur degil: senaryolar hala eski
`gizli_mi` alanina ve eski kademe anlamina gore yazilmis. **Task 17**
onlari yeni kurallara gore guncelleyecek. Sakin iddia zayiflatarak
gecirmeye calisma.

## Bilerek acik birakilan kirik pencereler

1. `mobil/lib/ayarlar.ts` hala `varsayilan_gizli` sutununu okuyup yaziyor;
   o sutun Task 5'te dusuruldu. **Task 11** onaracak.
2. `mobil/lib/checkin.ts` hala `gizli_mi` alanini kullaniyor. **Task 11**
   onaracak.
3. Ekranlar (check-in, ayarlar) hala iki secenekli anahtar gosteriyor.
   **Task 12 ve 13** onaracak.

## Ortam tuzaklari (bunlari yeniden kesfetmeye gerek yok)

- `supabase db query` diye bir alt komut **yok**; `psql` kurulu **degil**;
  `supabase db dump` Docker istiyor ve Docker **yok**. Uzak veritabaninda
  serbest SQL calistirmanin yolu yok — dogrulamalar
  `npm run test:sema` betigiyle yapiliyor.
- **Uygulanmis bir migrasyon dosyasini duzenleyip `supabase db push`
  calistirmak ise yaramaz**; push yalnizca yeni dosyalari calistirir.
  Duzeltme her zaman yeni bir migrasyon dosyasiyla yapilir. Bu fazdan
  once bir kez yasandi: dosyadaki kod dogruyken canli fonksiyon eski
  bozuk haliyle kalmisti.
- Tam Jest paketi **`npx jest --runInBand`** ile calistirilmali; paralel
  kosum bu makinede kodla ilgisi olmayan zaman asimlari uretiyor.
- Gorunurluk ve sema betikleri `mobil/.env` icindeki
  `TEST_HESAP_SIFRESI` degiskenine ihtiyac duyar. Degisken tanimli.
- `@testing-library/react-native` 14.0.1: `render()` ve `fireEvent`
  **asenkron**, `await` gerekiyor.
- Bu depoya **baska bir oturum da yaziyor**. `CLAUDE.md` ve
  `docs/konusma-gunlugu.md` disaridan degisebilir; yazmadan once bastan
  sona yeniden oku, yalnizca ekleme yap.

## Bu oturumda verilen kararlar

Tamami defterde `Ruling:` satirlariyla duruyor. Ozeti:

1. Faz 3a icin yeni dal acildi (`claude/faz3a-bag`).
2. Gunluk 50 istek tavani mevcut satirlari sayiyor; red satiri silindigi
   icin sayimdan dusuyor. Kabul edildi, cunku satiri silen taraf alici —
   gonderen kendi sayacini dusuremiyor.
3. Uc kademeli secenek listesi hem check-in hem ayarlar ekraninda ayri
   ayri tanimlanacak (aciklama metinleri farkli oldugu icin ortak sabite
   cikarilmadi).
4. `bag_kisileri` RPC'sinin migrasyonu istemci gorevi olan Task 15'in
   icinde kaliyor; baska hicbir gorev tuketmiyor.
5. Task 4-8 arasinda dalin kirik olmasi kabul edildi (plan bunu acikca
   yaziyor); ters sira daha kotu olurdu.
6. Task 1'in "dogrudan yazilamiyor" iddiasi ayri bir tur acilmadan
   Task 2'ye katilarak `42501` kod kontroluyle duzeltildi.

## Faz 2c'nin durumu

Faz 2c tamamlandi ve `claude/faz2c-kimlik` dalinda **oldugu gibi
birakildi** (kullanicinin karari): birlestirilmedi, push edilmedi.
Faz 3a o dalin ucundan ayrildi.

Faz 2c'den kalan tek elle dogrulama borcu: iki hesapla tarayici
gezintisi. Veritabani tarafi 18 senaryoda kapsaniyor; acikta kalan
yalnizca arayuzun gozle dogrulanmasi.
