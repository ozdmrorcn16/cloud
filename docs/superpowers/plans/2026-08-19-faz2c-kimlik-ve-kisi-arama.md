# Faz 2c — Kimlik ve kisi arama — uygulama plani

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Her kullaniciya baskasinda olmayan bir kullanici adi vermek ve
kisilerin birbirini kullanici adi ya da isim soyisimle bulabilecegi,
engellemelere ve "beni aramada gosterme" tercihine saygi duyan bir arama
eklemek.

**Architecture:** Uc yeni sutun `profiller` tablosuna gidiyor. Benzersizlik
ve bicim veritabani kisitlariyla zorunlu kilinyor; 30 gun kurali bir
`security definer` RPC'de ve sutun duzeyinde `update` yetkisiyle
korunuyor (istemci `kullanici_adi` sutununu dogrudan yazamiyor). Arama,
RLS'i asamayacagi icin yine `security definer` bir RPC — engelleme
filtreleri `baskasinin_profili`'ndeki mantigin aynisi.

**Tech Stack:** Expo (React Native, expo-router) + TypeScript, Supabase
(Postgres + PostgREST + RLS), Jest (`jest-expo` preset) ve gercek
veritabanina karsi calisan `tsx` tabanli gorunurluk test paketi.

**Spec:** `docs/superpowers/specs/2026-08-19-faz2c-kimlik-ve-kisi-arama-design.md`

## Global Constraints

- Butun kullanici arayuzu metinleri **Turkce**. Kodda ve dokumanlarda
  Turkce ozel karakter (c, g, i, o, s, u yerine aksanli harfler)
  **kullanilmiyor** — depo genelindeki yazim boyle.
- **GitHub'a push yok.** Yerelde commit'le, `git push` calistirma.
- Kullanici adi bicimi tam olarak: `^[a-z0-9._]{3,20}$`
- Kullanici adi degistirme araligi: **30 gun**.
- Arama: en az **2** karakter, en fazla **20** sonuc.
- Her `security definer` RPC ilk satirinda `auth.uid() is null` kontrolu
  yapar ve `Kimlik dogrulamasi gerekli` hatasi verir.
- Her RPC icin `revoke execute ... from public, anon;` +
  `grant execute ... to authenticated;`
- Migrasyon dosyalari `mobil/supabase/migrations/<timestamp>_<ad>.sql`,
  timestamp bicimi `YYYYMMDDHHMMSS`.
- Test dosyalari **asla** `mobil/src/app` altina konmaz — orasi
  expo-router'in rota kokudur, oraya konan test dosyasi uygulamayi
  cokertir. Ekran testleri `mobil/__tests__/ekranlar/` altinda durur.
  `mobil/__tests__/rota-agaci.test.ts` bunu zorunlu tutar.
- Komutlar `mobil/` dizininden calistirilir: `npm test`,
  `npm run test:gorunurluk`, `supabase db push`.

---

### Task 1: `profiller` tablosuna uc sutun

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_kullanici_adi_sutunlari.sql`

**Interfaces:**
- Produces: `profiller.kullanici_adi` (text, not null, unique, bicim
  kisitli), `profiller.kullanici_adi_degistirildi` (timestamptz, null
  olabilir), `profiller.aramada_gorunsun` (boolean, not null, default
  true). Task 2-6 arasindaki butun RPC'ler bu sutunlari kullanir.

- [ ] **Step 1: Migrasyonu olustur**

```bash
cd mobil
supabase migration new kullanici_adi_sutunlari
```

- [ ] **Step 2: Semayi yaz**

Uretilen dosyaya:

```sql
-- Kullanici adi: benzersiz, kucuk harfle saklanir, bicimi kisitlidir.
-- Once null kabul eder halde eklenip mevcut satirlar dolduruluyor,
-- ancak ondan sonra not null / unique / check ekleniyor. Sira onemli:
-- tersi mevcut profilleri (test hesaplari dahil) kirar.
alter table public.profiller add column kullanici_adi text;

update public.profiller
  set kullanici_adi = 'kullanici_' || left(id::text, 8)
  where kullanici_adi is null;

alter table public.profiller
  alter column kullanici_adi set not null,
  add constraint profiller_kullanici_adi_benzersiz unique (kullanici_adi),
  add constraint profiller_kullanici_adi_bicim
    check (kullanici_adi ~ '^[a-z0-9._]{3,20}$');

-- Son degisiklik ani. null = hic degistirilmemis (kayittan beri).
alter table public.profiller add column kullanici_adi_degistirildi timestamptz;

-- Kisi aramasindan tamamen cikma tercihi.
alter table public.profiller
  add column aramada_gorunsun boolean not null default true;
```

Not: `left(id::text, 8)` bir uuid'nin ilk 8 hane'sini verir; harfleri
kucuk hex oldugu icin uretilen `kullanici_<8 hane>` degeri hem bicim
kisitina uyar (18 karakter) hem de carpismaz.

- [ ] **Step 3: Uygula**

```bash
cd mobil
supabase db push
```

- [ ] **Step 4: Dogrula**

```bash
supabase db query "select column_name, is_nullable, column_default from information_schema.columns where table_name = 'profiller' and column_name in ('kullanici_adi','kullanici_adi_degistirildi','aramada_gorunsun') order by column_name;" --linked
```

Expected: uc satir. `aramada_gorunsun` → `NO` / `true`,
`kullanici_adi` → `NO`, `kullanici_adi_degistirildi` → `YES`.

```bash
supabase db query "select id, kullanici_adi from public.profiller;" --linked
```

Expected: mevcut her satirin `kullanici_<8 hane>` bicimli bir adi var,
hicbiri bos degil.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: profiller tablosuna kullanici adi ve arama gorunurlugu sutunlari"
```

---

### Task 2: Sutun duzeyinde `update` yetkisi

Bu gorev 30 gun kuralini gercekten baglayici yapan seydir. RLS satir
duzeyinde calisir; "kendi profilini guncelleyebilir" politikasi
kullanicinin `kullanici_adi` sutununu **dogrudan** PostgREST uzerinden
yazmasina izin verir ve RPC'deki butun kurallari atlatir.

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_profiller_sutun_yetkileri.sql`

**Interfaces:**
- Consumes: Task 1'in sutunlari.
- Produces: `authenticated` role'u artik `profiller.kullanici_adi` ve
  `profiller.kullanici_adi_degistirildi` sutunlarini guncelleyemez.
  Task 4'teki RPC (tablo sahibi olarak calisir) guncelleyebilir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new profiller_sutun_yetkileri
```

```sql
-- RLS satir duzeyindedir, sutun duzeyinde degil. Bu yuzden "kendi
-- profilini guncelleyebilir" politikasi kullanicinin kullanici_adi
-- sutununu dogrudan yazmasina izin verir ve kullanici_adi_degistir
-- RPC'sindeki 30 gun kurali atlanabilir hale gelir. Istemcinin
-- cagirmayi secebilecegi bir kural, kural degildir.
revoke update on public.profiller from authenticated;

grant update (ad, dogum_tarihi, biyografi, fotograflar,
              varsayilan_gizli, aramada_gorunsun)
  on public.profiller to authenticated;
```

Uyari: ileride bir migrasyon `grant all on public.profiller to
authenticated` yazarsa bu koruma sessizce kalkar. Yeni migrasyon
yazarken buraya bakilmali.

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
supabase db query "select column_name from information_schema.column_privileges where table_name = 'profiller' and grantee = 'authenticated' and privilege_type = 'UPDATE' order by column_name;" --linked
```

Expected: tam olarak alti satir — `ad`, `aramada_gorunsun`,
`biyografi`, `dogum_tarihi`, `fotograflar`, `varsayilan_gizli`.
`kullanici_adi` ve `kullanici_adi_degistirildi` listede **olmamali**.

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: kullanici adi sutunlarini dogrudan guncellemeye kapat"
```

