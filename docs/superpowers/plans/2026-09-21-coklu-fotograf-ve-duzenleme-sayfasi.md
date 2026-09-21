# Coklu Fotograf + "Check-in'i duzenle" Sayfasi - Uygulama Plani

> **TAMAMLANDI 2026-09-22** (commit'ler b6c03e61, 7ef93b4a, cf98003a; OTA 4a9aa8ec).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Bir check-in'e 5'e kadar fotograf eklenebilsin; duzenleme kartin icinden cikip referanstaki alttan gelen "Check-in'i duzenle" sayfasina tasinsin.

**Architecture:** Sunucuda `check_inler.fotograflar text[]` (eski `fotograf` sutunu generated `fotograflar[1]` olarak kalir); yeni RPC `check_in_fotograflarini_guncelle` kaldirilan yollari dondurur, istemci kovadan siler. Istemcide `CheckIn`/`AniGorunumu`/`AkisOgesi` tipleri `fotograflar` (yollar) + `fotografUrller` (imzali) tasir; kart yatay sayfali fotograf alanina, galeriler fotograf birimine duzlesir; yeni `CheckInDuzenle` bileseni tum duzenlemeyi toplar ve ekranlar tek `onDuzenleKaydet` ile listeyi gunceller.

**Tech Stack:** Expo SDK 57 / RN 0.81, expo-image, expo-image-picker, Supabase (PostgREST + Storage), jest + RNTL, Python canli testler.

**Spec:** `docs/superpowers/specs/2026-09-21-coklu-fotograf-ve-duzenleme-sayfasi-design.md`

## Global Constraints

- Ust sinir **5 fotograf** (sunucuda `check (cardinality(fotograflar) <= 5)`, istemcide `EN_FAZLA_FOTOGRAF = 5` `lib/checkin.ts`).
- Kod/yorum/commit ASCII Turkce; EKRAN METINLERI duzgun Turkce, 7 dil (`lib/ceviriler/*.ts`, `ceviri-tamlik` testi kilitler).
- Yeni SQL fonksiyonunda `revoke ... from public, anon` ACIKCA yazilir (MCP postgres rolunde kosmuyor).
- RPC imzasi degisince eski imza DROP edilir (asiri yukleme tuzagi); `check_in_yap`'ta `p_fotograf` korunur.
- Kaydet'e kadar sunucuya hicbir sey gitmez; not en son yazilir.
- Her adim: jest ilgili paket -> commit. Sonda `npx jest --runInBand`, `npx tsc --noEmit`, `npm run test:sema`, `npm run test:gorunurluk`, canli betikler, OTA + web.

---

### Task 1: Migrasyon - `fotograflar text[]`, generated `fotograf`, politikalar, RPC'ler

**Files:**
- Create: `mobil/supabase/migrations/20260921180000_coklu_fotograf.sql`
- Modify: `araclar/check-in-fotograf-degistir-canli-test.py` (yeni RPC + 5 siniri + sarmalayici)

**Interfaces (Produces):**
- `check_in_yap(p_mekan_id uuid, p_lat, p_lng, p_not_metni text, p_fotograf text, p_bulunurluk text, p_ifade text, p_fotograflar text[] default null) returns check_inler`
- `check_in_fotograflarini_guncelle(p_check_in_id uuid, p_fotograflar text[]) returns text[]` (kaldirilan eski yollar)
- `check_in_fotografini_guncelle(uuid, text) returns text` sarmalayici (eski OTA)
- `mekan_fotograflari` satir basina bir fotograf (kolonlar ayni)
- `verilerimi_disa_aktar` check_inler[].fotograflar
- Hata metinleri: `'En fazla 5 fotograf eklenebilir'`, `'Bu fotograf sana ait degil'`, `'Bu paylasim bulunamadi'`

- [x] **Step 1: Migrasyon dosyasini yaz** (ozet; tam govde dosyada):
  1. `alter table public.check_inler add column fotograflar text[] not null default '{}'`; `update ... set fotograflar = array[fotograf] where fotograf is not null`; `add constraint check_inler_fotograflar_en_fazla_5 check (cardinality(fotograflar) <= 5)`.
  2. `drop policy "check-in fotografini gorunurluk kuraliyla okuyabilir"`; `drop index check_inler_fotograf_idx`; `alter table drop column fotograf`; `add column fotograf text generated always as (fotograflar[1]) stored`; `create index check_inler_fotograflar_gin on check_inler using gin (fotograflar)`; okuma politikasi `(storage.foldername(name))[1] = auth.uid()::text or exists (select 1 from check_inler c where storage.objects.name = any(c.fotograflar))`.
  3. `drop function public.check_in_yap(uuid, double precision, double precision, text, text, text, text)`; yeni 8 parametreli govde = 20260921120000'deki govde + `v_fotograflar := coalesce(p_fotograflar, case when v_fotograf is not null then array[v_fotograf] else '{}' end)`; `foreach v_yol in array v_fotograflar` sahiplik kontrolu; `if cardinality(v_fotograflar) > 5 then raise 'En fazla 5 fotograf eklenebilir'`; insert `fotograflar` (fotograf sutununa YAZILMAZ - generated).
  4. `check_in_fotograflarini_guncelle`: kimlik + aktif hesap; her yol sahiplik; cardinality <= 5; `select fotograflar into v_eski ... for update`; `update set fotograflar = v_yeni`; `return array(select unnest(v_eski) except select unnest(v_yeni))`.
  5. `check_in_fotografini_guncelle(uuid,text)`: `v_kaldirilan := check_in_fotograflarini_guncelle(p_id, case when p_fotograf is null then '{}' else array[p_fotograf] end); return v_kaldirilan[1]`.
  6. `mekan_fotograflari` (20260913100000 govdesi): `from check_inler c cross join lateral unnest(c.fotograflar) with ordinality as f(yol, sira) ... select ..., f.yol as fotograf ... order by c.olusturma_zamani desc, f.sira`.
  7. `verilerimi_disa_aktar` (20260921120000 govdesi): check_inler bloguna `'fotograflar', c.fotograflar`.
  8. Hepsine `revoke ... from public, anon; grant ... to authenticated, service_role`.
- [x] **Step 2: MCP `apply_migration` ile uygula**; `select column_name, is_generated from information_schema.columns where table_name='check_inler' and column_name in ('fotograf','fotograflar')` ile dogrula; `select count(*) from check_inler where fotograf is distinct from fotograflar[1]` = 0.
- [x] **Step 3: Canli betigi guncelle ve kos**: `araclar/check-in-fotograf-degistir-canli-test.py` -> yeni RPC ile [yol1] -> [yol1,yol2] (kaldirilan bos) -> [yol2] (kaldirilan [yol1]) -> [] (kaldirilan [yol2]); 6 yol -> 'En fazla 5'; sarmalayici `check_in_fotografini_guncelle(id, yol)` eskiyi dondurur; baskasinin yolu/check-in'i/anon reddi. Beklenen: hepsi OK.
- [x] **Step 4: `npm run test:sema`** yesil (check_in_yap null korumasi ve bulunurluk iddialari yeni imzayla calisir).
- [x] **Step 5: Commit** `feat(db): check_inler.fotograflar (5'e kadar), fotograf generated, coklu fotograf RPC'leri`.

### Task 2: lib - tipler, toplu imza, coklu yukleme, degistirme

**Files:**
- Modify: `mobil/lib/checkin.ts` (`CheckIn.fotograflar: string[]`, `AniGorunumu.fotografUrller: string[]`, `checkInYap(..., fotograflar: string[])`, `EN_FAZLA_FOTOGRAF`), `mobil/lib/akis.ts` (`AkisOgesi.fotograflar`, `fotografUrller`; `anidanAkisOgesi`), `mobil/lib/fotograf-url.ts` (`checkInFotografiUrlleri(yollar): Promise<string[]>` - `createSignedUrls`, hatali olan atlanir), `mobil/lib/checkin-fotograf-yukle.ts` (`checkinFotograflariniYukle(uid, uriler): Promise<string[]>`), `mobil/lib/checkin-fotograf-degistir.ts` -> `checkInFotograflariniDegistir(checkInId, { kalanYollar, yeniUriler }): Promise<{ yollar: string[]; urller: string[] }>`, `mobil/lib/mekan-sayfasi.ts` (toplu imza), `mobil/lib/hata-metni.ts` + 7 sozluk (`hatalar.vt.en_fazla_5_fotograf`).
- Test: `lib/checkin.test.ts`, `lib/akis.test.ts`, `lib/fotograf-url.test.ts` (yeni), `lib/checkin-fotograf-degistir.test.ts`.

**Interfaces (Produces):**
```ts
export const EN_FAZLA_FOTOGRAF = 5
type CheckIn = { ...; fotograflar: string[] }            // 'fotograf' alani KALKTI
type AniGorunumu = CheckIn & { ...; fotografUrller: string[] }
type AkisOgesi = { ...; fotograflar: string[]; fotografUrller: string[] }
checkInYap(mekanId, lat, lng, not?, fotograflar: string[] = [], bulunurluk, ifade)  // rpc p_fotograflar
checkInFotografiUrlleri(yollar: string[]): Promise<string[]>
checkinFotograflariniYukle(kullaniciId, uriler: string[]): Promise<string[]>
checkInFotograflariniDegistir(id, { kalanYollar: string[]; yeniUriler: string[] }): Promise<{ yollar: string[]; urller: string[] }>
```
- [x] Testler once: `checkInYap` `p_fotograflar` gonderir ve `p_fotograf: null`; `satiriCheckInACevir` `fotograflar` tasir (eski satirda alan yoksa `[]`); `kullanicininAnilariniGetir` `fotografUrller` = toplu imza sonucu; `akisiGetir` ayni; `checkInFotografiUrlleri` `createSignedUrls` tek cagri, `error`li satir atlanir; `checkInFotograflariniDegistir` yeni uriler yuklenir -> RPC `[...kalan, ...yeni]` -> donen kaldirilanlar `remove` -> `{yollar, urller}`; RPC reddederse yeni yuklenenler geri silinir.
- [x] Uygula; `npx jest lib` yesil; tsc ekran hatalarini Task 3-6'ya birakir (once `git stash` degil - ekranlar bu task'ta gecici olarak kirik kalabilir, commit tsc yerine jest lib ile).
- [x] Commit `feat(lib): coklu fotograf tipleri, toplu imza, degistirme`.

