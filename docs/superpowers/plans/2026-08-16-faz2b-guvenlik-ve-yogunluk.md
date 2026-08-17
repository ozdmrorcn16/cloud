# Faz 2b — Guvenlik ve Yogunluk Uygulama Plani

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanici kendini gizleyebiliyor, anilarinin kimlere gorunecegini
seciyor, rahatsiz eden kisiyi engelleyip sikayet edebiliyor; ve cevresindeki
mekanlarin ne kadar yogun oldugunu — kimlerin orada oldugunu gormeden —
gorebiliyor.

**Architecture:** Faz 2a'nin Expo + Supabase/PostGIS mimarisi uzerine. Yeni
gorunurluk kurallari (engelleme, ani gorunurlugu) `check_inler`'in mevcut
SELECT RLS politikasina eklenir — istemci hicbir filtreleme yapmaz. Tek
istisna `gizli_mi`: baglama bagli oldugu icin (yogunluk disi kesif
yuzeylerinde gizli, mekan ekraninda gorunur) ilgili sorgunun `where`
kosulunda uygulanir. Baskasinin profili, `profiller`'in RLS'ine hic
dokunmadan, yalnizca herkese acik alanlari donduren bir `security definer`
RPC uzerinden okunur.

**Tech Stack:** Faz 2a'daki yigin. Yeni olarak: gercek veritabanina karsi
calisan gorunurluk testleri icin ayri bir test kosumu (`npm run
test:gorunurluk`), Jest degil duz Node betigi — iki ayri kimlikle es zamanli
Supabase istemcisi gerektirdigi icin.

**Spec:** `docs/superpowers/specs/2026-08-16-faz2b-guvenlik-ve-yogunluk-design.md`

## Global Constraints

- Node.js 18+, TypeScript strict mode, npm — Faz 1/2a'daki gibi.
- UI dili: Turkce.
- Ucretsiz yaricap: **1-5 km** (ust spec'teki 1-10 km bu fazda degisti).
- Mekan yogunlugu sayisi **yuvarlanmaz**, oldugu gibi gosterilir.
- Gizli check-in yapanlar yogunluk sayisina **dahildir**.
- Engellenenler yogunluk sayisindan **dusmez** (kisiye gore degisen sayi
  engellenme bilgisini sizdirir).
- Engelleme **cift tarafli ve sessiz**: A→B kaydi varsa ikisi de digerini
  gormez, B engellendigini anlamaz.
- Engelleme **gecmis anilari da kapsar** — canli/ani ayrimi yok.
- `profiller`'in RLS politikasi **degistirilmeyecek**. Baskasinin profili
  yalnizca RPC uzerinden, yalnizca (id, ad, biyografi, fotograflar)
  alanlariyla okunur. `dogum_tarihi` hicbir kosulda baskasina acilmaz.
- Butun yeni `security definer` RPC'ler `auth.uid() is null` kontrolu ile
  baslar ve sonunda `revoke execute ... from public, anon; grant execute
  ... to authenticated;` icerir (Faz 2a'da guvenlik taramasiyla bulunan
  acigin tekrarini onlemek icin).
- Supabase projesi: `konum-sosyal` (ref `swpiibyuoffykbmirvgq`), zaten
  linkli — `supabase link` gerekmiyor.
- Migrasyon dogrulamasi icin `supabase db query "<sql>" --linked` kullanilir
  (Dashboard erisimi gerekmez).

---

### Task 1: `engellemeler` tablosu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_engellemeler.sql`

**Interfaces:**
- Produces: `public.engellemeler` — Task 4 (RLS), Task 5 (RPC), Task 7
  (profil RPC) bu tabloyu okur.

- [ ] **Step 1: Migrasyonu olustur**

```bash
cd ~/projects/cloud/mobil
supabase migration new engellemeler
```

- [ ] **Step 2: Semayi yaz**

```sql
create table public.engellemeler (
  engelleyen_id uuid not null references auth.users(id) on delete cascade,
  engellenen_id uuid not null references auth.users(id) on delete cascade,
  olusturuldu timestamptz not null default now(),
  primary key (engelleyen_id, engellenen_id),
  constraint kendini_engelleyemez check (engelleyen_id <> engellenen_id)
);

create index engellemeler_engellenen_idx on public.engellemeler (engellenen_id);

alter table public.engellemeler enable row level security;

create policy "kendi engellemelerini okuyabilir"
  on public.engellemeler for select
  to authenticated
  using (engelleyen_id = auth.uid());
```

Not: yalnizca `select` politikasi var. Ekleme/silme Task 5'teki RPC'ler
uzerinden yapilacak. `engellenen_id` uzerindeki indeks, Task 4'teki RLS
politikasinin ters yonlu aramasi icin.

Politika bilerek yalnizca `engelleyen_id = auth.uid()` diyor: kullanici
kendi engelledigi kisileri gorebilir, ama **kimin kendisini engelledigini
goremez** — sessizlik ilkesi.

- [ ] **Step 3: Uygula**

```bash
supabase db push
```

- [ ] **Step 4: Dogrula**

```bash
supabase db query "select tablename, rowsecurity from pg_tables where tablename = 'engellemeler';" --linked
```

Expected: bir satir, `rowsecurity = true`.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: engellemeler tablosu"
```

---

### Task 2: `sikayetler` tablosu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_sikayetler.sql`

**Interfaces:**
- Produces: `public.sikayetler` — Task 6'daki `sikayet_gonder` RPC buraya
  yazar.

- [ ] **Step 1: Migrasyonu olustur**

```bash
cd ~/projects/cloud/mobil
supabase migration new sikayetler
```

- [ ] **Step 2: Semayi yaz**

```sql
create table public.sikayetler (
  id uuid primary key default gen_random_uuid(),
  sikayet_eden_id uuid not null references auth.users(id) on delete cascade,
  hedef_tur text not null check (hedef_tur in ('kullanici', 'check_in')),
  hedef_id uuid not null,
  sebep text not null,
  aciklama text,
  durum text not null default 'yeni'
    check (durum in ('yeni', 'incelendi', 'islem_yapildi', 'reddedildi')),
  olusturuldu timestamptz not null default now()
);

create index sikayetler_hedef_idx on public.sikayetler (hedef_tur, hedef_id);
create index sikayetler_durum_idx on public.sikayetler (durum);

alter table public.sikayetler enable row level security;

create policy "kendi sikayetlerini okuyabilir"
  on public.sikayetler for select
  to authenticated
  using (sikayet_eden_id = auth.uid());
```

Not: `hedef_id` bilerek yabanci anahtar **degil** — hedef ya `auth.users`
ya `check_inler` olabiliyor, ve sikayet edilen icerik silinse bile sikayet
kaydi durmali (moderasyon gecmisi). Yazma Task 6'daki RPC uzerinden.

- [ ] **Step 3: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select tablename, rowsecurity from pg_tables where tablename = 'sikayetler';" --linked
```

Expected: `rowsecurity = true`.

- [ ] **Step 4: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: sikayetler tablosu"
```

---

### Task 3: `gizli_mi` ve `varsayilan_gizli` sutunlari

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_gizlilik_sutunlari.sql`

**Interfaces:**
- Produces: `check_inler.gizli_mi`, `profiller.varsayilan_gizli` — Task 8
  (yogunluk), Task 9 (check_in_yap), Task 12/13 (ekranlar) kullanir.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new gizlilik_sutunlari
```

```sql
alter table public.check_inler
  add column gizli_mi boolean not null default false;

alter table public.profiller
  add column varsayilan_gizli boolean not null default false;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select column_name from information_schema.columns where table_name = 'check_inler' and column_name = 'gizli_mi';" --linked
supabase db query "select column_name from information_schema.columns where table_name = 'profiller' and column_name = 'varsayilan_gizli';" --linked
```

Expected: her ikisi de birer satir donmeli.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: gizli_mi ve varsayilan_gizli sutunlari"
```

---

### Task 4: `check_inler` SELECT politikasina engelleme ve ani gorunurlugu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_gorunurluk_politikasi.sql`

**Interfaces:**
- Consumes: `public.engellemeler` (Task 1), `check_inler.gorunurluk` (2a).
- Produces: guncellenmis `"check-in gorunurlugu"` politikasi — bundan sonra
  hicbir istemci sorgusu engellenmis veya `gorunurluk='kimse'` satiri
  goremez.

**Not:** Bu, bu fazin en kritik migrasyonu. Mevcut politika (2a,
`20260815001911_check_inler.sql`) uc kosulu OR'luyor: kendi satirin /
`konum is null` (ani) / ayni mekanda karsilikli canli. Yeni politika bu
uclusunu **korur** ama basina iki AND-kosulu ekler.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new gorunurluk_politikasi
```

```sql
drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    -- 1) Engelleme: iki yonden herhangi biri varsa hicbir sey gorunmez.
    not exists (
      select 1 from public.engellemeler e
      where (e.engelleyen_id = auth.uid() and e.engellenen_id = check_inler.kullanici_id)
         or (e.engelleyen_id = check_inler.kullanici_id and e.engellenen_id = auth.uid())
    )
    and
    -- 2) Ani gorunurlugu: 'kimse' ise yalnizca sahibi gorur.
    (
      kullanici_id = auth.uid()
      or konum is not null
      or gorunurluk <> 'kimse'
    )
    and
    -- 3) Faz 2a'nin uc kosulu (degismedi).
    (
      kullanici_id = auth.uid()
      or konum is null
      or exists (
        select 1 from public.check_inler benim
        where benim.kullanici_id = auth.uid()
          and benim.mekan_id = check_inler.mekan_id
          and benim.konum is not null
          and benim.bitis_zamani > now()
      )
    )
  );
