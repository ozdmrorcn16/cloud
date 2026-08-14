# Faz 2a — Mekanlar ve Check-in Uygulama Plani

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanicinin bir mekan arayip (ya da eksikse ekleyip) check-in yapabildigi,
4 saat (ya da "ayrildim" diyene kadar) o mekanda ayni anda check-in yapmis kisiler
tarafindan gorulebildigi, sure dolunca check-in'in otomatik olarak kalici bir aniya
donustugu ve kullanicinin kendi anilarini profilinde gorup silebildigi bir Expo
uygulamasi. Sonunda kullanici check-in yapabiliyor ama genel "yakindakiler" kesfi
henuz yok — Faz 2b'nin konusu.

**Architecture:** Faz 1'in Expo (React Native + TypeScript, Expo Router) + Supabase
(Auth + Postgres/PostGIS + Storage) mimarisi uzerine kuruluyor. Konum-gerektiren
tum yazma islemleri (check-in olusturma, mekan ekleme, check-in'den ayrilma)
dogrudan tablo `insert`/`update` yerine Postgres RPC fonksiyonlariyla yapiliyor;
mesafe kontrolleri boylece sunucu tarafinda, istemcinin atlayamayacagi sekilde
uygulaniyor. Canli check-in'in "karsilikli gorunurluk" kurali RLS `select`
politikasinda uygulaniyor — istemci kodu bir sey gizlemiyor, Postgres zaten yanlis
satiri hic dondurmuyor. Sure dolan check-in'lerin aniya donusmesi bir pg_cron
isiyle periyodik calisiyor.

**Tech Stack:** Faz 1'deki yigina ek olarak: `expo-location` (cihaz konumu),
PostGIS `geography(Point,4326)` + GiST indeksi, Postgres RPC fonksiyonlari
(`security definer`), pg_cron (zamanlanmis is), mevcut `expo-image-picker` +
`expo-file-system` + `base64-arraybuffer` (check-in fotografi, Faz 1'deki
`fotografYukle` deseninin ayni sekilde tekrari). Harita gorunumu icin ayri bir
kutuphane **yok** — "aniyi haritada ac" ihtiyaci cihazin kendi harita
uygulamasina `Linking.openURL` ile derin baglantiyla cozuluyor (YAGNI:
`react-native-maps` gibi native bir SDK eklemeye gerek yok, 2a'da hicbir ekran
harita *gomulu* gostermiyor).

**Spec:** `docs/superpowers/specs/2026-08-14-faz2a-mekanlar-checkin-design.md`

## Global Constraints

- Node.js 18+, TypeScript strict mode, npm — Faz 1'deki gibi.
- UI dili: Turkce.
- Check-in icin mekana yakinlik siniri: **~500 m** (`ST_DWithin`, sunucu tarafinda
  RPC icinde zorunlu kilinir).
- Mekan ekleme icin cihaz-mekan yakinlik siniri: **~200 m** (ayni sekilde RPC
  icinde zorunlu).
- Check-in suresi: olusturuldugu andan **4 saat** sonra otomatik biter
  (`bitis_zamani = now() + interval '4 hours'`), ya da kullanici "ayrildim"
  derse daha erken.
- Kullanici ayni anda yalnizca **bir** canli check-in'e sahip olabilir; yenisi
  oncekini otomatik kapatir.
- Check-in hicbir zaman otomatik **silinmez** — sure dolunca yalnizca `konum`
  alani null'lanir, satir kalici anidir. Silme yalnizca kullanicinin kendi
  eylemiyle olur.
- Medya: yalnizca fotograf, video yok.
- Gunluk mekan ekleme limiti: kullanici basina **5**.
- Mekan arama yaricapi: sabit **3000 m** (2a'da kullanici ayarlamiyor; bu,
  Faz 2b'nin ucretli "yakindakiler" kisi-arama yaricapindan ayri bir kavram).
- `check_inler` tablosunda sutun adi `not` **degil** `not_metni` — `not`,
  SQL'de ayrilmis anahtar kelime (`NOT`), sutun adi olarak kullanilamaz.
- `gorunurluk` alani semada duruyor ama 2a'da islevsiz; her check-in
  `'herkese_acik'` varsayilaniyla yazilir, hicbir ekran bunu degistirmeye izin
  vermez (ayar arayuzu Faz 2b'de).
- Supabase projesi: `konum-sosyal` (ref `swpiibyuoffykbmirvgq`, `eu-central-1`),
  Faz 1'de zaten linklendi — yeniden `supabase link` gerekmiyor.

---

### Task 1: `mekanlar` tablosu — PostGIS, sema, RLS

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mekanlar.sql`

**Interfaces:**
- Produces: `public.mekanlar` tablosu (`id, ad, tur, konum geography(Point,4326),
  adres, osm_id, ekleyen_kullanici, olusturuldu`) — Task 5, 6, 9, 10, 11 bu
  tabloyu okur/RPC uzerinden yazar.
- Produces: `postgis` extension'i etkin — sonraki tum konum sorgulari buna
  dayanir.

- [ ] **Step 1: Migrasyon dosyasini olustur**

```bash
cd ~/projects/cloud/mobil
supabase migration new mekanlar
```

- [ ] **Step 2: Semayi yaz**

Olusturulan dosyaya:

```sql
create extension if not exists postgis;

create table public.mekanlar (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  tur text not null,
  konum geography(point, 4326) not null,
  adres text,
  osm_id bigint,
  ekleyen_kullanici uuid references auth.users(id) on delete set null,
  olusturuldu timestamptz not null default now()
);

create index mekanlar_konum_idx on public.mekanlar using gist (konum);

alter table public.mekanlar enable row level security;

create policy "herkes mekanlari okuyabilir"
  on public.mekanlar for select
  to authenticated
  using (true);
```

Not: kasitli olarak `insert`/`update`/`delete` politikasi yok — mekan ekleme
Task 6'daki `mekan_ekle` RPC fonksiyonu uzerinden, `security definer` ile
yapilacak. Dogrudan tablo yazma kapali.

- [ ] **Step 3: Migrasyonu uzak projeye uygula**

```bash
supabase db push
```

Expected: "Applying migration ... mekanlar.sql" ciktisi, hata yok.

- [ ] **Step 4: Dogrula**

Dashboard → SQL Editor:

```sql
select postgis_version();
select tablename, rowsecurity from pg_tables where tablename = 'mekanlar';
```

Expected: `postgis_version()` bir surum dondurur (hata vermez);
`rowsecurity = true`.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: mekanlar tablosu (PostGIS) ve RLS"
```

---

### Task 2: `check_inler` tablosu — sema, karsilikli gorunurluk RLS

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_check_inler.sql`

**Interfaces:**
- Consumes: `public.mekanlar` (Task 1).
- Produces: `public.check_inler` tablosu (`id, kullanici_id, mekan_id,
  not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, gorunurluk`) —
  Task 7, 8, 9, 12, 13, 14 bu tabloyu okur/RPC uzerinden yazar.
- Produces: `select` RLS politikasi — spec'teki karar #12'yi (karsilikli canli
  gorunurluk) ve karar #14'u (gecmis anilarin herkese acik olmasi) birebir
  uyguluyor. Bundan sonraki hicbir ekran kodu bu kurali ayrica uygulamak
  zorunda degil — Postgres yanlis satiri zaten dondurmuyor.

- [ ] **Step 1: Migrasyon dosyasini olustur**

```bash
cd ~/projects/cloud/mobil
supabase migration new check_inler
```

- [ ] **Step 2: Semayi yaz**

```sql
create table public.check_inler (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  mekan_id uuid not null references public.mekanlar(id) on delete cascade,
  not_metni text,
  fotograf text,
  olusturma_zamani timestamptz not null default now(),
  bitis_zamani timestamptz not null,
  konum geography(point, 4326),
  gorunurluk text not null default 'herkese_acik'
);

create index check_inler_mekan_idx on public.check_inler (mekan_id);
create index check_inler_kullanici_idx on public.check_inler (kullanici_id);

alter table public.check_inler enable row level security;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    kullanici_id = auth.uid()
    or konum is null
    or exists (
      select 1 from public.check_inler benim
      where benim.kullanici_id = auth.uid()
        and benim.mekan_id = check_inler.mekan_id
        and benim.konum is not null
        and benim.bitis_zamani > now()
    )
  );

create policy "kendi anisini silebilir"
  on public.check_inler for delete
  using (kullanici_id = auth.uid());
```

Not: `insert`/`update` politikasi yok — yazma Task 7/8'deki RPC
fonksiyonlariyla, `security definer` ile yapilacak. `delete` dogrudan tablo
uzerinden acik cunku ekstra bir is kurali gerektirmiyor (kullanici sadece
kendi anisini silebilir, spec'teki "kullanici istedigi zaman elle silebilir").

- [ ] **Step 3: Migrasyonu uygula**

```bash
supabase db push
```

- [ ] **Step 4: RLS'i dogrula**

Dashboard → SQL Editor:

```sql
select tablename, rowsecurity from pg_tables where tablename = 'check_inler';
select polname, polcmd from pg_policies where tablename = 'check_inler';
```

Expected: `rowsecurity = true`; iki politika listelenir (`check-in gorunurlugu`
select, `kendi anisini silebilir` delete).

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: check_inler tablosu ve karsilikli gorunurluk RLS'i"
```

---

### Task 3: `check-in-fotograflari` storage bucket ve RLS

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_checkin_fotograflari_bucket.sql`

**Interfaces:**
- Consumes: `public.check_inler` (Task 2, RLS mantigi bucket politikasinda
  tekrar kullaniliyor).
- Produces: `check-in-fotograflari` bucket'i — Task 12'deki check-in olusturma
  ekrani buraya yukler.

**Not:** Faz 1'deki `profil-fotograflari` bucket'i her kullaniciyi kendi
klasoruyle sinirlayan basit bir politika kullaniyordu (`profil-fotograflari`
her zaman ozel). Check-in fotograflari boyle degil — gecmis anilar herkese
acik olabiliyor (karar #14), canli check-in'ler karsilikli gorunuyor
(karar #12). O yuzden okuma politikasi, Task 2'deki `check_inler.select`
kuralinin ayni mantigini `storage.objects` uzerinde tekrar ediyor (dosya
yolu `check_inler.fotograf` ile eslestiriliyor).

- [ ] **Step 1: Migrasyon dosyasini olustur**

```bash
cd ~/projects/cloud/mobil
supabase migration new checkin_fotograflari_bucket
```

- [ ] **Step 2: Bucket ve politikalari yaz**

```sql
insert into storage.buckets (id, name, public)
values ('check-in-fotograflari', 'check-in-fotograflari', false);

create policy "kendi check-in fotografini yukleyebilir"
  on storage.objects for insert
  with check (
    bucket_id = 'check-in-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select
  using (
    bucket_id = 'check-in-fotograflari'
    and exists (
      select 1 from public.check_inler c
      where c.fotograf = storage.objects.name
        and (
          c.kullanici_id = auth.uid()
          or c.konum is null
          or exists (
            select 1 from public.check_inler benim
            where benim.kullanici_id = auth.uid()
              and benim.mekan_id = c.mekan_id
              and benim.konum is not null
              and benim.bitis_zamani > now()
          )
        )
    )
  );
```

- [ ] **Step 3: Migrasyonu uygula**

```bash
supabase db push
```

- [ ] **Step 4: Dogrula**

Dashboard → Storage → `check-in-fotograflari` bucket'inin listede oldugunu
goz kontrolu ile dogrula.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations
git commit -m "mobil: check-in-fotograflari bucket'i ve gorunurluk kurallariyla eslesen RLS"
```

---

### Task 4: Konum yardimci fonksiyonlari (mesafe, izin, cihaz konumu)

**Files:**
- Create: `mobil/lib/konum.ts`
- Test: `mobil/lib/konum.test.ts`

**Interfaces:**
- Produces: `mesafeMetre(lat1: number, lng1: number, lat2: number, lng2: number):
  number` — saf fonksiyon, Task 11 ve 12'deki istemci-tarafi on-kontrollerde
  kullanilir (asil kontrol sunucuda RPC icinde, bu sadece kullaniciya erken
  geri bildirim icin).
- Produces: `cihazKonumunuAl(): Promise<{ lat: number; lng: number }>` — izin
  ister, konum doner. Task 11, 12, 13 bunu cagirir.

- [ ] **Step 1: Bagimliligi kur**

```bash
cd ~/projects/cloud/mobil
npx expo install expo-location
```

- [ ] **Step 2: `mesafeMetre` icin basarisiz testi yaz**

`mobil/lib/konum.test.ts`:

```ts
import { mesafeMetre } from './konum'

describe('mesafeMetre', () => {
  it('ayni noktada 0 doner', () => {
    expect(mesafeMetre(41.015, 28.979, 41.015, 28.979)).toBe(0)
  })

  it('bilinen iki nokta arasindaki mesafeyi yaklasik dogru hesaplar', () => {
    // Istanbul Taksim (41.0370, 28.9850) - Kadikoy (40.9903, 29.0275) ~ 6.4 km
    const mesafe = mesafeMetre(41.037, 28.985, 40.9903, 29.0275)
    expect(mesafe).toBeGreaterThan(6000)
    expect(mesafe).toBeLessThan(6800)
  })

  it('100 metre gibi kucuk mesafeleri dogru ayirt eder', () => {
    // ~90 m kuzeye kaydirilmis nokta
    const mesafe = mesafeMetre(41.015, 28.979, 41.0158, 28.979)
    expect(mesafe).toBeGreaterThan(50)
    expect(mesafe).toBeLessThan(150)
  })
})
```

- [ ] **Step 3: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- konum.test.ts`
Expected: FAIL — `./konum` module bulunamiyor.

- [ ] **Step 4: Modulu yaz**

`mobil/lib/konum.ts`:

```ts
import * as Location from 'expo-location'

const DUNYA_YARICAPI_METRE = 6371000

export function mesafeMetre(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radyana = (derece: number) => (derece * Math.PI) / 180
  const dLat = radyana(lat2 - lat1)
  const dLng = radyana(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radyana(lat1)) * Math.cos(radyana(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return DUNYA_YARICAPI_METRE * c
}

export async function cihazKonumunuAl(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Konum izni verilmedi')
  }
  const konum = await Location.getCurrentPositionAsync({})
  return { lat: konum.coords.latitude, lng: konum.coords.longitude }
}
```

- [ ] **Step 5: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- konum.test.ts`
Expected: PASS, 3 test.

- [ ] **Step 6: Commit**

```bash
cd ~/projects/cloud
git add mobil/lib/konum.ts mobil/lib/konum.test.ts mobil/package.json mobil/package-lock.json
git commit -m "mobil: mesafe hesaplama ve cihaz konumu alma yardimcilari"
```

---

### Task 5: `yakin_mekanlar` RPC + mekan arama istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_yakin_mekanlar_rpc.sql`
- Create: `mobil/lib/mekan.ts`
- Test: `mobil/lib/mekan.test.ts`

**Interfaces:**
- Consumes: `public.mekanlar` (Task 1), `supabase` (Faz 1 Task 4).
- Produces: `yakinMekanlariGetir(lat: number, lng: number, arama?: string):
  Promise<Mekan[]>` — Task 9'daki mekan arama ekrani bunu cagirir.
- Produces: `Mekan` tipi (`{ id, ad, tur, adres, osm_id, konum: { lat, lng } }`)
  — Task 9, 10, 11, 13 bu tipi kullanir.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new yakin_mekanlar_rpc
```

```sql
create or replace function public.yakin_mekanlar(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre int default 3000,
  p_arama text default null
) returns setof public.mekanlar
language sql
stable
as $$
  select *
  from public.mekanlar
  where ST_DWithin(konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
    and (p_arama is null or ad ilike '%' || p_arama || '%')
  order by konum <-> ST_MakePoint(p_lng, p_lat)::geography
  limit 50;
$$;
```

Not: `security definer` **yok** — bu fonksiyon `mekanlar`'in zaten herkese
acik `select` politikasini kullaniyor, ozel yetki gerekmiyor.

- [ ] **Step 2: Migrasyonu uygula ve dogrula**

```bash
supabase db push
```

Dashboard → SQL Editor:

```sql
select proname from pg_proc where proname = 'yakin_mekanlar';
```

Expected: bir satir doner.

- [ ] **Step 3: Basarisiz istemci testini yaz**

`mobil/lib/mekan.test.ts`:

```ts
import { yakinMekanlariGetir } from './mekan'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

describe('yakinMekanlariGetir', () => {
  it('konum ve arama metnini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'mekan-1',
          ad: 'Sahil Kafe',
          tur: 'kafe',
          adres: null,
          osm_id: 123,
          konum: 'POINT(28.979 41.015)',
        },
      ],
      error: null,
    })

    const sonuc = await yakinMekanlariGetir(41.015, 28.979, 'kafe')

    expect(supabase.rpc).toHaveBeenCalledWith('yakin_mekanlar', {
      p_lat: 41.015,
      p_lng: 28.979,
      p_arama: 'kafe',
    })
    expect(sonuc).toEqual([
      {
        id: 'mekan-1',
        ad: 'Sahil Kafe',
        tur: 'kafe',
        adres: null,
        osmId: 123,
        konum: { lat: 41.015, lng: 28.979 },
      },
    ])
  })

  it('hata donerse firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'sunucu hatasi' } })
    await expect(yakinMekanlariGetir(41.015, 28.979)).rejects.toThrow('sunucu hatasi')
  })
})
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: FAIL — `./mekan` module bulunamiyor.

