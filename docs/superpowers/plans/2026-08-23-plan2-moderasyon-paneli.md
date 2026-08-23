# Moderasyon paneli (Plan 2) - uygulama plani

> **Ajan calisanlar icin:** GEREKLI ALT BECERI: bu plani gorev gorev
> uygulamak icin `superpowers:subagent-driven-development` (onerilen) ya
> da `superpowers:executing-plans` kullanin. Adimlar takip icin onay
> kutusu (`- [ ]`) sozdizimi tasir.

**Hedef:** Uygulamayi isleten kisinin sikayetleri karara bagladigi,
kullanicilari ve icerigi yonettigi, her hassas erisimi silinemez bir
denetim izine yazan ayri bir yonetim konsolu kurmak.

**Mimari:** Panelde service-role anahtari YOKTUR. Moderator siradan bir
Supabase kullanicisi olarak giris yapar; butun okuma ve yazma islemleri
`public.moderasyon_*` `security definer` RPC'lerinden gecer ve her
RPC'nin ilk ifadesi `moderasyon.yetkili_mi_zorla()` cagrisidir. Yetki
iki kosulu birlikte arar: `moderatorler` tablosunda satir olmasi ve
JWT'nin `aal` talebinin `aal2` olmasi (yani TOTP ile dogrulanmis
oturum). Panel `panel/` altinda ayri bir Vite + React uygulamasidir ve
mobil uygulamayla kod paylasmaz.

**Teknoloji:** PostgreSQL (Supabase), PL/pgSQL, Vite + React 19 +
TypeScript, `@supabase/supabase-js`, `react-router-dom`. Test tarafi
mevcut dort kosum: `jest`, `npm run test:sema`, `npm run test:gorunurluk`,
`npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`
(karar 55-64 ve 75-76). Karar defteri: `docs/konusma-gunlugu.md` madde
55-77.

## Global kisitlar

Her gorevin gereksinimleri bu bolumu ortuk olarak icerir.

- **Kod, yorum ve commit metinleri duz ASCII Turkce** yazilir (c, g, i,
  o, s, u - aksansiz). **Kullaniciya gorunen her metin duzgun Turkce**
  (aksanli) yazilir; panel de bir kullanici arayuzudur, bu kural orada
  da gecerlidir (karar 74, 75).
- **Sirlar depoya girmez.** Panel yalnizca `anon` anahtarini tasir ve
  onu `.env` uzerinden okur; `panel/.env` gitignore'dadir,
  `panel/.env.example` gercek deger tasimaz.
- **Her moderator RPC'sinin ilk ifadesi** `perform
  moderasyon.yetkili_mi_zorla();` olur. Istisna yalnizca
  `public.moderator_muyum()`, o da hata firlatmaz sadece `boolean` doner.
- **Her moderator RPC'si icin** `revoke execute ... from public, anon`
  ve `grant execute ... to authenticated` uygulanir.
- **`moderasyon_kayitlari` ekleme-only'dir.** `update` ve `delete`
  yetkisi hicbir role verilmez, moderator dahil.
- **Panel mesajlara ASLA yazmaz.** Konusma goruntuleyici salt-okunurdur.
- **Migrasyon adlari** `mobil/supabase/migrations/YYYYMMDDHHMMSS_ad.sql`
  bicimindedir ve mevcut serinin (`20260822104000`) ardindan gelir.
  Migrasyonlar canli veritabanina Supabase MCP `apply_migration` ile
  uygulanir ve ayni icerik dosya olarak depoya yazilir.
- **Kisit adlari varsayilmaz.** `create table` govdesinde adsiz tanimli
  bir kisiti degistirmeden once adi `pg_constraint`'ten dogrulanir.
- **Plan 1'in kurdugu temel yeniden kurulmaz:** `moderasyon` semasi,
  `public.hesap_durumlari` (uc durumlu: `askida` / `yasakli` /
  `dondurulmus`) ve `moderasyon.hesap_aktif_mi` **zaten vardir**. Bu
  plan onlarin uzerine ekler.

---

## Dosya yapisi

**Yeni migrasyonlar** (`mobil/supabase/migrations/`):

| Dosya | Sorumluluk |
|---|---|
| `20260823090000_moderatorler_ve_yetki_kapisi.sql` | `moderatorler` tablosu, `moderasyon.yetkili_mi`, `moderasyon.yetkili_mi_zorla`, `public.moderator_muyum` |
| `20260823091000_denetim_izi.sql` | `moderasyon_kayitlari` tablosu, `moderasyon.kaydet` yardimcisi, saklama cron isi |
| `20260823092000_sikayet_genisletme.sql` | `sikayetler` karar sutunlari, `'mesaj'` turunun CHECK'e eklenmesi |
| `20260823093000_icerik_gizleme.sql` | `check_inler.moderasyon_gizli`, RLS filtresi, `security definer` okuyucularin guncellenmesi |
| `20260823094000_sikayet_gonder_mesaj.sql` | `sikayet_gonder`'in `'mesaj'` dogrulamalari |
| `20260823095000_moderasyon_sikayet_rpcleri.sql` | Sikayet listesi, detayi, hedef gecmisi |
| `20260823096000_moderasyon_karar_rpcsi.sql` | Sikayeti karara baglama |
| `20260823097000_moderasyon_kullanici_rpcleri.sql` | Kullanici arama ve detayi |
| `20260823098000_moderasyon_konusma_rpcsi.sql` | Konusma icerigi, iki kademe (karar 75) |
| `20260823099000_moderasyon_aksiyon_rpcleri.sql` | Askiya al / yasakla / durumu kaldir |
| `20260823100000_moderasyon_gizleme_rpcleri.sql` | Icerigi gizle / gizlemeyi kaldir |
| `20260823101000_moderasyon_iz_listesi.sql` | Denetim izi listeleme |
| `20260823102000_moderasyon_storage_politikalari.sql` | Iki bucket'a moderator `select` politikasi |

**Mobil uygulama** (`mobil/`):

| Dosya | Degisiklik |
|---|---|
| `src/app/sohbet/[kullaniciId].tsx` | Mesaj basina sikayet; gercek `mesaj.id` gecirilir |
| `src/app/sikayet.tsx` | Karar 76 baglam bildirimi satiri |
| `__tests__/ekranlar/sohbet/[kullaniciId].test.tsx` | Mesaj basina sikayet testi |
| `__tests__/ekranlar/sikayet.test.tsx` | Baglam bildirimi testi |
| `gorunurluk-testleri/sema-dogrula.ts` | Yeni sema ve yetki dogrulamalari |
| `gorunurluk-testleri/calistir.ts` | Yeni canli senaryolar |

**Panel** (`panel/`, tamami yeni):

| Dosya | Sorumluluk |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.env.example` | Iskele |
| `src/main.tsx`, `src/App.tsx` | Giris noktasi ve yonlendirme |
| `src/supabase.ts` | Istemci ve oturum |
| `src/tipler.ts` | RPC donus tipleri |
| `src/ortak/Durum.tsx` | Yukleniyor / hata / bos durum bilesenleri |
| `src/ortak/GerekceSor.tsx` | Gerekce isteyen kalip (kademe 1 ve 2) |
| `src/ortak/Onay.tsx` | Yikici aksiyonlarda onay adimi |
| `src/ekranlar/Giris.tsx` | Parola + TOTP, ilk kurulumda QR kayit |
| `src/ekranlar/Sikayetler.tsx` | Liste, filtre, sayfalama |
| `src/ekranlar/SikayetDetayi.tsx` | Detay, hedef gecmisi, karar formu, aksiyonlar |
| `src/ekranlar/Kullanicilar.tsx` | Arama |
| `src/ekranlar/KullaniciDetayi.tsx` | Karar 64 kapsamli detay |
| `src/ekranlar/Konusma.tsx` | Iki kademeli konusma goruntuleyici |
| `src/ekranlar/DenetimIzi.tsx` | Ters kronolojik iz |

---

## Faz A - Veritabani temeli

### Task 1: Moderator kimligi ve yetki kapisi

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823090000_moderatorler_ve_yetki_kapisi.sql`
- Degistir: `mobil/gorunurluk-testleri/sema-dogrula.ts` (yeni dogrulamalar sona eklenir)

**Arayuzler:**
- Uretir: `moderasyon.yetkili_mi() returns boolean`,
  `moderasyon.yetkili_mi_zorla() returns void`,
  `public.moderator_muyum() returns boolean`, `public.moderatorler` tablosu.
  Bundan sonraki BUTUN moderator RPC'leri ilk ifadede
  `perform moderasyon.yetkili_mi_zorla();` cagirir.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
-- Moderator uyeligi bir ROL degil, satir duzeyinde bir gercektir.
-- Boylece cok-moderatorlu modele gecis bir insert'ten ibaret olur
-- (spec karar 55) ve Postgres rol yonetimine hic dokunulmaz.
create table public.moderatorler (
  kullanici_id uuid primary key references auth.users(id) on delete cascade,
  rol          text not null default 'moderator'
                 check (rol in ('moderator', 'yonetici')),
  eklendi      timestamptz not null default now(),
  ekleyen_id   uuid references auth.users(id) on delete set null
);

-- RLS acik ve HICBIR politika yok: PostgREST uzerinden hicbir rol bu
-- tabloyu okuyamaz. Yalnizca security definer yardimcilar gorur.
-- Kimlerin moderator oldugu bilgisi de bir sizinti yuzeyidir.
alter table public.moderatorler enable row level security;
revoke all on public.moderatorler from authenticated, anon;

-- Yetki iki kosulu BIRLIKTE arar. aal2, TOTP ile dogrulanmis oturum
-- demektir; yalnizca parolayla alinmis oturum (aal1) hicbir moderator
-- RPC'sini cagiramaz. Kontrolun arayuzde degil burada olmasi sart:
-- istemcinin cagirmayi secebilecegi bir kural, kural degildir.
create or replace function moderasyon.yetkili_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select auth.uid() is not null
     and (auth.jwt() ->> 'aal') = 'aal2'
     and exists (
       select 1 from public.moderatorler m
        where m.kullanici_id = auth.uid()
     );
$fn$;

create or replace function moderasyon.yetkili_mi_zorla()
returns void
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not moderasyon.yetkili_mi() then
    raise exception 'Yetkisiz';
  end if;
end;
$fn$;

-- Panelin acilista sordugu tek istisna: hata firlatmaz, yalnizca
-- "bu oturum panele girebilir mi" sorusunu cevaplar.
create or replace function public.moderator_muyum()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select moderasyon.yetkili_mi();
$fn$;

revoke execute on function public.moderator_muyum() from public, anon;
grant execute on function public.moderator_muyum() to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula**

Supabase MCP `apply_migration` ile uygula (ad:
`moderatorler_ve_yetki_kapisi`), ardindan ayni icerigi yukaridaki
dosyaya yaz.

- [ ] **Adim 3: Kapinin negatif yonunu canlida dogrula**

`execute_sql` ile `select public.moderator_muyum();` calistir - `false`
donmeli, hata firlatmamali. Ardindan `select moderasyon.yetkili_mi_zorla();`
calistir - `Yetkisiz` hatasi vermeli.

- [ ] **Adim 4: sema-dogrula.ts'e uc dogrulama ekle**

Dosyanin sonundaki dogrulama listesine ayni kalipta ekle: `moderatorler`
PostgREST uzerinden okunamaz; `moderator_muyum` `anon` rolunden geri
alinmistir; `moderator_muyum` siradan (moderator olmayan) bir kullanici
icin `false` doner.

- [ ] **Adim 5: test:sema kosumunu calistir**

Calistir: `cd mobil && npm run test:sema`
Beklenen: onceki 137 dogrulamanin hepsi yesil, yeni ucuyle birlikte 140.

- [ ] **Adim 6: Commit**

```bash
git add mobil/supabase/migrations/20260823090000_moderatorler_ve_yetki_kapisi.sql mobil/gorunurluk-testleri/sema-dogrula.ts
git commit -m "feat(moderasyon): moderator tablosu ve AAL2 yetki kapisi"
```

---

### Task 2: Denetim izi

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823091000_denetim_izi.sql`
- Degistir: `mobil/gorunurluk-testleri/sema-dogrula.ts`