---

### Task 3: `kullanici_adi_musait_mi` RPC

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_kullanici_adi_musait_mi.sql`

**Interfaces:**
- Consumes: `profiller.kullanici_adi`.
- Produces: `public.kullanici_adi_musait_mi(p_ad text) returns boolean`.
  Task 8'deki `kullaniciAdiMusaitMi()` bunu cagirir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new kullanici_adi_musait_mi
```

```sql
-- Istemci bu sorguyu kendisi yapamaz: profiller'in RLS politikasi
-- yalnizca kendi satirini gosterir, dolayisiyla "bu ad baskasinda var
-- mi" sorusu her zaman "yok" cevabini dondururdu.
create or replace function public.kullanici_adi_musait_mi(p_ad text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Bicime uymayan deger icin hata degil false doniyor; bicim mesajini
  -- ekran zaten kendisi gosteriyor, iki ayri hata yolu gerekmiyor.
  if p_ad is null or p_ad !~ '^[a-z0-9._]{3,20}$' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiller p where p.kullanici_adi = p_ad
  );
end;
$$;

revoke execute on function public.kullanici_adi_musait_mi from public, anon;
grant execute on function public.kullanici_adi_musait_mi to authenticated;
```

Not: kullanici kendi mevcut adini sorarsa `false` doner ("alinmis").
Bu bilincli bir sadelestirme; degistirme ekraninda kullanici zaten
mevcut adini yazmaz.

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
supabase db query "select prosecdef, proacl::text from pg_proc where proname = 'kullanici_adi_musait_mi';" --linked
```

Expected: `prosecdef = true`, `proacl` icinde `authenticated=X` var,
`anon` yok.

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: kullanici adi musaitlik RPC'si"
```

---

### Task 4: `kullanici_adi_degistir` RPC

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_kullanici_adi_degistir.sql`

**Interfaces:**
- Consumes: Task 1'in sutunlari, Task 2'nin yetki kisiti.
- Produces: `public.kullanici_adi_degistir(p_yeni_ad text) returns void`.
  Task 8'deki `kullaniciAdiniDegistir()` bunu cagirir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new kullanici_adi_degistir
```

```sql
create or replace function public.kullanici_adi_degistir(p_yeni_ad text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mevcut_ad text;
  v_son_degisiklik timestamptz;
  v_kalan_gun int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_yeni_ad is null or p_yeni_ad !~ '^[a-z0-9._]{3,20}$' then
    raise exception 'Kullanici adi kurallara uymuyor';
  end if;

  select kullanici_adi, kullanici_adi_degistirildi
    into v_mevcut_ad, v_son_degisiklik
    from public.profiller
    where id = auth.uid();

  if not found then
    raise exception 'Profil bulunamadi';
  end if;

  -- Ayni adi yeniden yazmak 30 gunluk hakki harcamamali.
  if v_mevcut_ad = p_yeni_ad then
    raise exception 'Zaten bu kullanici adini kullaniyorsun';
  end if;

  if v_son_degisiklik is not null
     and v_son_degisiklik > now() - interval '30 days' then
    v_kalan_gun := ceil(
      extract(epoch from (v_son_degisiklik + interval '30 days' - now())) / 86400
    );
    raise exception
      'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: % gun', v_kalan_gun;
  end if;

  -- Asil guvence unique kisiti; buradaki kontrol yalnizca daha okunakli
  -- bir hata mesaji uretmek icin. Iki es zamanli cagri yarisirsa
  -- kaybeden taraf kisit ihlaliyle (23505) doner, bu da dogru davranis.
  if exists (
    select 1 from public.profiller
    where kullanici_adi = p_yeni_ad and id <> auth.uid()
  ) then
    raise exception 'Bu kullanici adi alinmis';
  end if;

  update public.profiller
    set kullanici_adi = p_yeni_ad,
        kullanici_adi_degistirildi = now()
    where id = auth.uid();
end;
$$;

revoke execute on function public.kullanici_adi_degistir from public, anon;
grant execute on function public.kullanici_adi_degistir to authenticated;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
supabase db query "select prosecdef from pg_proc where proname = 'kullanici_adi_degistir';" --linked
```

Expected: `prosecdef = true`.

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: kullanici adi degistirme RPC'si, 30 gun kurali sunucuda"
```

---

### Task 5: `kisi_ara` RPC

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_kisi_ara.sql`

**Interfaces:**
- Consumes: `profiller.kullanici_adi`, `profiller.aramada_gorunsun`,
  `engellemeler` tablosu (Faz 2b).
- Produces: `public.kisi_ara(p_metin text) returns table (id uuid,
  kullanici_adi text, ad text, fotograf text)`. Task 9'daki `kisiAra()`
  bunu cagirir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new kisi_ara