- [ ] **Step 5: Istemci modulunu yaz**

`mobil/lib/mekan.ts`:

```ts
import { supabase } from './supabase'

export type Mekan = {
  id: string
  ad: string
  tur: string
  adres: string | null
  osmId: number | null
  konum: { lat: number; lng: number }
}

function noktayiCoz(wkt: string): { lat: number; lng: number } {
  // PostGIS geography, PostgREST uzerinden "POINT(lng lat)" WKT metni olarak doner.
  const eslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!eslesme) throw new Error(`Beklenmeyen konum formati: ${wkt}`)
  return { lng: parseFloat(eslesme[1]), lat: parseFloat(eslesme[2]) }
}

type MekanSatiri = {
  id: string
  ad: string
  tur: string
  adres: string | null
  osm_id: number | null
  konum: string
}

function satiriMekanaCevir(satir: MekanSatiri): Mekan {
  return {
    id: satir.id,
    ad: satir.ad,
    tur: satir.tur,
    adres: satir.adres,
    osmId: satir.osm_id,
    konum: noktayiCoz(satir.konum),
  }
}

export async function yakinMekanlariGetir(
  lat: number,
  lng: number,
  arama?: string
): Promise<Mekan[]> {
  const { data, error } = await supabase.rpc('yakin_mekanlar', {
    p_lat: lat,
    p_lng: lng,
    p_arama: arama ?? null,
  })
  if (error) throw new Error(error.message)
  return (data as MekanSatiri[]).map(satiriMekanaCevir)
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: PASS, 2 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/mekan.ts mobil/lib/mekan.test.ts
git commit -m "mobil: yakin_mekanlar RPC'si ve mekan arama istemci fonksiyonu"
```

---

### Task 6: `mekan_ekle` RPC + istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mekan_ekle_rpc.sql`
- Modify: `mobil/lib/mekan.ts`
- Modify: `mobil/lib/mekan.test.ts`

**Interfaces:**
- Consumes: `public.mekanlar` (Task 1), `Mekan` tipi (Task 5).
- Produces: `mekanEkle(ad: string, tur: string, konum: { lat: number; lng: number },
  cihazKonumu: { lat: number; lng: number }, adres?: string): Promise<Mekan>`
  — Task 10'daki mekan ekleme ekrani bunu cagirir.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new mekan_ekle_rpc
```

```sql
create or replace function public.mekan_ekle(
  p_ad text,
  p_tur text,
  p_lat double precision,
  p_lng double precision,
  p_cihaz_lat double precision,
  p_cihaz_lng double precision,
  p_adres text default null
) returns public.mekanlar
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gunluk_sayi int;
  v_yeni public.mekanlar;
