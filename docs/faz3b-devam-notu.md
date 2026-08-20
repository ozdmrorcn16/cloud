# Faz 3b - devam notu (2026-08-20)

Oturum token siniri yuzunden kesildi. Bu dosya yeni oturumun nereden
devam edecegini anlatir. **Once bunu oku, sonra asagida adi gecen
defteri.**

## Nerede kaldik

- **Dal:** `claude/faz3b-sohbet` (Faz 2c/3a'nin ucundan, `f57359f` uzerine)
- **Spec:** `docs/superpowers/specs/2026-08-20-faz3b-birebir-sohbet-design.md`
- **Plan:** `docs/superpowers/plans/2026-08-20-faz3b-birebir-sohbet.md` (18 gorev)
- **SDD defteri:** `.superpowers/sdd/2026-08-20-faz3b-birebir-sohbet/progress.md`
  Bu dizin git'e girmiyor ama **diskte duruyor**; butun kararlar, brief'ler,
  gorev raporlari ve inceleme ozetleri orada. Yeni oturum onu okuyarak
  devam edebilir. Kaybolursa asagidaki ozet yeter.

### Gorev durumu

| Gorev | Durum |
|---|---|
| 1 Kosucunun kota temizligi | tamam, incelendi (`03da900`) |
| 2 Takip karsilikli | tamam, incelendi (`dccbdfd`) |
| 3-5 Uc tablo | tamam, toplu incelendi (`a618334`, `e3809c6`, `e939830`) |
| 6 `bag.yazabilir_mi` | tamam, incelendi (`1fac76a`) |
| 7 `mesaj_gonder` | tamam, incelendi (`60fac45`) |
| 8 Okuma RPC'leri | tamam, incelendi (`d514d48`) |
| 9 Realtime + mesaj sikayeti | tamam, incelendi (`359c26d`) |
| 10 `lib/sohbet.ts` | tamam, incelendi (`0030445`) |
| 11-12 `lib/bag.ts` + baglar ekrani | tamam, toplu incelendi (`4eed42b`, `fc14f47`) |
| 13 Mesaj kutusu ekrani | tamam, incelendi (`565cde0`) |
| 14 Konusma ekrani | tamam, incelendi (`1f474d3`) |
| 15-16 Ana ekran + profil butonu | tamam, toplu incelendi (`fcfb0fe`, `383b158`) |
| 17 Canli senaryolar | **uygulandi (`ce8caec`), INCELENMEDI** |
| 18 Kapanis | baslanmadi |

Faz commit sayisi: 17 (arti guvenlik duzeltmesi `f4a6840` ve bu not).

## Devam noktasi: Gorev 17'nin INCELEMESI

Gorev 17 tamamlandi ve commit'lendi (`ce8caec`, 696 satir: `calistir.ts`
ve `README.md`). **Ama incelenmedi** - oturum, uygulayicinin raporu
geldikten hemen sonra kesildi.

Yeni oturum once inceleme paketini uretip inceleyiciyi gondermeli:

```bash
bash "C:/Users/orcns/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/skills/subagent-driven-development/scripts/review-package"   docs/superpowers/plans/2026-08-20-faz3b-birebir-sohbet.md 383b158 ce8caec
```

(Aralik `383b158..ce8caec`; arada duran `f4a6840` ve `b65e353` salt
belge/guvenlik commit'leri, diff'e girmesinler diye degil - girseler de
zararsiz, ama temiz aralik budur. Uygulayicinin raporu
`.superpowers/sdd/2026-08-20-faz3b-birebir-sohbet/task-17-report.md`.)

**Incelemede ozellikle sorulmasi gerekenler:**

1. **Hicbir iddia zayiflatildi mi?** Diff'teki silinen satirlarda kaybolan
   her iddia tek tek hesaba katilmali. Uygulayici "yalnizca senaryo 28
   yapisal olarak bozuktu, 19-27 ve 30-31 gercekten degisiklik
   gerektirmiyordu" diyor - bu iddia dogrulanmali, cunku kolay yol
   senaryolari sessizce gevsetmekti.
2. **13 yeni senaryonun her birinin POZITIF KONTROLU var mi?** Negatif
   iddialar kurulum hic olusmadiginda da gecer.
3. **Temizlik gercekten iddia ediliyor mu** (`esitMi` ile), yoksa sessiz
   mi birakilmis?
4. Uygulayici "hicbir kod hatasi bulmadim, her sey belgelenen davranisla
   ortusuyordu" diyor. Bu rahatlatici bir sonuc; kaynaktan dogrulanmali.