```

```sql
create or replace function public.kisi_ara(p_metin text)
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_metin text;
  v_desen text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  v_metin := lower(trim(coalesce(p_metin, '')));

  -- Tek harfle butun kullanici tablosunu dokmeyi engeller.
  if length(v_metin) < 2 then
    return;
  end if;

  -- like/ilike joker karakterlerini kacir. Alt cizgi kullanici adinda
  -- gecerli bir karakter oldugu icin bu sart: kacirilmazsa "a_b"
  -- aramasi "axb" ile de eslesir.
  v_desen := replace(replace(replace(v_metin, '\', '\\'), '%', '\%'), '_', '\_');

  return query
    select p.id,
           p.kullanici_adi,
           p.ad,
           case
             when array_length(p.fotograflar, 1) > 0 then p.fotograflar[1]
             else null
           end
    from public.profiller p
    where p.id <> auth.uid()
      and p.aramada_gorunsun
      and (
        p.kullanici_adi like v_desen || '%' escape '\'
        or p.ad ilike '%' || v_desen || '%' escape '\'
      )
      -- Engelleme iki yonde de gizler ve "bulunamadi" gibi davranir;
      -- baskasinin_profili'ndeki mantigin aynisi (Faz 2b).
      and not exists (
        select 1 from public.engellemeler e
        where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
           or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
      )
    order by (p.kullanici_adi = v_metin) desc,
             (p.kullanici_adi like v_desen || '%' escape '\') desc,
             p.kullanici_adi
    limit 20;
end;
$$;

revoke execute on function public.kisi_ara from public, anon;
grant execute on function public.kisi_ara to authenticated;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
supabase db query "select proname, prosecdef from pg_proc where proname = 'kisi_ara';" --linked
```

Expected: bir satir, `prosecdef = true`.

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: kisi arama RPC'si"
```

---

### Task 6: `baskasinin_profili` kullanici adini da donsun

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_baskasinin_profili_kullanici_adi.sql`

**Interfaces:**
- Consumes: `profiller.kullanici_adi`.
- Produces: `baskasinin_profili` artik `(id, kullanici_adi, ad,
  biyografi, fotograflar)` doner. Task 14'teki ekran bunu kullanir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new baskasinin_profili_kullanici_adi
```

```sql
-- Donen sutun listesi degistigi icin create or replace yetmiyor;
-- fonksiyonun once dusurulmesi gerekiyor.
drop function if exists public.baskasinin_profili(uuid);

create function public.baskasinin_profili(p_kullanici_id uuid)
returns table (id uuid, kullanici_adi text, ad text, biyografi text, fotograflar text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Engelleme her iki yonde de profili gizler; "bulunamadi" gibi davranir.
  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  -- Dogum tarihi hicbir kosulda donmuyor (Faz 2b karar #27).
  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.fotograflar
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
supabase db query "select pg_get_function_result(oid) from pg_proc where proname = 'baskasinin_profili';" --linked
```

Expected: donen tipte `kullanici_adi text` gorunuyor, `dogum_tarihi`
gorunmuyor.

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: baskasinin profili kullanici adini da donsun"
```

---

### Task 7: Kullanici adi bicim kurallari (saf fonksiyonlar)

**Files:**
- Create: `mobil/lib/kullanici-adi.ts`
- Test: `mobil/lib/kullanici-adi.test.ts`

**Interfaces:**
- Produces:
  - `KULLANICI_ADI_KURALI: string` — ekranlarda gosterilen kural metni
  - `kullaniciAdiniNormallestir(ham: string): string`
  - `kullaniciAdiGecerliMi(ad: string): boolean`

  Task 8, 10 ve 11 bunlari kullanir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/kullanici-adi.test.ts`:

```ts
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiniNormallestir,
  kullaniciAdiGecerliMi,
} from './kullanici-adi'

describe('kullaniciAdiniNormallestir', () => {
  it('bastaki ve sondaki bosluklari atar', () => {
    expect(kullaniciAdiniNormallestir('  orcun  ')).toBe('orcun')
  })

  it('buyuk harfleri kucultur', () => {
    expect(kullaniciAdiniNormallestir('Orcun.Ozdemir')).toBe('orcun.ozdemir')
  })
})

describe('kullaniciAdiGecerliMi', () => {
  it('kucuk harf, rakam, nokta ve alt cizgiyi kabul eder', () => {
    expect(kullaniciAdiGecerliMi('orcun.ozdemir_16')).toBe(true)
  })

  it('3 karakterden kisayi reddeder', () => {
    expect(kullaniciAdiGecerliMi('or')).toBe(false)
  })

  it('20 karakterden uzunu reddeder', () => {
    expect(kullaniciAdiGecerliMi('a'.repeat(21))).toBe(false)
  })

  it('buyuk harfi reddeder', () => {
    expect(kullaniciAdiGecerliMi('Orcun')).toBe(false)
  })

  it('bosluk ve tire gibi karakterleri reddeder', () => {
    expect(kullaniciAdiGecerliMi('orcun ozdemir')).toBe(false)
    expect(kullaniciAdiGecerliMi('orcun-ozdemir')).toBe(false)
  })

  it('kural metni kullaniciya kurali aciklar', () => {
    expect(KULLANICI_ADI_KURALI).toContain('3-20')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest lib/kullanici-adi.test.ts
```

Expected: FAIL — `Cannot find module './kullanici-adi'`.

- [ ] **Step 3: En kucuk uygulamayi yaz**

`mobil/lib/kullanici-adi.ts`:

```ts
// Bicim veritabaninda da ayni sekilde kisitli
// (profiller_kullanici_adi_bicim). Buradaki kopya yalnizca kullaniciya
// sunucuya gitmeden hizli geri bildirim vermek icin var; asil zorlayici
// olan veritabani kisitidir.
const DESEN = /^[a-z0-9._]{3,20}$/

export const KULLANICI_ADI_KURALI =
  'Kullanici adi 3-20 karakter olmali; sadece kucuk harf, rakam, nokta ve alt cizgi kullanilabilir.'

export function kullaniciAdiniNormallestir(ham: string): string {
  return ham.trim().toLowerCase()
}

export function kullaniciAdiGecerliMi(ad: string): boolean {
  return DESEN.test(ad)
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest lib/kullanici-adi.test.ts
```

Expected: PASS, 7 test.

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/kullanici-adi.ts mobil/lib/kullanici-adi.test.ts
git commit -m "mobil: kullanici adi bicim kurallari"
```

---

### Task 8: Kullanici adi RPC sarmalayicilari

**Files:**
- Modify: `mobil/lib/kullanici-adi.ts`
- Modify: `mobil/lib/kullanici-adi.test.ts`

**Interfaces:**
- Consumes: Task 3 ve 4'un RPC'leri, Task 7'nin saf fonksiyonlari.
- Produces:
  - `kullaniciAdiMusaitMi(ad: string): Promise<boolean>`
  - `kullaniciAdiniDegistir(yeniAd: string): Promise<void>`

  Task 10 ve 11 bunlari kullanir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/kullanici-adi.test.ts` dosyasinin **basina** mock, sonuna
testler eklenir. Dosyanin en ustune:

```ts
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

const mockRpc = supabase.rpc as jest.Mock
```

Import satirina yeni fonksiyonlar eklenir:

```ts
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiniNormallestir,
  kullaniciAdiGecerliMi,
  kullaniciAdiMusaitMi,
  kullaniciAdiniDegistir,
} from './kullanici-adi'
```

Dosyanin sonuna:

```ts
describe('kullaniciAdiMusaitMi', () => {
  beforeEach(() => mockRpc.mockReset())

  it('RPC true donerse true doner', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    await expect(kullaniciAdiMusaitMi('orcun')).resolves.toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_musait_mi', { p_ad: 'orcun' })
  })

  it('adi normallestirerek gonderir', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    await kullaniciAdiMusaitMi('  Orcun  ')
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_musait_mi', { p_ad: 'orcun' })
  })

  it('RPC hata dondururse hatayi firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })
    await expect(kullaniciAdiMusaitMi('orcun')).rejects.toThrow('Kimlik dogrulamasi gerekli')
  })
})

describe('kullaniciAdiniDegistir', () => {
  beforeEach(() => mockRpc.mockReset())

  it('normallestirilmis adi RPC'ye gonderir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    await kullaniciAdiniDegistir(' Orcun.Ozdemir ')
    expect(mockRpc).toHaveBeenCalledWith('kullanici_adi_degistir', {
      p_yeni_ad: 'orcun.ozdemir',
    })
  })

  it('sunucudan gelen 30 gun mesajini oldugu gibi firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: 12 gun' },
    })
    await expect(kullaniciAdiniDegistir('yeniad')).rejects.toThrow('Kalan sure: 12 gun')
  })
})
```

Not: test metni icindeki `RPC'ye` ifadesindeki kesme isareti yuzunden
test adini cift tirnakla yaz: `it("normallestirilmis adi RPC'ye
gonderir", ...)`.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest lib/kullanici-adi.test.ts
```

Expected: FAIL — `kullaniciAdiMusaitMi is not a function`.

- [ ] **Step 3: En kucuk uygulamayi yaz**

`mobil/lib/kullanici-adi.ts` sonuna:

```ts
import { supabase } from './supabase'

export async function kullaniciAdiMusaitMi(ad: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('kullanici_adi_musait_mi', {
    p_ad: kullaniciAdiniNormallestir(ad),
  })
  if (error) throw new Error(error.message)
  return data as boolean
}

export async function kullaniciAdiniDegistir(yeniAd: string): Promise<void> {
  const { error } = await supabase.rpc('kullanici_adi_degistir', {
    p_yeni_ad: kullaniciAdiniNormallestir(yeniAd),
  })
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest lib/kullanici-adi.test.ts
```

Expected: PASS, 12 test.

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/kullanici-adi.ts mobil/lib/kullanici-adi.test.ts
git commit -m "mobil: kullanici adi musaitlik ve degistirme cagrilari"
```

---

### Task 9: Kisi arama istemci modulu

**Files:**
- Create: `mobil/lib/kisi-ara.ts`
- Test: `mobil/lib/kisi-ara.test.ts`

**Interfaces:**
- Consumes: Task 5'in `kisi_ara` RPC'si.
- Produces:
  - `type KisiSonucu = { id: string; kullaniciAdi: string; ad: string; fotograf: string | null }`
  - `kisiAra(metin: string): Promise<KisiSonucu[]>`

  Task 12'deki ekran bunu kullanir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/kisi-ara.test.ts`:

```ts
import { supabase } from './supabase'
import { kisiAra } from './kisi-ara'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

const mockRpc = supabase.rpc as jest.Mock

describe('kisiAra', () => {
  beforeEach(() => mockRpc.mockReset())

  it('sunucu satirlarini istemci tipine cevirir', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { id: 'k1', kullanici_adi: 'orcun', ad: 'Orcun Ozdemir', fotograf: 'k1/a.jpg' },
        { id: 'k2', kullanici_adi: 'ayse', ad: 'Ayse Yilmaz', fotograf: null },
      ],
      error: null,
    })

    await expect(kisiAra('orc')).resolves.toEqual([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: 'k1/a.jpg' },
      { id: 'k2', kullaniciAdi: 'ayse', ad: 'Ayse Yilmaz', fotograf: null },
    ])
    expect(mockRpc).toHaveBeenCalledWith('kisi_ara', { p_metin: 'orc' })
  })

  it('iki karakterden kisa metinde sunucuya hic gitmez', async () => {
    await expect(kisiAra('o')).resolves.toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('bostan ibaret metinde sunucuya hic gitmez', async () => {
    await expect(kisiAra('   ')).resolves.toEqual([])
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('hata dondururse firlatir', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Kimlik dogrulamasi gerekli' } })
    await expect(kisiAra('orc')).rejects.toThrow('Kimlik dogrulamasi gerekli')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest lib/kisi-ara.test.ts
```

Expected: FAIL — `Cannot find module './kisi-ara'`.

- [ ] **Step 3: En kucuk uygulamayi yaz**

`mobil/lib/kisi-ara.ts`:

```ts
import { supabase } from './supabase'

export type KisiSonucu = {
  id: string
  kullaniciAdi: string
  ad: string
  fotograf: string | null
}

type SunucuSatiri = {
  id: string
  kullanici_adi: string
  ad: string
  fotograf: string | null
}

// Sunucu da en az iki karakter istiyor; buradaki kontrol yalnizca
// bosuna istek atmamak icin.
const EN_AZ_KARAKTER = 2

export async function kisiAra(metin: string): Promise<KisiSonucu[]> {
  const temiz = metin.trim()
  if (temiz.length < EN_AZ_KARAKTER) return []

  const { data, error } = await supabase.rpc('kisi_ara', { p_metin: temiz })
  if (error) throw new Error(error.message)

  return (data as SunucuSatiri[]).map((satir) => ({
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    fotograf: satir.fotograf,
  }))
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest lib/kisi-ara.test.ts
```

Expected: PASS, 4 test.

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/kisi-ara.ts mobil/lib/kisi-ara.test.ts
git commit -m "mobil: kisi arama istemci modulu"
```

---

### Task 10: Profil olusturma ekraninda kullanici adi

**Files:**
- Modify: `mobil/src/app/profil-olustur.tsx`
- Test: `mobil/__tests__/ekranlar/profil-olustur.test.tsx`

**Interfaces:**
- Consumes: Task 7 ve 8 (`kullaniciAdiGecerliMi`,
  `kullaniciAdiniNormallestir`, `kullaniciAdiMusaitMi`),
  `KULLANICI_ADI_KURALI`.
- Produces: `profiller` insert'i artik `kullanici_adi` alanini da yazar.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/__tests__/ekranlar/profil-olustur.test.tsx` dosyasina ekle. Once
dosyanin mevcut mock'larina `lib/kullanici-adi` mock'u eklenir:

```ts
jest.mock('../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../lib/kullanici-adi'),
  kullaniciAdiMusaitMi: jest.fn(),
}))
```

Testler:

```tsx
it('bicime uymayan kullanici adinda kurali gosterir ve kaydetmez', async () => {
  render(<ProfilOlusturEkrani />)
  fireEvent.changeText(screen.getByPlaceholderText('Adin'), 'Orcun Ozdemir')
  fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'or')
  fireEvent.changeText(screen.getByPlaceholderText('YYYY-AA-GG'), '1990-01-01')
  fireEvent.press(screen.getByText('Devam et'))

  expect(await screen.findByText(/3-20 karakter/)).toBeTruthy()
})

it('alinmis kullanici adinda uyari gosterir', async () => {
  ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(false)

  render(<ProfilOlusturEkrani />)
  fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'orcun')

  expect(await screen.findByText('Bu kullanici adi alinmis, baska bir tane dene.')).toBeTruthy()
})

it('musait kullanici adinda musait yazisini gosterir', async () => {
  ;(kullaniciAdiMusaitMi as jest.Mock).mockResolvedValue(true)

  render(<ProfilOlusturEkrani />)
  fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi'), 'orcun')

  expect(await screen.findByText('Bu kullanici adi musait.')).toBeTruthy()
})
```

Mevcut basarili kayit testi de guncellenir: "Kullanici adi" alanina
`Orcun` yazilir ve `insert` cagrisinin **kucuk harfe cevrilmis** degeri
icerdigi dogrulanir — normallestirmenin ekranda gercekten uygulandiginin
kaniti bu:

```tsx
expect(mockInsert).toHaveBeenCalledWith(
  expect.objectContaining({ kullanici_adi: 'orcun' })
)
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/profil-olustur.test.tsx
```

Expected: FAIL — `Unable to find an element with placeholder: Kullanici adi`.

- [ ] **Step 3: Ekrani guncelle**

`mobil/src/app/profil-olustur.tsx`:

Import ekle:

```tsx
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiMusaitMi,
} from '../../lib/kullanici-adi'
```

Durum ekle:

```tsx
const [kullaniciAdi, setKullaniciAdi] = useState('')
const [kullaniciAdiDurumu, setKullaniciAdiDurumu] = useState<string | null>(null)
```

Yazarken musaitlik kontrolu:

```tsx
async function kullaniciAdiDegisti(metin: string) {
  setKullaniciAdi(metin)
  const normal = kullaniciAdiniNormallestir(metin)

  if (normal.length === 0) {
    setKullaniciAdiDurumu(null)
    return
  }
  if (!kullaniciAdiGecerliMi(normal)) {
    setKullaniciAdiDurumu(KULLANICI_ADI_KURALI)
    return
  }
  try {
    const musait = await kullaniciAdiMusaitMi(normal)
    setKullaniciAdiDurumu(
      musait ? 'Bu kullanici adi musait.' : 'Bu kullanici adi alinmis, baska bir tane dene.'
    )
  } catch {
    setKullaniciAdiDurumu(null)
  }
}
```

`devamEt` icinde, ad kontrolunden hemen sonra:

```tsx
const kullaniciAdiNormal = kullaniciAdiniNormallestir(kullaniciAdi)
if (!kullaniciAdiGecerliMi(kullaniciAdiNormal)) {
  setHata(KULLANICI_ADI_KURALI)
  return
}
```

`insert` cagrisina alan eklenir:

```tsx
kullanici_adi: kullaniciAdiNormal,
```

`insert` hatasi yakalanan yerde benzersizlik ihlali Turkcelestirilir:

```tsx
if (error) {
  setHata(
    error.code === '23505'
      ? 'Bu kullanici adi alinmis, baska bir tane dene.'
      : error.message
  )
  return
}
```

Arayuze alan ve durum satiri eklenir ("Adin" alaninin hemen altina):

```tsx
<TextInput
  style={stiller.girdi}
  placeholder="Kullanici adi"
  autoCapitalize="none"
  value={kullaniciAdi}
  onChangeText={kullaniciAdiDegisti}
/>
{kullaniciAdiDurumu && <Text style={stiller.ipucu}>{kullaniciAdiDurumu}</Text>}
```

Stile ekle: `ipucu: { color: '#555', marginBottom: 12 }`.

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/profil-olustur.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/profil-olustur.tsx mobil/__tests__/ekranlar/profil-olustur.test.tsx
git commit -m "mobil: kayitta kullanici adi secimi ve musaitlik gosterimi"
```

---

### Task 11: Ayarlar ekraninda hesap bolumu

**Files:**
- Modify: `mobil/lib/ayarlar.ts`
- Modify: `mobil/lib/ayarlar.test.ts`
- Modify: `mobil/src/app/profil/ayarlar.tsx`
- Modify: `mobil/__tests__/ekranlar/profil/ayarlar.test.tsx`

**Interfaces:**
- Consumes: Task 8 (`kullaniciAdiniDegistir`), Task 1'in
  `aramada_gorunsun` sutunu.
- Produces: `aramadaGorunsunGetir(): Promise<boolean>`,
  `aramadaGorunsunAyarla(deger: boolean): Promise<void>`.

- [ ] **Step 1: Basarisiz testi yaz (lib)**

`mobil/lib/ayarlar.test.ts` dosyasinin import satirina
`aramadaGorunsunGetir, aramadaGorunsunAyarla` eklenir ve dosyanin
sonuna:

```ts
describe('aramadaGorunsunGetir', () => {
  it('profilden aramada_gorunsun degerini okur', async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { aramada_gorunsun: false }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })

  it('satir yoksa varsayilan olarak gorunur kabul eder', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await aramadaGorunsunGetir()).toBe(true)
  })
})

describe('aramadaGorunsunAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aramadaGorunsunAyarla(false)

    expect(update).toHaveBeenCalledWith({ aramada_gorunsun: false })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest lib/ayarlar.test.ts
```

Expected: FAIL — `aramadaGorunsunGetir is not a function`.

- [ ] **Step 3: lib/ayarlar.ts'ye ekle**

```ts
export async function aramadaGorunsunGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('aramada_gorunsun')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.aramada_gorunsun ?? true
}

export async function aramadaGorunsunAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ aramada_gorunsun: deger })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 4: Ekran testini yaz**