```

Kosul 2'nin okunusu: kendi satirinsa gorursun; **canli** bir check-in ise
(`konum is not null`) `gorunurluk` henuz devrede degil, cunku o alan ani
fazini yonetiyor; aksi halde `gorunurluk` `'kimse'` olmamali.

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select polname from pg_policies where tablename = 'check_inler';" --linked
```

Expected: `check-in gorunurlugu` ve `kendi anisini silebilir` listelenir.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: check-in gorunurluk politikasina engelleme ve ani gizliligi eklendi"
```

---

### Task 5: Engelleme RPC'leri ve istemci fonksiyonlari

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_engelleme_rpc.sql`
- Create: `mobil/lib/engelleme.ts`
- Test: `mobil/lib/engelleme.test.ts`

**Interfaces:**
- Consumes: `public.engellemeler` (Task 1).
- Produces: `engelle(kullaniciId: string): Promise<void>`,
  `engeliKaldir(kullaniciId: string): Promise<void>`,
  `engellediklerimiGetir(): Promise<string[]>` — Task 15 (baskasinin
  profili) ve Task 12 (ayarlar) kullanir.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new engelleme_rpc
```

```sql
create or replace function public.engelle(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kullanici_id = auth.uid() then
    raise exception 'Kendini engelleyemezsin';
  end if;

  insert into public.engellemeler (engelleyen_id, engellenen_id)
  values (auth.uid(), p_kullanici_id)
  on conflict do nothing;
end;
$$;

create or replace function public.engeli_kaldir(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.engellemeler
  where engelleyen_id = auth.uid() and engellenen_id = p_kullanici_id;
end;
$$;

revoke execute on function public.engelle from public, anon;
grant execute on function public.engelle to authenticated;
revoke execute on function public.engeli_kaldir from public, anon;
grant execute on function public.engeli_kaldir to authenticated;
```

`on conflict do nothing`: zaten engellenmis kisiyi tekrar engellemek sessizce
basarili sayilir (spec'teki hata durumu).

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select proname from pg_proc where proname in ('engelle', 'engeli_kaldir');" --linked
```

Expected: iki satir.

- [ ] **Step 3: Basarisiz testi yaz**

`mobil/lib/engelleme.test.ts`:

```ts
import { engelle, engeliKaldir, engellediklerimiGetir } from './engelleme'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('engelle', () => {
  it('kullanici id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await engelle('kullanici-2')
    expect(supabase.rpc).toHaveBeenCalledWith('engelle', { p_kullanici_id: 'kullanici-2' })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kendini engelleyemezsin' },
    })
    await expect(engelle('kendim')).rejects.toThrow('Kendini engelleyemezsin')
  })
})

describe('engeliKaldir', () => {
  it('kullanici id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await engeliKaldir('kullanici-2')
    expect(supabase.rpc).toHaveBeenCalledWith('engeli_kaldir', { p_kullanici_id: 'kullanici-2' })
  })
})

describe('engellediklerimiGetir', () => {
  it('engellenen kullanici id lerini doner', async () => {
    const select = jest.fn().mockResolvedValue({
      data: [{ engellenen_id: 'kullanici-2' }, { engellenen_id: 'kullanici-3' }],
      error: null,
    })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    const sonuc = await engellediklerimiGetir()

    expect(supabase.from).toHaveBeenCalledWith('engellemeler')
    expect(sonuc).toEqual(['kullanici-2', 'kullanici-3'])
  })
})
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- engelleme.test.ts`
Expected: FAIL — `./engelleme` module bulunamiyor.

- [ ] **Step 5: Modulu yaz**

`mobil/lib/engelleme.ts`:

```ts
import { supabase } from './supabase'

export async function engelle(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engelle', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(error.message)
}

export async function engeliKaldir(kullaniciId: string): Promise<void> {
  const { error } = await supabase.rpc('engeli_kaldir', { p_kullanici_id: kullaniciId })
  if (error) throw new Error(error.message)
}

export async function engellediklerimiGetir(): Promise<string[]> {
  const { data, error } = await supabase.from('engellemeler').select('engellenen_id')
  if (error) throw new Error(error.message)
  return (data as { engellenen_id: string }[]).map((satir) => satir.engellenen_id)
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- engelleme.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/engelleme.ts mobil/lib/engelleme.test.ts
git commit -m "mobil: engelleme RPC'leri ve istemci fonksiyonlari"
```

---

### Task 6: Sikayet RPC'si ve istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_sikayet_rpc.sql`
- Create: `mobil/lib/sikayet.ts`
- Test: `mobil/lib/sikayet.test.ts`

**Interfaces:**
- Consumes: `public.sikayetler` (Task 2).
- Produces: `sikayetGonder(hedefTur: 'kullanici' | 'check_in', hedefId:
  string, sebep: string, aciklama?: string): Promise<void>` — Task 16
  (sikayet ekrani) kullanir.
- Produces: `SIKAYET_SEBEPLERI` sabiti — Task 16'daki sebep secici bunu
  listeler.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new sikayet_rpc
```

```sql
create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur not in ('kullanici', 'check_in') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select proname from pg_proc where proname = 'sikayet_gonder';" --linked
```

- [ ] **Step 3: Basarisiz testi yaz**

`mobil/lib/sikayet.test.ts`:

```ts
import { sikayetGonder, SIKAYET_SEBEPLERI } from './sikayet'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('sikayetGonder', () => {
  it('hedef ve sebebi rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    await sikayetGonder('kullanici', 'kullanici-2', 'taciz', 'surekli mesaj atiyor')

    expect(supabase.rpc).toHaveBeenCalledWith('sikayet_gonder', {
      p_hedef_tur: 'kullanici',
      p_hedef_id: 'kullanici-2',
      p_sebep: 'taciz',
      p_aciklama: 'surekli mesaj atiyor',
    })
  })

  it('aciklama verilmezse null gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })

    await sikayetGonder('check_in', 'checkin-1', 'uygunsuz_icerik')

    expect(supabase.rpc).toHaveBeenCalledWith('sikayet_gonder', {
      p_hedef_tur: 'check_in',
      p_hedef_id: 'checkin-1',
      p_sebep: 'uygunsuz_icerik',
      p_aciklama: null,
    })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kendini sikayet edemezsin' },
    })
    await expect(sikayetGonder('kullanici', 'kendim', 'taciz')).rejects.toThrow(
      'Kendini sikayet edemezsin'
    )
  })
})