### Task 3: `CheckInKarti` - yatay fotograf alani, duzenleme alani KALKAR

**Files:**
- Modify: `mobil/src/tasarim/CheckInKarti.tsx`
- Create: `mobil/src/tasarim/FotografSeridi.tsx` (2:1, yatay `FlatList pagingEnabled`, `onLayout` genislik, >1 ise nokta gostergesi + "1/3" rozeti sag ust; `onDokun(indeks)`; testID `akis-fotografi`, `akis-fotografi-<i>`, `fotograf-rozeti`)
- Test: `__tests__/tasarim/FotografSeridi.test.tsx` (yeni), `__tests__/ekranlar/index.test.tsx` (duzenleme testleri Task 6'da yeniden yazilir - bu task'ta yerinde duzenleme testleri SILINIR)

**Interfaces:**
- Kart prop'lari: `onNotKaydet/onIfadeKaydet/onEtiketEkle/onEtiketKaldir/onFotografKaydet` KALKAR; yerine `onDuzenle?: (id: string) => void` (menude "Düzenle" satiri bunun varligina bakar). `onFotografAc?: (indeks: number) => void`.
- Kart tam ekran: birden fazla fotografta `FotografGezgini` (kartin kendi tek fotografli `YakinlastirilabilirTamEkran`i yerine); `FotografAltyazisi` ayni.
- [x] Test: 3 fotografli ogede `akis-fotografi-0..2` var, rozet "1/3"; tek fotografta rozet yok; `onFotografAc(1)` ikinci kareye dokununca.
- [x] Uygula; kart icindeki `duzenleAlani` JSX, taslak state'leri, picker fonksiyonlari, ArkadasSecici/IfadeSecici/SecimPenceresi kullanimlari ve stilleri sil; `menuVar = oge.benimMi && Boolean(onSilOnayi || onDuzenle)`.
- [x] `npx jest __tests__/tasarim` yesil; commit `refactor(kart): fotograf seridi, yerinde duzenleme kalkti`.