`mobil/__tests__/ekranlar/profil/ayarlar.test.tsx` dosyasinin mock
bloklari once genisletilir — mevcut `lib/ayarlar` mock'una iki yeni
fonksiyon, ayrica `lib/kullanici-adi` icin ayri bir mock:

```tsx
jest.mock('../../../lib/ayarlar', () => ({
  varsayilanGizliyiGetir: jest.fn(),
  varsayilanGizliyiAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
  aramadaGorunsunGetir: jest.fn(),
  aramadaGorunsunAyarla: jest.fn(),
}))

jest.mock('../../../lib/kullanici-adi', () => ({
  ...jest.requireActual('../../../lib/kullanici-adi'),
  kullaniciAdiniDegistir: jest.fn(),
}))
```

`beforeEach` blogunun sonuna:

```tsx
;(aramadaGorunsunGetir as jest.Mock).mockResolvedValue(true)
;(aramadaGorunsunAyarla as jest.Mock).mockResolvedValue(undefined)
```

Testler:

```tsx
it('kullanici adini degistirir', async () => {
  ;(kullaniciAdiniDegistir as jest.Mock).mockResolvedValue(undefined)

  render(<AyarlarEkrani />)
  fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanici adi'), 'yeniad')
  fireEvent.press(screen.getByText('Kullanici adini degistir'))

  await waitFor(() => expect(kullaniciAdiniDegistir).toHaveBeenCalledWith('yeniad'))
  expect(await screen.findByText('Kullanici adin guncellendi.')).toBeTruthy()
})

it('sunucudan gelen 30 gun hatasini gosterir', async () => {
  ;(kullaniciAdiniDegistir as jest.Mock).mockRejectedValue(
    new Error('Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: 12 gun')
  )

  render(<AyarlarEkrani />)
  fireEvent.changeText(screen.getByPlaceholderText('Yeni kullanici adi'), 'yeniad')
  fireEvent.press(screen.getByText('Kullanici adini degistir'))

  expect(await screen.findByText(/Kalan sure: 12 gun/)).toBeTruthy()
})

it('aramada gorunurlugu kapatir', async () => {
  render(<AyarlarEkrani />)
  fireEvent(screen.getByLabelText('Aramada gorunurluk'), 'valueChange', false)

  await waitFor(() => expect(aramadaGorunsunAyarla).toHaveBeenCalledWith(false))
})
```