begin
  if not ST_DWithin(
    ST_MakePoint(p_lng, p_lat)::geography,
    ST_MakePoint(p_cihaz_lng, p_cihaz_lat)::geography,
    200
  ) then
    raise exception 'Mekana yakin olmalisin (~200 m icinde)';
  end if;

  select count(*) into v_gunluk_sayi
  from public.mekanlar
  where ekleyen_kullanici = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_gunluk_sayi >= 5 then
    raise exception 'Gunluk mekan ekleme limitine ulastin (5)';
  end if;

  insert into public.mekanlar (ad, tur, konum, adres, ekleyen_kullanici)
  values (p_ad, p_tur, ST_MakePoint(p_lng, p_lat)::geography, p_adres, auth.uid())
  returning * into v_yeni;

  return v_yeni;
end;
$$;
```

- [ ] **Step 2: Migrasyonu uygula ve dogrula**

```bash
supabase db push
```

Dashboard → SQL Editor: `select proname from pg_proc where proname = 'mekan_ekle';`
Expected: bir satir doner.

- [ ] **Step 3: Basarisiz istemci testini yaz**

`mobil/lib/mekan.test.ts` dosyasinin sonuna ekle:

```ts
describe('mekanEkle', () => {
  it('ad, tur, konum ve cihaz konumunu rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        id: 'mekan-yeni',
        ad: 'Yeni Kafe',
        tur: 'kafe',
        adres: null,
        osm_id: null,
        konum: 'POINT(28.98 41.02)',
      },
      error: null,
    })

    const sonuc = await mekanEkle(
      'Yeni Kafe',
      'kafe',
      { lat: 41.02, lng: 28.98 },
      { lat: 41.0201, lng: 28.9801 }
    )

    expect(supabase.rpc).toHaveBeenCalledWith('mekan_ekle', {
      p_ad: 'Yeni Kafe',
      p_tur: 'kafe',
      p_lat: 41.02,
      p_lng: 28.98,
      p_cihaz_lat: 41.0201,
      p_cihaz_lng: 28.9801,
      p_adres: null,
    })
    expect(sonuc.id).toBe('mekan-yeni')
  })

  it('cihaz mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana yakin olmalisin (~200 m icinde)' },
    })
    await expect(
      mekanEkle('Uzak Kafe', 'kafe', { lat: 41.02, lng: 28.98 }, { lat: 42, lng: 30 })
    ).rejects.toThrow('Mekana yakin olmalisin')
  })
})
```

Test dosyasinin en ustundeki import satirini guncelle:

```ts
import { yakinMekanlariGetir, mekanEkle } from './mekan'
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: FAIL — `mekanEkle` export edilmiyor.

- [ ] **Step 5: Istemci fonksiyonunu ekle**

`mobil/lib/mekan.ts` dosyasinin sonuna ekle:

```ts
export async function mekanEkle(
  ad: string,
  tur: string,
  konum: { lat: number; lng: number },
  cihazKonumu: { lat: number; lng: number },
  adres?: string
): Promise<Mekan> {
  const { data, error } = await supabase.rpc('mekan_ekle', {
    p_ad: ad,
    p_tur: tur,
    p_lat: konum.lat,
    p_lng: konum.lng,
    p_cihaz_lat: cihazKonumu.lat,
    p_cihaz_lng: cihazKonumu.lng,
    p_adres: adres ?? null,
  })
  if (error) throw new Error(error.message)
  return satiriMekanaCevir(data as MekanSatiri)
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekan.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/mekan.ts mobil/lib/mekan.test.ts
git commit -m "mobil: mekan_ekle RPC'si (yakinlik + gunluk limit) ve istemci fonksiyonu"
```

---

### Task 7: `check_in_yap` RPC + istemci fonksiyonu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_check_in_yap_rpc.sql`
- Create: `mobil/lib/checkin.ts`
- Test: `mobil/lib/checkin.test.ts`

**Interfaces:**
- Consumes: `public.check_inler` (Task 2), `public.mekanlar` (Task 1).
- Produces: `checkInYap(mekanId: string, konum: { lat: number; lng: number },
  notMetni?: string, fotograf?: string): Promise<CheckIn>` — Task 12'deki
  check-in olusturma ekrani bunu cagirir.
- Produces: `CheckIn` tipi (`{ id, mekanId, notMetni, fotograf,
  olusturmaZamani, bitisZamani, canliMi }`) — Task 12, 13, 14 kullanir.

- [ ] **Step 1: RPC migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new check_in_yap_rpc
```

```sql
create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null
) returns public.check_inler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mekan_konum geography;
  v_yeni public.check_inler;
begin
  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 500) then
    raise exception 'Mekana cok uzaksin (~500 m icinde olmalisin)';
  end if;

  update public.check_inler
  set konum = null
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum)
  values (
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '4 hours',
    ST_MakePoint(p_lng, p_lat)::geography
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;
```

- [ ] **Step 2: Migrasyonu uygula ve dogrula**

```bash
supabase db push
```

Dashboard → SQL Editor: `select proname from pg_proc where proname = 'check_in_yap';`
Expected: bir satir doner.

- [ ] **Step 3: Basarisiz istemci testini yaz**

`mobil/lib/checkin.test.ts`:

```ts
import { checkInYap } from './checkin'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: { rpc: jest.fn() },
}))

describe('checkInYap', () => {
  it('mekan, konum, not ve fotografi rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: {
        id: 'checkin-1',
        mekan_id: 'mekan-1',
        not_metni: 'guzel bir yer',
        fotograf: 'kullanici-1/123.jpg',
        olusturma_zamani: '2026-08-14T10:00:00Z',
        bitis_zamani: '2026-08-14T14:00:00Z',
        konum: 'POINT(28.979 41.015)',
      },
      error: null,
    })

    const sonuc = await checkInYap('mekan-1', { lat: 41.015, lng: 28.979 }, 'guzel bir yer', 'kullanici-1/123.jpg')

    expect(supabase.rpc).toHaveBeenCalledWith('check_in_yap', {
      p_mekan_id: 'mekan-1',
      p_lat: 41.015,
      p_lng: 28.979,
      p_not_metni: 'guzel bir yer',
      p_fotograf: 'kullanici-1/123.jpg',
    })
    expect(sonuc).toEqual({
      id: 'checkin-1',
      mekanId: 'mekan-1',
      notMetni: 'guzel bir yer',
      fotograf: 'kullanici-1/123.jpg',
      olusturmaZamani: '2026-08-14T10:00:00Z',
      bitisZamani: '2026-08-14T14:00:00Z',
      canliMi: true,
    })
  })

  it('mekana uzaksa sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Mekana cok uzaksin (~500 m icinde olmalisin)' },
    })
    await expect(checkInYap('mekan-1', { lat: 41.5, lng: 29.5 })).rejects.toThrow('Mekana cok uzaksin')
  })
})
```

- [ ] **Step 4: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: FAIL — `./checkin` module bulunamiyor.

- [ ] **Step 5: Istemci modulunu yaz**

`mobil/lib/checkin.ts`:

```ts
import { supabase } from './supabase'

export type CheckIn = {
  id: string
  mekanId: string
  notMetni: string | null
  fotograf: string | null
  olusturmaZamani: string
  bitisZamani: string
  canliMi: boolean
}

type CheckInSatiri = {
  id: string
  mekan_id: string
  not_metni: string | null
  fotograf: string | null
  olusturma_zamani: string
  bitis_zamani: string
  konum: string | null
}

function satiriCheckInACevir(satir: CheckInSatiri): CheckIn {
  return {
    id: satir.id,
    mekanId: satir.mekan_id,
    notMetni: satir.not_metni,
    fotograf: satir.fotograf,
    olusturmaZamani: satir.olusturma_zamani,
    bitisZamani: satir.bitis_zamani,
    canliMi: satir.konum !== null,
  }
}

export async function checkInYap(
  mekanId: string,
  konum: { lat: number; lng: number },
  notMetni?: string,
  fotograf?: string
): Promise<CheckIn> {
  const { data, error } = await supabase.rpc('check_in_yap', {
    p_mekan_id: mekanId,
    p_lat: konum.lat,
    p_lng: konum.lng,
    p_not_metni: notMetni ?? null,
    p_fotograf: fotograf ?? null,
  })
  if (error) throw new Error(error.message)
  return satiriCheckInACevir(data as CheckInSatiri)
}
```

- [ ] **Step 6: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: PASS, 2 test.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/checkin.ts mobil/lib/checkin.test.ts
git commit -m "mobil: check_in_yap RPC'si (yakinlik + tek aktif check-in) ve istemci fonksiyonu"
```

---