describe('SIKAYET_SEBEPLERI', () => {
  it('her sebebin bir anahtari ve Turkce etiketi var', () => {
    expect(SIKAYET_SEBEPLERI.length).toBeGreaterThan(0)
    for (const sebep of SIKAYET_SEBEPLERI) {
      expect(typeof sebep.anahtar).toBe('string')
      expect(typeof sebep.etiket).toBe('string')
      expect(sebep.etiket.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- sikayet.test.ts`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 5: Modulu yaz**

`mobil/lib/sikayet.ts`:

```ts
import { supabase } from './supabase'

export type SikayetHedefTuru = 'kullanici' | 'check_in'

export const SIKAYET_SEBEPLERI = [
  { anahtar: 'taciz', etiket: 'Taciz veya rahatsiz etme' },
  { anahtar: 'uygunsuz_icerik', etiket: 'Uygunsuz icerik' },
  { anahtar: 'sahte_hesap', etiket: 'Sahte hesap' },
  { anahtar: 'spam', etiket: 'Spam veya reklam' },
  { anahtar: 'diger', etiket: 'Diger' },
] as const

export async function sikayetGonder(
  hedefTur: SikayetHedefTuru,
  hedefId: string,
  sebep: string,
  aciklama?: string
): Promise<void> {
  const { error } = await supabase.rpc('sikayet_gonder', {
    p_hedef_tur: hedefTur,
    p_hedef_id: hedefId,
    p_sebep: sebep,
    p_aciklama: aciklama ?? null,
  })
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- sikayet.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/sikayet.ts mobil/lib/sikayet.test.ts
git commit -m "mobil: sikayet RPC'si ve istemci fonksiyonu"
```

---

### Task 7: `baskasinin_profili` RPC'si ve istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_baskasinin_profili_rpc.sql`
- Create: `mobil/lib/profil.ts`
- Test: `mobil/lib/profil.test.ts`

**Interfaces:**
- Consumes: `public.profiller` (Faz 1), `public.engellemeler` (Task 1).
- Produces: `baskasininProfiliniGetir(kullaniciId: string):
  Promise<BaskaProfil | null>` ve `BaskaProfil` tipi — Task 15 kullanir.
  `null` doner: kullanici yok **veya** engelleme var (ikisi ayirt
  edilemez — sessizlik ilkesi).

**Not — bu tasarimin gerekcesi:** `profiller`'in RLS politikasi
(`using (auth.uid() = id)`) bilerek **degistirilmiyor**. Postgres RLS satir
duzeyindedir, sutun duzeyinde degil; `ad`'i baskalarina acan her politika
`dogum_tarihi`'ni de acardi. Bunun yerine yalnizca herkese acik alanlari
donduren bir `security definer` RPC yaziliyor.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new baskasinin_profili_rpc
```

```sql
create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (id uuid, ad text, biyografi text, fotograflar text[])
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

  return query
    select p.id, p.ad, p.biyografi, p.fotograflar
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
```

`dogum_tarihi` donen sutunlar arasinda **yok** ve olmayacak.

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select proname from pg_proc where proname = 'baskasinin_profili';" --linked
```

- [ ] **Step 3: Basarisiz testi yaz**

`mobil/lib/profil.test.ts`:

```ts
import { baskasininProfiliniGetir } from './profil'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('baskasininProfiliniGetir', () => {
  it('profil bulunursa alanlarini doner', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ id: 'kullanici-2', ad: 'Ada', biyografi: 'merhaba', fotograflar: ['a.jpg'] }],
      error: null,
    })

    const sonuc = await baskasininProfiliniGetir('kullanici-2')

    expect(supabase.rpc).toHaveBeenCalledWith('baskasinin_profili', {
      p_kullanici_id: 'kullanici-2',
    })
    expect(sonuc).toEqual({
      id: 'kullanici-2',
      ad: 'Ada',
      biyografi: 'merhaba',
      fotograflar: ['a.jpg'],
    })
  })

  it('bos sonuc gelirse null doner (yok ya da engellenmis)', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null })
    expect(await baskasininProfiliniGetir('kullanici-3')).toBeNull()
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Kimlik dogrulamasi gerekli' },
    })
    await expect(baskasininProfiliniGetir('kullanici-2')).rejects.toThrow(
      'Kimlik dogrulamasi gerekli'
    )
  })
})
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- profil.test.ts`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 5: Modulu yaz**

`mobil/lib/profil.ts`:

```ts
import { supabase } from './supabase'

export type BaskaProfil = {
  id: string
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

  const satirlar = data as BaskaProfil[]
  return satirlar.length > 0 ? satirlar[0] : null
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- profil.test.ts`
Expected: PASS, 3 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/profil.ts mobil/lib/profil.test.ts
git commit -m "mobil: baskasinin profili RPC'si (dogum tarihi acilmadan)"
```

---

### Task 8: Mekan yogunlugu RPC'si ve istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mekan_yogunlugu_rpc.sql`
- Modify: `mobil/lib/mekan.ts`
- Modify: `mobil/lib/mekan.test.ts`

**Interfaces:**
- Consumes: `public.check_inler`, `public.mekanlar`.
- Produces: `yakinMekanlariYogunlukIleGetir(lat, lng, arama?):
  Promise<MekanYogunlukIle[]>` ve `MekanYogunlukIle = Mekan & { kisiSayisi:
  number }` — Task 14 (mekan arama ekrani) kullanir.

**Not:** Bu RPC `security definer` — cunku yogunluk sayisi **herkes icin
ayni** olmali. RLS uzerinden sayarsak engellenen kisiler sayidan duser ve
sayiyi karsilastiran biri engellenme bilgisini cikarabilir (spec'teki
sessizlik ilkesi). Sayi kimlik acmadigi icin bu guvenli.

Ayrica gizli check-in yapanlar **sayiya dahildir** — gizlenen kimliktir,
varlik degil.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new mekan_yogunlugu_rpc
```

```sql
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre int default 5000,
  p_arama text default null
) returns table (
  id uuid,
  ad text,
  tur text,
  konum geography,
  adres text,
  osm_id bigint,
  ekleyen_kullanici uuid,
  olusturuldu timestamptz,
  kisi_sayisi int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select m.id, m.ad, m.tur, m.konum, m.adres, m.osm_id,
           m.ekleyen_kullanici, m.olusturuldu,
           (
             select count(*)::int
             from public.check_inler c
             where c.mekan_id = m.id
               and c.konum is not null
               and c.bitis_zamani > now()
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;
```

Alt sorguda `gizli_mi` filtresi **bilerek yok** — gizli check-in'ler sayiya
dahil.

- [ ] **Step 2: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select proname from pg_proc where proname = 'yakin_mekanlar_yogunluk';" --linked
```

- [ ] **Step 3: Basarisiz testi yaz**

`mobil/lib/mekan.test.ts` dosyasinin sonuna ekle:

```ts
describe('yakinMekanlariYogunlukIleGetir', () => {
  it('yaricapi ve aramayi rpc parametresi olarak gonderir, kisi sayisini cozer', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'mekan-1',
          ad: 'Sahil Kafe',
          tur: 'kafe',
          adres: null,
          osm_id: 123,
          konum: 'POINT(28.979 41.015)',
          kisi_sayisi: 8,
        },
      ],
      error: null,
    })

    const sonuc = await yakinMekanlariYogunlukIleGetir(41.015, 28.979, 5000, 'kafe')

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar_yogunluk', {
      p_lat: 41.015,
      p_lng: 28.979,
      p_yaricap_metre: 5000,
      p_arama: 'kafe',
    })
    expect(sonuc[0].kisiSayisi).toBe(8)
    expect(sonuc[0].konum).toEqual({ lat: 41.015, lng: 28.979 })
  })

  it('hata donerse firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'sunucu hatasi' },
    })
    await expect(yakinMekanlariYogunlukIleGetir(41.015, 28.979, 5000)).rejects.toThrow(
      'sunucu hatasi'
    )
  })
})
```

Import satirini guncelle — mevcut import'a `yakinMekanlariYogunlukIleGetir`
adini ekle (dosyanin basindaki gercek import satirini okuyup uzerine ekle,
silme).

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: FAIL — `yakinMekanlariYogunlukIleGetir` export edilmiyor.

- [ ] **Step 5: Istemci fonksiyonunu ekle**

`mobil/lib/mekan.ts` dosyasinin sonuna:

```ts
export type MekanYogunlukIle = Mekan & { kisiSayisi: number }

type MekanYogunlukSatiri = MekanSatiri & { kisi_sayisi: number }

export async function yakinMekanlariYogunlukIleGetir(
  lat: number,
  lng: number,
  yaricapMetre: number,
  arama?: string
): Promise<MekanYogunlukIle[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar_yogunluk', {
    p_lat: lat,
    p_lng: lng,
    p_yaricap_metre: yaricapMetre,
    p_arama: arama ?? null,
  })
  if (error) throw new Error(error.message)
  return (data as MekanYogunlukSatiri[]).map((satir) => ({
    ...satiriMekanaCevir(satir),
    kisiSayisi: satir.kisi_sayisi,
  }))
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: PASS (mevcut 4 test + 2 yeni).

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/mekan.ts mobil/lib/mekan.test.ts
git commit -m "mobil: mekan yogunlugu RPC'si ve istemci fonksiyonu"
```

---

### Task 9: `check_in_yap` RPC'sine `gizli_mi` parametresi

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_check_in_yap_gizli.sql`
- Modify: `mobil/lib/checkin.ts`
- Modify: `mobil/lib/checkin.test.ts`

**Interfaces:**
- Consumes: `check_inler.gizli_mi` (Task 3).
- Produces: `checkInYap(..., gizliMi?: boolean)` — Task 13 (check-in
  ekrani) kullanir. `CheckIn` tipine `gizliMi: boolean` eklenir.

**Not:** `check_in_yap`'in mevcut govdesi
`20260815140000_check_in_yap_kullanici_adi.sql` icinde. Yeni migrasyon
`create or replace` ile **tum govdeyi yeniden uretmeli** — once mevcut
dosyayi oku, oradaki govdeyi birebir kopyala, yalnizca yeni parametreyi ve
insert'e yeni sutunu ekle. Ezberden yeniden yazma.

- [ ] **Step 1: Mevcut fonksiyonu oku**

```bash
cat mobil/supabase/migrations/20260815140000_check_in_yap_kullanici_adi.sql
```

- [ ] **Step 2: Migrasyonu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new check_in_yap_gizli
```

Mevcut govdeyi birebir koruyarak, imzaya `p_gizli_mi boolean default false`
ekle ve `insert` ifadesine `gizli_mi` sutunu ile `p_gizli_mi` degerini
ekle. Sonuna yine `revoke`/`grant` satirlarini koy.

- [ ] **Step 3: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select pg_get_function_identity_arguments(oid) from pg_proc where proname = 'check_in_yap';" --linked
```

Expected: parametre listesinde `p_gizli_mi boolean` gorunmeli.

- [ ] **Step 4: Basarisiz testi yaz**

`mobil/lib/checkin.test.ts` icindeki mevcut `checkInYap` testine ek olarak:

```ts
it('gizli check-in bayragini rpc parametresi olarak gonderir', async () => {
  ;(supabase.rpc as jest.Mock).mockResolvedValue({
    data: {
      id: 'checkin-1',
      mekan_id: 'mekan-1',
      kullanici_id: 'kullanici-1',
      kullanici_adi: 'Ada',
      not_metni: null,
      fotograf: null,
      olusturma_zamani: '2026-08-16T10:00:00Z',
      bitis_zamani: '2026-08-16T14:00:00Z',
      konum: 'POINT(28.979 41.015)',
      gizli_mi: true,
    },
    error: null,
  })

  const sonuc = await checkInYap('mekan-1', { lat: 41.015, lng: 28.979 }, undefined, undefined, true)

  expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
    p_mekan_id: 'mekan-1',
    p_lat: 41.015,
    p_lng: 28.979,
    p_not_metni: null,
    p_fotograf: null,
    p_gizli_mi: true,
  })
  expect(sonuc.gizliMi).toBe(true)
})
```

Mevcut `checkInYap` testleri de artik `p_gizli_mi: false` bekleyecek —
onlari da guncelle.

- [ ] **Step 5: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: FAIL.

- [ ] **Step 6: Istemciyi guncelle**

`mobil/lib/checkin.ts`: `CheckIn` tipine `gizliMi: boolean` ekle,
`CheckInSatiri` tipine `gizli_mi: boolean` ekle,
`satiriCheckInACevir`'e `gizliMi: satir.gizli_mi` ekle, `checkInYap`'a
besinci parametre `gizliMi: boolean = false` ekleyip
`p_gizli_mi: gizliMi` olarak gonder.

- [ ] **Step 7: Testlerin gectigini dogrula**

Run: `cd mobil && npm test`
Expected: PASS, tum suite.

- [ ] **Step 8: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/checkin.ts mobil/lib/checkin.test.ts
git commit -m "mobil: check_in_yap'a gizli check-in parametresi"
```

---

### Task 10: Gercek veritabani test altyapisi

**Files:**
- Create: `mobil/gorunurluk-testleri/yardimcilar.ts`
- Create: `mobil/gorunurluk-testleri/README.md`
- Modify: `mobil/package.json` (yeni script)

**Interfaces:**
- Produces: `ikiKullaniciIleBaglan(): Promise<{ a: SupabaseClient, b:
  SupabaseClient, aId: string, bId: string }>`, `temizle(): Promise<void>`,
  `esitMi(gercek, beklenen, mesaj)` — Task 11 bunlari kullanir.

**Not — bu gorevin gerekcesi:** Faz 2a'da 66 test yesilken mekan detay
ekrani canli veritabaninda hic calismiyordu; sebebi butun testlerin
Supabase'i mock'lamasiydi. Bu fazda korunan sey dogrudan guvenlik oldugu
icin, kuralin gercekten uygulandigini mock'la kanitlayamayiz. Bu testler
Jest'te degil duz Node betiginde calisir cunku ayni anda iki farkli
kimlikle oturum acilmis iki istemci gerekiyor.

Test kullanicilari Faz 1'de tanimlanan ucretsiz test numaralari:
`+905550000000` ve `+905550000001`, ikisinin de SMS kodu `123456`.

- [ ] **Step 1: Klasoru ve yardimcilari yaz**

`mobil/gorunurluk-testleri/yardimcilar.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const TEST_A = { telefon: '+905550000000', sifre: 'test1234' }
const TEST_B = { telefon: '+905550000001', sifre: 'test1234' }

async function kullaniciIleBaglan(telefon: string, sifre: string) {
  const istemci = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let { data, error } = await istemci.auth.signInWithPassword({ phone: telefon, password: sifre })

  if (error) {
    await istemci.auth.signUp({ phone: telefon, password: sifre })
    await istemci.auth.verifyOtp({ phone: telefon, token: '123456', type: 'sms' })
    ;({ data, error } = await istemci.auth.signInWithPassword({ phone: telefon, password: sifre }))
    if (error) throw new Error(`${telefon} ile giris yapilamadi: ${error.message}`)
  }

  return { istemci, id: data.user!.id }
}

export async function ikiKullaniciIleBaglan() {
  const a = await kullaniciIleBaglan(TEST_A.telefon, TEST_A.sifre)
  const b = await kullaniciIleBaglan(TEST_B.telefon, TEST_B.sifre)
  return { a: a.istemci, b: b.istemci, aId: a.id, bId: b.id }
}

let basarisiz = 0

export function esitMi(gercek: unknown, beklenen: unknown, mesaj: string) {
  const gercekMetin = JSON.stringify(gercek)
  const beklenenMetin = JSON.stringify(beklenen)
  if (gercekMetin === beklenenMetin) {
    console.log(`  OK   ${mesaj}`)
  } else {
    basarisiz += 1
    console.error(`  HATA ${mesaj}\n       beklenen: ${beklenenMetin}\n       gercek:   ${gercekMetin}`)
  }
}

export function sonucuBildirVeCik() {
  if (basarisiz > 0) {
    console.error(`\n${basarisiz} dogrulama basarisiz.`)
    process.exit(1)
  }
  console.log('\nButun gorunurluk dogrulamalari gecti.')
  process.exit(0)
}
```

- [ ] **Step 2: README yaz**

`mobil/gorunurluk-testleri/README.md`:

```markdown
# Gorunurluk testleri

Bu testler **gercek** Supabase projesine baglanir ve RLS kurallarinin
gercekten uygulandigini dogrular. `npm test` (Jest) icindeki testler
Supabase'i mock'lar; bu yuzden bir RLS hatasini yakalayamazlar.

Faz 2a'da tam olarak bu oldu: 66 Jest testi yesilken mekan detay ekrani
canli veritabaninda hic calismiyordu.

## Calistirma

```bash
cd mobil
npm run test:gorunurluk
```

`mobil/.env` icindeki `EXPO_PUBLIC_SUPABASE_URL` ve
`EXPO_PUBLIC_SUPABASE_ANON_KEY` degerlerini kullanir.

## Test kullanicilari

Faz 1'de tanimlanan ucretsiz test numaralari: `+905550000000` ve
`+905550000001`, ikisinin de SMS kodu `123456`. Betik yoksa olusturur.

## Dikkat

Bu testler canli veritabanina yazar ve sonunda kendi verisini siler.
Uretim verisi olan bir projede calistirma.
```

- [ ] **Step 3: package.json'a script ekle**

`mobil/package.json` icindeki `scripts` bolumune ekle:

```json
"test:gorunurluk": "tsx gorunurluk-testleri/calistir.ts"
```

ve gelistirme bagimliligi kur:

```bash
cd ~/projects/cloud/mobil
npm install --save-dev tsx
```

- [ ] **Step 4: Baglantiyi dogrula**

Gecici bir `mobil/gorunurluk-testleri/calistir.ts` yaz:

```ts
import { ikiKullaniciIleBaglan } from './yardimcilar'

async function main() {
  const { aId, bId } = await ikiKullaniciIleBaglan()
  console.log('A:', aId)
  console.log('B:', bId)
}

main()
```

Run: `cd mobil && npm run test:gorunurluk`
Expected: iki farkli kullanici kimligi yazdirilir, hata yok.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/gorunurluk-testleri mobil/package.json mobil/package-lock.json
git commit -m "mobil: gercek veritabanina karsi gorunurluk testi altyapisi"
```

---

### Task 11: Gorunurluk testleri — engelleme, gizlilik, ani gorunurlugu

**Files:**
- Modify: `mobil/gorunurluk-testleri/calistir.ts` (Task 10'daki gecici
  dosyanin yerini alir)

**Interfaces:**
- Consumes: Task 10'un yardimcilari, Task 1-9'un butun migrasyonlari.

**Not:** Bu gorev, bu fazin butun guvenlik iddialarini gercek veritabanina
karsi dogrulayan yer. Basarisiz olursa onceki gorevlerden birinde gercek
bir hata var demektir — testi degil, kodu duzelt.

- [ ] **Step 1: Test betigini yaz**

`mobil/gorunurluk-testleri/calistir.ts` — asagidaki senaryolari sirayla
calistirir. Her adimda once veri kurar, sonra iki istemciyle okuyup
`esitMi` ile dogrular:

**Senaryo 1 — Ayni mekanda karsilikli canli gorunurluk (Faz 2a regresyonu).**
A ve B ayni mekana check-in yapar. A, B'yi `check_inler` sorgusunda gorur;
B de A'yi gorur.

**Senaryo 2 — Farkli mekanda canli gorunmez.**
A mekan-1'e, B mekan-2'ye check-in yapar. A, B'nin canli satirini goremez.

**Senaryo 3 — Ani herkese acik.**
A'nin check-in'i sona erer (`konum` null'lanir, `gorunurluk` varsayilan
`herkese_acik`). B, hicbir yerde check-in'i olmasa bile A'nin anisini
gorur.

**Senaryo 4 — `gorunurluk = 'kimse'` olan ani gizlenir.**
A anisinin `gorunurluk` alanini `'kimse'` yapar. B artik goremez, A hala
gorur.

**Senaryo 5 — Engelleme canli gorunurlugu keser.**
A ve B ayni mekanda canli. A, B'yi engeller. A artik B'yi goremez **ve**
B de A'yi goremez (cift taraflilik).

**Senaryo 6 — Engelleme gecmis anilari da kapsar.**
A'nin herkese acik bir anisi var, B goruyordu. A, B'yi engeller. B artik
o aniyi da goremez.

**Senaryo 7 — Engellenen kisinin profili "bulunamadi" gibi davranir.**
A, B'yi engelledikten sonra B, `baskasinin_profili(A)` cagirir; bos sonuc
doner (`null`).

**Senaryo 8 — Yogunluk sayisi engellemeden etkilenmez.**
A ve B ayni mekanda canli, A B'yi engellemis. `yakin_mekanlar_yogunluk`
her iki kullanici icin de ayni sayiyi doner.

**Senaryo 9 — Gizli check-in yogunluk sayisina dahildir.**
A gizli check-in yapar. Mekanin `kisi_sayisi` degeri A'yi da sayar.

Her senaryonun sonunda betik kendi olusturdugu check-in, engelleme ve
mekan kayitlarini siler; sonunda `sonucuBildirVeCik()` cagirir.

- [ ] **Step 2: Calistir**

Run: `cd mobil && npm run test:gorunurluk`
Expected: butun dogrulamalar `OK`, cikis kodu 0.

Herhangi biri `HATA` verirse: ilgili gorevdeki migrasyona don ve kuralı
duzelt. Testi gevsetme — bu testler bu fazin varlik sebebi.

- [ ] **Step 3: Commit**

```bash
cd ~/projects/cloud
git add mobil/gorunurluk-testleri
git commit -m "mobil: engelleme, gizlilik ve ani gorunurlugu icin gercek veritabani testleri"
```

---

### Task 12: Gorunurluk ayarlari ekrani

**Files:**
- Create: `mobil/src/app/profil/ayarlar.tsx`
- Test: `mobil/src/app/profil/ayarlar.test.tsx`
- Create: `mobil/lib/ayarlar.ts`
- Test: `mobil/lib/ayarlar.test.ts`

**Interfaces:**
- Produces: `varsayilanGizliyiGetir(): Promise<boolean>`,
  `varsayilanGizliyiAyarla(deger: boolean): Promise<void>`,
  `aniGorunurlugunuAyarla(deger: 'herkese_acik' | 'kimse'): Promise<void>`
  — sonuncusu kullanicinin **butun** mevcut anilarinin gorunurlugunu
  gunceller (tek tek degil, toplu).

- [ ] **Step 1: Lib testini yaz**

`mobil/lib/ayarlar.test.ts`:

```ts
import { varsayilanGizliyiGetir, varsayilanGizliyiAyarla, aniGorunurlugunuAyarla } from './ayarlar'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) },
    from: jest.fn(),
  },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('varsayilanGizliyiGetir', () => {
  it('profilden varsayilan_gizli degerini okur', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { varsayilan_gizli: true }, error: null })
    const eq = jest.fn().mockReturnValue({ maybeSingle })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ select })

    expect(await varsayilanGizliyiGetir()).toBe(true)
    expect(supabase.from).toHaveBeenCalledWith('profiller')
  })
})