**Arayuzler:**
- Tuketir: Task 1'in `moderasyon.yetkili_mi_zorla()`.
- Uretir: `public.moderasyon_kayitlari` tablosu ve
  `moderasyon.kaydet(p_eylem text, p_hedef_tur text, p_hedef_id uuid,
  p_ayrinti jsonb) returns void`. Bundan sonraki her yazma RPC'si ve her
  hassas okuma RPC'si bu yardimciyi cagirir.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
-- Ekleme-only (spec karar 61). update/delete hicbir role verilmez;
-- moderator kendi izini silemez. Izin degeri tam olarak budur.
create table public.moderasyon_kayitlari (
  id           uuid primary key default gen_random_uuid(),
  -- Moderator hesabi silinirse kayit KALIR, kimlik bagi kopar.
  -- Karar 68'in "anonimlestir, yok etme" cizgisi.
  moderator_id uuid references auth.users(id) on delete set null,
  eylem        text not null,
  hedef_tur    text not null check (hedef_tur in
                 ('kullanici', 'check_in', 'sikayet', 'konusma')),
  hedef_id     uuid not null,
  ayrinti      jsonb,
  olusturuldu  timestamptz not null default now()
);

create index moderasyon_kayitlari_hedef
  on public.moderasyon_kayitlari (hedef_tur, hedef_id);
create index moderasyon_kayitlari_zaman
  on public.moderasyon_kayitlari (olusturuldu desc);

alter table public.moderasyon_kayitlari enable row level security;
-- Politika YOK: okuma da yalnizca security definer RPC uzerinden.
revoke all on public.moderasyon_kayitlari from authenticated, anon;

-- Tek yazma yolu. security definer, cunku tabloya hicbir rolun
-- dogrudan insert yetkisi yok. auth.uid() gercek degerdir (service-role
-- kullanilmadigi icin), yani "kim yapti" bilgisini veritabani
-- dolduruyor - panel yalan soyleyemez (spec karar 55).
create or replace function moderasyon.kaydet(
  p_eylem     text,
  p_hedef_tur text,
  p_hedef_id  uuid,
  p_ayrinti   jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.moderasyon_kayitlari
    (moderator_id, eylem, hedef_tur, hedef_id, ayrinti)
  values (auth.uid(), p_eylem, p_hedef_tur, p_hedef_id, p_ayrinti);
end;
$fn$;
```

Saklama suresi icin ayri bir ifade (spec karar 65 onerisi: moderasyon
erisim kayitlari 2 yil). `cron.schedule` cagrisinin ikinci argumani
dolar-tirnakli bir SQL govdesidir; mevcut cron islerinin kalibi
`20260815*` migrasyonlarindadir, aynisi kullanilir:

```sql
select cron.schedule(
  'moderasyon-izi-buda',
  '30 3 * * *',
  'delete from public.moderasyon_kayitlari where olusturuldu < now() - interval ''2 years'''
);
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Cron isinin kayitli oldugunu dogrula**

`execute_sql`: `select jobname, schedule from cron.job where jobname = 'moderasyon-izi-buda';`
Beklenen: bir satir.

- [ ] **Adim 4: sema-dogrula.ts'e iki dogrulama ekle**

`moderasyon_kayitlari` PostgREST uzerinden okunamaz; `authenticated` ve
`anon` rollerinde bu tablo uzerinde `update` ya da `delete` yetkisi
**yoktur** (`information_schema.role_table_grants` sorgusu; kalip
dosyadaki mevcut yetki dogrulamalarindan kopyalanir).

- [ ] **Adim 5: test:sema kosumunu calistir**

Calistir: `cd mobil && npm run test:sema`
Beklenen: 142 dogrulama, 0 hata.

- [ ] **Adim 6: Commit**

```bash
git add mobil/supabase/migrations/20260823091000_denetim_izi.sql mobil/gorunurluk-testleri/sema-dogrula.ts
git commit -m "feat(moderasyon): ekleme-only denetim izi ve kaydet yardimcisi"
```

---

### Task 3: Sikayet tablosunun genisletilmesi

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823092000_sikayet_genisletme.sql`

**Arayuzler:**
- Uretir: `sikayetler.karar_veren_id`, `sikayetler.karar_zamani`,
  `sikayetler.moderator_notu` sutunlari ve `'mesaj'` turunu taniyan CHECK
  kisiti. Task 5 (`sikayet_gonder`) ve Task 8 (karara baglama) bunlara
  dayanir.

- [ ] **Adim 1: Kisit adini canlida dogrula**

`execute_sql`:

```sql
select conname, pg_get_constraintdef(oid)
  from pg_constraint
 where conrelid = 'public.sikayetler'::regclass
   and contype = 'c';
```

Beklenen: `hedef_tur` kisitinin gercek adi. Buyuk ihtimalle
`sikayetler_hedef_tur_check`, ama **varsayilmaz** - ciktidaki ad
migrasyona yazilir.

- [ ] **Adim 2: Migrasyonu yaz**

```sql
alter table public.sikayetler
  add column karar_veren_id uuid references auth.users(id) on delete set null,
  add column karar_zamani   timestamptz,
  add column moderator_notu text;

-- Karar 62: 'mesaj' turu bugun RPC tarafindan kabul ediliyor ama tablo
-- tanimadigi icin insert 23514 ile patliyor - yani bir mesaj sikayeti
-- HIC gonderilemiyor. Kisit adi Adim 1'de dogrulandi.
alter table public.sikayetler
  drop constraint sikayetler_hedef_tur_check,
  add  constraint sikayetler_hedef_tur_check
    check (hedef_tur in ('kullanici', 'check_in', 'mesaj'));

-- Karar sutunlarina istemci yazamaz; tek yazma yolu
-- moderasyon_sikayeti_karara_bagla RPC'sidir (Task 8).
revoke update on public.sikayetler from authenticated, anon;
```

- [ ] **Adim 3: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 4: Kisitin genisledigini dogrula**

`execute_sql`: `select pg_get_constraintdef(oid) from pg_constraint where conname = 'sikayetler_hedef_tur_check';`
Beklenen: cikti `'mesaj'` icerir.

- [ ] **Adim 5: Commit**

```bash
git add mobil/supabase/migrations/20260823092000_sikayet_genisletme.sql
git commit -m "feat(moderasyon): sikayet karar sutunlari ve mesaj turu"
```

---

### Task 4: Icerik gizleme

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823093000_icerik_gizleme.sql`
- Degistir: `mobil/gorunurluk-testleri/sema-dogrula.ts`

**Arayuzler:**
- Uretir: `check_inler.moderasyon_gizli boolean not null default false`.
  Task 12 (`moderasyon_icerigi_gizle`) bu sutunu yazar.

- [ ] **Adim 1: RLS'i atlayan butun check_inler okuyucularini listele**

`execute_sql` ile su sorguyu calistir ve ciktiyi migrasyon yorumuna
gecir:

```sql
select n.nspname, p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.prosecdef
   and pg_get_functiondef(p.oid) ilike '%check_inler%'
 order by 1, 2;
```

Spec'in saydigi ucu (`public.baskasinin_profili`,
`public.yakin_mekanlar_yogunluk`, `gizli.ayni_mekanda_canli_mi`) bu
listede olmali; **liste daha uzunsa hepsi filtreyi tasir.** Bu adim
atlanirsa gizlenen icerik bir yoldan gorunmeye devam eder.

- [ ] **Adim 2: Migrasyonu yaz**

```sql
alter table public.check_inler
  add column moderasyon_gizli boolean not null default false;

-- Sutun bazli grant VERILMEZ: 20260820052249 zaten authenticated
-- rolunden butun update yetkisini geri almisti, o durum korunur.
-- Tek yazma yolu Task 12'nin RPC'leridir.

-- Gizlenen icerik SAHIBINE DE gorunmez (spec karar 60). Bu yuzden
-- filtre en distaki kosuldur, sahiplik kolunun de onunde. Politika
-- govdesinin geri kalani 20260822095000'den birebir kopyalandi.
drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select to authenticated
  using (
    not moderasyon_gizli
    and (
      kullanici_id = auth.uid()
      or (
        moderasyon.hesap_aktif_mi(check_inler.kullanici_id)
        and not gizli.engelli_mi(check_inler.kullanici_id)
        and case
          when konum is null then
            gorunurluk = 'herkese_acik'
            or (
              gorunurluk = 'takipcilerim'
              and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
            )
          else
            (
              bulunurluk = 'herkese_acik'
              and (
                gizli.ayni_mekanda_canli_mi(check_inler.mekan_id)
                or bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
              )
            )
            or (
              bulunurluk = 'takipcilerim'
              and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
            )
        end
      )
    )
  );
```

Ardindan Adim 1'de bulunan **her** `security definer` okuyucunun
govdesine gizlilik kosulu eklenir (`and not c.moderasyon_gizli`, tablo
takma adina gore). Fonksiyonlar `create or replace` ile bastan yazilir:
govde canlidan `pg_get_functiondef` ile alinir, yalnizca bu kosul
eklenir, baska hicbir sey degistirilmez.

- [ ] **Adim 3: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 4: Gizlemenin gercekten kestigini canlida dogrula**

`execute_sql` ile bir test check-in'inde `moderasyon_gizli = true` yap;
sahibinin kimligiyle RLS uzerinden `select` dene ve bos dondugunu gor;
sonra geri al.

- [ ] **Adim 5: sema-dogrula.ts'e bir dogrulama ekle**

`check_inler` uzerinde `authenticated` rolunun `update` yetkisi
olmadiginin korundugu (mevcut kalip kullanilir).