### Task 8: "Ayrildim" RPC'si + otomatik ani donusumu (pg_cron)

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_check_inden_ayril_rpc.sql`
- Create: `mobil/supabase/migrations/<timestamp>_ani_donusumu_cron.sql`
- Modify: `mobil/lib/checkin.ts`
- Modify: `mobil/lib/checkin.test.ts`

**Interfaces:**
- Consumes: `public.check_inler` (Task 2).
- Produces: `checkIndenAyril(checkInId: string): Promise<void>` — Task 13'teki
  mekan ekrani/ana ekrandaki "ayrildim" butonu bunu cagirir.
- Produces: sunucu tarafinda periyodik calisan bir is — kullanici hicbir sey
  yapmasa da 4 saat sonra check-in otomatik aniya doner.

- [ ] **Step 1: `check_inden_ayril` migrasyonunu olustur ve yaz**

```bash
cd ~/projects/cloud/mobil
supabase migration new check_inden_ayril_rpc
```

```sql
create or replace function public.check_inden_ayril(p_check_in_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.check_inler
  set konum = null
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and konum is not null;
end;
$$;
```

- [ ] **Step 2: Ani donusumu cron isini olustur ve yaz**

```bash
supabase migration new ani_donusumu_cron
```

```sql
create extension if not exists pg_cron;

select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler set konum = null where konum is not null and bitis_zamani <= now(); $$
);
```

**Not:** hosted Supabase projelerinde `pg_cron` extension'i bazen migrasyondan
degil, Dashboard → Database → Extensions sayfasindan elle etkinlestirilmesi
gerekebiliyor (yetki hatasi alirsan). Migrasyon basarisiz olursa: Dashboard'da
`pg_cron`'u elle ac, sonra `select cron.schedule(...)` cagrisini SQL Editor'de
tek basina calistir.

- [ ] **Step 3: Migrasyonlari uygula**

```bash
supabase db push
```

- [ ] **Step 4: Dogrula**

Dashboard → SQL Editor:

```sql
select proname from pg_proc where proname = 'check_inden_ayril';
select jobname, schedule from cron.job where jobname = 'check-in-suresi-dolanlari-aniya-cevir';
```

Expected: ikisi de birer satir doner.

- [ ] **Step 5: Basarisiz istemci testini yaz**

`mobil/lib/checkin.test.ts` dosyasina ekle:

```ts
describe('checkIndenAyril', () => {
  it('check-in id sini rpc parametresi olarak gonderir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null })
    await checkIndenAyril('checkin-1')
    expect(supabase.rpc).toHaveBeenCalledWith('check_inden_ayril', {
      p_check_in_id: 'checkin-1',
    })
  })

  it('sunucu hatasini firlatir', async () => {
    ;(supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'yetkisiz' } })
    await expect(checkIndenAyril('checkin-1')).rejects.toThrow('yetkisiz')
  })
})
```

Import satirini guncelle: `import { checkInYap, checkIndenAyril } from './checkin'`

- [ ] **Step 6: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: FAIL — `checkIndenAyril` export edilmiyor.

- [ ] **Step 7: Istemci fonksiyonunu ekle**

`mobil/lib/checkin.ts` dosyasinin sonuna:

```ts
export async function checkIndenAyril(checkInId: string): Promise<void> {
  const { error } = await supabase.rpc('check_inden_ayril', { p_check_in_id: checkInId })
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 8: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: PASS, 4 test.

- [ ] **Step 9: Commit**

```bash
cd ~/projects/cloud
git add mobil/supabase/migrations mobil/lib/checkin.ts mobil/lib/checkin.test.ts
git commit -m "mobil: ayrildim RPC'si ve suresi dolan check-in'leri aniya ceviren zamanlanmis is"
```

---

### Task 9: OSM mekan yukleme betigi (tek seferlik, `araclar/`)

**Files:**
- Create: `araclar/mekan-yukle.py`
- Create: `araclar/README.md`

**Interfaces:**
- Produces: `public.mekanlar` tablosunda OSM kaynakli toplu veri (Task 1'in
  bos tablosunu doldurur). Uygulamanin calisma zamaninin parcasi degil,
  elle/periyodik calistirilan bagimsiz bir betik.

**Not:** Bu gorev diger gorevlerden farkli — TDD uygulanamaz (disaridan gelen
gercek, buyuk bir veri dosyasi isliyor). Dogrulama otomatik test yerine
kucuk bir alt-kume ile manuel calistirma ve satir sayisi kontrolu ile
yapiliyor.

- [ ] **Step 1: Bagimliliklari kur (sistem araci, npm degil)**

```bash
pip install osmium
```

`osmium` (PyOsmium), buyuk `.osm.pbf` dosyalarini bellege tamamen yuklemeden
akis halinde okuyabilen tek kutuphane — Turkiye ozutu ~2 GB oldugu icin
bu onemli.

- [ ] **Step 2: Betigi yaz**

`araclar/mekan-yukle.py`:

```python
"""Tek seferlik OSM -> mekanlar tablosu yukleme betigi.

Kullanim:
    python araclar/mekan-yukle.py turkey-latest.osm.pbf

Once https://download.geofabrik.de/europe/turkey.html adresinden
'turkey-latest.osm.pbf' dosyasini indir, sonra bu betigi calistir.
"""

import os
import sys

import osmium
from supabase import create_client

ILGILI_ETIKETLER = {
    "amenity": {"cafe", "bar", "restaurant", "pub", "fast_food"},
    "leisure": {"park"},
}

TUR_ESLEME = {
    "cafe": "kafe",
    "bar": "bar",
    "restaurant": "restoran",
    "pub": "bar",
    "fast_food": "restoran",
    "park": "park",
}


class MekanIsleyici(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.mekanlar = []

    def _uygun_mu(self, etiketler):
        for anahtar, degerler in ILGILI_ETIKETLER.items():
            if etiketler.get(anahtar) in degerler:
                return etiketler.get(anahtar)
        return None

    def node(self, n):
        deger = self._uygun_mu(n.tags)
        if deger is None or "name" not in n.tags:
            return
        self.mekanlar.append(
            {
                "ad": n.tags["name"],
                "tur": TUR_ESLEME[deger],
                "konum_lat": n.location.lat,
                "konum_lng": n.location.lon,
                "adres": n.tags.get("addr:full"),
                "osm_id": n.id,
            }
        )


def toplu_yaz(supabase, mekanlar, parca_boyutu=500):
    for i in range(0, len(mekanlar), parca_boyutu):
        parca = mekanlar[i : i + parca_boyutu]
        satirlar = [
            {
                "ad": m["ad"],
                "tur": m["tur"],
                "konum": f"POINT({m['konum_lng']} {m['konum_lat']})",
                "adres": m["adres"],
                "osm_id": m["osm_id"],
            }
            for m in parca
        ]
        supabase.table("mekanlar").insert(satirlar).execute()
        print(f"{i + len(parca)}/{len(mekanlar)} yazildi")


def main():
    if len(sys.argv) != 2:
        print("Kullanim: python araclar/mekan-yukle.py <dosya.osm.pbf>")
        sys.exit(1)

    isleyici = MekanIsleyici()
    isleyici.apply_file(sys.argv[1])
    print(f"{len(isleyici.mekanlar)} mekan bulundu")

    supabase = create_client(
        os.environ["EXPO_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )
    toplu_yaz(supabase, isleyici.mekanlar)


if __name__ == "__main__":
    main()
```

Not: `SUPABASE_SERVICE_ROLE_KEY` kullaniliyor cunku `mekanlar` tablosunda
dogrudan `insert` politikasi yok (Task 1) — bu betik RLS'i bilerek atlayan
tek yer, cunku tek seferlik ve guvenilir, elle calistirilan bir yonetim
islemi. Bu anahtar asla `mobil/.env` icine (istemci tarafina) konulmaz,
yalnizca betigi calistiran kisinin kendi kabuk ortaminda durur.

- [ ] **Step 3: Kullanim dokumantasyonunu yaz**

`araclar/README.md`:

```markdown
# Araclar

## mekan-yukle.py

OpenStreetMap'ten Turkiye'deki kafe/bar/restoran/park verisini `mekanlar`
tablosuna tek seferlik yukler.

1. https://download.geofabrik.de/europe/turkey.html adresinden
   `turkey-latest.osm.pbf` indir.
2. `pip install osmium supabase`
3. `SUPABASE_SERVICE_ROLE_KEY` ortam degiskenini ayarla (Dashboard →
   Project Settings → API → `service_role` anahtari — **gizli tut**).
4. `python araclar/mekan-yukle.py turkey-latest.osm.pbf`

Veri tazelemek istendiginde tekrar calistirilir. OSM lisansi (ODbL) geregi
uygulama icinde "Mekan verileri © OpenStreetMap katkida bulunanlar" atfi
gorunur olmali (bkz. Task 10, mekan arama ekrani altligi).
```

- [ ] **Step 4: Kucuk bir alt-kumeyle manuel dogrula**

Geofabrik'ten tum Turkiye yerine once kucuk bir bolge ozutu indir (ornegin
Marmara), `osmium extract` ile daha da kuculterek dene, ya da dogrudan
kucuk bir il dosyasiyla test et:

```bash
python araclar/mekan-yukle.py istanbul-latest.osm.pbf
```

Dashboard → Table Editor → `mekanlar`: satir sayisinin arttigini, `konum`
sutununun dolu oldugunu goz kontrolu ile dogrula.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add araclar
git commit -m "araclar: OSM mekan yukleme betigi"
```

---

### Task 10: Mekan arama ekrani

**Files:**
- Create: `mobil/src/app/mekanlar/index.tsx`
- Test: `mobil/src/app/mekanlar/index.test.tsx`

**Interfaces:**
- Consumes: `cihazKonumunuAl` (Task 4), `yakinMekanlariGetir`, `Mekan` (Task 5).
- Produces: her mekan satirina basinca `/mekanlar/[id]` rotasina yonlendirme
  (Task 13'teki mekan detay ekrani); "mekan ekle" butonuna basinca
  `/mekanlar/ekle` rotasina yonlendirme (Task 11).

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/src/app/mekanlar/index.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanAramaEkrani from './index'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir } from '../../../lib/mekan'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/mekan', () => ({ yakinMekanlariGetir: jest.fn() }))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MekanAramaEkrani', () => {
  it('acilista cihaz konumuna gore yakin mekanlari listeler', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanAramaEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
    expect(yakinMekanlariGetir).toHaveBeenCalledWith(41.015, 28.979, undefined)
  })

  it('bir mekana basinca detay ekranina yonlendirir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-1', ad: 'Sahil Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanAramaEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))

    expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('konum izni verilmezse hata gosterir', async () => {
    ;(cihazKonumunuAl as jest.Mock).mockRejectedValue(new Error('Konum izni verilmedi'))
    await render(<MekanAramaEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Konum izni verilmedi')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekanlar/index.test.tsx`
Expected: FAIL — `./index` module bulunamiyor.

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/mekanlar/index.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, type Mekan } from '../../../lib/mekan'