### Task 4: `CheckInDuzenle` bileseni (referans sayfa)

**Files:**
- Create: `mobil/src/tasarim/CheckInDuzenle.tsx`, `mobil/src/tasarim/FotografIzgarasiDuzenle.tsx` (3 sutun kare izgara: kaldir x, "Değiştir" seridi, "+ Ekle" karesi; bos halde kesikli buyuk kutu; form ve duzenleme ortak kullanir)
- Modify: 7 sozluk `checkIn` blogu: `duzenleBaslik: 'Check-in’i düzenle'`, `fotograflar: 'Fotoğraflar'`, `kameraVeyaGaleri: 'Kamera veya galeriden seç'`, `ifade: 'İfade'`, `degistir: 'Değiştir'`, `enFazlaFotograf: 'En fazla {{n}} fotoğraf ekleyebilirsin.'`, `kaydedinceUygulanir: 'Değişiklikler kaydedildiğinde uygulanır.'`; `checkIn.fotografDegistir` bu turda SILINIR (yerine `degistir`).
- Test: `__tests__/tasarim/CheckInDuzenle.test.tsx`

**Interfaces (Produces):**
```ts
export type DuzenlemeDegisiklikleri = {
  not: string
  ifade: string | null
  fotograflar: { kalanYollar: string[]; yeniUriler: string[] } | null  // null = dokunulmadi
  etiketEkle: string[]
  etiketKaldir: string[]
}
<CheckInDuzenle acikMi oge={AkisOgesi} zamanYazisi onKapat onKaydet={(d: DuzenlemeDegisiklikleri) => Promise<void>} />
```
- Fotograf izgarasi durumu: `{ yol?: string; url: string }[]` (mevcut) + yeni yerel uriler tek listede sirali; kaldir/degistir indeksle. `fotograflar` alani ancak liste degistiyse dolar.
- Galeri: `launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: EN_FAZLA_FOTOGRAF - mevcut, quality: 0.7 })`; Degistir tekli.
- testID'ler: `duzenle-sayfasi`, `duzenle-kapat`, `duzenle-not`, `duzenle-foto-ekle`, `duzenle-foto-<i>`, `duzenle-foto-kaldir-<i>`, `duzenle-foto-degistir-<i>`, `duzenle-ifade-degistir`, `duzenle-ifade-kaldir`, `duzenle-birlikte-ekle`, `duzenle-etiket-kaldir-<id>`, `duzenle-vazgec`, `duzenle-kaydet`, `duzenle-hata`.
- [x] Testler: acilinca mevcut not/ifade/fotograf/etiketler dolu; Kaydet `onKaydet` icin dogru `DuzenlemeDegisiklikleri` uretir (dokunulmayan fotograf `null`); foto ekle (galeri 2 secim) -> 2 kare + Ekle; 5'te Ekle yok; kaldir -> `kalanYollar` eksilir; Vazgec `onKaydet` cagirmaz; `onKaydet` reddederse `duzenle-hata` gorunur ve sayfa acik kalir.
- [x] Uygula; commit `feat(duzenle): Check-in'i duzenle sayfasi`.