describe('varsayilanGizliyiAyarla', () => {
  it('profili gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await varsayilanGizliyiAyarla(true)

    expect(update).toHaveBeenCalledWith({ varsayilan_gizli: true })
    expect(eq).toHaveBeenCalledWith('id', 'kullanici-1')
  })
})

describe('aniGorunurlugunuAyarla', () => {
  it('kullanicinin butun check-in satirlarini gunceller', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const update = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock).mockReturnValue({ update })

    await aniGorunurlugunuAyarla('kimse')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(update).toHaveBeenCalledWith({ gorunurluk: 'kimse' })
    expect(eq).toHaveBeenCalledWith('kullanici_id', 'kullanici-1')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- ayarlar.test.ts`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 3: Lib modulunu yaz**

`mobil/lib/ayarlar.ts`:

```ts
import { supabase } from './supabase'

async function kendiKullaniciId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('Oturum bulunamadi')
  return id
}

export async function varsayilanGizliyiGetir(): Promise<boolean> {
  const id = await kendiKullaniciId()
  const { data, error } = await supabase
    .from('profiller')
    .select('varsayilan_gizli')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.varsayilan_gizli ?? false
}

export async function varsayilanGizliyiAyarla(deger: boolean): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('profiller')
    .update({ varsayilan_gizli: deger })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function aniGorunurlugunuAyarla(
  deger: 'herkese_acik' | 'kimse'
): Promise<void> {
  const id = await kendiKullaniciId()
  const { error } = await supabase
    .from('check_inler')
    .update({ gorunurluk: deger })
    .eq('kullanici_id', id)
  if (error) throw new Error(error.message)
}
```

**Not:** `check_inler`'de `update` politikasi yok (2a'da bilerek
birakilmamisti). Bu fonksiyonun calismasi icin bir politika gerekiyor —
Step 4'te ekleniyor.

- [ ] **Step 4: `check_inler` icin kendi satirini guncelleme politikasi**

```bash
cd ~/projects/cloud/mobil
supabase migration new check_inler_update_politikasi
```

```sql
create policy "kendi check-in'ini guncelleyebilir"
  on public.check_inler for update
  to authenticated
  using (kullanici_id = auth.uid())
  with check (kullanici_id = auth.uid());
```

```bash
supabase db push
supabase db query "select polname, polcmd from pg_policies where tablename = 'check_inler';" --linked
```

Expected: uc politika (select, delete, update).

- [ ] **Step 5: Lib testlerinin gectigini dogrula**

Run: `cd mobil && npm test -- ayarlar.test.ts`
Expected: PASS, 3 test.

- [ ] **Step 6: Ekran testini yaz**

`mobil/src/app/profil/ayarlar.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import AyarlarEkrani from './ayarlar'
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
} from '../../../lib/ayarlar'