export default function MekanAramaEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  const [mekanlar, setMekanlar] = useState<Mekan[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function baslangicKonumunuYukle() {
      try {
        const konum = await cihazKonumunuAl()
        setCihazKonumu(konum)
        const sonuc = await yakinMekanlariGetir(konum.lat, konum.lng, undefined)
        setMekanlar(sonuc)
      } catch (e) {
        setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
      } finally {
        setYukleniyor(false)
      }
    }
    baslangicKonumunuYukle()
  }, [])

  async function aramaDegisti(metin: string) {
    setArama(metin)
    if (!cihazKonumu) return
    const sonuc = await yakinMekanlariGetir(cihazKonumu.lat, cihazKonumu.lng, metin || undefined)
    setMekanlar(sonuc)
  }

  if (yukleniyor) return <Text style={stiller.durum}>Yukleniyor...</Text>
  if (hata) return <Text style={stiller.hata}>{hata}</Text>

  return (
    <View style={stiller.kapsayici}>
      <TextInput
        style={stiller.arama}
        placeholder="Mekan ara"
        value={arama}
        onChangeText={aramaDegisti}
      />
      <FlatList
        data={mekanlar}
        keyExtractor={(mekan) => mekan.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => router.push(`/mekanlar/${item.id}`)}>
            <Text style={stiller.mekanAdi}>{item.ad}</Text>
            <Text style={stiller.mekanTuru}>{item.tur}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Yakinda mekan bulunamadi</Text>}
      />
      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>Mekan bulamadin mi? Ekle</Text>
      </Pressable>
      <Text style={stiller.atif}>Mekan verileri © OpenStreetMap katkida bulunanlar</Text>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  arama: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  satir: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mekanAdi: { fontSize: 16, fontWeight: '600' },
  mekanTuru: { color: '#666', marginTop: 2 },
  durum: { textAlign: 'center', marginTop: 24, color: '#666' },
  hata: { textAlign: 'center', marginTop: 24, color: '#c00' },
  ekleButonu: { padding: 14, alignItems: 'center' },
  ekleButonuYazi: { color: '#111', fontWeight: '600' },
  atif: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 8 },
})
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekanlar/index.test.tsx`
Expected: PASS, 3 test.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/mekanlar/index.tsx mobil/src/app/mekanlar/index.test.tsx
git commit -m "mobil: mekan arama ekrani"
```

---

### Task 11: Mekan ekleme ekrani

**Files:**
- Create: `mobil/src/app/mekanlar/ekle.tsx`
- Test: `mobil/src/app/mekanlar/ekle.test.tsx`

**Interfaces:**
- Consumes: `cihazKonumunuAl` (Task 4), `yakinMekanlariGetir`, `mekanEkle`,
  `Mekan` (Task 5, 6).
- Produces: basarili eklemeden sonra `/mekanlar/[id]` (yeni mekanin kendisi)
  rotasina yonlendirme.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/src/app/mekanlar/ekle.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanEkleEkrani from './ekle'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle } from '../../../lib/mekan'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/mekan', () => ({
  yakinMekanlariGetir: jest.fn().mockResolvedValue([]),
  mekanEkle: jest.fn(),
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
  ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([])
})