### Task 5: Check-in formu coklu fotograf

**Files:**
- Modify: `mobil/src/app/check-in/[mekanId].tsx` (`yerelFotoUriler: string[]`, `FotografIzgarasiDuzenle`, `checkinFotograflariniYukle`, `checkInYap(..., yollar)`), test `__tests__/ekranlar/check-in/[mekanId].test.tsx`.
- [x] Test: galeri 2 secim -> 2 kare; kaldir; gonderince `checkInYap` 5. parametre `['uid/1.jpg','uid/2.jpg']`; yukleme hatasi uyari + fotografsiz devam (mevcut kural).
- [x] Commit `feat(check-in): formda coklu fotograf`.

### Task 6: Ekranlar - ana sayfa, profil, baskasinin profili, mekan galerisi

**Files:**
- Modify: `mobil/src/app/index.tsx`, `mobil/src/app/profil/index.tsx` (`duzenlenen` state + `<CheckInDuzenle>`; `duzenlemeyiKaydet(id, d)`: fotograflar -> `checkInFotograflariniDegistir` -> etiket kaldir/ekle -> `etiketleriGetir([id])` -> ifade -> not; listeyi yerinde gunceller), `mobil/src/app/kullanici/[id].tsx` (galeri duzlesme), `mobil/src/tasarim/MekanFotografGalerisi.tsx` (degismez; RPC satir basina fotograf), `mobil/src/tasarim/SuAnDisarida.tsx` vb. tsc'nin gosterdigi yerler.
- Galeri duzlesme yardimcisi `lib/akis.ts`: `fotografBirimleri(anilar): { aniId, indeks, url }[]`.
- Test: `__tests__/ekranlar/index.test.tsx`, `profil/index.test.tsx`, `kullanici/[id].test.tsx`: Duzenle -> sayfa acilir -> Kaydet -> lib cagrilari sirasi ve kartin guncel hali; izgara 2 fotografli aniyi 2 kare gosterir; gezgin dogru indeksten acilir.
- [x] `npx tsc --noEmit` uygulama kodunda 0 hata; `npx jest --runInBand` yesil.
- [x] Commit `feat(ekranlar): duzenleme sayfasi + coklu fotograf galerileri`.

### Task 7: Dogrulama, belgeler, yayin

- [x] `npm run test:gorunurluk` (senaryo 61/61b fotograf yollari - `fotograf` generated oldugu icin select ayni calismali; kirilirsa senaryo `fotograflar` okur).
- [x] `python araclar/check-in-tekrar-canli-test.py`, `check-in-ifade-canli-test.py` (p_fotograf: None ile uyumlu).
- [x] Ekran goruntusu: `node araclar/spa-sunucu.mjs dist` + `araclar/ekran-goruntusu.mjs` ile duzenleme sayfasi -> `tasarim/checkin-duzenle.png`.
- [x] `docs/kvkk-uyum-listesi.md` ("5'e kadar fotograf"), `CLAUDE.md` bolumu, `slooin-projesi.md` kaldigi yer.
- [x] `eas update --branch production --environment production --non-interactive`, `npm run yayinla`; commit + push.