- [ ] **Adim 6: test:sema ve test:gorunurluk kosumlarini calistir**

Calistir: `cd mobil && npm run test:sema && npm run test:gorunurluk`
Beklenen: sema 143 dogrulama 0 hata; gorunurluk 56 senaryo / 306
dogrulama 0 hata (senaryo 29 bilerek ATLANDI).

- [ ] **Adim 7: Commit**

```bash
git add mobil/supabase/migrations/20260823093000_icerik_gizleme.sql mobil/gorunurluk-testleri/sema-dogrula.ts
git commit -m "feat(moderasyon): icerik gizleme sutunu ve gorunurluk filtresi"
```

---

## Faz B - Sikayet akisinin duzeltilmesi

### Task 5: sikayet_gonder'in mesaj dogrulamalari

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823094000_sikayet_gonder_mesaj.sql`
- Degistir: `mobil/gorunurluk-testleri/calistir.ts` (yeni senaryolar sona)

**Arayuzler:**
- Tuketir: Task 3'un genisletilmis CHECK kisiti.
- Uretir: `p_hedef_tur = 'mesaj'` icin gercekten calisan `sikayet_gonder`.
  Task 6 (mobil ekran) ve Task 7 (sikayet detayi) buna dayanir.

Bugunku govde `'mesaj'` turunu kabul ediyor ama iki dogrulamasi eksik:
sikayet edenin o mesajin konusmasinda uye olup olmadigi ve kendi
mesajini sikayet edip etmedigi sorulmuyor. Ikisi de `security definer`
govdesinde yapilmali, cunku `mesajlar` RLS'i burada atlaniyor. Uyelik
kontrolu ayni zamanda var olmayan ya da baskasina ait bir mesaj id'siyle
sahte sikayet uretilmesini kapatir.

- [ ] **Adim 1: Basarisiz senaryoyu yaz**

`mobil/gorunurluk-testleri/calistir.ts` icine, dosyadaki mevcut senaryo
kalibiyla uc yeni senaryo ekle (numaralar mevcut serinin devami, 58-60):

- Senaryo 58: A ve B karsilikli bagli, A bir mesaj gonderiyor; B o
  mesaji `hedefTur='mesaj'`, `hedefId=<gercek mesaj id>` ile sikayet
  ediyor. Beklenen: `sikayetler` tablosuna satir YAZILIR (bugun `23514`
  ile patliyor).
- Senaryo 59: B kendi gonderdigi bir mesaji sikayet etmeye calisiyor.
  Beklenen: `Kendi mesajini sikayet edemezsin` hatasi.
- Senaryo 60: C (o konusmanin uyesi olmayan ucuncu kisi) ayni mesaj
  id'siyle sikayet etmeye calisiyor. Beklenen: `Bu mesaji sikayet
  edemezsin` hatasi.

- [ ] **Adim 2: Senaryolarin basarisiz oldugunu gor**

Calistir: `cd mobil && npm run test:gorunurluk`
Beklenen: 58, 59 ve 60 BASARISIZ. 58 icin hata `23514` ya da benzeri bir
kisit ihlali olmali (Task 3 uygulandiysa 58 gecebilir; o durumda 59 ve
60 basarisiz kalir - dogrulama kapisi bunlardir).

- [ ] **Adim 3: Migrasyonu yaz**

```sql
-- Karar 62: mesaj sikayeti kaliyor ve DUZGUN uygulaniyor. Govde
-- 20260820140113'ten alindi; eklenen tek sey 'mesaj' dalindaki iki
-- dogrulama. Ikisi de security definer govdesinde, cunku mesajlar
-- RLS'i burada atlaniyor - istemciye sorulamaz.
create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_gonderen uuid;
  v_konusma  uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_id is null then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_sebep is null or trim(p_sebep) = '' then
    raise exception 'Sikayet sebebi belirtilmeli';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  if p_hedef_tur = 'mesaj' then
    select m.gonderen_id, m.konusma_id
      into v_gonderen, v_konusma
      from public.mesajlar m
     where m.id = p_hedef_id;

    -- Var olmayan bir mesaj id'si de buraya duser: sahte sikayet
    -- uretilemez.
    if v_konusma is null then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if not exists (
      select 1 from public.konusma_uyeleri u
       where u.konusma_id = v_konusma
         and u.kullanici_id = auth.uid()
    ) then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    -- gonderen_id null olabilir (gonderen hesabini silmis); o mesaj
    -- sikayet edilebilir kalir, kimse sahiplenmiyor demektir.
    if v_gonderen is not null and v_gonderen = auth.uid() then
      raise exception 'Kendi mesajini sikayet edemezsin';
    end if;
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$fn$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
```

- [ ] **Adim 4: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 5: Senaryolarin gectigini gor**

Calistir: `cd mobil && npm run test:gorunurluk`
Beklenen: 59 senaryo (58-60 dahil), 0 hata.

- [ ] **Adim 6: Commit**

```bash
git add mobil/supabase/migrations/20260823094000_sikayet_gonder_mesaj.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "fix(sikayet): mesaj sikayeti gercekten calisiyor, uyelik ve sahiplik dogrulaniyor"
```

---

### Task 6: Mesaj basina sikayet ve baglam bildirimi (mobil)

**Dosyalar:**
- Degistir: `mobil/src/app/sohbet/[kullaniciId].tsx:169-183` ve mesaj
  render blogu (`renderItem`)
- Degistir: `mobil/src/app/sikayet.tsx`
- Test: `mobil/__tests__/ekranlar/sohbet/[kullaniciId].test.tsx`
- Test: `mobil/__tests__/ekranlar/sikayet.test.tsx`

**Arayuzler:**
- Tuketir: Task 5'in `sikayet_gonder`'i; `lib/sikayet.ts`'teki
  `SikayetHedefTuru` tipi **degismez** (`'mesaj'` zaten gecerli).
- Uretir: Sikayet ekranina `hedefTur='mesaj'` ile gercek `mesaj.id`
  gecirilmesi. Task 7'nin `moderasyon_sikayet_detayi`'si bu id'ye
  dayanir.

Bugun ust bardaki tek sikayet dugmesi `hedefId` olarak **konusma
id'si** geciriyor (satir 173-174). Moderator "hangi mesaj" sorusunu
cevaplayamiyor. Ust bardaki dugme kullanici sikayetine donusuyor,
mesaj sikayeti mesajin kendisine tasiniyor.

- [ ] **Adim 1: Basarisiz testleri yaz**

`__tests__/ekranlar/sohbet/[kullaniciId].test.tsx` icine ekle:

```tsx
it('bir mesaja uzun basinca o mesajin id ile sikayet ekranina gider', async () => {
  ;(mesajlariGetir as jest.Mock).mockResolvedValue([
    { id: 'mesaj-1', konusma_id: 'konusma-1', gonderen_id: 'kullanici-2', icerik: 'merhaba', olusturuldu: '2026-08-23T10:00:00Z' },
  ])
  const ekran = await render(<SohbetEkrani />)
  fireEvent(ekran.getByText('merhaba'), 'longPress')
  expect(router.push).toHaveBeenCalledWith('/sikayet?hedefTur=mesaj&hedefId=mesaj-1')
})

it('ust bardaki sikayet dugmesi kullaniciyi sikayet eder', async () => {
  const ekran = await render(<SohbetEkrani />)
  fireEvent.press(ekran.getByText('Şikayet et'))
  expect(router.push).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
})
```

`__tests__/ekranlar/sikayet.test.tsx` icine ekle:

```tsx
it('mesaj sikayetinde baglam bildirimini gosterir', async () => {
  ;(useLocalSearchParams as jest.Mock).mockReturnValue({ hedefTur: 'mesaj', hedefId: 'mesaj-1' })
  const ekran = await render(<SikayetEkrani />)
  expect(ekran.getByText(/çevresindeki mesajlar/i)).toBeTruthy()
})

it('kullanici sikayetinde baglam bildirimi gosterilmez', async () => {
  ;(useLocalSearchParams as jest.Mock).mockReturnValue({ hedefTur: 'kullanici', hedefId: 'kullanici-2' })
  const ekran = await render(<SikayetEkrani />)
  expect(ekran.queryByText(/çevresindeki mesajlar/i)).toBeNull()
})
```

- [ ] **Adim 2: Testlerin basarisiz oldugunu gor**

Calistir: `cd mobil && npx jest __tests__/ekranlar/sohbet __tests__/ekranlar/sikayet`
Beklenen: dort yeni test FAIL.

- [ ] **Adim 3: Sohbet ekranini degistir**

`sohbet/[kullaniciId].tsx` icinde 169-174 satirlarindaki iki degiskeni
kaldir; ust bar dugmesi artik dogrudan kullaniciyi sikayet eder:

```tsx
<Pressable onPress={() => router.push(`/sikayet?hedefTur=kullanici&hedefId=${kullaniciId}`)}>
  <Text style={stiller.sikayetButonu}>Şikayet et</Text>
</Pressable>
```

`renderItem` icindeki mesaj balonunu `Pressable` ile sar ve uzun basisa
bagla. Kendi mesajini sikayet etmek sunucuda reddedildigi icin
(Task 5), kendi balonuna sikayet baglanmaz:

```tsx
<Pressable
  onLongPress={
    item.gonderen_id && item.gonderen_id !== kendiId
      ? () => router.push(`/sikayet?hedefTur=mesaj&hedefId=${item.id}`)
      : undefined
  }
>
  {/* mevcut balon icerigi aynen korunur */}
</Pressable>
```

- [ ] **Adim 4: Sikayet ekranina baglam bildirimini ekle**

Karar 76: sikayet eden, cevredeki mesajlarin incelemeye acilacagini
gorur. Ayri bir onay kutusu YOK - sikayeti gondermek zaten iradi bir
eylemdir ve ek surtunme sikayet etmeyi caydirir.

`sikayet.tsx` icinde, sebep listesinin ustune:

```tsx
{hedefTur === 'mesaj' && (
  <Text style={stiller.baglamBildirimi}>
    İncelemede bu mesajın çevresindeki mesajlar da moderasyona açılır.
  </Text>
)}
```

Stil: `baglamBildirimi: { fontSize: 13, color: '#666', marginBottom: 12 }`.

- [ ] **Adim 5: Testlerin gectigini gor**

Calistir: `cd mobil && npx jest --runInBand`
Beklenen: 44 paket / 364 test yesil (mevcut 360 + yeni 4).

- [ ] **Adim 6: Tip kontrolu**

Calistir: `cd mobil && npx tsc --noEmit`
Beklenen: yalnizca bes onceden var olan `@types/node` hatasi.

- [ ] **Adim 7: Commit**

```bash
git add mobil/src/app/sohbet mobil/src/app/sikayet.tsx mobil/__tests__/ekranlar/sohbet mobil/__tests__/ekranlar/sikayet.test.tsx
git commit -m "feat(sikayet): mesaj basina sikayet ve baglam bildirimi (karar 62, 76)"
```

---

## Faz C - Moderator RPC'leri

Bu fazdaki her RPC icin ortak kurallar (her gorevde tekrar edilmez ama
her gorevde uygulanir):

- Ilk ifade `perform moderasyon.yetkili_mi_zorla();`
- `security definer`, `set search_path = public`
- `revoke execute ... from public, anon` ve `grant execute ... to authenticated`
- Liste RPC'leri `returns table(...)`, detay RPC'leri `returns jsonb`
  doner. Gerekce: detaylar cok parcali (profil + baglar + istekler +
  konusmalar), her parcasi icin ayri sutun tanimlamak imzayi kirilgan
  yapar.
- `p_limit` her yerde `least(coalesce(p_limit, 50), 200)` ile
  sinirlanir; sinirsiz sayfa istegi kabul edilmez.

### Task 7: Sikayet listesi, detayi ve hedef gecmisi

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823095000_moderasyon_sikayet_rpcleri.sql`