describe('MekanEkleEkrani', () => {
  it('gecerli bilgilerle mekanEkle cagirir ve yeni mekana yonlendirir', async () => {
    ;(mekanEkle as jest.Mock).mockResolvedValue({
      id: 'mekan-yeni', ad: 'Yeni Kafe', tur: 'kafe', adres: null, osmId: null,
      konum: { lat: 41.015, lng: 28.979 },
    })

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adi'), 'Yeni Kafe')
    await fireEvent.changeText(screen.getByPlaceholderText('Tur (kafe, bar, restoran, park...)'), 'kafe')
    await fireEvent.press(screen.getByText('Ekle'))

    await waitFor(() => {
      expect(mekanEkle).toHaveBeenCalledWith(
        'Yeni Kafe', 'kafe', { lat: 41.015, lng: 28.979 }, { lat: 41.015, lng: 28.979 }, undefined
      )
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/mekanlar/mekan-yeni')
  })

  it('sunucu mesafe hatasi donerse gosterir', async () => {
    ;(mekanEkle as jest.Mock).mockRejectedValue(new Error('Mekana yakin olmalisin (~200 m icinde)'))

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adi'), 'Uzak Kafe')
    await fireEvent.changeText(screen.getByPlaceholderText('Tur (kafe, bar, restoran, park...)'), 'kafe')
    await fireEvent.press(screen.getByText('Ekle'))

    await waitFor(() => {
      expect(screen.getByText('Mekana yakin olmalisin (~200 m icinde)')).toBeTruthy()
    })
  })

  it('yakinda benzer isimli mekan varsa uyari gosterir', async () => {
    ;(yakinMekanlariGetir as jest.Mock).mockResolvedValue([
      { id: 'mekan-benzer', ad: 'Yeni Kafe', tur: 'kafe', adres: null, osmId: 1, konum: { lat: 41.015, lng: 28.979 } },
    ])

    await render(<MekanEkleEkrani />)
    await waitFor(() => expect(cihazKonumunuAl).toHaveBeenCalled())
    await fireEvent.changeText(screen.getByPlaceholderText('Mekan adi'), 'Yeni Kafe')

    await waitFor(() => {
      expect(screen.getByText('Bunlardan biri mi demek istedin?')).toBeTruthy()
      expect(screen.getByText('Yeni Kafe')).toBeTruthy()
    })
    expect(mekanEkle).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- mekanlar/ekle.test.tsx`
Expected: FAIL — `./ekle` module bulunamiyor.

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/mekanlar/ekle.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle, type Mekan } from '../../../lib/mekan'

export default function MekanEkleEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [ad, setAd] = useState('')
  const [tur, setTur] = useState('')
  const [adres, setAdres] = useState('')
  const [benzerMekanlar, setBenzerMekanlar] = useState<Mekan[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  useEffect(() => {
    cihazKonumunuAl()
      .then(setCihazKonumu)
      .catch((e) => setHata(e instanceof Error ? e.message : 'Bir sorun olustu'))
  }, [])

  useEffect(() => {
    async function benzerleriAra() {
      if (!cihazKonumu || ad.trim().length < 2) {
        setBenzerMekanlar([])
        return
      }
      const sonuc = await yakinMekanlariGetir(cihazKonumu.lat, cihazKonumu.lng, ad.trim())
      setBenzerMekanlar(sonuc)
    }
    benzerleriAra()
  }, [ad, cihazKonumu])

  async function ekle() {
    setHata(null)
    if (!cihazKonumu) return
    if (ad.trim().length === 0 || tur.trim().length === 0) {
      setHata('Mekan adi ve turu gerekli')
      return
    }

    setGonderiliyor(true)
    try {
      const yeniMekan = await mekanEkle(
        ad.trim(),
        tur.trim(),
        cihazKonumu,
        cihazKonumu,
        adres.trim() || undefined
      )
      router.replace(`/mekanlar/${yeniMekan.id}`)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Yeni mekan ekle</Text>
      <TextInput style={stiller.girdi} placeholder="Mekan adi" value={ad} onChangeText={setAd} />
      <TextInput
        style={stiller.girdi}
        placeholder="Tur (kafe, bar, restoran, park...)"
        value={tur}
        onChangeText={setTur}
      />
      <TextInput style={stiller.girdi} placeholder="Adres (opsiyonel)" value={adres} onChangeText={setAdres} />

      {benzerMekanlar.length > 0 && (
        <View style={stiller.benzerKutu}>
          <Text style={stiller.benzerBaslik}>Bunlardan biri mi demek istedin?</Text>
          <FlatList
            data={benzerMekanlar}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/mekanlar/${item.id}`)}>
                <Text style={stiller.benzerMekan}>{item.ad}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={ekle} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Ekleniyor...' : 'Ekle'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  benzerKutu: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 12 },
  benzerBaslik: { fontWeight: '600', marginBottom: 6 },
  benzerMekan: { color: '#0645ad', paddingVertical: 4 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- mekanlar/ekle.test.tsx`
Expected: PASS, 3 test.

- [ ] **Step 5: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/mekanlar/ekle.tsx mobil/src/app/mekanlar/ekle.test.tsx
git commit -m "mobil: mekan ekleme ekrani (yakinlik kontrolu + mukerrer uyarisi)"
```

---

### Task 12: Check-in olusturma ekrani

**Files:**
- Create: `mobil/src/app/check-in/[mekanId].tsx`
- Test: `mobil/src/app/check-in/[mekanId].test.tsx`
- Create: `mobil/lib/checkin-fotograf-yukle.ts`
- Test: `mobil/lib/checkin-fotograf-yukle.test.ts`

**Interfaces:**
- Consumes: `cihazKonumunuAl` (Task 4), `checkInYap` (Task 7), `supabase`
  (Faz 1 Task 4).
- Produces: `checkinFotografYukle(kullaniciId: string, yerelUri: string):
  Promise<string>` — bu ekran tarafindan cagirilir, `check-in-fotograflari`
  bucket'ina yukler.
- Produces: basarili check-in sonrasi `/mekanlar/[mekanId]` rotasina
  yonlendirme (Task 13'teki mekan detay ekrani).

- [ ] **Step 1: Fotograf yukleme fonksiyonu icin basarisiz testi yaz**

`mobil/lib/checkin-fotograf-yukle.test.ts` — Faz 1'deki `fotografYukle`
testinin ayni deseni, farkli bucket:

```ts
import { checkinFotografYukle } from './checkin-fotograf-yukle'
import { supabase } from './supabase'
import * as FileSystem from 'expo-file-system'

jest.mock('./supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}))
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}))

describe('checkinFotografYukle', () => {
  it('check-in-fotograflari bucketina kullanici klasoru altina yukler', async () => {
    ;(FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64icerik')
    const upload = jest.fn().mockResolvedValue({ data: { path: 'kullanici-1/123.jpg' }, error: null })
    ;(supabase.storage.from as jest.Mock).mockReturnValue({ upload })

    const yol = await checkinFotografYukle('kullanici-1', 'file:///yerel/foto.jpg')

    expect(supabase.storage.from).toHaveBeenCalledWith('check-in-fotograflari')
    expect(upload.mock.calls[0][0]).toMatch(/^kullanici-1\//)
    expect(yol).toBe('kullanici-1/123.jpg')
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin-fotograf-yukle.test.ts`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 3: Fonksiyonu yaz**

`mobil/lib/checkin-fotograf-yukle.ts`:

```ts
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

export async function checkinFotografYukle(kullaniciId: string, yerelUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(yerelUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const dosyaYolu = `${kullaniciId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('check-in-fotograflari')
    .upload(dosyaYolu, decode(base64), { contentType: 'image/jpeg' })

  if (error) throw error
  return data.path
}
```

- [ ] **Step 4: Testin gectigini dogrula**

Run: `cd mobil && npm test -- checkin-fotograf-yukle.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Ekran icin basarisiz testi yaz**

`mobil/src/app/check-in/[mekanId].test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import CheckInEkrani from './[mekanId]'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'

jest.mock('../../../lib/konum', () => ({ cihazKonumunuAl: jest.fn() }))
jest.mock('../../../lib/checkin', () => ({ checkInYap: jest.fn() }))
jest.mock('../../../lib/checkin-fotograf-yukle', () => ({ checkinFotografYukle: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))

const mockRouterReplace = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useLocalSearchParams: () => ({ mekanId: 'mekan-1' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(cihazKonumunuAl as jest.Mock).mockResolvedValue({ lat: 41.015, lng: 28.979 })
})

describe('CheckInEkrani', () => {
  it('not ile check-in yapar ve mekan ekranina yonlendirir', async () => {
    ;(checkInYap as jest.Mock).mockResolvedValue({
      id: 'checkin-1', mekanId: 'mekan-1', notMetni: 'harika', fotograf: null,
      olusturmaZamani: '2026-08-14T10:00:00Z', bitisZamani: '2026-08-14T14:00:00Z', canliMi: true,
    })

    await render(<CheckInEkrani />)
    await fireEvent.changeText(screen.getByPlaceholderText('Bir not ekle (opsiyonel)'), 'harika')
    await fireEvent.press(screen.getByText('Check-in yap'))

    await waitFor(() => {
      expect(checkInYap).toHaveBeenCalledWith('mekan-1', { lat: 41.015, lng: 28.979 }, 'harika', undefined)
    })
    expect(mockRouterReplace).toHaveBeenCalledWith('/mekanlar/mekan-1')
  })

  it('sunucu mesafe hatasi donerse gosterir', async () => {
    ;(checkInYap as jest.Mock).mockRejectedValue(new Error('Mekana cok uzaksin (~500 m icinde olmalisin)'))

    await render(<CheckInEkrani />)
    await fireEvent.press(screen.getByText('Check-in yap'))

    await waitFor(() => {
      expect(screen.getByText('Mekana cok uzaksin (~500 m icinde olmalisin)')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 6: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- "check-in/\[mekanId\].test.tsx"`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 7: Ekrani yaz**

`mobil/src/app/check-in/[mekanId].tsx`:

```tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'

export default function CheckInEkrani() {
  const router = useRouter()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  const [yerelFotoUri, setYerelFotoUri] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [uyari, setUyari] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  async function fotografSec() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (!sonuc.canceled) {
      setYerelFotoUri(sonuc.assets[0].uri)
    }
  }

  async function checkInYapButonu() {
    setHata(null)
    setGonderiliyor(true)
    try {
      const konum = await cihazKonumunuAl()

      let yuklenenFotoYolu: string | undefined
      if (yerelFotoUri) {
        try {
          const { data: kullaniciVerisi } = await supabase.auth.getUser()
          const kullaniciId = kullaniciVerisi.user?.id
          if (kullaniciId) {
            yuklenenFotoYolu = await checkinFotografYukle(kullaniciId, yerelFotoUri)
          }
        } catch {
          // Fotograf yuklenemezse check-in'i engelleme — notsuz/fotografsiz devam eder.
          setUyari('Fotograf yuklenemedi, notunla check-in yapildi')
        }
      }

      await checkInYap(mekanId, konum, notMetni.trim() || undefined, yuklenenFotoYolu)
      router.replace(`/mekanlar/${mekanId}`)
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Network request failed') {
        setHata('Internet baglantisi yok, tekrar dene')
      } else {
        setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
      }
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Check-in yap</Text>
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Bir not ekle (opsiyonel)"
        value={notMetni}
        onChangeText={setNotMetni}
        multiline
      />
      <Pressable style={stiller.fotoButonu} onPress={fotografSec}>
        <Text style={stiller.fotoButonuYazi}>
          {yerelFotoUri ? 'Fotografi degistir' : 'Fotograf ekle (opsiyonel)'}
        </Text>
      </Pressable>
      {yerelFotoUri && <Image source={{ uri: yerelFotoUri }} style={stiller.onizleme} />}

      {uyari && <Text style={stiller.uyari}>{uyari}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={checkInYapButonu} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Check-in yapiliyor...' : 'Check-in yap'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  cokSatirli: { minHeight: 80, textAlignVertical: 'top' },
  fotoButonu: { padding: 12, alignItems: 'center', marginBottom: 12 },
  fotoButonuYazi: { color: '#0645ad' },
  onizleme: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  uyari: { color: '#a60', marginBottom: 12 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
```

**Not (spec'teki hata durumlari tablosundan):** "Fotograf yuklenemedi" durumunda
check-in **engellenmiyor** — yukleme basarisiz olursa notla (fotografsiz)
devam ediyor, kullaniciya turuncu bir uyari gosteriliyor. "Fotografi sonra
ekleme" (var olan bir check-in'e sonradan fotograf ekleme duzenleme akisi)
2a'nin kapsaminda **degil** — bu, "check-in'e izin ver" kismini karsiliyor,
"sonra ekleyebilir" kismi ayri bir duzenleme ekrani gerektirir ve YAGNI
geregi bu faza alinmadi. "Ag yok" durumunda spec'in tarif ettigi tam
"kuyrukta bekle, baglanti gelince gonder" davranisi (kalici yerel kuyruk +
baglanti dinleyicisi) bu plana **alinmadi** — bunun yerine acik bir hata
mesaji (`Internet baglantisi yok, tekrar dene`) gosteriliyor, buton tekrar
aktif kaliyor, kullanici manuel tekrar dener. Tam arka-plan kuyruklama,
kapsam buyuklugu nedeniyle Faz 2b sonrasina birakildi (bkz. plan sonundaki
"Sonraki adim").

- [ ] **Step 8: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- "check-in/\[mekanId\].test.tsx"`
Expected: PASS, 2 test.

- [ ] **Step 9: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/check-in mobil/lib/checkin-fotograf-yukle.ts mobil/lib/checkin-fotograf-yukle.test.ts
git commit -m "mobil: check-in olusturma ekrani (not + fotograf)"
```

---

### Task 13: Mekan detay ekrani ("su an burada" + "anilar")

**Files:**
- Create: `mobil/src/app/mekanlar/[id].tsx`
- Test: `mobil/src/app/mekanlar/[id].test.tsx`
- Modify: `mobil/lib/checkin.ts`
- Modify: `mobil/lib/checkin.test.ts`

**Interfaces:**
- Consumes: `supabase` (Faz 1 Task 4), `checkIndenAyril` (Task 8).
- Produces: `suAnBurdakileriGetir(mekanId: string): Promise<CheckInGorunumu[]>`,
  `mekanAnilariniGetir(mekanId: string): Promise<CheckInGorunumu[]>` —
  `CheckInGorunumu = CheckIn & { kullaniciAdi: string }`.
- Produces: "Check-in yap" butonu → `/check-in/[id]` (Task 12); aktif kendi
  check-in'i varsa "Ayrildim" butonu.

**Not:** `suAnBurdakileriGetir` ve `mekanAnilariniGetir`, RLS'in zaten
filtreledigi `check_inler` satirlarini okur — istemci kodu karsilikli
gorunurluk kuralini (karar #12) ayrica uygulamiyor, sadece "konum dolu mu
bos mu" ayrimini yapiyor (Task 2'deki RLS zaten yanlis satiri hic
dondurmedigi icin bu yeterli).

- [ ] **Step 1: Istemci sorgu fonksiyonlari icin basarisiz testi yaz**

`mobil/lib/checkin.test.ts` dosyasina ekle:

```ts
describe('suAnBurdakileriGetir', () => {
  it('mekana gore filtreler ve yalnizca canli satirlari ister', async () => {
    const eq2 = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-1', mekan_id: 'mekan-1', kullanici_id: 'kullanici-2', not_metni: null, fotograf: null,
          olusturma_zamani: '2026-08-14T10:00:00Z', bitis_zamani: '2026-08-14T14:00:00Z',
          konum: 'POINT(28.979 41.015)', profiller: { ad: 'Ada' },
        },
      ],
      error: null,
    })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const not = jest.fn().mockReturnValue({ eq: eq1 })
    const select = jest.fn().mockReturnValue({ not })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await suAnBurdakileriGetir('mekan-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].kullaniciAdi).toBe('Ada')
    expect(sonuc[0].kullaniciId).toBe('kullanici-2')
    expect(sonuc[0].canliMi).toBe(true)
  })
})

describe('mekanAnilariniGetir', () => {
  it('mekana gore filtreler ve yalnizca aniya donusmus satirlari ister', async () => {
    const eq1 = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-2', mekan_id: 'mekan-1', kullanici_id: 'kullanici-3', not_metni: 'guzel', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, profiller: { ad: 'Berk' },
        },
      ],
      error: null,
    })
    const is_ = jest.fn().mockReturnValue({ eq: eq1 })
    const select = jest.fn().mockReturnValue({ is: is_ })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await mekanAnilariniGetir('mekan-1')

    expect(sonuc[0].kullaniciAdi).toBe('Berk')
    expect(sonuc[0].canliMi).toBe(false)
  })
})
```

Import satirini guncelle:
`import { checkInYap, checkIndenAyril, suAnBurdakileriGetir, mekanAnilariniGetir } from './checkin'`
ve `supabase` mock'una `from: jest.fn()` ekle (mevcut `jest.mock('./supabase', ...)`
bloguna).

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: FAIL — `suAnBurdakileriGetir` export edilmiyor.

- [ ] **Step 3: Istemci fonksiyonlarini ekle**

`mobil/lib/checkin.ts` dosyasinin sonuna:

```ts
export type CheckInGorunumu = CheckIn & { kullaniciId: string; kullaniciAdi: string }

type CheckInSatiriProfilli = CheckInSatiri & { kullanici_id: string; profiller: { ad: string } }

function satiriGorunumeCevir(satir: CheckInSatiriProfilli): CheckInGorunumu {
  return {
    ...satiriCheckInACevir(satir),
    kullaniciId: satir.kullanici_id,
    kullaniciAdi: satir.profiller.ad,
  }
}

export async function suAnBurdakileriGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, profiller(ad)')
    .not('konum', 'is', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}

export async function mekanAnilariniGetir(mekanId: string): Promise<CheckInGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, kullanici_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, profiller(ad)')
    .is('konum', null)
    .eq('mekan_id', mekanId)
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriProfilli[]).map(satiriGorunumeCevir)
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Ekran icin basarisiz testi yaz**

`mobil/src/app/mekanlar/[id].test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import MekanDetayEkrani from './[id]'
import { suAnBurdakileriGetir, mekanAnilariniGetir, checkIndenAyril } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/checkin', () => ({
  suAnBurdakileriGetir: jest.fn(),
  mekanAnilariniGetir: jest.fn(),
  checkIndenAyril: jest.fn(),
}))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))

const mockRouterPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useLocalSearchParams: () => ({ id: 'mekan-1' }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('MekanDetayEkrani', () => {
  it('su an orada olanlari ve anilari iki ayri bolumde gosterir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciAdi: 'Ada', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-2', kullaniciAdi: 'Berk', notMetni: 'guzel', fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: false },
    ])

    await render(<MekanDetayEkrani />)

    await waitFor(() => {
      expect(screen.getByText('Ada')).toBeTruthy()
      expect(screen.getByText('Berk')).toBeTruthy()
    })
  })

  it('kendi aktif check-ini varsa ayrildim butonu gosterir ve basinca cagirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([
      { id: 'checkin-1', kullaniciId: 'kullanici-1', kullaniciAdi: 'Sen', notMetni: null, fotograf: null, mekanId: 'mekan-1', olusturmaZamani: '', bitisZamani: '', canliMi: true },
    ])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])
    ;(checkIndenAyril as jest.Mock).mockResolvedValue(undefined)

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Ayrildim'))
    await fireEvent.press(screen.getByText('Ayrildim'))

    await waitFor(() => {
      expect(checkIndenAyril).toHaveBeenCalledWith('checkin-1')
    })
  })

  it('check-in yap butonuna basinca check-in ekranina yonlendirir', async () => {
    ;(suAnBurdakileriGetir as jest.Mock).mockResolvedValue([])
    ;(mekanAnilariniGetir as jest.Mock).mockResolvedValue([])

    await render(<MekanDetayEkrani />)
    await waitFor(() => screen.getByText('Check-in yap'))
    await fireEvent.press(screen.getByText('Check-in yap'))

    expect(mockRouterPush).toHaveBeenCalledWith('/check-in/mekan-1')
  })
})
```

- [ ] **Step 6: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- "mekanlar/\[id\].test.tsx"`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 7: Ekrani yaz**