Inceleme temizse Gorev 18 (kapanis) kalir.

## Testlerin su anki hali

Kontrolorun kendi olctugu degerler (Gorev 16 sonrasi):

- `npx jest --runInBand` -> **39 paket / 289 test**, hepsi geciyor
- `npm run test:sema` -> **69 dogrulama**, sifir hata
- `npx tsc --noEmit` -> **tam olarak 5** onceden var olan hata
  (`@types/node` kurulu degil; rota-agaci.test.ts'te dort, calistir.ts'te bir)
- `npm run test:gorunurluk` -> **189 dogrulama, sifir hata** (Gorev 17
  sonrasi). Senaryo 29 varsayilan kosumda ATLANDI olarak gorunur, bu
  dogru: gunluk tavan senaryosu yalnizca `--tavan` bayragiyla calisir ve
  o bayrak KULLANILMAZ.

  Not: bu deger uygulayicinin kosumundan; kontrolor bagimsiz olarak
  yeniden kosturmadi (oturum kesildi). Inceleme sonrasi bir kez
  dogrulamak iyi olur.

## Veritabaninin durumu

Oturum sonunda olculdu, **hepsi 0 satir**: `konusmalar`,
`konusma_uyeleri`, `mesajlar`, `takipler`, `sohbet_istekleri`,
`engellemeler`, `istek_gunlugu`. Yani Gorev 17 temiz zemine oturuyor ve
gunluk istek kotasi dokunulmamis.

## GUVENLIK: bu oturumda yasanan olay

`SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_...`) `mobil/.env` icine eklendi
(gitignored). Gorev 17'nin konusma temizligi icin gerekliydi:
`konusmalar` uzerinde silme yetkisi `authenticated` rolunden geri
alindigi icin yalnizca yonetici anahtari silebiliyor.

**Olay:** anahtar konusmaya yapistirildiginda, oturum kaydi hook'unun
maskeleme kalip listesinde `sb_secret_` deseninin karsiligi YOKTU. Anahtar
bugunun oturum dokumune duz metin yazildi. `docs/oturumlar/` public
depoya gidiyor.

**Sonuc:** depoya ULASMADI (dosyalar izlenmiyordu, hic commit
edilmemisti). Mevcut dokumler temizlendi (bes gecis maskelendi).
Hook'a kalici kural eklendi (`f4a6840`): artik `sb_secret_` ve
`sb_publishable_` maskeleniyor.

**Kullaniciya onerilen (karari onun):** anahtari panelden yenilemek.
Sizmadi ama bir sure diskte duz metin durdu. Yenilenirse `mobil/.env`
icindeki deger guncellenmeli.

**Ders:** bir sir istenecekse, yapistirilmadan ONCE dokumun public
depoya gittigi soylenmeli ve maskeleme kaliplarinda karsiligi oldugu
dogrulanmali.

## Ortam gercekleri (yeniden kesfetmeye gerek yok)

- **`npx tsc --noEmit` bu fazin dogrulama setinin parcasi.** Jest bu
  sinif hatayi YAPISAL olarak goremiyor: ekran testleri lib modullerini
  mock'luyor ve RPC adlari string. Bu fazda iki kez ise yaradi - bir kez
  saf silme gorevinde sarkan bir import yakaladi, bir kez de bayat
  uretilmis rota tiplerini.
- **`mobil/.expo/types/router.d.ts` UretIlmis bir dosya, ELLE
  DUZENLENMEZ.** Bu fazda bir uygulayici duzenledi ve yazdigi surum
  sessizce bir rotayi atlamisti; bir sonraki gorevde sebebi anlasilmayan
  bir tip hatasi olarak patlayacakti. Bayatsa `npx expo start` ile
  ureteci calistir. Su an DOGRU (kontrolor gercek sunucuyu calistirip
  yeniden urettirdi).
- **`test:gorunurluk` kendi kotasini tuketiyor.** Senaryolari gercek
  takip ve sohbet istegi gonderiyor, bunlar gunluk 50 tavanindan
  dusuyor, tavan ekle-only tabloyu sayiyor ve istemci silemiyor. Gorev
  1'de kosucuya yonetici anahtariyla temizlik eklendi. **Bu artik
  DOGRULANDI:** Gorev 17'nin kosumundan sonra `istek_gunlugu` 0 satirda
  kaldi, yani temizlik gercekten calisti. Gorev 1'in acik birakilan
  boslugu boylece kapandi. Bir dusme gorursen yine de once kotayi
  kontrol et, kodu degil.