- [ ] **Step 5: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/profil/ayarlar.test.tsx
```

Expected: FAIL — `Unable to find an element with placeholder: Yeni kullanici adi`.

- [ ] **Step 6: Ekrani guncelle**

`mobil/src/app/profil/ayarlar.tsx` icine "Hesap" bolumu (ekranin en
ustune, gizlilik basliginin oncesine) ve gizlilik tarafina anahtar:

```tsx
<Text style={stiller.altBaslik}>Hesap</Text>
<TextInput
  style={stiller.girdi}
  placeholder="Yeni kullanici adi"
  autoCapitalize="none"
  value={yeniKullaniciAdi}
  onChangeText={setYeniKullaniciAdi}
/>
<Pressable style={stiller.buton} onPress={kullaniciAdiniGuncelle}>
  <Text style={stiller.butonMetni}>Kullanici adini degistir</Text>
</Pressable>
<Text style={stiller.ipucu}>{KULLANICI_ADI_KURALI}</Text>
{kullaniciAdiSonucu && <Text style={stiller.ipucu}>{kullaniciAdiSonucu}</Text>}

<View style={stiller.satir}>
  <Text style={stiller.etiket}>Beni aramada goster</Text>
  <Switch
    accessibilityLabel="Aramada gorunurluk"
    value={aramadaGorunsun}
    onValueChange={aramadaGorunsunDegisti}
  />
</View>
```

Islev:

```tsx
async function kullaniciAdiniGuncelle() {
  const normal = kullaniciAdiniNormallestir(yeniKullaniciAdi)
  if (!kullaniciAdiGecerliMi(normal)) {
    setKullaniciAdiSonucu(KULLANICI_ADI_KURALI)
    return
  }
  try {
    await kullaniciAdiniDegistir(normal)
    setKullaniciAdiSonucu('Kullanici adin guncellendi.')
    setYeniKullaniciAdi('')
  } catch (e) {
    setKullaniciAdiSonucu(e instanceof Error ? e.message : 'Bir sorun olustu')
  }
}
```

Yeni durumlar ve gorunurluk islevi:

```tsx
const [yeniKullaniciAdi, setYeniKullaniciAdi] = useState('')
const [kullaniciAdiSonucu, setKullaniciAdiSonucu] = useState<string | null>(null)
const [aramadaGorunsun, setAramadaGorunsun] = useState(true)

async function aramadaGorunsunDegisti(deger: boolean) {
  const oncekiDeger = aramadaGorunsun
  setAramadaGorunsun(deger)
  try {
    await aramadaGorunsunAyarla(deger)
    setHata(null)
  } catch (e) {
    setAramadaGorunsun(oncekiDeger)
    setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
  }
}
```

`ayarlariYukle` icine, mevcut `setVarsayilanGizli(...)` satirinin
hemen ardina:

```tsx
setAramadaGorunsun(await aramadaGorunsunGetir())
```

Import satirlari:

```tsx
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
} from '../../../lib/ayarlar'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiniDegistir,
} from '../../../lib/kullanici-adi'
```

Stile eklenecekler: `girdi: { borderWidth: 1, borderColor: '#ccc',
borderRadius: 8, padding: 12, marginBottom: 8 }` ve
`ipucu: { color: '#555', marginBottom: 12 }`.

Ekran basligi "Gizlilik ayarlari" olarak kalir; ana ekrandaki buton da
ayni adi tasidigi icin degistirilmiyor.

- [ ] **Step 7: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest lib/ayarlar.test.ts __tests__/ekranlar/profil/ayarlar.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add mobil/lib/ayarlar.ts mobil/lib/ayarlar.test.ts mobil/src/app/profil/ayarlar.tsx mobil/__tests__/ekranlar/profil/ayarlar.test.tsx
git commit -m "mobil: ayarlarda kullanici adi degistirme ve aramada gorunurluk"
```