`mobil/src/app/mekanlar/[id].tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import {
  suAnBurdakileriGetir,
  mekanAnilariniGetir,
  checkIndenAyril,
  type CheckInGorunumu,
} from '../../../lib/checkin'

export default function MekanDetayEkrani() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [suAnBurdakiler, setSuAnBurdakiler] = useState<CheckInGorunumu[]>([])
  const [anilar, setAnilar] = useState<CheckInGorunumu[]>([])
  const [kendiKullaniciId, setKendiKullaniciId] = useState<string | null>(null)

  async function verileriYukle() {
    const [canlilar, gecmisAnilar, kullaniciVerisi] = await Promise.all([
      suAnBurdakileriGetir(id),
      mekanAnilariniGetir(id),
      supabase.auth.getUser(),
    ])
    setSuAnBurdakiler(canlilar)
    setAnilar(gecmisAnilar)
    setKendiKullaniciId(kullaniciVerisi.data.user?.id ?? null)
  }

  useEffect(() => {
    verileriYukle()
  }, [id])

  const kendiCheckIni = suAnBurdakiler.find((c) => c.kullaniciId === kendiKullaniciId)

  async function ayril(checkInId: string) {
    await checkIndenAyril(checkInId)
    await verileriYukle()
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.bolumBaslik}>Su an burada</Text>
      <FlatList
        data={suAnBurdakiler}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Su an kimse yok</Text>}
      />

      {kendiCheckIni ? (
        <Pressable style={stiller.buton} onPress={() => ayril(kendiCheckIni.id)}>
          <Text style={stiller.butonYazi}>Ayrildim</Text>
        </Pressable>
      ) : (
        <Pressable style={stiller.buton} onPress={() => router.push(`/check-in/${id}`)}>
          <Text style={stiller.butonYazi}>Check-in yap</Text>
        </Pressable>
      )}

      <Text style={stiller.bolumBaslik}>Anilar</Text>
      <FlatList
        data={anilar}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir ani yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  bolumBaslik: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  satir: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  kullaniciAdi: { fontSize: 16, fontWeight: '600' },
  not: { color: '#555', marginTop: 2 },
  durum: { color: '#666' },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
```

- [ ] **Step 8: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- "mekanlar/\[id\].test.tsx"`
Expected: PASS, 3 test.

- [ ] **Step 9: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/mekanlar/\[id\].tsx mobil/src/app/mekanlar/\[id\].test.tsx mobil/lib/checkin.ts mobil/lib/checkin.test.ts
git commit -m "mobil: mekan detay ekrani (su an burada + anilar, ayrildim butonu)"
```

---

### Task 14: Profildeki anilar ekrani

**Files:**
- Create: `mobil/src/app/profil/anilar.tsx`
- Test: `mobil/src/app/profil/anilar.test.tsx`
- Modify: `mobil/lib/checkin.ts`
- Modify: `mobil/lib/checkin.test.ts`

**Interfaces:**
- Consumes: `supabase` (Faz 1 Task 4).
- Produces: `kendiAnilariniGetir(): Promise<AniGorunumu[]>`,
  `aniyiSil(checkInId: string): Promise<void>` — `AniGorunumu = CheckIn &
  { mekanAdi: string; mekanKonumu: { lat: number; lng: number } }`.
- Anilardan birine tiklayinca cihazin harita uygulamasi `Linking.openURL` ile
  acilir (karar #16) — ayri bir harita kutuphanesi yok.

- [ ] **Step 1: Istemci fonksiyonlari icin basarisiz testi yaz**

`mobil/lib/checkin.test.ts` dosyasina ekle:

```ts
describe('kendiAnilariniGetir', () => {
  it('yalnizca kendi aniya donusmus check-inlerini mekan bilgisiyle getirir', async () => {
    const order = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'checkin-3', mekan_id: 'mekan-1', not_metni: 'harika', fotograf: null,
          olusturma_zamani: '2026-08-10T10:00:00Z', bitis_zamani: '2026-08-10T14:00:00Z',
          konum: null, mekanlar: { ad: 'Sahil Kafe', konum: 'POINT(28.979 41.015)' },
        },
      ],
      error: null,
    })
    const is_ = jest.fn().mockReturnValue({ order })
    const eq = jest.fn().mockReturnValue({ is: is_ })
    const select = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select })

    const sonuc = await kendiAnilariniGetir('kullanici-1')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(sonuc[0].mekanAdi).toBe('Sahil Kafe')
    expect(sonuc[0].mekanKonumu).toEqual({ lat: 41.015, lng: 28.979 })
  })
})

describe('aniyiSil', () => {
  it('check-in id sine gore satiri siler', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null })
    const del = jest.fn().mockReturnValue({ eq })
    ;(supabase.from as jest.Mock) = jest.fn().mockReturnValue({ delete: del })

    await aniyiSil('checkin-3')

    expect(supabase.from).toHaveBeenCalledWith('check_inler')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'checkin-3')
  })
})
```

Import satirini guncelle:
`import { ..., kendiAnilariniGetir, aniyiSil } from './checkin'`

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- checkin.test.ts`
Expected: FAIL — `kendiAnilariniGetir` export edilmiyor.

- [ ] **Step 3: Istemci fonksiyonlarini ekle**

`mobil/lib/checkin.ts` dosyasinin sonuna:

```ts
export type AniGorunumu = CheckIn & { mekanAdi: string; mekanKonumu: { lat: number; lng: number } }

type CheckInSatiriMekanli = CheckInSatiri & { mekanlar: { ad: string; konum: string } }

function noktayiCoz(wkt: string): { lat: number; lng: number } {
  const eslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!eslesme) throw new Error(`Beklenmeyen konum formati: ${wkt}`)
  return { lng: parseFloat(eslesme[1]), lat: parseFloat(eslesme[2]) }
}

export async function kendiAnilariniGetir(kullaniciId: string): Promise<AniGorunumu[]> {
  const { data, error } = await supabase
    .from('check_inler')
    .select('id, mekan_id, not_metni, fotograf, olusturma_zamani, bitis_zamani, konum, mekanlar(ad, konum)')
    .eq('kullanici_id', kullaniciId)
    .is('konum', null)
    .order('olusturma_zamani', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as CheckInSatiriMekanli[]).map((satir) => ({
    ...satiriCheckInACevir(satir),
    mekanAdi: satir.mekanlar.ad,
    mekanKonumu: noktayiCoz(satir.mekanlar.konum),
  }))
}