jest.mock('../../../lib/ayarlar', () => ({
  varsayilanGizliyiGetir: jest.fn(),
  varsayilanGizliyiAyarla: jest.fn(),
  aniGorunurlugunuAyarla: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(varsayilanGizliyiGetir as jest.Mock).mockResolvedValue(false)
  ;(varsayilanGizliyiAyarla as jest.Mock).mockResolvedValue(undefined)
  ;(aniGorunurlugunuAyarla as jest.Mock).mockResolvedValue(undefined)
})

describe('AyarlarEkrani', () => {
  it('varsayilan gizlilik anahtarini acinca kaydeder', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent(screen.getByLabelText('Varsayilan gizli check-in'), 'valueChange', true)
    await waitFor(() => {
      expect(varsayilanGizliyiAyarla).toHaveBeenCalledWith(true)
    })
  })

  it('anilari kimseye kapatinca kaydeder', async () => {
    await render(<AyarlarEkrani />)
    await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
    await fireEvent.press(screen.getByText('Kimse gormesin'))
    await waitFor(() => {
      expect(aniGorunurlugunuAyarla).toHaveBeenCalledWith('kimse')
    })
  })

  it('yukleme hatasi mesaj gosterir', async () => {
    ;(varsayilanGizliyiGetir as jest.Mock).mockRejectedValue(new Error('Oturum bulunamadi'))
    await render(<AyarlarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Oturum bulunamadi')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 7: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- profil/ayarlar.test.tsx`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 8: Ekrani yaz**

`mobil/src/app/profil/ayarlar.tsx` — `Switch` ile varsayilan gizlilik,
iki butonla ani gorunurlugu (`Herkes gorsun` / `Kimse gormesin`), hata
durumu icin `hata` state'i. Faz 2a ekranlarindaki `stiller` desenini
izle. `Switch` bileseni `accessibilityLabel="Varsayilan gizli check-in"`
almali (test bunu ariyor).

- [ ] **Step 9: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- profil/ayarlar.test.tsx`
Expected: PASS, 3 test.

- [ ] **Step 10: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/ayarlar.ts mobil/lib/ayarlar.test.ts mobil/src/app/profil/ayarlar.tsx mobil/src/app/profil/ayarlar.test.tsx
git commit -m "mobil: gorunurluk ayarlari ekrani"
```

---

### Task 13: Check-in ekranina gizlilik anahtari ve ilk kullanim uyarisi

**Files:**
- Modify: `mobil/src/app/check-in/[mekanId].tsx`
- Modify: `mobil/src/app/check-in/[mekanId].test.tsx`

**Interfaces:**
- Consumes: `checkInYap(..., gizliMi)` (Task 9),
  `varsayilanGizliyiGetir()` (Task 12).

- [ ] **Step 1: Testleri yaz**

Mevcut test dosyasina ekle (mevcut testleri silme):

```tsx
it('varsayilan gizli tercihi acikken gizli check-in yapar', async () => {
  ;(varsayilanGizliyiGetir as jest.Mock).mockResolvedValue(true)
  ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

  await render(<CheckInEkrani />)
  await waitFor(() => expect(varsayilanGizliyiGetir).toHaveBeenCalled())
  await fireEvent.press(screen.getByText('Check-in yap'))

  await waitFor(() => {
    expect(checkInYap).toHaveBeenCalledWith(
      'mekan-1', { lat: 41.015, lng: 28.979 }, undefined, undefined, true
    )
  })
})

it('ilk check-in uyarisini gosterir ve oradan gizliye cevrilebilir', async () => {
  ;(varsayilanGizliyiGetir as jest.Mock).mockResolvedValue(false)
  ;(checkInYap as jest.Mock).mockResolvedValue({ id: 'checkin-1' })

  await render(<CheckInEkrani />)
  await waitFor(() => {
    expect(screen.getByText('Bu check-in ne paylasiyor?')).toBeTruthy()
  })
  await fireEvent.press(screen.getByText('Gizli yap'))
  await fireEvent.press(screen.getByText('Check-in yap'))

  await waitFor(() => {
    expect(checkInYap).toHaveBeenCalledWith(
      'mekan-1', { lat: 41.015, lng: 28.979 }, undefined, undefined, true
    )
  })
})
```

Mock listesine `varsayilanGizliyiGetir` ekle; mevcut testlerde
`checkInYap` cagrisi artik besinci parametreyle (`false`) bekleniyor,
onlari da guncelle.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- "check-in/\[mekanId\].test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Ekrani guncelle**

- Acilista `varsayilanGizliyiGetir()` cagrilir, sonucu `gizliMi` state'ine
  yazilir.
- `Switch` ile "Gizli check-in" anahtari; `gizliMi`'yi degistirir.
- `checkInYap(..., gizliMi)` olarak cagirilir.
- **Ilk kullanim uyarisi:** `AsyncStorage`'da `ilk-checkin-uyarisi-gosterildi`
  anahtari yoksa, ekran acilir acilmaz tam ekran bir uyari gosterilir.
  Basligi `Bu check-in ne paylasiyor?`, icinde ne paylasildigi acik
  cumlelerle yazili, iki buton: `Anladim` ve `Gizli yap`. `Gizli yap`
  basilirsa `gizliMi` true olur. Her iki durumda da anahtar
  `AsyncStorage`'a yazilir, uyari bir daha gosterilmez.

`AsyncStorage` zaten Faz 1'de bagimlilik olarak var
(`@react-native-async-storage/async-storage`).

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npm test`
Expected: PASS, tum suite.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/check-in
git commit -m "mobil: check-in ekraninda gizlilik anahtari ve ilk kullanim uyarisi"
```

---

### Task 14: Mekan arama ekraninda yogunluk sayisi

**Files:**
- Modify: `mobil/src/app/mekanlar/index.tsx`
- Modify: `mobil/src/app/mekanlar/index.test.tsx`

**Interfaces:**
- Consumes: `yakinMekanlariYogunlukIleGetir` (Task 8).

- [ ] **Step 1: Testleri yaz**

Mevcut testleri `yakinMekanlariYogunlukIleGetir` mock'una cevir ve ekle:

```tsx
it('her mekanin yanindaki kisi sayisini gosterir', async () => {
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([
    { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1,
      konum: { lat: 41.015, lng: 28.979 }, kisiSayisi: 8 },
  ])

  await render(<MekanAramaEkrani />)

  await waitFor(() => {
    expect(screen.getByText('8 kisi')).toBeTruthy()
  })
})

it('yaricap secicisi 5 km ustunu sunmaz', async () => {
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
  ;(yakinMekanlariYogunlukIleGetir as jest.Mock).mockResolvedValue([])

  await render(<MekanAramaEkrani />)
  await waitFor(() => expect(yakinMekanlariYogunlukIleGetir).toHaveBeenCalled())

  expect(screen.queryByText('10 km')).toBeNull()
  expect(screen.getByText('5 km')).toBeTruthy()
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekanlar/index.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Ekrani guncelle**

- `yakinMekanlariGetir` yerine `yakinMekanlariYogunlukIleGetir` kullan.
- Yaricap secici ekle: `1 km`, `2 km`, `5 km` (varsayilan `5 km`).
  **10 km secenegi yok** — ucretsiz sinir.
- Her satirda mekan adinin yaninda `{item.kisiSayisi} kisi` gosterilir.
  Sayi 0 ise gosterilmez (bos mekan icin gurultu olmasin).

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekanlar/index.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/mekanlar/index.tsx mobil/src/app/mekanlar/index.test.tsx
git commit -m "mobil: mekan arama ekraninda yogunluk sayisi ve 1-5 km yaricap"
```

---

### Task 15: Baskasinin profili ekrani

**Files:**
- Create: `mobil/src/app/kullanici/[id].tsx`
- Test: `mobil/src/app/kullanici/[id].test.tsx`
- Modify: `mobil/src/app/mekanlar/[id].tsx` (isimleri tiklanabilir yap)

**Interfaces:**
- Consumes: `baskasininProfiliniGetir` (Task 7), `engelle`,
  `engellediklerimiGetir`, `engeliKaldir` (Task 5),
  `kullanicininAnilariniGetir` (asagida, Step 0'da yeniden adlandiriliyor).
- Produces: `/kullanici/[id]` rotasi — Task 16 (sikayet) buradan acilir.

**Not — anilar profilde gosterilecek.** Ani dedigimiz sey zaten
`check_inler` satirinin kendisi ve o satir mekan ekraninda herkese acik
goruluyor; ayni satiri profilde gizlemek yeni bir koruma saglamaz
(spec'teki gerekce). Faz 2a'daki `kendiAnilariniGetir(kullaniciId)`
fonksiyonu zaten parametre olarak kullanici kimligi aliyor ve Task 4'ten
sonra RLS engellemeyi ve `gorunurluk = 'kimse'` kuralini kendisi
uyguluyor — yani baskasinin kimligiyle cagrildiginda dogru sonucu
donduruyor. Yalnizca adi yaniltici ("kendi"), Step 0'da duzeltiliyor.

- [ ] **Step 0: `kendiAnilariniGetir` fonksiyonunu yeniden adlandir**

`mobil/lib/checkin.ts` icinde `kendiAnilariniGetir` →
`kullanicininAnilariniGetir` olarak degistir (govde ayni kalir).
`mobil/lib/checkin.test.ts` ve `mobil/src/app/profil/anilar.tsx`
icindeki cagrilari da guncelle.

Run: `cd mobil && npm test -- checkin.test.ts profil/anilar.test.tsx`
Expected: PASS — davranis degismedi, yalnizca ad degisti.

- [ ] **Step 1: Testleri yaz**

`mobil/src/app/kullanici/[id].test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import KullaniciProfiliEkrani from './[id]'
import { baskasininProfiliniGetir } from '../../../lib/profil'
import { engelle, engellediklerimiGetir } from '../../../lib/engelleme'

jest.mock('../../../lib/profil', () => ({ baskasininProfiliniGetir: jest.fn() }))
jest.mock('../../../lib/engelleme', () => ({
  engelle: jest.fn(),
  engeliKaldir: jest.fn(),
  engellediklerimiGetir: jest.fn(),
}))
jest.mock('../../../lib/checkin', () => ({ kullanicininAnilariniGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'kullanici-2' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(engellediklerimiGetir as jest.Mock).mockResolvedValue([])
  ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([])
})

describe('KullaniciProfiliEkrani', () => {
  it('profili gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: 'merhaba', fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('merhaba')).toBeTruthy()
    })
  })

  it('kullanicinin herkese acik anilarini listeler', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(kullanicininAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika',
        fotograf: null, olusturmaZamani: '', bitisZamani: '', canliMi: false,
        mekanKonumu: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(kullanicininAnilariniGetir).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
  })

  it('profil null donerse bulunamadi gosterir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue(null)

    await render(<KullaniciProfiliEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Bu profil bulunamadi')).toBeTruthy()
    })
  })

  it('engelle butonuna basinca engeller ve profili kapatir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })
    ;(engelle as jest.Mock).mockResolvedValue(undefined)

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Engelle'))

    await waitFor(() => {
      expect(engelle).toHaveBeenCalledWith('kullanici-2')
      expect(screen.getByText('Bu profil bulunamadi')).toBeTruthy()
    })
  })

  it('sikayet butonuna basinca sikayet ekranina yonlendirir', async () => {
    ;(baskasininProfiliniGetir as jest.Mock).mockResolvedValue({
      id: 'kullanici-2', ad: 'Ada', biyografi: null, fotograflar: [],
    })

    await render(<KullaniciProfiliEkrani />)
    await waitFor(() => screen.getByText('Ada'))
    await fireEvent.press(screen.getByText('Sikayet et'))

    expect(mockRouterPush).toHaveBeenCalledWith('/sikayet?hedefTur=kullanici&hedefId=kullanici-2')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- "kullanici/\[id\].test.tsx"`
Expected: FAIL.

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/kullanici/[id].tsx` — profil bilgileri (ad, profil
fotograflari, biyografi), altinda kullanicinin herkese acik anilari
(mekan adi + not + fotograf; `mobil/src/app/profil/anilar.tsx`'teki
liste desenini izle ama **silme butonu olmadan** — baskasinin anisini
silemezsin), en altta `Engelle` ve `Sikayet et` butonlari.

Anilar `kullanicininAnilariniGetir(id)` ile cekilir; RLS engellemeyi ve
`gorunurluk = 'kimse'` kuralini zaten uyguladigi icin ekran kodu ayrica
filtreleme yapmaz.

Engelledikten sonra profil icerigi yerine `Bu profil bulunamadi`
gosterilir (kendi eylemin oldugu icin bu kullaniciya surpriz degil).
Yukleme ve hata durumlari 2a desenine gore.

- [ ] **Step 4: Mekan detay ekraninda isimleri tiklanabilir yap**

`mobil/src/app/mekanlar/[id].tsx` — "Su an burada" ve "Anilar"
listelerindeki kullanici adlarina basinca `/kullanici/${item.kullaniciId}`
rotasina gidilir. Kendi satirinsa yonlendirme yapilmaz.

- [ ] **Step 5: Testlerin gectigini dogrula**

Run: `cd mobil && npm test`
Expected: PASS, tum suite.

- [ ] **Step 6: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/kullanici mobil/src/app/mekanlar
git commit -m "mobil: baskasinin profili ekrani, engelleme ve sikayet girisleri"
```

---

### Task 16: Sikayet ekrani

**Files:**
- Create: `mobil/src/app/sikayet.tsx`
- Test: `mobil/src/app/sikayet.test.tsx`
- Modify: `mobil/src/app/mekanlar/[id].tsx` (icerik sikayeti girisi)

**Interfaces:**
- Consumes: `sikayetGonder`, `SIKAYET_SEBEPLERI` (Task 6).

- [ ] **Step 1: Testleri yaz**

`mobil/src/app/sikayet.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import SikayetEkrani from './sikayet'
import { sikayetGonder } from '../../lib/sikayet'

jest.mock('../../lib/sikayet', () => ({
  sikayetGonder: jest.fn(),
  SIKAYET_SEBEPLERI: [
    { anahtar: 'taciz', etiket: 'Taciz veya rahatsiz etme' },
    { anahtar: 'spam', etiket: 'Spam veya reklam' },
  ],
}))

const mockRouterBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockRouterBack }),
  useLocalSearchParams: () => ({ hedefTur: 'kullanici', hedefId: 'kullanici-2' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('SikayetEkrani', () => {
  it('sebep secip gonderince sikayeti iletir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Taciz veya rahatsiz etme'))
    await fireEvent.changeText(screen.getByPlaceholderText('Eklemek istedigin bir sey var mi?'), 'detay')
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(sikayetGonder).toHaveBeenCalledWith('kullanici', 'kullanici-2', 'taciz', 'detay')
    })
  })

  it('sebep secilmeden gonderilemez', async () => {
    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(screen.getByText('Bir sebep sec')).toBeTruthy()
    })
    expect(sikayetGonder).not.toHaveBeenCalled()
  })

  it('gonderdikten sonra teyit gosterir', async () => {
    ;(sikayetGonder as jest.Mock).mockResolvedValue(undefined)

    await render(<SikayetEkrani />)
    await fireEvent.press(screen.getByText('Spam veya reklam'))
    await fireEvent.press(screen.getByText('Gonder'))

    await waitFor(() => {
      expect(screen.getByText('Sikayetin alindi')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- sikayet.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/sikayet.tsx` — `SIKAYET_SEBEPLERI` listesinden sebep
secici, istege bagli aciklama alani, `Gonder` butonu. Gonderdikten sonra
`Sikayetin alindi` teyidi gosterilir; **"inceleyecegiz" denmez** (elle
moderasyonda tutulamayacak bir soz). Sebep secilmemisse `Bir sebep sec`
hatasi.

- [ ] **Step 4: Mekan detay ekranina icerik sikayeti ekle**

`mobil/src/app/mekanlar/[id].tsx` — her check-in/ani kartinda kucuk bir
`Sikayet et` baglantisi; `/sikayet?hedefTur=check_in&hedefId=${item.id}`
rotasina gider. Kendi satirinda gosterilmez.

- [ ] **Step 5: Testlerin gectigini dogrula**

Run: `cd mobil && npm test`
Expected: PASS, tum suite.

- [ ] **Step 6: Gorunurluk testlerini tekrar calistir**

Run: `cd mobil && npm run test:gorunurluk`
Expected: butun dogrulamalar `OK` — ekran degisiklikleri RLS kurallarini
bozmamis olmali.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/sikayet.tsx mobil/src/app/sikayet.test.tsx mobil/src/app/mekanlar
git commit -m "mobil: sikayet ekrani ve icerik sikayeti girisi"
```

---

### Task 17: Ana ekrandan ayarlara erisim

**Files:**
- Modify: `mobil/src/app/index.tsx`
- Modify: `mobil/__tests__/ekranlar/index.test.tsx`

**Interfaces:**
- Consumes: Task 12'nin `/profil/ayarlar` rotasi.

- [ ] **Step 1: Testi ekle**

```tsx
it('ayarlar butonuna basinca /profil/ayarlar rotasina yonlendirir', async () => {
  await render(<AnaEkran />)
  await fireEvent.press(screen.getByText('Gizlilik ayarlari'))
  expect(mockRouterPush).toHaveBeenCalledWith('/profil/ayarlar')
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- __tests__/ekranlar/index.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Ana ekrani guncelle**

Mevcut butonlari koruyarak `Gizlilik ayarlari` butonu ekle,
`/profil/ayarlar` rotasina gider.

- [ ] **Step 4: Tum testleri calistir**

Run: `cd mobil && npm test`
Expected: PASS, tum suite.

Run: `cd mobil && npm run test:gorunurluk`
Expected: butun dogrulamalar `OK`.

- [ ] **Step 5: Elle dogrulama**

Run: `cd mobil && npx expo start --web`

Iki farkli tarayici penceresinde iki test numarasiyla giris yap
(`+905550000000` ve `+905550000001`, kod `123456`) ve sirayla dogrula:
ayni mekana check-in → birbirinizi goruyorsunuz → biri digerini
engelliyor → artik gormuyorsunuz → yogunluk sayisi ikisinde de ayni.

Bu adim Faz 2a'da atlanmisti ve canli veritabaninda calismayan bir ekran
uretilmisti. **Atlama.** Yapamiyorsan raporda acikca yaz.

- [ ] **Step 6: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/index.tsx mobil/__tests__/ekranlar/index.test.tsx
git commit -m "mobil: ana ekrandan gizlilik ayarlarina erisim"
```

---

### Task 18: Gizli check-in aniya donusurken gorunurlugu de kapat

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_gizli_ani_gorunurlugu.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts` (yeni senaryo)

**Interfaces:**
- Consumes: `check_inler.gizli_mi`, `check_inler.gorunurluk` (Task 3),
  `check_inden_ayril` (onceki fazdan), pg_cron isi (onceki fazdan).

**Not:** Bu gorev plan yazildiktan sonra eklendi (2026-08-17 kullanici
karari, spec'in "Gizli check-in aniya donusurken gorunurlugu de kapanir"
bolumu). Gerekce orada.

Kural: `gizli_mi = true` olan bir check-in ani haline gelirken
`gorunurluk` da `'kimse'` yapilir. Iki donusum yolu var ve **ikisi de**
guncellenmeli:
1. `check_inden_ayril(p_check_in_id)` RPC — kullanici "ayrildim" dedigi an
2. pg_cron isi — 4 saat dolunca otomatik

Ters yon gecerli degil: `gizli_mi = false` olan check-in'in `gorunurluk`
degeri degistirilmez.

- [ ] **Step 1: Mevcut tanimlari oku**

```bash
cat mobil/supabase/migrations/*check_inden_ayril*.sql
cat mobil/supabase/migrations/*ani_donusumu_cron*.sql
supabase db query "select pg_get_functiondef(oid) from pg_proc where proname = 'check_inden_ayril';" --linked
supabase db query "select jobname, schedule, command from cron.job;" --linked
```

Govdeleri buradan kopyala; ezberden yeniden yazma.

- [ ] **Step 2: Migrasyonu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new gizli_ani_gorunurlugu
```

`check_inden_ayril`'i `create or replace` ile yeniden yaz — mevcut
govdesini birebir koru (auth guard dahil), yalnizca `update` ifadesini
genislet:

```sql
update public.check_inler
set konum = null,
    gorunurluk = case when gizli_mi then 'kimse' else gorunurluk end
where id = p_check_in_id
  and kullanici_id = auth.uid()
  and konum is not null;
```

Sonuna mevcut `revoke`/`grant` satirlarini yine ekle.

Cron isini de guncelle (`cron.schedule` ayni `jobname` ile cagrilirsa isi
degistirir, ikinci bir is yaratmaz):

```sql
select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler
     set konum = null,
         gorunurluk = case when gizli_mi then 'kimse' else gorunurluk end
     where konum is not null and bitis_zamani <= now(); $$
);
```

- [ ] **Step 3: Uygula ve dogrula**

```bash
supabase db push
supabase db query "select pg_get_functiondef(oid) from pg_proc where proname = 'check_inden_ayril';" --linked
supabase db query "select jobname, command from cron.job where jobname = 'check-in-suresi-dolanlari-aniya-cevir';" --linked
```

Ikisinde de `gorunurluk` atamasi gorunmeli, ve cron isi **tek** satir
olmali (mukerrer is olusmamis olmali).

- [ ] **Step 4: Gorunurluk testine yeni senaryo ekle**

`mobil/gorunurluk-testleri/calistir.ts` icine onuncu senaryo:

**Senaryo 10 — Gizli check-in aniya donusunce baskasina gorunmez.**
A, `gizli_mi = true` ile check-in yapar. A "ayrildim" der
(`check_inden_ayril`). B — bu mekanda canli check-in'i olmayan biri —
o aniyi **goremez** (cunku `gorunurluk` artik `'kimse'`). Kontrol
olarak: A kendi anisini hala gorur.

Ayrica ters yonu de dogrula: A gizli **olmayan** bir check-in yapip
ayrilirsa, B o aniyi **gorur** — yani kural yalnizca gizli olanlara
uyguluyor, hepsini kapatmiyor. Bu ikinci kisim onemli; olmadan senaryo
"her ani kapaniyor" hatasini yakalayamaz.

- [ ] **Step 5: Testleri calistir**

Run: `cd mobil && npm run test:gorunurluk`
Expected: 10/10 `OK`, cikis kodu 0.

Run: `cd mobil && npm test`
Expected: butun suite yesil (bu gorev istemci kodunu degistirmiyor, ama
regresyon olmadigini dogrula).

- [ ] **Step 6: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/gorunurluk-testleri
git commit -m "mobil: gizli check-in aniya donusurken gorunurlugu de kapat"
```

---

## Sonraki adim

Faz 2b tamamlandiginda kullanici kendini gizleyebiliyor, anilarinin
gorunurlugunu secebiliyor, engelleyip sikayet edebiliyor ve mekan
yogunlugunu goruyor — ama kimlerin nerede oldugunu hala goremiyor.

Sirada iki bagimsiz is var:
- **Moderasyon paneli** — ayri bir web sayfasi (uygulamanin icinde degil),
  `sikayetler` tablosunu okur. Kendi kucuk planini alir.
- **Faz 3 — Bag ve sohbet** ya da **Faz 4 — Gelir** (kimlik kesfi +
  odeme). Faz 4'un kisi listesi bu fazin butun guvenlik altyapisinin
  uzerine oturacak.