**Arayuzler:**
- Tuketir: Task 1 yetki kapisi, Task 3 karar sutunlari, Task 5'in
  gercek mesaj id'si.
- Uretir: `moderasyon_sikayetleri_listele(p_durum text, p_hedef_tur text,
  p_baslangic timestamptz, p_bitis timestamptz, p_sirala text,
  p_limit int, p_ofset int)`,
  `moderasyon_sikayet_detayi(p_sikayet_id uuid) returns jsonb`,
  `moderasyon_hedef_gecmisi(p_hedef_tur text, p_hedef_id uuid) returns jsonb`.
  Panel Task 18 ve 19 bunlari cagirir.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
-- Liste ekranlarinda gezinme ize DUSMEZ (spec karar 61): aksi halde iz
-- gurultuye bogulur ve icinde gercek erisimler kaybolur.
create or replace function public.moderasyon_sikayetleri_listele(
  p_durum      text default null,
  p_hedef_tur  text default null,
  p_baslangic  timestamptz default null,
  p_bitis      timestamptz default null,
  p_sirala     text default 'yeni_once',
  p_limit      int default 50,
  p_ofset      int default 0
)
returns table (
  id                 uuid,
  hedef_tur          text,
  hedef_id           uuid,
  sebep              text,
  aciklama           text,
  durum              text,
  olusturuldu        timestamptz,
  sikayet_eden_adi   text,
  hedef_adi          text,
  hedefin_sikayeti   bigint
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select s.id, s.hedef_tur, s.hedef_id, s.sebep, s.aciklama, s.durum,
         s.olusturuldu,
         se.kullanici_adi,
         -- Hedefin adi turune gore baska bir yerden gelir; kullanici
         -- disindaki turlerde bos kalabilir, panel id gosterir.
         case s.hedef_tur
           when 'kullanici' then (select p.kullanici_adi from public.profiller p where p.id = s.hedef_id)
           when 'check_in'  then (select m.ad from public.check_inler c join public.mekanlar m on m.id = c.mekan_id where c.id = s.hedef_id)
           else null
         end,
         -- Tekrar eden suclu rozetle hemen goze carpsin.
         (select count(*) from public.sikayetler s2
           where s2.hedef_tur = s.hedef_tur and s2.hedef_id = s.hedef_id)
    from public.sikayetler s
    left join public.profiller se on se.id = s.sikayet_eden_id
   where (p_durum is null or s.durum = p_durum)
     and (p_hedef_tur is null or s.hedef_tur = p_hedef_tur)
     and (p_baslangic is null or s.olusturuldu >= p_baslangic)
     and (p_bitis is null or s.olusturuldu <= p_bitis)
   order by
     case when p_sirala = 'eski_once' then s.olusturuldu end asc,
     case when p_sirala <> 'eski_once' then s.olusturuldu end desc
   limit least(coalesce(p_limit, 50), 200)
  offset greatest(coalesce(p_ofset, 0), 0);
end;
$fn$;

-- Detay: hedefin TAM icerigi. Mesaj turunde mesajin kendisi burada
-- gelir ama CEVRESI gelmez - baglam ayri bir cagridir
-- (moderasyon_konusma_mesajlari, Task 10) ve o cagri ize duser.
create or replace function public.moderasyon_sikayet_detayi(p_sikayet_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  s public.sikayetler%rowtype;
  v_hedef jsonb;
begin
  perform moderasyon.yetkili_mi_zorla();

  select * into s from public.sikayetler where id = p_sikayet_id;
  if s.id is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  if s.hedef_tur = 'kullanici' then
    select to_jsonb(p) into v_hedef
      from public.profiller p where p.id = s.hedef_id;
  elsif s.hedef_tur = 'check_in' then
    select jsonb_build_object(
             'id', c.id, 'kullanici_id', c.kullanici_id,
             'not_metni', c.not_metni, 'fotograf', c.fotograf,
             'mekan_adi', m.ad, 'olusturma_zamani', c.olusturma_zamani,
             'gorunurluk', c.gorunurluk, 'bulunurluk', c.bulunurluk,
             'moderasyon_gizli', c.moderasyon_gizli)
      into v_hedef
      from public.check_inler c
      join public.mekanlar m on m.id = c.mekan_id
     where c.id = s.hedef_id;
  elsif s.hedef_tur = 'mesaj' then
    select jsonb_build_object(
             'id', m.id, 'konusma_id', m.konusma_id,
             'gonderen_id', m.gonderen_id, 'metin', m.metin,
             'olusturuldu', m.olusturuldu)
      into v_hedef
      from public.mesajlar m where m.id = s.hedef_id;
  end if;

  return jsonb_build_object(
    'sikayet', to_jsonb(s),
    'sikayet_eden', (select to_jsonb(p) from public.profiller p where p.id = s.sikayet_eden_id),
    'hedef', v_hedef
  );
end;
$fn$;

-- Ayni hedefe ait butun sikayetler ve verilmis kararlar.
create or replace function public.moderasyon_hedef_gecmisi(
  p_hedef_tur text,
  p_hedef_id  uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.olusturuldu desc)
      from public.sikayetler s
     where s.hedef_tur = p_hedef_tur
       and s.hedef_id = p_hedef_id
  ), '[]'::jsonb);
end;
$fn$;

revoke execute on function public.moderasyon_sikayetleri_listele from public, anon;
revoke execute on function public.moderasyon_sikayet_detayi from public, anon;
revoke execute on function public.moderasyon_hedef_gecmisi from public, anon;
grant execute on function public.moderasyon_sikayetleri_listele to authenticated;
grant execute on function public.moderasyon_sikayet_detayi to authenticated;
grant execute on function public.moderasyon_hedef_gecmisi to authenticated;
```

- [ ] **Adim 2: `check_inler.bulunurluk` sutununun varligini dogrula**

`execute_sql`: `select column_name from information_schema.columns where table_name = 'check_inler';`
Beklenen: `bulunurluk` ve `gorunurluk` var, `gizli_mi` YOK (Faz 3a'da
dusuruldu). Yoksa detay RPC'sindeki alan adlari duzeltilir.

- [ ] **Adim 3: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 4: Yetki kapisini negatif yonden dogrula**

`execute_sql`: `select public.moderasyon_sikayetleri_listele();`
Beklenen: `Yetkisiz` hatasi (cagiran moderator degil).

- [ ] **Adim 5: Commit**

```bash
git add mobil/supabase/migrations/20260823095000_moderasyon_sikayet_rpcleri.sql
git commit -m "feat(moderasyon): sikayet listesi, detayi ve hedef gecmisi RPC'leri"
```

---

### Task 8: Sikayeti karara baglama

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823096000_moderasyon_karar_rpcsi.sql`

**Arayuzler:**
- Tuketir: Task 2 `moderasyon.kaydet`, Task 3 karar sutunlari.
- Uretir: `moderasyon_sikayeti_karara_bagla(p_sikayet_id uuid,
  p_durum text, p_not text) returns void`.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