export async function aniyiSil(checkInId: string): Promise<void> {
  const { error } = await supabase.from('check_inler').delete().eq('id', checkInId)
  if (error) throw new Error(error.message)
}
```

**Not:** `noktayiCoz` burada `lib/mekan.ts`'teki ayniyla tekrar ediliyor. Bu
kasitli kucuk bir tekrar degil — bunu paylasilan bir yardimciya cikarmak
gerekiyordu ama iki modul birbirini import etmiyordu (DRY ihlali). Bu
adimi uygulayan gorevli, `noktayiCoz`'u `lib/konum.ts`'e tasiyip hem
`lib/mekan.ts` hem `lib/checkin.ts`'in oradan import etmesini saglamali
(ikisindeki yerel kopyalari silip `import { noktayiCoz } from './konum'`
eklemeli), testleri tekrar calistirip hala gectigini dogrulamali.

- [ ] **Step 4: Tekrari gider (yukaridaki nota gore)**

`mobil/lib/konum.ts` dosyasinin sonuna ekle:

```ts
export function noktayiCoz(wkt: string): { lat: number; lng: number } {
  const eslesme = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!eslesme) throw new Error(`Beklenmeyen konum formati: ${wkt}`)
  return { lng: parseFloat(eslesme[1]), lat: parseFloat(eslesme[2]) }
}
```

`mobil/lib/mekan.ts` ve `mobil/lib/checkin.ts` icindeki yerel `noktayiCoz`
tanimlarini sil, ikisine de `import { noktayiCoz } from './konum'` ekle.

- [ ] **Step 5: Tum testlerin gectigini dogrula**

Run: `cd mobil && npm test -- konum.test.ts mekan.test.ts checkin.test.ts`
Expected: PASS, tumu.

- [ ] **Step 6: Ekran icin basarisiz testi yaz**

`mobil/src/app/profil/anilar.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import AnilarEkrani from './anilar'
import { kendiAnilariniGetir, aniyiSil } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

jest.mock('../../../lib/checkin', () => ({ kendiAnilariniGetir: jest.fn(), aniyiSil: jest.fn() }))
jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'kullanici-1' } } }) } },
}))
jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

beforeEach(() => {
  jest.clearAllMocks()
  ;(kendiAnilariniGetir as jest.Mock).mockResolvedValue([
    {
      id: 'checkin-3', mekanId: 'mekan-1', mekanAdi: 'Sahil Kafe', notMetni: 'harika', fotograf: null,
      olusturmaZamani: '2026-08-10T10:00:00Z', bitisZamani: '2026-08-10T14:00:00Z', canliMi: false,
      mekanKonumu: { lat: 41.015, lng: 28.979 },
    },
  ])
})

describe('AnilarEkrani', () => {
  it('anilari mekan adiyla listeler', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => {
      expect(screen.getByText('Sahil Kafe')).toBeTruthy()
    })
  })

  it('bir aniya tiklayinca haritayi acar', async () => {
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sahil Kafe'))
    expect(Linking.openURL).toHaveBeenCalledWith('https://maps.google.com/?q=41.015,28.979')
  })

  it('sil butonuna basinca aniyiSil cagirir ve listeden kaldirir', async () => {
    ;(aniyiSil as jest.Mock).mockResolvedValue(undefined)
    await render(<AnilarEkrani />)
    await waitFor(() => screen.getByText('Sahil Kafe'))
    await fireEvent.press(screen.getByText('Sil'))
    await waitFor(() => {
      expect(aniyiSil).toHaveBeenCalledWith('checkin-3')
    })
  })
})
```

- [ ] **Step 7: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- profil/anilar.test.tsx`
Expected: FAIL — module bulunamiyor.

- [ ] **Step 8: Ekrani yaz**

`mobil/src/app/profil/anilar.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { kendiAnilariniGetir, aniyiSil, type AniGorunumu } from '../../../lib/checkin'

export default function AnilarEkrani() {
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])

  async function anilariYukle() {
    const { data: kullaniciVerisi } = await supabase.auth.getUser()
    const kullaniciId = kullaniciVerisi.user?.id
    if (!kullaniciId) return
    setAnilar(await kendiAnilariniGetir(kullaniciId))
  }

  useEffect(() => {
    anilariYukle()
  }, [])

  function haritadaAc(konum: { lat: number; lng: number }) {
    Linking.openURL(`https://maps.google.com/?q=${konum.lat},${konum.lng}`)
  }

  async function sil(checkInId: string) {
    await aniyiSil(checkInId)
    setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Anilarim</Text>
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Pressable onPress={() => haritadaAc(item.mekanKonumu)}>
              <Text style={stiller.mekanAdi}>{item.mekanAdi}</Text>
              {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
            </Pressable>
            <Pressable onPress={() => sil(item.id)}>
              <Text style={stiller.silButonu}>Sil</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir anin yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  satir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  mekanAdi: { fontSize: 16, fontWeight: '600', color: '#0645ad' },
  not: { color: '#555', marginTop: 2 },
  silButonu: { color: '#c00' },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
})
```

- [ ] **Step 9: Testlerin gectigini dogrula**

Run: `cd mobil && npm test -- profil/anilar.test.tsx`
Expected: PASS, 3 test.

- [ ] **Step 10: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/profil mobil/lib/checkin.ts mobil/lib/checkin.test.ts mobil/lib/mekan.ts mobil/lib/konum.ts
git commit -m "mobil: profildeki anilar ekrani (harita linki + silme)"
```

---

### Task 15: Ana ekrani mekanlara bagla

**Files:**
- Modify: `mobil/src/app/index.tsx`
- Modify: `mobil/src/app/index.test.tsx` (varsa; yoksa olustur)

**Interfaces:**
- Consumes: Task 10 (`/mekanlar`), Task 14 (`/profil/anilar`).
- Produces: kullanicinin Faz 1'in "Hesabin hazir" ekranindan Faz 2a'nin
  ozelliklerine ulasabildigi son baglanti.

- [ ] **Step 1: Mevcut testi oku ve neyin degisecegini belirle**

Run: `cd mobil && cat __tests__/ekranlar/index.test.tsx 2>/dev/null || echo "yok"`

Bu dosyanin mevcut icerigine gore asagidaki adimda hangi metnin/butonun
degistigini uyarla; mevcut "Cikis yap" testini bozma, yalnizca yeni iki
buton icin test ekle.

- [ ] **Step 2: Yeni butonlar icin basarisiz testi ekle**

`__tests__/ekranlar/index.test.tsx` (ya da mevcut dosyanin sonuna) ekle:

```tsx
it('mekanlara git butonuna basinca /mekanlar rotasina yonlendirir', async () => {
  await render(<AnaEkran />)
  await fireEvent.press(screen.getByText('Mekanlari kesfet'))
  expect(mockRouterPush).toHaveBeenCalledWith('/mekanlar')
})

it('anilarim butonuna basinca /profil/anilar rotasina yonlendirir', async () => {
  await render(<AnaEkran />)
  await fireEvent.press(screen.getByText('Anilarim'))
  expect(mockRouterPush).toHaveBeenCalledWith('/profil/anilar')
})
```

Bu testler dosyanin ustunde zaten `expo-router`'in `useRouter` mock'unu
`push: mockRouterPush` iceriyor olmali (Faz 1'deki desen); yoksa ekle.

- [ ] **Step 3: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm test -- __tests__/ekranlar/index.test.tsx`
Expected: FAIL — "Mekanlari kesfet" / "Anilarim" bulunamiyor.

- [ ] **Step 4: Ana ekrani guncelle**

`mobil/src/app/index.tsx` — mevcut icerigi koruyarak (cikis butonu vs.) iki
buton ekle:

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function AnaEkran() {
  const router = useRouter()

  async function cikisYap() {
    await supabase.auth.signOut()
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabin hazir</Text>
      <Text style={stiller.aciklama}>
        Yakinindaki mekanlari kesfet, check-in yap.
      </Text>
      <Pressable style={stiller.buton} onPress={() => router.push('/mekanlar')}>
        <Text style={stiller.butonYazi}>Mekanlari kesfet</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/profil/anilar')}>
        <Text style={stiller.ikincilButonYazi}>Anilarim</Text>
      </Pressable>
      <Pressable style={stiller.cikisButonu} onPress={cikisYap}>
        <Text style={stiller.cikisYazi}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  aciklama: { color: '#555', textAlign: 'center', marginBottom: 24 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', width: '100%' },
  butonYazi: { color: '#fff', fontWeight: '600' },
  ikincilButon: { padding: 14, alignItems: 'center', width: '100%' },
  ikincilButonYazi: { color: '#111', fontWeight: '600' },
  cikisButonu: { padding: 14, alignItems: 'center' },
  cikisYazi: { color: '#c00' },
})
```

- [ ] **Step 5: Testlerin gectigini dogrula**

Run: `cd mobil && npm test`
Expected: PASS, tum test suite'i (Faz 1 + Faz 2a).

- [ ] **Step 6: Web'de uctan uca manuel dogrula**

Run: `cd mobil && npx expo start --web`
Expected: giris yap → "Mekanlari kesfet" → konum izni → mekan listesi →
bir mekana check-in yap → mekan ekraninda kendi check-in'ini gor →
"Ayrildim" → "Anilarim"da anini gor → sil. Sunucuyu durdur.

- [ ] **Step 7: Commit**

```bash
cd ~/projects/cloud
git add mobil/src/app/index.tsx __tests__/ekranlar/index.test.tsx
git commit -m "mobil: ana ekrani mekan kesfi ve anilara baglar"
```

---

## Sonraki adim

Faz 2a tamamlandiginda kullanici check-in yapabiliyor, mekan ekleyebiliyor,
anilarini gorup silebiliyor — ama genel "yakindakiler" kesfi yok. Siradaki
adim Faz 2b'nin (kesif ve guvenlik: yakindakiler sorgusu, gorunurluk
tercihi arayuzu, gizli check-in, engelleme, sikayet) kendi spec → plan
dongusu.

**Bilerek kucuk tutulan bir spec sapmasi:** spec'in hata durumlari
tablosundaki "Ag yok → check-in kuyrukta bekler, baglanti gelince gonderilir"
davranisi bu planda tam uygulanmiyor (Task 12, Step 7'deki not). Yerine acik
hata mesaji + manuel tekrar deneme konuldu. Tam arka-plan kuyruklama
(kalici yerel kuyruk, baglanti durumu dinleyicisi, otomatik yeniden
gonderme) ayri, kucuk bir gorev olarak Faz 2b'den once ya da onunla birlikte
ele alinabilir.