---

### Task 12: Kisi arama ekrani

**Files:**
- Create: `mobil/src/app/kisiler.tsx`
- Test: `mobil/__tests__/ekranlar/kisiler.test.tsx`

**Interfaces:**
- Consumes: Task 9 (`kisiAra`, `KisiSonucu`).
- Produces: `/kisiler` rotasi. Task 13'teki ana ekran buraya yonlendirir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/__tests__/ekranlar/kisiler.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KisilerEkrani from '../../src/app/kisiler'
import { kisiAra } from '../../lib/kisi-ara'

jest.mock('../../lib/kisi-ara', () => ({ kisiAra: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

jest.mock('../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({ getPublicUrl: () => ({ data: { publicUrl: 'https://ornek/foto.jpg' } }) }),
    },
  },
}))

describe('KisilerEkrani', () => {
  beforeEach(() => {
    ;(kisiAra as jest.Mock).mockReset()
    mockRouterPush.mockReset()
  })

  it('sonuclari kullanici adi ve isimle listeler', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    render(<KisilerEkrani />)
    fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'orc')

    expect(await screen.findByText('orcun')).toBeTruthy()
    expect(screen.getByText('Orcun Ozdemir')).toBeTruthy()
  })

  it('iki karakterden kisa metinde uyari gosterir', async () => {
    render(<KisilerEkrani />)
    fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'o')

    expect(await screen.findByText('En az 2 karakter yaz.')).toBeTruthy()
    expect(kisiAra).not.toHaveBeenCalled()
  })

  it('sonuc yoksa bilgilendirir', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([])

    render(<KisilerEkrani />)
    fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'zzz')

    expect(await screen.findByText('Kimse bulunamadi.')).toBeTruthy()
  })

  it('sonuca basinca profile gider', async () => {
    ;(kisiAra as jest.Mock).mockResolvedValue([
      { id: 'k1', kullaniciAdi: 'orcun', ad: 'Orcun Ozdemir', fotograf: null },
    ])

    render(<KisilerEkrani />)
    fireEvent.changeText(screen.getByPlaceholderText('Kullanici adi ya da isim'), 'orc')
    fireEvent.press(await screen.findByText('orcun'))

    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/kullanici/k1'))
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/kisiler.test.tsx
```

Expected: FAIL — `Cannot find module '../../src/app/kisiler'`.

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/kisiler.tsx`:

```tsx
import { useState } from 'react'
import { View, Text, TextInput, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { kisiAra, type KisiSonucu } from '../../lib/kisi-ara'
import { supabase } from '../../lib/supabase'

function fotografUrl(yol: string): string {
  return supabase.storage.from('profil-fotograflari').getPublicUrl(yol).data.publicUrl
}

export default function KisilerEkrani() {
  const router = useRouter()
  const [metin, setMetin] = useState('')
  const [sonuclar, setSonuclar] = useState<KisiSonucu[]>([])
  const [durum, setDurum] = useState<string | null>(null)

  async function metinDegisti(yeni: string) {
    setMetin(yeni)

    if (yeni.trim().length < 2) {
      setSonuclar([])
      setDurum(yeni.trim().length === 0 ? null : 'En az 2 karakter yaz.')
      return
    }

    try {
      const bulunanlar = await kisiAra(yeni)
      setSonuclar(bulunanlar)
      setDurum(bulunanlar.length === 0 ? 'Kimse bulunamadi.' : null)
    } catch (e) {
      setSonuclar([])
      setDurum(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <TextInput
        style={stiller.arama}
        placeholder="Kullanici adi ya da isim"
        autoCapitalize="none"
        value={metin}
        onChangeText={metinDegisti}
      />
      {durum && <Text style={stiller.durum}>{durum}</Text>}
      <FlatList
        data={sonuclar}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => router.push(`/kullanici/${item.id}`)}>
            {item.fotograf && (
              <Image source={{ uri: fotografUrl(item.fotograf) }} style={stiller.fotograf} />
            )}
            <View>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  arama: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  durum: { color: '#555', marginBottom: 12 },
  satir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  fotograf: { width: 40, height: 40, borderRadius: 20 },
  kullaniciAdi: { fontSize: 16, fontWeight: '600' },
  ad: { color: '#555' },
})
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/kisiler.test.tsx
```

Expected: PASS, 4 test.

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/kisiler.tsx mobil/__tests__/ekranlar/kisiler.test.tsx
git commit -m "mobil: kisi arama ekrani"
```

---

### Task 13: Ana ekrandan kisi aramaya giris

**Files:**
- Modify: `mobil/src/app/index.tsx`
- Test: `mobil/__tests__/ekranlar/index.test.tsx`

**Interfaces:**
- Consumes: Task 12'nin `/kisiler` rotasi.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/__tests__/ekranlar/index.test.tsx` dosyasina, mevcut "ayarlar
butonu" testinin kalibiyla:

```tsx
it('kisi ara butonuna basinca /kisiler rotasina yonlendirir', async () => {
  render(<AnaEkran />)
  await fireEvent.press(screen.getByText('Kisi ara'))
  expect(mockRouterPush).toHaveBeenCalledWith('/kisiler')
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/index.test.tsx
```

Expected: FAIL — `Unable to find an element with text: Kisi ara`.

- [ ] **Step 3: Butonu ekle**

`mobil/src/app/index.tsx` icinde "Mekanlari kesfet" butonunun hemen
altina:

```tsx
<Pressable style={stiller.ikincilButon} onPress={() => router.push('/kisiler')}>
  <Text style={stiller.ikincilButonYazi}>Kisi ara</Text>
</Pressable>
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest __tests__/ekranlar/index.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/index.tsx mobil/__tests__/ekranlar/index.test.tsx
git commit -m "mobil: ana ekrandan kisi aramaya erisim"
```

---

### Task 14: Baskasinin profilinde kullanici adi

**Files:**
- Modify: `mobil/lib/profil.ts`
- Modify: `mobil/src/app/kullanici/[id].tsx`
- Modify: `mobil/__tests__/ekranlar/kullanici/[id].test.tsx`

**Interfaces:**
- Consumes: Task 6'nin genisletilmis `baskasinin_profili` RPC'si.
- Produces: `BaskaProfil` tipine `kullaniciAdi: string` eklenir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/__tests__/ekranlar/kullanici/[id].test.tsx` icindeki mevcut
profil verisine `kullaniciAdi` eklenir ve yeni test yazilir:

```tsx
it('kullanici adini gosterir', async () => {
  ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
    id: 'k1',
    kullaniciAdi: 'orcun',
    ad: 'Orcun Ozdemir',
    biyografi: null,
    fotograflar: [],
  })
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])

  render(<KullaniciProfiliEkrani />)

  expect(await screen.findByText('Orcun Ozdemir')).toBeTruthy()
  expect(screen.getByText('@orcun')).toBeTruthy()
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest "__tests__/ekranlar/kullanici"
```

Expected: FAIL — `Unable to find an element with text: @orcun`.

- [ ] **Step 3: Tipi ve ekrani guncelle**

`mobil/lib/profil.ts`:

```ts
export type BaskaProfil = {
  id: string
  kullaniciAdi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

type SunucuProfili = {
  id: string
  kullanici_adi: string
  ad: string
  biyografi: string | null
  fotograflar: string[]
}

export async function baskasininProfiliniGetir(
  kullaniciId: string
): Promise<BaskaProfil | null> {
  const { data, error } = await supabase.rpc('baskasinin_profili', {
    p_kullanici_id: kullaniciId,
  })
  if (error) throw new Error(error.message)

  const satirlar = data as SunucuProfili[]
  if (satirlar.length === 0) return null

  const satir = satirlar[0]
  return {
    id: satir.id,
    kullaniciAdi: satir.kullanici_adi,
    ad: satir.ad,
    biyografi: satir.biyografi,
    fotograflar: satir.fotograflar,
  }
}
```

`mobil/src/app/kullanici/[id].tsx` icinde `{profil.ad}` satirinin hemen
altina:

```tsx
<Text style={stiller.kullaniciAdi}>@{profil.kullaniciAdi}</Text>
```

Stile ekle: `kullaniciAdi: { color: '#555', marginBottom: 8 }`.

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest "__tests__/ekranlar/kullanici"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/profil.ts "mobil/src/app/kullanici/[id].tsx" "mobil/__tests__/ekranlar/kullanici/[id].test.tsx"
git commit -m "mobil: baskasinin profilinde kullanici adi"
```

---

### Task 15: Gercek veritabanina karsi kimlik ve arama testleri

Bu gorev fazin asil kanitidir. Onceki gorevlerin testleri Supabase'i
mock'luyor; bu paket gercek veritabanina soruyor. Faz 2a'da 66 mock'lu
test yesilken canli veritabaninda hic calismayan bir ekran uretilmisti.

**Files:**
- Modify: `mobil/gorunurluk-testleri/calistir.ts`
- Modify: `mobil/gorunurluk-testleri/README.md`

**Interfaces:**
- Consumes: Task 1-6'nin butun sema ve RPC'leri, mevcut
  `ikiKullaniciIleBaglan()` / `esitMi()` / `senaryo()` yardimcilari.

**Tekrarlanabilirlik notu (onemli):** `kullanici_adi_degistir` basarili
olursa hesap 30 gun kilitlenir ve betik bir daha ayni sonucu uretemez.
Bu yuzden **basarili degistirme dogrudan iddia edilmiyor.** Iki ardisik
cagriya dayanan sunlar iddia ediliyor:

- Ilk cagri ya basarili olur ya da **yalnizca 30 gun mesajiyla**
  reddedilir (bicim ya da baska bir hata olamaz).
- Ikinci cagri **her durumda** 30 gun mesajiyla reddedilir — cunku ilk
  cagri basarili olduysa zaman damgasi simdi, olmadiysa zaten yakin
  gecmiste. Bu iddia betigin kacinci kez calistigindan bagimsizdir.

- [ ] **Step 1: Senaryolari yaz**

`mobil/gorunurluk-testleri/calistir.ts` icindeki `main()` fonksiyonunun
sonuna, mevcut `senaryo(...)` cagrilarinin ardina:

```ts
await senaryo('11 - Kullanici adi benzersizligi', async () => {
  // Aktor bilerek A: RPC'de 30 gun kontrolu benzersizlik kontrolunden
  // once geliyor, dolayisiyla adi degistirilmis bir hesapla denenirse
  // beklenen "alinmis" mesaji yerine 30 gun mesaji doner ve test
  // betigin kacinci calismasi oldugu bilgisine bagimli hale gelir.
  // A'nin kullanici adi hicbir senaryoda degistirilmiyor.
  const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
  const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi

  const { error } = await a.rpc('kullanici_adi_degistir', { p_yeni_ad: bAdi })
  esitMi(
    error?.message?.includes('alinmis') ?? false,
    true,
    "A, B'nin kullanici adini alamaz"
  )
})

await senaryo('12 - Bicim kurallari sunucuda zorunlu', async () => {
  for (const gecersiz of ['ORCUN', 'or', 'a'.repeat(21), 'orcun ozdemir', 'orcun-x']) {
    const { error } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: gecersiz })
    esitMi(
      error?.message?.includes('kurallara uymuyor') ?? false,
      true,
      `gecersiz ad reddedilir: ${JSON.stringify(gecersiz)}`
    )
  }

  const { data: musait } = await b.rpc('kullanici_adi_musait_mi', { p_ad: 'ORCUN' })
  esitMi(musait, false, 'musait_mi buyuk harfli adi musait saymaz')
})

await senaryo('13 - 30 gun kurali sunucuda tutar', async () => {
  // Bkz. yukaridaki tekrarlanabilirlik notu: basarili degistirme
  // dogrudan iddia edilemez, cunku bir kez basarili olunca hesap
  // 30 gun kilitlenir ve betik tekrar calistirilamaz hale gelirdi.
  const ilkAd = `test_${Math.floor(Date.now() / 1000)}`.slice(0, 20)
  const { error: ilkHata } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: ilkAd })
  esitMi(
    ilkHata === null || (ilkHata.message?.includes('30 gunde bir') ?? false),
    true,
    'ilk cagri ya kabul edilir ya da yalnizca 30 gun kuraliyla reddedilir'
  )

  const ikinciAd = `${ilkAd}x`.slice(0, 20)
  const { error: ikinciHata } = await b.rpc('kullanici_adi_degistir', { p_yeni_ad: ikinciAd })
  esitMi(
    ikinciHata?.message?.includes('30 gunde bir') ?? false,
    true,
    'ardisik ikinci cagri her durumda 30 gun kuraliyla reddedilir'
  )
})

await senaryo('14 - Kullanici adi sutunu dogrudan yazilamaz', async () => {
  const { error } = await b
    .from('profiller')
    .update({ kullanici_adi: 'dogrudan_yazim' })
    .eq('id', bId)
  esitMi(
    error !== null,
    true,
    'dogrudan update ile kullanici adi degistirilemez (sutun yetkisi)'
  )

  const { error: acikHata } = await b
    .from('profiller')
    .update({ aramada_gorunsun: true })
    .eq('id', bId)
  esitMi(acikHata, null, 'aramada_gorunsun dogrudan guncellenebilir (karsi kontrol)')
})

await senaryo('15 - Arama kullanici adi ve isimle bulur', async () => {
  const { data: bProfil } = await b.from('profiller').select('kullanici_adi, ad').single()
  const { kullanici_adi: bAdi, ad: bIsim } = bProfil as { kullanici_adi: string; ad: string }

  const { data: adaGore } = await a.rpc('kisi_ara', { p_metin: bAdi.slice(0, 4) })
  esitMi(
    ((adaGore ?? []) as { id: string }[]).some((s) => s.id === bId),
    true,
    'kullanici adiyla bulunur'
  )

  const { data: isimeGore } = await a.rpc('kisi_ara', { p_metin: bIsim.slice(0, 3) })
  esitMi(
    ((isimeGore ?? []) as { id: string }[]).some((s) => s.id === bId),
    true,
    'isim soyisimle bulunur'
  )

  const { data: kisa } = await a.rpc('kisi_ara', { p_metin: 'b' })
  esitMi((kisa ?? []).length, 0, 'tek karakterlik arama bos doner')

  const { data: kendisi } = await a.rpc('kisi_ara', { p_metin: bAdi.slice(0, 4) })
  esitMi(
    ((kendisi ?? []) as { id: string }[]).some((s) => s.id === aId),
    false,
    'arama kullanicinin kendisini sonuclara koymaz'
  )
})

await senaryo('16 - Aramada gorunme kapatilinca cikmaz', async () => {
  const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
  const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi

  await b.from('profiller').update({ aramada_gorunsun: false }).eq('id', bId)
  const { data: kapali } = await a.rpc('kisi_ara', { p_metin: bAdi.slice(0, 4) })
  esitMi(
    ((kapali ?? []) as { id: string }[]).some((s) => s.id === bId),
    false,
    'aramada_gorunsun = false olan kullanici cikmaz'
  )

  await b.from('profiller').update({ aramada_gorunsun: true }).eq('id', bId)
  const { data: acik } = await a.rpc('kisi_ara', { p_metin: bAdi.slice(0, 4) })
  esitMi(
    ((acik ?? []) as { id: string }[]).some((s) => s.id === bId),
    true,
    'tercih geri acilinca yeniden gorunur (pozitif kontrol)'
  )
})

await senaryo('17 - Engelleme aramayi iki yonde de keser', async () => {
  const { data: bProfil } = await b.from('profiller').select('kullanici_adi').single()
  const bAdi = (bProfil as { kullanici_adi: string }).kullanici_adi
  const { data: aProfil } = await a.from('profiller').select('kullanici_adi').single()
  const aAdi = (aProfil as { kullanici_adi: string }).kullanici_adi

  await a.rpc('engelle', { p_kullanici_id: bId })
  t.engellemeler.push({ istemci: a, engellenenId: bId })

  const { data: aninGorusu } = await a.rpc('kisi_ara', { p_metin: bAdi.slice(0, 4) })
  esitMi(
    ((aninGorusu ?? []) as { id: string }[]).some((s) => s.id === bId),
    false,
    'engelleyen, engelledigini aramada goremez'
  )

  const { data: bninGorusu } = await b.rpc('kisi_ara', { p_metin: aAdi.slice(0, 4) })
  esitMi(
    ((bninGorusu ?? []) as { id: string }[]).some((s) => s.id === aId),
    false,
    'engellenen de engelleyeni aramada goremez (cift taraflilik)'
  )
})

await senaryo('18 - Kimliksiz cagrilar reddedilir', async () => {
  // Giris yapmamis, ham anon istemci. RPC'lerde hem auth.uid() null
  // kontrolu hem de "revoke execute from anon" var; ikisinden biri
  // bile calissa cagri hata donmeli.
  const anonim = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { error: musaitHatasi } = await anonim.rpc('kullanici_adi_musait_mi', {
    p_ad: 'herhangibiri',
  })
  esitMi(musaitHatasi !== null, true, 'kimliksiz musait_mi cagrisi reddedilir')

  const { error: aramaHatasi } = await anonim.rpc('kisi_ara', { p_metin: 'ab' })
  esitMi(aramaHatasi !== null, true, 'kimliksiz kisi_ara cagrisi reddedilir')
})
```

Bu senaryo icin dosyanin basindaki import satirina `createClient`
eklenmeli:

```ts
import { createClient } from '@supabase/supabase-js'
```

Not: `senaryo 14` icinde `aramada_gorunsun` degeri `true` olarak
birakiliyor, `senaryo 16` da kendi degisikligini geri aliyor — boylece
betik durumu kendinden sonrakine bozuk birakmiyor. Engelleme
`t.engellemeler` uzerinden mevcut `temizle()` tarafindan kaldiriliyor.

- [ ] **Step 2: Calistir**

```bash
cd mobil
npm run test:gorunurluk
```

Expected: butun senaryolar `OK`, son satir
`Butun gorunurluk dogrulamalari gecti.`

Basarisiz olan olursa: sorun testte degil, once uygulamada aranir.
Hangi RPC'nin hangi kosulda beklenenden farkli davrandigi yazdirilir.

- [ ] **Step 3: README'yi guncelle**

`mobil/gorunurluk-testleri/README.md` icine yeni senaryo basliklarini
ve 30 gun kuralinin neden dolayli olarak test edildigini (yukaridaki
tekrarlanabilirlik notu) ekle.

- [ ] **Step 4: Commit**

```bash
git add mobil/gorunurluk-testleri
git commit -m "mobil: kimlik ve arama icin gercek veritabani senaryolari"
```

---

### Task 16: Butun paketi calistir, elle dogrula, hafizayi guncelle

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/konusma-gunlugu.md`

- [ ] **Step 1: Butun otomatik testleri calistir**

```bash
cd mobil
npm test
npm run test:gorunurluk
```

Expected: Jest tarafinda butun paketler yesil (yeni testlerle birlikte
yaklasik 35 paket), gorunurluk paketinde butun senaryolar `OK`.

- [ ] **Step 2: Uygulamanin gercekten acildigini dogrula**

```bash
cd mobil
npx expo start --web --clear
```

Sonra baska bir kabuktan:

```bash
curl -s http://localhost:8081 -o /dev/null -w "%{http_code}\n"
```

Expected: `200`, ve sunucu logunda `Web Bundled ... (N modules)` satiri
var, `ERROR` satiri **yok**. `expect is not defined` gibi bir hata
gorursen `src/app` altina test dosyasi sizmistir; `npx jest
__tests__/rota-agaci.test.ts` bunu soyler.

- [ ] **Step 3: Iki hesapla elle gez**

Iki tarayici penceresi (biri normal, biri gizli):

1. A ile giris (`05550000000` / `test1234`), B ile giris
   (`05550000001` / `test1234`).
2. A'da "Kisi ara" → B'nin kullanici adinin ilk harflerini yaz → B
   listede cikmali.
3. B'nin adina bas → profilinde isim soyisim ve `@kullaniciadi`
   gorunmeli.
4. B'de ayarlar → "Beni aramada goster" anahtarini kapat.
5. A'da ayni aramayi tekrarla → B artik cikmamali.
6. B'de anahtari geri ac, A'da tekrar ara → B yine cikmali.
7. B'de ayarlardan kullanici adini degistir → yeni adla aramada
   bulunabilmeli; ikinci kez degistirmeye kalkinca 30 gun mesaji
   gelmeli.
8. A, B'yi engellesin → A da B de artik birbirini aramada bulamamali.

Bu adim atlanirsa raporda **acikca** yaz. Faz 2a'da tam bu adim
atlandigi icin canli veritabaninda hic calismayan bir ekran
uretilmisti.

- [ ] **Step 4: Proje hafizasini guncelle**

`CLAUDE.md` icinde "Proje durumu" bolumune Faz 2c'nin bittigini, hangi
islevlerin calistigini ve elle dogrulanmayan bir sey kaldiysa onu yaz.
`docs/konusma-gunlugu.md` icindeki karar defterine yeni bir karar
eklendiyse (uygulama sirasinda cikan) numarayi 35'ten devam ettir.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/konusma-gunlugu.md
git commit -m "docs: Faz 2c tamamlandi, proje hafizasi guncellendi"
```

---

## Ozet

| # | Gorev | Cikti |
|---|---|---|
| 1 | Uc sutun | `kullanici_adi`, `kullanici_adi_degistirildi`, `aramada_gorunsun` |
| 2 | Sutun yetkileri | Kullanici adi dogrudan yazilamaz |
| 3 | `kullanici_adi_musait_mi` | Canli musaitlik kontrolu |
| 4 | `kullanici_adi_degistir` | 30 gun kurali sunucuda |
| 5 | `kisi_ara` | Engelleme ve tercih filtreli arama |
| 6 | `baskasinin_profili` | Kullanici adini da doner |
| 7 | `lib/kullanici-adi.ts` | Bicim kurallari |
| 8 | Ayni dosya | RPC sarmalayicilari |
| 9 | `lib/kisi-ara.ts` | Arama cagrisi |
| 10 | `profil-olustur` | Kayitta kullanici adi |
| 11 | `profil/ayarlar` | Degistirme + aramada gorunurluk |
| 12 | `kisiler` | Arama ekrani |
| 13 | `index` | Aramaya giris |
| 14 | `kullanici/[id]` | Profilde `@kullaniciadi` |
| 15 | `gorunurluk-testleri` | Sekiz yeni gercek veritabani senaryosu |
| 16 | Kapanis | Tam kosum, elle gezinti, hafiza |