create or replace function public.moderasyon_sikayeti_karara_bagla(
  p_sikayet_id uuid,
  p_durum      text,
  p_not        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_eski text;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_durum not in ('yeni', 'incelendi', 'islem_yapildi', 'reddedildi') then
    raise exception 'Gecersiz sikayet durumu';
  end if;

  select durum into v_eski from public.sikayetler where id = p_sikayet_id;
  if v_eski is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  update public.sikayetler
     set durum          = p_durum,
         moderator_notu = p_not,
         karar_veren_id = auth.uid(),
         karar_zamani   = now()
   where id = p_sikayet_id;

  perform moderasyon.kaydet(
    'sikayet_karara_baglandi', 'sikayet', p_sikayet_id,
    jsonb_build_object('eski_durum', v_eski, 'yeni_durum', p_durum, 'not', p_not)
  );
end;
$fn$;

revoke execute on function public.moderasyon_sikayeti_karara_bagla from public, anon;
grant execute on function public.moderasyon_sikayeti_karara_bagla to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Commit**

```bash
git add mobil/supabase/migrations/20260823096000_moderasyon_karar_rpcsi.sql
git commit -m "feat(moderasyon): sikayeti karara baglama ve ize yazma"
```

---

### Task 9: Kullanici arama ve kullanici detayi

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823097000_moderasyon_kullanici_rpcleri.sql`

**Arayuzler:**
- Tuketir: Task 2 `moderasyon.kaydet`.
- Uretir: `moderasyon_kullanici_ara(p_metin text, p_limit int)`,
  `moderasyon_kullanici_detayi(p_kullanici_id uuid) returns jsonb`.
  Panel Task 20 bunlari cagirir.

Karar 64: detay GERCEKTEN her seyi gosterir. Karar 61: kullanici
detayinin goruntulenmesi ize duser (kisisel veriye erisim). Bildirim
jetonunun kendisi DONMEZ, yalnizca cihaz sayisi - jeton bir kimlik
bilgisidir ve gosterilmesinin moderasyon degeri yoktur.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
-- Arama: aramada_gorunsun tercihi ve engellemeler DIKKATE ALINMAZ.
-- Moderasyon gorunurlugu kullanici tercihlerinin uzerindedir; zaten
-- kapi aal2 + moderatorler satiri ile korunuyor.
create or replace function public.moderasyon_kullanici_ara(
  p_metin text,
  p_limit int default 20
)
returns table (
  id            uuid,
  ad            text,
  kullanici_adi text,
  durum         text,
  sikayet_sayisi bigint
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_metin is null or length(trim(p_metin)) < 2 then
    raise exception 'En az 2 karakter gerekli';
  end if;

  return query
  select p.id, p.ad, p.kullanici_adi,
         d.durum,
         (select count(*) from public.sikayetler s
           where s.hedef_tur = 'kullanici' and s.hedef_id = p.id)
    from public.profiller p
    left join public.hesap_durumlari d on d.kullanici_id = p.id
   -- Joker karakterler kacisli: kullanici girdisi desen olarak
   -- yorumlanmamali (kisi_ara'daki ayni kalip).
   where p.kullanici_adi ilike '%' || replace(replace(replace(trim(p_metin), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      or p.ad            ilike '%' || replace(replace(replace(trim(p_metin), '\', '\\'), '%', '\%'), '_', '\_') || '%'
   order by p.kullanici_adi
   limit least(coalesce(p_limit, 20), 100);
end;
$fn$;

create or replace function public.moderasyon_kullanici_detayi(p_kullanici_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v jsonb;
begin
  perform moderasyon.yetkili_mi_zorla();

  select jsonb_build_object(
    'profil', (select to_jsonb(p) from public.profiller p where p.id = p_kullanici_id),
    'hesap_durumu', (select to_jsonb(d) from public.hesap_durumlari d where d.kullanici_id = p_kullanici_id),
    -- Gizlenenler DAHIL: moderator kendi gizledigini de gormeli.
    'check_inler', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'mekan_adi', m.ad, 'not_metni', c.not_metni,
               'fotograf', c.fotograf, 'olusturma_zamani', c.olusturma_zamani,
               'canli_mi', c.konum is not null,
               'gorunurluk', c.gorunurluk, 'bulunurluk', c.bulunurluk,
               'moderasyon_gizli', c.moderasyon_gizli)
             order by c.olusturma_zamani desc)
        from public.check_inler c join public.mekanlar m on m.id = c.mekan_id
       where c.kullanici_id = p_kullanici_id), '[]'::jsonb),
    'takipler', coalesce((
      select jsonb_agg(jsonb_build_object(
               'karsi_taraf', t.takip_edilen_id, 'durum', t.durum, 'olusturuldu', t.olusturuldu))
        from public.takipler t where t.takip_eden_id = p_kullanici_id), '[]'::jsonb),
    'engelledikleri', coalesce((
      select jsonb_agg(e.engellenen_id) from public.engellemeler e
       where e.engelleyen_id = p_kullanici_id), '[]'::jsonb),
    'onu_engelleyenler', coalesce((
      select jsonb_agg(e.engelleyen_id) from public.engellemeler e
       where e.engellenen_id = p_kullanici_id), '[]'::jsonb),
    'sohbet_istekleri', coalesce((
      select jsonb_agg(jsonb_build_object(
               'gonderen_id', si.gonderen_id, 'alan_id', si.alan_id,
               'durum', si.durum, 'olusturuldu', si.olusturuldu))
        from public.sohbet_istekleri si
       where si.gonderen_id = p_kullanici_id or si.alan_id = p_kullanici_id), '[]'::jsonb),
    -- Spam incelemesi icin gunluk sayac.
    'bugunku_istek_sayisi', (
      select count(*) from public.istek_gunlugu g
       where g.gonderen_id = p_kullanici_id
         and g.olusturuldu >= date_trunc('day', now())),
    -- METADATA, icerik degil. Icerik ayri bir cagri ve ayri bir iz
    -- satiridir (Task 10).
    'konusmalar', coalesce((
      select jsonb_agg(jsonb_build_object(
               'konusma_id', k.id,
               'karsi_taraf', (select u2.kullanici_id from public.konusma_uyeleri u2
                                where u2.konusma_id = k.id and u2.kullanici_id <> p_kullanici_id
                                limit 1),
               'mesaj_sayisi', (select count(*) from public.mesajlar m where m.konusma_id = k.id),
               'ilk_mesaj', (select min(m.olusturuldu) from public.mesajlar m where m.konusma_id = k.id),
               'son_mesaj', (select max(m.olusturuldu) from public.mesajlar m where m.konusma_id = k.id)))
        from public.konusmalar k
        join public.konusma_uyeleri u on u.konusma_id = k.id
       where u.kullanici_id = p_kullanici_id), '[]'::jsonb),
    -- Jetonun kendisi DEGIL, yalnizca sayi.
    'bildirim_cihazi', (
      select count(*) from public.bildirim_jetonlari b where b.kullanici_id = p_kullanici_id),
    'sikayet_ozeti', jsonb_build_object(
      'hakkinda', (select count(*) from public.sikayetler s
                    where s.hedef_tur = 'kullanici' and s.hedef_id = p_kullanici_id),
      'actigi',   (select count(*) from public.sikayetler s
                    where s.sikayet_eden_id = p_kullanici_id))
  ) into v;

  -- Kisisel veriye erisim izi (karar 61). Liste ekranlari kaydedilmez,
  -- detay kaydedilir.
  perform moderasyon.kaydet('kullanici_detayi_goruntulendi', 'kullanici', p_kullanici_id, null);

  return v;
end;
$fn$;

revoke execute on function public.moderasyon_kullanici_ara from public, anon;
revoke execute on function public.moderasyon_kullanici_detayi from public, anon;
grant execute on function public.moderasyon_kullanici_ara to authenticated;
grant execute on function public.moderasyon_kullanici_detayi to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Commit**

```bash
git add mobil/supabase/migrations/20260823097000_moderasyon_kullanici_rpcleri.sql
git commit -m "feat(moderasyon): kullanici arama ve izli kullanici detayi"
```

---

### Task 10: Konusma icerigi - iki kademe (karar 75)

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823098000_moderasyon_konusma_rpcsi.sql`

**Arayuzler:**
- Tuketir: Task 2 `moderasyon.kaydet`.
- Uretir: `moderasyon_konusma_mesajlari(p_konusma_id uuid, p_gerekce text,
  p_merkez_mesaj_id uuid, p_limit int, p_ofset int) returns jsonb`.
  Panel Task 21 bunu cagirir.

Karar 75 bu RPC'nin merkezinde: **kademe 1** (`p_merkez_mesaj_id`
dolu) sikayet baglamidir ve varsayilandir; **kademe 2**
(`p_merkez_mesaj_id` null) konusmanin tamamidir, ayri gerekce ister ve
ize AYRI TURDE duser. Iki kademenin ayrimi izde gorunmezse karar 75'in
tek somut ciktisi kaybolur.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
create or replace function public.moderasyon_konusma_mesajlari(
  p_konusma_id      uuid,
  p_gerekce         text,
  p_merkez_mesaj_id uuid default null,
  p_limit           int default 100,
  p_ofset           int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mesajlar jsonb;
  v_merkez   timestamptz;
  v_eylem    text;
begin
  perform moderasyon.yetkili_mi_zorla();

  -- Gerekce ZORUNLU. Bos gerekceyle okuma, izi degersiz kilar:
  -- "neden bakildi" sorusunun cevabi kalmaz.
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  if not exists (select 1 from public.konusmalar where id = p_konusma_id) then
    raise exception 'Konusma bulunamadi';
  end if;

  if p_merkez_mesaj_id is not null then
    -- KADEME 1: sikayet baglami. Merkez mesajin oncesi 20, sonrasi 20.
    select olusturuldu into v_merkez
      from public.mesajlar
     where id = p_merkez_mesaj_id and konusma_id = p_konusma_id;

    if v_merkez is null then
      raise exception 'Mesaj bu konusmada bulunamadi';
    end if;

    v_eylem := 'mesaj_baglami';

    select jsonb_agg(x order by x_olusturuldu) into v_mesajlar
      from (
        (select to_jsonb(m) as x, m.olusturuldu as x_olusturuldu
           from public.mesajlar m
          where m.konusma_id = p_konusma_id and m.olusturuldu <= v_merkez
          order by m.olusturuldu desc limit 21)
        union all
        (select to_jsonb(m), m.olusturuldu
           from public.mesajlar m
          where m.konusma_id = p_konusma_id and m.olusturuldu > v_merkez
          order by m.olusturuldu asc limit 20)
      ) t;
  else
    -- KADEME 2: konusmanin tamami. Panel bunu ayri bir onay adiminin
    -- ardindan cagirir (Task 21); sunucu tarafindaki fark izin turudur.
    v_eylem := 'konusma_tam';

    select jsonb_agg(to_jsonb(m) order by m.olusturuldu) into v_mesajlar
      from (
        select * from public.mesajlar
         where konusma_id = p_konusma_id
         order by olusturuldu
         limit least(coalesce(p_limit, 100), 500)
        offset greatest(coalesce(p_ofset, 0), 0)
      ) m;
  end if;

  perform moderasyon.kaydet(
    v_eylem, 'konusma', p_konusma_id,
    jsonb_build_object('gerekce', p_gerekce, 'merkez_mesaj_id', p_merkez_mesaj_id)
  );

  return jsonb_build_object(
    'kademe', case when p_merkez_mesaj_id is null then 2 else 1 end,
    'uyeler', coalesce((
      select jsonb_agg(u.kullanici_id) from public.konusma_uyeleri u
       where u.konusma_id = p_konusma_id), '[]'::jsonb),
    'mesajlar', coalesce(v_mesajlar, '[]'::jsonb)
  );
end;
$fn$;

revoke execute on function public.moderasyon_konusma_mesajlari from public, anon;
grant execute on function public.moderasyon_konusma_mesajlari to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Iki kademenin ize AYRI turde dustugunu dogrula**

`execute_sql` ile iz tablosunu oku:
`select eylem, count(*) from public.moderasyon_kayitlari group by 1;`
Beklenen (elle dogrulama turunde, Task 23): `mesaj_baglami` ve
`konusma_tam` ayri satirlar olarak gorunur.

- [ ] **Adim 4: Commit**

```bash
git add mobil/supabase/migrations/20260823098000_moderasyon_konusma_rpcsi.sql
git commit -m "feat(moderasyon): iki kademeli konusma erisimi (karar 75)"
```

---

### Task 11: Hesap durumu aksiyonlari

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823099000_moderasyon_aksiyon_rpcleri.sql`

**Arayuzler:**
- Tuketir: Plan 1'in `public.hesap_durumlari` tablosu ve
  `hesap_durumlari_kaynak` / `hesap_durumlari_sure` kisitlari; Task 2
  `moderasyon.kaydet`.
- Uretir: `moderasyon_hesabi_askiya_al(p_kullanici_id uuid,
  p_bitis timestamptz, p_gerekce text)`,
  `moderasyon_hesabi_yasakla(p_kullanici_id uuid, p_gerekce text)`,
  `moderasyon_hesap_durumunu_kaldir(p_kullanici_id uuid, p_gerekce text)`.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
-- Ortak koruma: moderator kendini ya da baska bir moderatoru askiya
-- alamaz. Yoksa panel kendi kendini kilitleyebilir ve geri donusu
-- yalnizca dogrudan veritabani erisimi olur.
create or replace function moderasyon.hedef_uygun_mu(p_kullanici_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if p_kullanici_id is null then
    raise exception 'Kullanici belirtilmeli';
  end if;
  if p_kullanici_id = auth.uid() then
    raise exception 'Kendine islem uygulayamazsin';
  end if;
  if exists (select 1 from public.moderatorler where kullanici_id = p_kullanici_id) then
    raise exception 'Bir moderatore islem uygulanamaz';
  end if;
end;
$fn$;

create or replace function public.moderasyon_hesabi_askiya_al(
  p_kullanici_id uuid,
  p_bitis        timestamptz,
  p_gerekce      text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();
  perform moderasyon.hedef_uygun_mu(p_kullanici_id);

  if p_bitis is null or p_bitis <= now() then
    raise exception 'Aski bitisi gelecekte olmali';
  end if;
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  -- Kullanicinin kendi koydugu 'dondurulmus' durumu da bu satirla
  -- degisir; moderasyon karari kullanicinin tercihinin uzerindedir.
  insert into public.hesap_durumlari
    (kullanici_id, durum, aski_bitisi, gerekce, moderator_id, guncellendi)
  values (p_kullanici_id, 'askida', p_bitis, p_gerekce, auth.uid(), now())
  on conflict (kullanici_id) do update
    set durum = 'askida', aski_bitisi = excluded.aski_bitisi,
        gerekce = excluded.gerekce, moderator_id = excluded.moderator_id,
        guncellendi = now();

  perform moderasyon.kaydet('hesap_askiya_alindi', 'kullanici', p_kullanici_id,
    jsonb_build_object('bitis', p_bitis, 'gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_hesabi_yasakla(
  p_kullanici_id uuid,
  p_gerekce      text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();
  perform moderasyon.hedef_uygun_mu(p_kullanici_id);

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  -- Kalici yasak bitis tarihi TASIMAZ (hesap_durumlari_sure kisiti).
  insert into public.hesap_durumlari
    (kullanici_id, durum, aski_bitisi, gerekce, moderator_id, guncellendi)
  values (p_kullanici_id, 'yasakli', null, p_gerekce, auth.uid(), now())
  on conflict (kullanici_id) do update
    set durum = 'yasakli', aski_bitisi = null,
        gerekce = excluded.gerekce, moderator_id = excluded.moderator_id,
        guncellendi = now();

  perform moderasyon.kaydet('hesap_yasaklandi', 'kullanici', p_kullanici_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_hesap_durumunu_kaldir(
  p_kullanici_id uuid,
  p_gerekce      text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_eski text;
begin
  perform moderasyon.yetkili_mi_zorla();

  select durum into v_eski from public.hesap_durumlari
   where kullanici_id = p_kullanici_id;

  -- Satirin YOKLUGU aktif demektir; kaldirmak satiri silmektir.
  -- Gecmis denetim izinde durur.
  delete from public.hesap_durumlari where kullanici_id = p_kullanici_id;

  perform moderasyon.kaydet('hesap_durumu_kaldirildi', 'kullanici', p_kullanici_id,
    jsonb_build_object('eski_durum', v_eski, 'gerekce', p_gerekce));
end;
$fn$;

revoke execute on function public.moderasyon_hesabi_askiya_al from public, anon;
revoke execute on function public.moderasyon_hesabi_yasakla from public, anon;
revoke execute on function public.moderasyon_hesap_durumunu_kaldir from public, anon;
grant execute on function public.moderasyon_hesabi_askiya_al to authenticated;
grant execute on function public.moderasyon_hesabi_yasakla to authenticated;
grant execute on function public.moderasyon_hesap_durumunu_kaldir to authenticated;
```

- [ ] **Adim 2: `hesap_durumlari_kaynak` kisitinin bu insert'e izin
      verdigini dogrula**

Plan 1'in son hali: `durum <> 'dondurulmus' or moderator_id is null`.
`askida` / `yasakli` icin `moderator_id` dolu olabilir - kisit
gecilir. `execute_sql` ile bir test kullanicisinda askiya alma denenip
geri alinir.

- [ ] **Adim 3: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 4: Commit**

```bash
git add mobil/supabase/migrations/20260823099000_moderasyon_aksiyon_rpcleri.sql
git commit -m "feat(moderasyon): askiya alma, yasaklama ve durumu kaldirma"
```

---

### Task 12: Icerik gizleme RPC'leri

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823100000_moderasyon_gizleme_rpcleri.sql`

**Arayuzler:**
- Tuketir: Task 4'un `check_inler.moderasyon_gizli` sutunu; Task 2
  `moderasyon.kaydet`.
- Uretir: `moderasyon_icerigi_gizle(p_check_in_id uuid, p_gerekce text)`,
  `moderasyon_gizlemeyi_kaldir(p_check_in_id uuid, p_gerekce text)`.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
create or replace function public.moderasyon_icerigi_gizle(
  p_check_in_id uuid,
  p_gerekce     text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_sahip uuid;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  select kullanici_id into v_sahip from public.check_inler where id = p_check_in_id;
  if v_sahip is null then
    raise exception 'Check-in bulunamadi';
  end if;

  update public.check_inler set moderasyon_gizli = true where id = p_check_in_id;

  perform moderasyon.kaydet('icerik_gizlendi', 'check_in', p_check_in_id,
    jsonb_build_object('sahip', v_sahip, 'gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_gizlemeyi_kaldir(
  p_check_in_id uuid,
  p_gerekce     text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  update public.check_inler set moderasyon_gizli = false where id = p_check_in_id;

  perform moderasyon.kaydet('gizleme_kaldirildi', 'check_in', p_check_in_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$fn$;

revoke execute on function public.moderasyon_icerigi_gizle from public, anon;
revoke execute on function public.moderasyon_gizlemeyi_kaldir from public, anon;
grant execute on function public.moderasyon_icerigi_gizle to authenticated;
grant execute on function public.moderasyon_gizlemeyi_kaldir to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Commit**

```bash
git add mobil/supabase/migrations/20260823100000_moderasyon_gizleme_rpcleri.sql
git commit -m "feat(moderasyon): icerik gizleme ve geri alma"
```

---

### Task 13: Denetim izi listeleme

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823101000_moderasyon_iz_listesi.sql`

**Arayuzler:**
- Tuketir: Task 2 tablosu.
- Uretir: `moderasyon_kayitlarini_listele(p_hedef_tur text,
  p_hedef_id uuid, p_limit int, p_ofset int)`. Panel Task 22 cagirir.

- [ ] **Adim 1: Migrasyonu yaz**

```sql
create or replace function public.moderasyon_kayitlarini_listele(
  p_hedef_tur text default null,
  p_hedef_id  uuid default null,
  p_limit     int default 100,
  p_ofset     int default 0
)
returns table (
  id            uuid,
  moderator_id  uuid,
  eylem         text,
  hedef_tur     text,
  hedef_id      uuid,
  ayrinti       jsonb,
  olusturuldu   timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select k.id, k.moderator_id, k.eylem, k.hedef_tur, k.hedef_id,
         k.ayrinti, k.olusturuldu
    from public.moderasyon_kayitlari k
   where (p_hedef_tur is null or k.hedef_tur = p_hedef_tur)
     and (p_hedef_id is null or k.hedef_id = p_hedef_id)
   order by k.olusturuldu desc
   limit least(coalesce(p_limit, 100), 500)
  offset greatest(coalesce(p_ofset, 0), 0);
end;
$fn$;

revoke execute on function public.moderasyon_kayitlarini_listele from public, anon;
grant execute on function public.moderasyon_kayitlarini_listele to authenticated;
```

- [ ] **Adim 2: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 3: Commit**

```bash
git add mobil/supabase/migrations/20260823101000_moderasyon_iz_listesi.sql
git commit -m "feat(moderasyon): denetim izi listeleme"
```

---

### Task 14: Storage okuma politikalari

**Dosyalar:**
- Olustur: `mobil/supabase/migrations/20260823102000_moderasyon_storage_politikalari.sql`

**Arayuzler:**
- Tuketir: Task 1'in `moderasyon.yetkili_mi()`.
- Uretir: `storage.objects` uzerinde iki yeni `select` politikasi.

Panel sikayet edilen fotografi gorebilmeli. Service-role'e gerek
birakmayan tek yol budur (spec).

- [ ] **Adim 1: Mevcut politika adlarini canlida dogrula**

`execute_sql`:

```sql
select policyname, cmd from pg_policies
 where schemaname = 'storage' and tablename = 'objects'
 order by policyname;
```

Yeni politika adlari mevcutlarla cakismamali.

- [ ] **Adim 2: Migrasyonu yaz**

```sql
-- Moderator, sikayet edilen gorseli gorebilmeli. Mevcut politikalar
-- degistirilmez; bunlar EK politikalardir (Postgres politikalari OR'lanir).
create policy "moderator ani fotograflarini okur"
  on storage.objects for select to authenticated
  using (bucket_id = 'checkin-fotograflari' and moderasyon.yetkili_mi());

create policy "moderator profil fotograflarini okur"
  on storage.objects for select to authenticated
  using (bucket_id = 'profil-fotograflari' and moderasyon.yetkili_mi());
```

- [ ] **Adim 3: Migrasyonu canliya uygula ve dosyaya yaz**

- [ ] **Adim 4: Commit**

```bash
git add mobil/supabase/migrations/20260823102000_moderasyon_storage_politikalari.sql
git commit -m "feat(moderasyon): panel icin storage okuma politikalari"
```

---

## Faz D - Veritabani dogrulamasi

### Task 15: Yetki kapisinin negatif yonden dogrulanmasi

**Dosyalar:**
- Degistir: `mobil/gorunurluk-testleri/calistir.ts`

**Arayuzler:**
- Tuketir: Faz C'nin butun RPC'leri.
- Uretir: Yeni senaryo 61 - moderator olmayan ve `aal1` bir kullanici
  **her** moderator RPC'sinden `Yetkisiz` alir.

Pozitif yon (gercek `aal2` ile calisma) otomatik kosumda dogrulanamaz,
cunku TOTP gerektirir; o Task 23'te elle dogrulanir. Negatif yon ise
guvenlik acisindan daha kritik olandir ve otomatiklestirilebilir.

- [ ] **Adim 1: Senaryoyu yaz**

`calistir.ts` icine senaryo 61 olarak ekle. Kalip dosyadaki mevcut
senaryolardan alinir; A kullanicisinin (siradan, moderator olmayan)
oturumuyla su RPC'lerin **hepsi** tek tek cagrilir ve her birinin
`Yetkisiz` hatasi verdigi dogrulanir:

```
moderasyon_sikayetleri_listele, moderasyon_sikayet_detayi,
moderasyon_hedef_gecmisi, moderasyon_sikayeti_karara_bagla,
moderasyon_kullanici_ara, moderasyon_kullanici_detayi,
moderasyon_konusma_mesajlari, moderasyon_hesabi_askiya_al,
moderasyon_hesabi_yasakla, moderasyon_hesap_durumunu_kaldir,
moderasyon_icerigi_gizle, moderasyon_gizlemeyi_kaldir,
moderasyon_kayitlarini_listele
```

Ayrica `public.moderator_muyum()` cagrilir ve **hata firlatmadan**
`false` dondugu dogrulanir (panelin acilista sordugu tek istisna).

Onemli: liste 13 RPC'yi kapsamali. Yeni bir moderator RPC'si
eklendiginde bu senaryoya da eklenmesi gerekir; senaryonun basina bu
notu yorum olarak koy.

- [ ] **Adim 2: Senaryonun gectigini gor**

Calistir: `cd mobil && npm run test:gorunurluk`
Beklenen: 60 senaryo (58-61 dahil), 0 hata.

- [ ] **Adim 3: Commit**

```bash
git add mobil/gorunurluk-testleri/calistir.ts
git commit -m "test(moderasyon): yetki kapisinin negatif yonu 13 RPC'de dogrulaniyor"
```

---

### Task 16: Gizlemenin ve askiya almanin gorunurluk etkisi

**Dosyalar:**
- Degistir: `mobil/gorunurluk-testleri/calistir.ts`

**Arayuzler:**
- Tuketir: Task 4 (gizleme sutunu ve filtre), Task 12 (gizleme RPC'si).
- Uretir: Senaryo 62-63.

Askiya alma **service-role ile dogrudan `hesap_durumlari`'na yazilarak**
kurulur (harness'in mevcut yontemi); boylece TOTP gerekmez. Gizleme de
ayni sekilde `check_inler.moderasyon_gizli` dogrudan yazilarak kurulur.
Test edilen sey RPC'nin kendisi degil, **filtrelerin gercekten
kesip kesmedigi**.

- [ ] **Adim 1: Senaryolari yaz**

- Senaryo 62: A'nin herkese acik bir anisi var ve B onu goruyor.
  `moderasyon_gizli = true` yapildiktan sonra: B goremez, **A da
  goremez** (karar 60: sahibine de gorunmez). `moderasyon_gizli = false`
  geri alininca ikisi de yeniden gorur.
- Senaryo 63: A'nin gizlenmis anisi `baskasinin_profili` ve
  `yakin_mekanlar_yogunluk` ciktilarindan da DUSER. Bu, Task 4 Adim
  1'de bulunan **her** `security definer` okuyucu icin ayri ayri
  dogrulanir; okuyucu listesi orada uretildigi icin senaryo o listeye
  gore yazilir.

- [ ] **Adim 2: Senaryolarin gectigini gor**

Calistir: `cd mobil && npm run test:gorunurluk`
Beklenen: 62 senaryo, 0 hata.

- [ ] **Adim 3: Butun kosumlari calistir**

```bash
cd mobil
npx jest --runInBand
npm run test:sema
npm run test:gorunurluk
npx tsc --noEmit
```

Beklenen: jest 44 paket / 364 test yesil; sema 143+ dogrulama 0 hata;
gorunurluk 62 senaryo 0 hata; tsc yalnizca bes onceden var olan hata.

- [ ] **Adim 4: Commit**

```bash
git add mobil/gorunurluk-testleri/calistir.ts
git commit -m "test(moderasyon): gizlemenin butun gorunurluk yollarindan dustugu dogrulaniyor"
```

---

## Faz E - Panel uygulamasi

### Task 17: Panel iskeleti

**Dosyalar:**
- Olustur: `panel/package.json`, `panel/tsconfig.json`,
  `panel/vite.config.ts`, `panel/index.html`, `panel/.env.example`,
  `panel/src/main.tsx`, `panel/src/App.tsx`, `panel/src/supabase.ts`,
  `panel/src/stil.css`
- Degistir: `.gitignore` (`panel/node_modules`, `panel/dist`, `panel/.env`)

**Arayuzler:**
- Uretir: `panel/src/supabase.ts` icinden `supabase` istemcisi;
  `App.tsx` icinde `react-router-dom` yonlendirmesi. Task 18-22 bunlara
  baglanir.

- [ ] **Adim 1: Projeyi kur**

```bash
cd C:/Users/orcns/projects/cloud
npm create vite@latest panel -- --template react-ts
cd panel && npm install && npm install @supabase/supabase-js react-router-dom
```

- [ ] **Adim 2: Ortam dosyalarini yaz**

`panel/.env.example` (gercek deger TASIMAZ):

```
VITE_SUPABASE_URL=https://<proje-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-anahtar>
```

`panel/.env` ayni iki degiskeni gercek degerlerle tasir ve
gitignore'dadir. Degerler `mobil/.env` icindeki
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` ile
aynidir - anon anahtar sir degildir (spec karar 55).

- [ ] **Adim 3: Supabase istemcisini yaz**

`panel/src/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  throw new Error('VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanimli olmali')
}

// Panelde service-role anahtari YOKTUR (spec karar 55). Butun erisim
// moderator hesabinin oturumu uzerinden, security definer RPC'lerle
// olur; yetki kapisi veritabanindadir.
export const supabase = createClient(url, anon)
```

- [ ] **Adim 4: Yonlendirmeyi yaz**

`panel/src/App.tsx`: `BrowserRouter` icinde alti rota - `/` (Giris),
`/sikayetler`, `/sikayetler/:id`, `/kullanicilar`, `/kullanicilar/:id`,
`/konusma/:id`, `/iz`. Oturum yoksa ya da `moderator_muyum()` `false`
donuyorsa hepsi Giris'e yonlendirir:

```tsx
const [yetkili, setYetkili] = useState<boolean | null>(null)

useEffect(() => {
  const { data: abone } = supabase.auth.onAuthStateChange(() => kontrolEt())
  kontrolEt()
  return () => abone.subscription.unsubscribe()

  async function kontrolEt() {
    const { data } = await supabase.rpc('moderator_muyum')
    setYetkili(data === true)
  }
}, [])
```

- [ ] **Adim 5: Uygulamanin ayaga kalktigini dogrula**

Calistir: `cd panel && npm run dev`
Beklenen: `http://localhost:5173` acilir, giris ekrani gorunur, konsolda
hata yok.

- [ ] **Adim 6: Tip kontrolu**

Calistir: `cd panel && npx tsc --noEmit`
Beklenen: 0 hata.

- [ ] **Adim 7: Commit**

```bash
git add panel .gitignore
git commit -m "feat(panel): Vite + React iskeleti ve sirsiz Supabase istemcisi"
```

---

### Task 18: Giris ve TOTP

**Dosyalar:**
- Olustur: `panel/src/ekranlar/Giris.tsx`, `panel/src/ortak/Durum.tsx`

**Arayuzler:**
- Tuketir: `supabase` istemcisi, `moderator_muyum` RPC'si.
- Uretir: `aal2` seviyesinde oturum. Bundan sonraki her ekran bu
  oturumun varligini varsayar.

Akis uc durumlu: (1) parola girisi, (2) TOTP kaydi yoksa QR ile bir
kerelik kayit, (3) TOTP kodu dogrulama. `aal2` alinmadan hicbir
moderator RPC'si cagrilmaz - ama bu bir arayuz nezaketidir, gercek kapi
veritabanindadir.

- [ ] **Adim 1: Parola adimini yaz**

```tsx
async function girisYap() {
  const { error } = await supabase.auth.signInWithPassword({ phone, password: parola })
  if (error) { setHata(error.message); return }
  await mfaDurumunuOku()
}
```

- [ ] **Adim 2: TOTP kayit ve dogrulama adimlarini yaz**

```tsx
async function mfaDurumunuOku() {
  const { data } = await supabase.auth.mfa.listFactors()
  const totp = data?.totp?.[0]
  if (!totp) {
    // Ilk kurulum: QR uret, kullanici uygulamasina eklesin.
    const { data: kayit, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) { setHata(error.message); return }
    setFaktorId(kayit.id)
    setQr(kayit.totp.qr_code)
    setAdim('kod')
    return
  }
  setFaktorId(totp.id)
  setAdim('kod')
}

async function koduDogrula() {
  const { data: meydan, error: mErr } = await supabase.auth.mfa.challenge({ factorId })
  if (mErr) { setHata(mErr.message); return }
  const { error } = await supabase.auth.mfa.verify({
    factorId, challengeId: meydan.id, code: kod,
  })
  if (error) { setHata(error.message); return }
  // Buradan sonra oturum aal2; App yonlendirmeyi devralir.
}
```

- [ ] **Adim 3: Moderator olmayan hesabi durustce reddet**

`aal2` alindiktan sonra `moderator_muyum()` `false` donuyorsa ekranda
"Bu hesap moderatör değil." yazilir ve `supabase.auth.signOut()`
cagrilir. Kullaniciya sebebini gizlemek bir guvenlik kazanci saglamaz,
yalnizca hata ayiklamayi zorlastirir.

- [ ] **Adim 4: Ilk moderator satirini canlida ekle**

Panel kendi moderatorunu ekleyemez (tavuk-yumurta). Supabase MCP
`execute_sql` ile, kullanicinin panel icin actigi hesabin id'si
kullanilarak:

```sql
insert into public.moderatorler (kullanici_id, rol)
values ('<moderator-auth-user-id>', 'yonetici');
```

Bu adim Task 23'un elle dogrulama turunde kullanicinin kendi hesabiyla
yapilir; plan yurutulurken **atlanmaz**, cunku panel onsuz hicbir sey
gostermez.

- [ ] **Adim 5: Tip kontrolu ve commit**

```bash
cd panel && npx tsc --noEmit
git add panel/src
git commit -m "feat(panel): parola + TOTP girisi ve moderator kontrolu"
```

---

### Task 19: Sikayetler listesi ve detayi

**Dosyalar:**
- Olustur: `panel/src/ekranlar/Sikayetler.tsx`,
  `panel/src/ekranlar/SikayetDetayi.tsx`,
  `panel/src/ortak/GerekceSor.tsx`, `panel/src/ortak/Onay.tsx`,
  `panel/src/tipler.ts`

**Arayuzler:**
- Tuketir: Task 7, 8, 11, 12 RPC'leri.
- Uretir: Sikayet detayindan `/konusma/:id` baglantisi (Task 21).

- [ ] **Adim 1: Tipleri yaz**

`panel/src/tipler.ts` icine RPC donuslerinin tiplerini yaz:
`SikayetSatiri`, `SikayetDetayi`, `KullaniciOzeti`, `KullaniciDetayi`,
`KonusmaIcerigi`, `IzSatiri`. Alanlar Faz C'deki RPC imzalariyla
birebir eslesir.

- [ ] **Adim 2: Liste ekranini yaz**

Filtreler: durum, hedef turu, tarih araligi, siralama. Tablo satirinda
hedefin toplam sikayet sayisi rozet olarak gosterilir (tekrar eden
suclu goze carpsin). Sayfalama `p_limit` / `p_ofset` ile.

```tsx
const { data, error } = await supabase.rpc('moderasyon_sikayetleri_listele', {
  p_durum: durum || null,
  p_hedef_tur: hedefTur || null,
  p_baslangic: baslangic || null,
  p_bitis: bitis || null,
  p_sirala: sirala,
  p_limit: 50,
  p_ofset: sayfa * 50,
})
```

- [ ] **Adim 3: Onay ve gerekce bilesenlerini yaz**

`Onay.tsx`: yikici aksiyonlarda (askiya alma, yasaklama, gizleme) tek
tiklamayi engelleyen onay adimi. `GerekceSor.tsx`: en az 3 karakter
gerekce isteyen, iptal edilebilir kalip. Ikisi de sunucunun zaten
zorladigi kurallarin arayuz karsiligi.

- [ ] **Adim 4: Detay ekranini yaz**

Gosterilenler: sikayetin kendisi, sikayet eden, hedefin tam icerigi
(tur basina farkli govde), hedef gecmisi
(`moderasyon_hedef_gecmisi`), karar formu (durum + not) ve aksiyon
dugmeleri.

Mesaj sikayetinde ayrica **"Bağlamı aç"** dugmesi bulunur; bu dugme
`/konusma/:konusmaId?merkez=<mesajId>` adresine gider (kademe 1).
Konusmanin tamami icin ayri bir dugme vardir ve o **ayri bir onay**
adimindan gecer (kademe 2, karar 75).

- [ ] **Adim 5: Elle dogrula**

`npm run dev` ile listeyi ac, bir sikayeti ac, karar formunu kaydet ve
`moderasyon_kayitlarini_listele` ciktisinda karsiligini gor.

- [ ] **Adim 6: Tip kontrolu ve commit**

```bash
cd panel && npx tsc --noEmit
git add panel/src
git commit -m "feat(panel): sikayet listesi, detayi ve karar formu"
```

---

### Task 20: Kullanicilar

**Dosyalar:**
- Olustur: `panel/src/ekranlar/Kullanicilar.tsx`,
  `panel/src/ekranlar/KullaniciDetayi.tsx`

**Arayuzler:**
- Tuketir: Task 9 (arama ve detay), Task 11 (aksiyonlar), Task 12
  (gizleme).
- Uretir: Kullanici detayindan `/konusma/:id` baglantisi - bu baglanti
  **daima kademe 2'dir** (ortada sikayet baglami yok, karar 75).

- [ ] **Adim 1: Arama ekranini yaz**

En az 2 karakter; sonuc satirinda kullanici adi, ad, hesap durumu
rozeti ve hakkindaki sikayet sayisi.

- [ ] **Adim 2: Detay ekranini yaz**

Karar 64'un tamami bolumler halinde: profil, hesap durumu, check-in ve
ani gecmisi (gizlenenler ayirt edilebilir bicimde), takipler,
engelledikleri ve onu engelleyenler, sohbet istekleri, bugunku istek
sayaci, konusma listesi (metadata), bildirim cihazi sayisi, sikayet
ozeti.

Ekranin ustunde kalici bir uyari durur: **"Bu görüntüleme denetim izine
kaydedildi."** Kullanici detayi cagrisi sunucuda zaten ize duser
(Task 9); uyari o gercegin arayuzdeki karsiligidir.

- [ ] **Adim 3: Aksiyonlari bagla**

Askiya al (bitis tarihi + gerekce), yasakla (gerekce), durumu kaldir.
Hepsi `Onay` bileseninden gecer. Moderatore ya da kendine islem
denenirse sunucu reddeder; panel hatayi oldugu gibi gosterir.

- [ ] **Adim 4: Konusma baglantilarini kademe 2 olarak isaretle**

Konusma listesindeki her satirin dugmesi "Tüm konuşmayı aç" yazar ve
`Onay` adimindan gecer. Metin acik olmali: moderator neye tikladigini
bilerek tiklamali.

- [ ] **Adim 5: Tip kontrolu ve commit**

```bash
cd panel && npx tsc --noEmit
git add panel/src
git commit -m "feat(panel): kullanici arama ve kapsamli kullanici detayi"
```

---

### Task 21: Konusma goruntuleyici

**Dosyalar:**
- Olustur: `panel/src/ekranlar/Konusma.tsx`

**Arayuzler:**
- Tuketir: Task 10 `moderasyon_konusma_mesajlari`.

Karar 75'in arayuz karsiligi burada. Ekran iki kademeyi **gorsel olarak
ayirir**; moderator hangi kademede oldugunu her an bilir.

- [ ] **Adim 1: Gerekce kapisini yaz**

Gerekce girilmeden icerik YUKLENMEZ. Sayfa acilir acilmaz RPC
cagrilmaz; once gerekce alani gosterilir.

```tsx
async function acKademe1(merkezMesajId: string) {
  const { data, error } = await supabase.rpc('moderasyon_konusma_mesajlari', {
    p_konusma_id: konusmaId,
    p_gerekce: gerekce,
    p_merkez_mesaj_id: merkezMesajId,
  })
  if (error) { setHata(error.message); return }
  setIcerik(data)
}

async function acKademe2() {
  // Ayri gerekce, ayri onay: kademe 1'in gerekcesi DEVRALINMAZ.
  const { data, error } = await supabase.rpc('moderasyon_konusma_mesajlari', {
    p_konusma_id: konusmaId,
    p_gerekce: genisGerekce,
    p_merkez_mesaj_id: null,
    p_limit: 200,
    p_ofset: 0,
  })
  if (error) { setHata(error.message); return }
  setIcerik(data)
}
```

- [ ] **Adim 2: Kademe gostergesini yaz**

Ekranin ustunde surekli gorunur bir serit: kademe 1'de "Şikayet
bağlamı: bu mesajın çevresi", kademe 2'de "Tüm konuşma açıldı — bu
erişim denetim izinde ayrı olarak görünür." Merkez mesaj vurgulanir.

- [ ] **Adim 3: Salt-okunurlugu koru**

Hicbir aksiyon dugmesi YOK: silme, duzenleme, gizleme yok. Panel
mesajlara asla yazmaz.

- [ ] **Adim 4: Tip kontrolu ve commit**

```bash
cd panel && npx tsc --noEmit
git add panel/src
git commit -m "feat(panel): iki kademeli konusma goruntuleyici"
```

---

### Task 22: Denetim izi ekrani

**Dosyalar:**
- Olustur: `panel/src/ekranlar/DenetimIzi.tsx`

**Arayuzler:**
- Tuketir: Task 13 `moderasyon_kayitlarini_listele`.

- [ ] **Adim 1: Listeyi yaz**

Ters kronolojik; hedefe gore filtrelenebilir (`p_hedef_tur`,
`p_hedef_id`). Her satirda eylem, hedef, zaman ve `ayrinti` icindeki
gerekce.

- [ ] **Adim 2: Mesaj okumalarini ayirt edilebilir kil**

`mesaj_baglami` ve `konusma_tam` eylemleri listede **farkli renkte ve
etiketli** gorunur. Karar 75'in tek somut ciktisi izdeki bu ayrimdir;
gorunmezse karar kagit uzerinde kalir.

- [ ] **Adim 3: Tip kontrolu ve commit**

```bash
cd panel && npx tsc --noEmit
git add panel/src
git commit -m "feat(panel): denetim izi ekrani"
```

---

### Task 23: Uctan uca elle dogrulama ve belgeleme

**Dosyalar:**
- Olustur: `panel/README.md`
- Degistir: `CLAUDE.md`, `docs/konusma-gunlugu.md`
- Olustur: `docs/plan2-takip-isleri.md`

**Elle dogrulama bu is icin ertelenmez** (spec). Panel tek operatorlu,
tek tarayicili ve kullanicinin kendi makinesinde; Faz 2a'dan devreden
"iki insan gerekiyor" mazereti burada gecerli degil.

- [ ] **Adim 1: Akisi bastan sona gez**

1. TOTP ile giris (ilk kurulumda QR kaydi dahil)
2. Uygulamada bir mesaji sikayet et (mobil, mesaja uzun bas)
3. Panelde o sikayeti ac; sikayet edilen mesaji **baglamiyla** gor
   (kademe 1)
4. Gerekce girip konusmanin tamamini ac (kademe 2, ayri onay)
5. Hedefi askiya al
6. Uygulamada o hesabin yazamadigini ve baskalarina gorunmedigini gor
7. Askiyi kaldir
8. Denetim izinde butun satirlari gor - `mesaj_baglami` ve
   `konusma_tam` ayri ayri gorunmeli

- [ ] **Adim 2: panel/README.md yaz**

Kurulum (`npm install`, `.env`), calistirma (`npm run dev`), ilk
moderator satirinin nasil eklendigi, ve **neden service-role
kullanilmadigi**. Son madde onemli: ilerideki bir oturum "panel yavas,
service-role koyalim" diye dusunebilir.

- [ ] **Adim 3: Kalan borclari yaz**

`docs/plan2-takip-isleri.md`: `[SONRA]` diliminde kalanlar (kalici
silme, sikayet edeni degerlendirme, profil alani temizleme, pano,
panelin barindirilmasi, askiya alinan oturumun aninda iptali) ve bu
plan sirasinda bulunan her kusur.

- [ ] **Adim 4: CLAUDE.md ve karar defterini guncelle**

Plan 2'nin kapanis ozeti, dort kosumun son degerleri, ve elle
dogrulamanin yapildigi.

- [ ] **Adim 5: Butun kosumlari son kez calistir**

```bash
cd mobil
npx jest --runInBand
npm run test:sema
npm run test:gorunurluk
npx tsc --noEmit
cd ../panel && npx tsc --noEmit
```

- [ ] **Adim 6: Commit ve push**

```bash
git add -A
git commit -m "docs(moderasyon): Plan 2 kapanisi, elle dogrulama ve takip isleri"
git push origin claude/plan1-hesap-haklari
```

---

## Oz-inceleme notlari

Plan yazildiktan sonra spec'e karsi kontrol edildi:

- **Spec kapsami:** Karar 55 (service-role yok) Task 17'de; 56 (ayri
  hesap + TOTP + AAL2) Task 1 ve 18'de; 57 (askiya alma) Plan 1'de
  kurulmustu, aksiyonlari Task 11'de; 58 (ayri panel) Task 17'de; 60
  (gizleme) Task 4 ve 12'de; 61 (ekleme-only iz) Task 2'de; 62 (mesaj
  sikayeti) Task 3, 5, 6'da; 63 (konusma erisimi) Task 10'da; 64
  (kapsamli detay) Task 9 ve 20'de; 75-76 (olcululuk) Task 10, 6, 21 ve
  22'de.
- **Kapsam disinda birakilanlar (spec'in kendi `[SONRA]` listesi):**
  kalici silme, sikayet edeni degerlendirme, profil alani temizleme,
  pano, panelin barindirilmasi. Task 23 Adim 3 bunlari yazili biraktirir.
- **Bilerek plana alinmayan:** spec'in "gizlenen icerigin fotografi
  Storage'da kalir" notu - `[SONRA]`. Task 14 yalnizca moderatorun
  gorebilmesini ekler, kullanici tarafinda bir sey kapatmaz.