- **Calisan bir `expo start --web` sunucusu** tam Jest kosumlarinda
  araliklarla 5000 ms render zaman asimlari uretiyor. Tam kosumdan once
  kapat.
- **Supabase MCP** bagliyken canli veritabanina dogrudan SQL
  atilabiliyor. Bu fazin en degerli dogrulamalari bununla yapildi.
- **Kimlik taklidi ile canli RPC testi mumkun:** tek bir ifade icinde
  `set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true)`
  ayarlanip fonksiyon cagrilabiliyor. Sira garantisi icin LATERAL
  kullan:
  `select m.x from (select set_config(...)) s, lateral (select f() as x) m`.
  Bu sayede yazma kapisi ve gonderme yolu Gorev 17 BEKLENMEDEN
  dogrulandi.

## Bu oturumda kontrolorun canli olctugu davranislar

Bunlar iddia degil, olcum. Gorev 17 bunlari senaryolastiracak ama zemin
zaten kanitli:

**Yazma kapisi (`bag.yazabilir_mi`), bes durum:** hic bag yok -> kapali;
karsilikli takip -> acik; **yalnizca tek yonlu satir -> kapali**;
kabul edilmis sohbet istegi (takip yok) -> acik; engelli (sohbet istegi
dururken) -> kapali.

**Gonderme yolu (`mesaj_gonder`), yedi davranis:** konusma olusuyor;
sirali anahtar dogru; iki uye olusuyor ve ikisi de gizli degil; okuma
imleci YALNIZCA gonderende; karsi taraf yazinca AYNI konusma id'si;
gizlenen konusma karsi taraf yazinca geri geliyor; **bag koptuktan sonra
gonderme reddediliyor ama gecmis duruyor**.

**Okuma yolu:** engellenen kullanici `mesajlari_getir` ile okuyamiyor
(pozitif kontrollu deneyle kanitlandi - engellemeden ONCE okuyabiliyordu).

## Ertelenmis kucuk maddeler (Gorev 18'e ya da takip isine)

- Dort `bag`/`gizli` yardimcisina (`yazabilir_mi`, `takip_ediyor_mu`,
  `engelli_mi`, `istek_on_kontrol`) `revoke execute from public, anon`
  ekleyen TEK bir migrasyon. Bugun ulasilamaz (sema `usage` yalnizca
  authenticated'da, PostgREST bag semasini sunmuyor) ama derinlemesine
  savunma.
- **`mesajlari_getir`'in engelleme kontrolu `limit 1` ile "diger uyeyi"
  buluyor ve `tur='birebir'` filtresi yok.** Bugun zararsiz, ama Faz 3c
  grup odalarini ayni RPC'ye baglarsa yalnizca rastgele bir uyenin engel
  durumu kontrol edilir ve grup sohbetinde engelleme sessizce kirilir.
  3c'yi yazan bunu okumali.
- **Mesaj sikayetinde `hedefId` = konusma id'si**, mesaj id'si degil.
  Diger turlerde o alan sikayet edilen seyin tam id'si. Moderasyon
  paneli `sikayetler` tablosunu okudugunda hangi mesajin sikayet
  edildigini bulamaz.
- Kurulu bir konusmaya gonderilen mesaj iyimser olarak eklenmiyor;
  yalnizca Realtime yansitinca beliriyor. Ustelik tutarsiz: konusmayi
  OLUSTURAN ilk gonderimde yeniden cekiliyor, sonrakilerde cekilmiyor.
- `mesaj_gonder`'in `update konusma_uyeleri`'si kosulsuz calisiyor; her
  mesajda iki UPDATE olayi daha yayiniyor.
- `mesajlari_getir`'e negatif `p_limit` ham Postgres hatasi uretiyor.
- `__tests__/ekranlar/kullanici/[id].test.tsx`'te artik var olmayan
  `takipciyiCikar` mock'lanmaya devam ediyor.
- `index.test.tsx`'in odak mock kayit defteri duz dizi; `mesajlar.test.tsx`
  Set'e cevrildi. Ikisi de Set olmali.
- `sikayet_gonder`'in revoke/grant satirlari arguman imzasi yazmiyor.

## Faz 3a'dan devreden, hala acik

`docs/faz3a-takip-isleri.md` icinde duruyor. En onemlisi: **iki hesapla
elle tarayici gezintisi hic yapilmadi.** Kullanici bunu bilerek erteledi.
Faz 3b de ayni borcu ekliyor.
