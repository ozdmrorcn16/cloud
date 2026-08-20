# Faz 3b - Birebir sohbet - uygulama plani

> **Ajan calisanlar icin:** GEREKLI ALT BECERI:
> `superpowers:subagent-driven-development` (onerilen) ya da
> `superpowers:executing-plans` ile bu plani gorev gorev uygula.
> Adimlar takip icin `- [ ]` kutucuk sozdizimi kullaniyor.

**Amac:** Bag kurmus iki kisi birbirine gercek zamanli mesaj yazabilsin;
yazma yetkisi her mesajda sunucuda olculsun.

**Mimari:** Faz 3a'nin `takipler` tablosu semasi degismeden takip
karsilikli hale getiriliyor (kabul iki yon de yaziyor). Ustune uc yeni
tablo (`konusmalar`, `konusma_uyeleri`, `mesajlar`), tek bir yazma kapisi
(`bag.yazabilir_mi`) ve bes RPC geliyor. Istemci tarafinda bir modul
(`lib/sohbet.ts`), iki yeni ekran ve uc ekran degisikligi var. Gercek
zamanli akis Supabase Realtime'in `mesajlar` insert olaylarina abonelikle
kuruluyor; yetki okuma RLS'inden geliyor.

**Teknoloji:** Expo + React Native (expo-router), Supabase (Postgres,
RLS, Realtime), TypeScript, Jest + @testing-library/react-native 14.0.1.

**Spec:** `docs/superpowers/specs/2026-08-20-faz3b-birebir-sohbet-design.md`

## Global Constraints

- Butun kullanici arayuzu metinleri **Turkce**. Kodda, yorumlarda, test
  adlarinda ve belgelerde Turkce aksanli harf **kullanilmiyor** (duz
  ASCII: c, g, i, o, s, u). Duz ASCII kesme isareti (`'`) serbest;
  tipografik `U+2019` ve em dash `U+2014` **yasak**.
- Dosyalar **UTF-8 BOM'suz**. Yeni dosyalarda bayt bazinda dogrula:
  `head -c 3 <dosya> | od -An -tx1` sonucu `ef bb bf` OLMAMALI.
- **Uygulanmis bir migrasyon dosyasi duzenlenmez.** `supabase db push`
  yalnizca daha once calistirmadigi dosyalari calistirir; duzeltme her
  zaman yeni bir migrasyon dosyasiyla yapilir.
- Her `public` semasindaki `security definer` fonksiyon
  `set search_path = public` icerir, ilk satirda `auth.uid() is null`
  kontrolu yapar ve `revoke execute ... from public, anon;` +
  `grant execute ... to authenticated;` ile biter.
- RLS politikalari `takipler`, `engellemeler` ya da `sohbet_istekleri`
  tablolarina **dogrudan alt sorguyla bakmaz**; yalnizca `bag.*` ve
  `gizli.*` yardimcilarini cagirir. Gerekce: Faz 2b'de `check_inler`
  politikasi kendi tablosuna alt sorguyla baktigi icin Postgres her
  sorguyu "infinite recursion detected in policy" ile reddetti.
- Yeni tablolarda `authenticated` rolunden `insert`, `update` ve
  `delete` **geri alinir**; yalnizca `select` kalir. Yazma tamamen RPC
  uzerinden.
- Bag durumu degerleri tam olarak: `beklemede`, `kabul`.
  Bulunurluk: `herkese_acik`, `takipcilerim`, `gizli`.
  Ani gorunurlugu: `herkese_acik`, `takipcilerim`, `kimse`.
- Mesaj metni: kirpilmis uzunlugu **1 ile 2000** arasi.
- Test dosyalari **asla** `mobil/src/app` altina konmaz - orasi
  expo-router'in rota koku. Ekran testleri `mobil/__tests__/ekranlar/`
  altinda.
- `@testing-library/react-native` **14.0.1**: `render()` ve `fireEvent`
  **asenkron**, hepsine `await` gerekir.
- Tam Jest paketi **`npx jest --runInBand`** ile calistirilir.
- `npx tsc --noEmit` dogrulama setinin parcasi. Taban durum: `@types/node`
  kurulu olmadigi icin var olan **bes** hata. Bu sayi artmamali.
- **`npm run test:gorunurluk --tavan` calistirilmaz.** Tek kosumda test
  hesabinin gunluk kotasina 50 kalici satir yazar.
- Komutlar `mobil/` dizininden calistirilir.
- Commit'ler yereldir; push faz sonunda bir kez yapilir.

**Taban olcumler (bu plan basladiginda):**

| Kosum | Deger |
|---|---|
| `npx jest --runInBand` | 36 paket / 252 test |
| `npm run test:sema` | 53 dogrulama |
| `npm run test:gorunurluk` | 82 dogrulama, sifir hata |
| `npx tsc --noEmit` | 5 onceden var olan hata |

---

## Dosya haritasi

**Migrasyonlar (hepsi yeni dosya):** takip karsilikliligi, uc tablo,
yazma kapisi, bes RPC, sikayet hedefi, Realtime yayini.

**Istemci:**

| Dosya | Sorumluluk |
|---|---|
| `mobil/lib/sohbet.ts` (yeni) | Mesaj RPC'lerinin sarmalayicilari ve Realtime aboneligi |
| `mobil/lib/bag.ts` (degisir) | `takipciyiCikar` kaldirilir |
| `mobil/src/app/mesajlar.tsx` (yeni) | Mesaj kutusu |
| `mobil/src/app/sohbet/[kullaniciId].tsx` (yeni) | Konusma ekrani |
| `mobil/src/app/index.tsx` (degisir) | "Mesajlar" girisi + rozet |
| `mobil/src/app/kullanici/[id].tsx` (degisir) | "Mesaj gonder" butonu |
| `mobil/src/app/baglar.tsx` (degisir) | Iki takip listesi tek listeye iner |

**Test kosucusu:**

| Dosya | Sorumluluk |
|---|---|
| `mobil/gorunurluk-testleri/yardimcilar.ts` | Yonetici istemcisi + kota temizligi |
| `mobil/gorunurluk-testleri/calistir.ts` | 19-28 guncellenir, 13 yeni senaryo |
| `mobil/gorunurluk-testleri/sema-dogrula.ts` | Yeni tablolara dogrudan yazma reddi |

---

### Task 1: Test kosucusunun kota temizligi

Bu gorev **once** geliyor: sonraki her canli test gorevinin ustune
oturdugu zemin bu. Gorunurluk paketi kendi senaryolarinda gercek istek
gonderiyor, bunlar gunluk 50 istek tavanindan dusuyor, tavan ekle-only
bir gunlugu sayiyor ve istemci o satirlari tasarim geregi silemiyor.
Sonuc: paket gunde ~8 kosumdan sonra **yanlis alarm** vermeye basliyor.
Bu faz istek gonderen senaryo sayisini artiriyor, yani cozulmezse fazin
kendi dogrulamasi curur.

**Files:**
- Modify: `mobil/gorunurluk-testleri/yardimcilar.ts`

**Interfaces:**
- Produces: `yoneticiIstemcisi(): SupabaseClient | null`,
  `kotayiTemizle(kimlikler: string[]): Promise<void>`

- [ ] **Step 1: Ortam degiskenini ekle**

`mobil/.env` dosyasina (gitignored) su satir eklenir:

```
SUPABASE_SERVICE_ROLE_KEY=<Supabase panelinden alinan service_role anahtari>
```

Anahtar Supabase panelinde Project Settings -> API -> `service_role`
altinda. **Bu anahtar asla depoya girmez**; `.env` gitignored ve oyle
kalmali.

Anahtar yoksa gorev yine tamamlanir: temizlik atlanir ve gurultulu bir
uyari basilir (Step 2). Faz bu yuzden bloke olmaz.

- [ ] **Step 2: Yonetici istemcisini ve temizligi yaz**

`mobil/gorunurluk-testleri/yardimcilar.ts` sonuna:

```ts
// Yonetici istemcisi YALNIZCA test kosucusu icindir. Uygulama kodu bu
// anahtari hicbir yerde kullanmaz. Anahtar yoksa null doner ve cagiran
// taraf temizligi atlar - faz bloke olmaz, yalnizca uyari basilir.
export function yoneticiIstemcisi(): SupabaseClient | null {
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!anahtar) return null
  return createClient(SUPABASE_URL, anahtar, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Gorunurluk paketinin senaryolari gercek istek gonderiyor ve bunlar
// gunluk 50 istek tavanindan dusuyor. Tavan ekle-only `istek_gunlugu`
// tablosunu sayiyor; istemci o satirlari TASARIM GEREGI silemiyor
// (RLS acik, politika yok) - tavanin atlatilamaz olmasinin sebebi bu.
// Bu yuzden temizlik yonetici anahtariyla yapilir ve YALNIZCA test
// hesaplarinin satirlarini hedefler.
//
// Urun degismezligi bozulmuyor: ekle-only olmasi ISTEMCIYE karsi
// zorlanan bir kural ve o kural yerinde kaliyor.
export async function kotayiTemizle(kimlikler: string[]): Promise<void> {
  const yonetici = yoneticiIstemcisi()
  if (!yonetici) {
    console.warn(
      '\n  UYARI: SUPABASE_SERVICE_ROLE_KEY yok, istek kotasi temizlenmedi.\n' +
        '  Paket gunde ~8 kosumdan sonra kota yuzunden YANLIS ALARM verir.\n' +
        '  Bir dusme gorursen once kotayi kontrol et, kodu degil.\n'
    )
    return
  }
  const { error } = await yonetici
    .from('istek_gunlugu')
    .delete()
    .in('gonderen_id', kimlikler)
  if (error) {
    console.error('  Kota temizligi basarisiz:', error.message)
  }
}
```

`SupabaseClient` tipi ve `createClient` dosyada zaten import edilmis
degilse import satirina eklenir.

- [ ] **Step 3: `temizle()` sonunda cagir**

`yardimcilar.ts` icindeki mevcut `temizle()` fonksiyonunun **sonuna**,
mevcut temizlik adimlarindan sonra:

```ts
  await kotayiTemizle([t.aId, t.bId, t.cId].filter(Boolean) as string[])
```

`temizle()`'nin aldigi nesnede hesap kimliklerinin hangi adla durdugunu
dosyadan oku ve ona gore yaz; yukaridaki adlar tahmindir, **dosyadaki
gercek adlari kullan**.

- [ ] **Step 4: Calistir ve dogrula**

```bash
cd mobil
npm run test:gorunurluk
```

Beklenen: 82 dogrulama, sifir hata. Kosum sonunda ya temizlik sessizce
calisir ya da anahtar yoksa uyari basilir.

Ardindan **ikinci kez** calistir. Ikinci kosum da 82/0 vermeli - kota
birikmedigi icin. (Anahtar yoksa bu adim atlanir ve raporda belirtilir.)

- [ ] **Step 5: Commit**

```bash
git add mobil/gorunurluk-testleri/yardimcilar.ts
git commit -m "test: gorunurluk kosucusu kendi istek kotasini temizlesin"
```

---

### Task 2: Takip karsilikli hale gelsin

**UYARI:** Bu gorevden sonra canli senaryolarin bir kismi (19-28 arasi
takip yonuyle ilgili olanlar) duser. Bu **beklenen** ve plan bunu
kabul ediyor: senaryolar Task 17'de guncellenecek. Ters sira daha kotu
olurdu (senaryolar henuz var olmayan davranisi test ederdi).

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_takip_karsilikli.sql`

**Interfaces:**
- Produces: degismis `takip_istegini_yanitla`, `takibi_birak`;
  dusurulmus `takipciyi_cikar`.

- [ ] **Step 1: Migrasyonu olustur**

```bash
cd mobil
supabase migration new takip_karsilikli
```

- [ ] **Step 2: Migrasyonu yaz**

```sql
-- Takip artik KARSILIKLI (karar 42). Kabul iki yonu de yaziyor, bagi
-- koparmak iki yonu de siliyor. Sema degismiyor; degisen tek sey
-- satirlarin ne zaman yazildigi.
--
-- Karsiliklilik tek bir yerde, bu RPC'de kuruluyor. `takipler` tablosuna
-- yalnizca security definer RPC'ler yazabiliyor (insert/update politikasi
-- bilerek yok), dolayisiyla ikinci satiri atlayan bir yazma yolu yok.
--
-- Govde 20260819190203_bag_rpcleri.sql'den kopyalandi; yalnizca kabul
-- kolundaki ayna insert'i ve `not found` kontrolunun yeri degisti.

create or replace function public.takip_istegini_yanitla(
  p_kullanici_id uuid,
  p_kabul boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Yalnizca ALICI yanitlayabilir: where kosulundaki takip_edilen_id
  -- auth.uid(). Gonderen kendi istegini kabul edemez.
  if p_kabul then
    update public.takipler
      set durum = 'kabul'
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';

    if not found then
      raise exception 'Yanitlanacak istek bulunamadi';
    end if;

    -- Ayna satir: bag karsilikli. `not found` kontrolu bu insert'ten
    -- ONCE yapilmali, yoksa insert `found`'u ezer ve olmayan bir istek
    -- sessizce kabul edilmis gorunur.
    insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
    values (auth.uid(), p_kullanici_id, 'kabul')
    on conflict (takip_eden_id, takip_edilen_id)
      do update set durum = 'kabul';
  else
    -- Red satiri siliniyor (karar #37).
    delete from public.takipler
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';

    if not found then
      raise exception 'Yanitlanacak istek bulunamadi';
    end if;
  end if;
end;
$$;

revoke execute on function public.takip_istegini_yanitla(uuid, boolean) from public, anon;
grant execute on function public.takip_istegini_yanitla(uuid, boolean) to authenticated;

-- Bagi koparmak iki yonu de siler.
create or replace function public.takibi_birak(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.takipler
    where (takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id)
       or (takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid());
end;
$$;

revoke execute on function public.takibi_birak(uuid) from public, anon;
grant execute on function public.takibi_birak(uuid) to authenticated;

-- takipciyi_cikar artik takibi_birak ile ayni ise iniyor; dusuruluyor.
drop function if exists public.takipciyi_cikar(uuid);

-- Geri doldurma: mevcut kabul edilmis TEK YONLU satirlar icin ayna
-- satiri ekleniyor. Bekleyen istekler dokunulmadan kaliyor - onlar
-- henuz bag degil.
insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
select t.takip_edilen_id, t.takip_eden_id, 'kabul'
from public.takipler t
where t.durum = 'kabul'
on conflict (takip_eden_id, takip_edilen_id) do nothing;
```

- [ ] **Step 3: Uygula**

```bash
cd mobil
supabase db push
npm run test:sema
```

`test:sema` 53 dogrulamayla gecmeli (bu gorev sema iddialarini
degistirmiyor).

- [ ] **Step 4: Geri doldurmayi dogrula**

Kalan tek yonlu kabul satiri olmadigini dogrula. `test:sema` icine yeni
bir iddia ekle (dosyadaki mevcut desene uy):

```ts
// Karsilikli takip degismezligi: kabul edilmis her satirin aynasi da
// olmali. Tek yonlu kalmis bir satir, yazma kapisinin sessizce yanlis
// cevap vermesi demek olurdu.
const { data: tekYonluler } = await a
  .from('takipler')
  .select('takip_eden_id, takip_edilen_id, durum')
  .eq('durum', 'kabul')
```

Bu istemci sorgusu yalnizca cagiranin taraf oldugu satirlari gorur
(`takipler`'in RLS'i boyle), yani tam kontrol icin yetmez.

Tam kontrolu **kosucunun yonetici istemcisiyle** yap (Task 1'de
eklendi): butun `kabul` satirlarini cek ve her biri icin aynasinin var
oldugunu `esitMi` ile iddia et.

Yonetici anahtari yoksa bu iddia yazilamaz. O durumda iddiayi **hic
ekleme** ve raporunda acikca "karsilikli takip degismezligi
dogrulanamadi, SUPABASE_SERVICE_ROLE_KEY yok" diye yaz. Anahtar yokken
gecmis gibi gorunen bir iddia yazma - yanlis guven, dogrulanmamis
durumdan daha kotudur.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations mobil/gorunurluk-testleri/sema-dogrula.ts
git commit -m "mobil: takip karsilikli hale geldi"
```

---

### Task 3: `konusmalar` tablosu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_konusmalar.sql`

**Interfaces:**
- Produces: `public.konusmalar (id, tur, birebir_anahtar, olusturuldu)`

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new konusmalar
```

```sql
-- Birebir konusmalar ve (3c icin) mekan odalari ayni tabloda durur.
-- birebir_anahtar sirali ciftten turer ve BENZERSIZ oldugu icin bir
-- ciftin tek konusmasi olur; bul-ya-olustur yarisa acik degildir.
-- Ayni cift hem takiplesip hem sohbet istegiyle baglanmis olsa bile
-- tek konusma. mekan_odasi satirlarinda null kalir (unique null saymaz).
create table public.konusmalar (
  id               uuid primary key default gen_random_uuid(),
  tur              text not null default 'birebir'
                     check (tur in ('birebir', 'mekan_odasi')),
  birebir_anahtar  text unique,
  olusturuldu      timestamptz not null default now()
);

-- RLS acik, YAZMA POLITIKASI YOK: yazma tamamen RPC uzerinden.
alter table public.konusmalar enable row level security;

revoke insert, update, delete on public.konusmalar from authenticated;
```

**Select politikasi bilerek burada DEGIL.** Politika `konusma_uyeleri`
tablosuna bakmak zorunda ve o tablo Task 4'te aciliyor; burada yazilsa
var olmayan bir tabloya referans verirdi. Politikayi Task 4 kuruyor.

Bu arada `konusmalar` okunamaz durumda: RLS acik, select politikasi yok,
yani hicbir satir gorunmuyor. Task 4'e kadar suren bu bosluk bilincli ve
**guvenli yonde** - fazla degil, eksik gosteriyor. Ikisi ardisik
calistigi icin pencere dakikalarla olculuyor.

- [ ] **Step 2: Uygula**

```bash
cd mobil
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: konusmalar tablosu"
```

---

### Task 4: `konusma_uyeleri` tablosu ve konusma politikasi

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_konusma_uyeleri.sql`

**Interfaces:**
- Consumes: Task 3'un `konusmalar` tablosu.
- Produces: `public.konusma_uyeleri (konusma_id, kullanici_id, gizlendi_mi, son_okuma)`
  ve `konusmalar` uzerindeki select politikasi.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new konusma_uyeleri
```

```sql
-- gizlendi_mi karar 44'un tasiyicisi: konusmayi "silmek" yalnizca kendi
-- tarafinda gizler. mesaj_gonder iki uyenin de bayragini indirir, boylece
-- karsi taraf yazinca konusma geri gelir.
create table public.konusma_uyeleri (
  konusma_id    uuid not null references public.konusmalar(id) on delete cascade,
  kullanici_id  uuid not null references auth.users(id) on delete cascade,
  gizlendi_mi   boolean not null default false,
  son_okuma     timestamptz,
  primary key (konusma_id, kullanici_id)
);

create index konusma_uyeleri_kullanici on public.konusma_uyeleri (kullanici_id);

alter table public.konusma_uyeleri enable row level security;

-- Yalnizca kendi uyelik satirlarini gorursun.
create policy "kendi uyeliklerim"
  on public.konusma_uyeleri for select
  to authenticated
  using (kullanici_id = auth.uid());

revoke insert, update, delete on public.konusma_uyeleri from authenticated;

-- konusmalar'in select politikasi burada kuruluyor, cunku
-- konusma_uyeleri'ne bakiyor ve o tablo bu migrasyonda aciliyor.
create policy "konusma uyeligi"
  on public.konusmalar for select
  to authenticated
  using (
    exists (
      select 1 from public.konusma_uyeleri u
      where u.konusma_id = konusmalar.id
        and u.kullanici_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Uygula**

```bash
cd mobil
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: konusma_uyeleri tablosu ve konusma politikasi"
```

---

### Task 5: `mesajlar` tablosu

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mesajlar.sql`

**Interfaces:**
- Consumes: Task 3 ve 4'un tablolari.
- Produces: `public.mesajlar (id, konusma_id, gonderen_id, metin, olusturuldu)`

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new mesajlar
```

```sql
create table public.mesajlar (
  id           uuid primary key default gen_random_uuid(),
  konusma_id   uuid not null references public.konusmalar(id) on delete cascade,
  gonderen_id  uuid not null references auth.users(id) on delete cascade,
  metin        text not null check (length(trim(metin)) between 1 and 2000),
  olusturuldu  timestamptz not null default now()
);

-- Hem gecmis sayfalamasi hem son mesaj sorgusu bu indeksi kullanir.
create index mesajlar_konusma_zaman
  on public.mesajlar (konusma_id, olusturuldu desc);

alter table public.mesajlar enable row level security;

-- Uyesi oldugun konusmanin mesajlarini gorursun, ve engelli iliski
-- varsa hicbir sey gormezsin. Politika takipler/engellemeler tablolarina
-- DOGRUDAN bakmiyor; yalnizca gizli.engelli_mi yardimcisini cagiriyor
-- (Faz 2b'de dogrudan alt sorgu "infinite recursion" hatasi vermisti).
create policy "mesaj uyeligi"
  on public.mesajlar for select
  to authenticated
  using (
    exists (
      select 1 from public.konusma_uyeleri u
      where u.konusma_id = mesajlar.konusma_id
        and u.kullanici_id = auth.uid()
    )
    and not gizli.engelli_mi(mesajlar.gonderen_id)
  );

revoke insert, update, delete on public.mesajlar from authenticated;
```

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
npm run test:sema
```

- [ ] **Step 3: Sema iddialari ekle**

`mobil/gorunurluk-testleri/sema-dogrula.ts` icine, dosyadaki mevcut
desene uyarak: `authenticated` istemcisiyle uc tablonun ucune de
dogrudan `insert` ve `update` denemesi reddediliyor mu. Hangi hata
kodunun dondugunu once **GOZLEMLE**, sonra iddiayi ona gore yaz;
varsayma. (Faz 3a'da bu tur denemelerde `42501` donuyordu.)

- [ ] **Step 4: Commit**

```bash
git add mobil/supabase/migrations mobil/gorunurluk-testleri/sema-dogrula.ts
git commit -m "mobil: mesajlar tablosu ve sutun yetkisi iddialari"
```

---

### Task 6: Yazma kapisi `bag.yazabilir_mi`

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_yazabilir_mi.sql`

**Interfaces:**
- Consumes: `bag.takip_ediyor_mu`, `gizli.engelli_mi`, `sohbet_istekleri`.
- Produces: `bag.yazabilir_mi(p_hedef uuid) returns boolean`

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new yazabilir_mi
```

```sql
-- Yazma kapisi TEK yerde. Her mesajda cagriliyor, konusma acilirken bir
-- kez degil (karar 45): bag koparsa konusma salt-okunur olur.
--
-- `bag` semasinda, `public`te DEGIL: public'teki her fonksiyonu PostgREST
-- istemciye RPC olarak sunar.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    -- 1) Engelli iliski her seyin onunde (iki yonlu).
    not gizli.engelli_mi(p_hedef)
    and (
      -- 2) Karsilikli takip. IKI YON DE ayri ayri soruluyor: kabul zaten
      --    iki satiri da yaziyor, yani tek kontrol yeterli olurdu. Ama
      --    basibos bir tek yonlu satir (eski veri, ileride bir hata) o
      --    durumda sessizce "bagli" sayilirdi. Iki yon sormak bunu veri
      --    hatasi olarak birakir, guvenlik hatasina donusturmez.
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
      -- 3) Ya da kabul edilmis sohbet istegi (iki yonden biri).
      or exists (
        select 1 from public.sohbet_istekleri s
        where s.durum = 'kabul'
          and (
            (s.gonderen_id = auth.uid() and s.alan_id = p_hedef)
            or (s.gonderen_id = p_hedef and s.alan_id = auth.uid())
          )
      )
    );
$$;

grant execute on function bag.yazabilir_mi(uuid) to authenticated;
```

`auth.uid()` null iken `bag.takip_ediyor_mu` false doner ve `exists`
bos kalir, yani fonksiyon false doner. Yine de bu fonksiyonu cagiran
`public` RPC'lerinin hepsi ilk satirda `auth.uid() is null` kontrolu
yapiyor.

- [ ] **Step 2: Uygula**

```bash
cd mobil
supabase db push
npm run test:sema
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: yazma kapisi bag.yazabilir_mi"
```

---

### Task 7: `mesaj_gonder` RPC'si

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mesaj_gonder.sql`

**Interfaces:**
- Consumes: Task 3-6.
- Produces: `public.mesaj_gonder(p_kullanici_id uuid, p_metin text) returns uuid`
  (donen deger: konusma id'si)

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new mesaj_gonder
```

```sql
create or replace function public.mesaj_gonder(
  p_kullanici_id uuid,
  p_metin text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anahtar text;
  v_konusma_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kullanici_id = auth.uid() then
    raise exception 'Kendine mesaj gonderemezsin';
  end if;

  if p_metin is null or length(trim(p_metin)) = 0 then
    raise exception 'Mesaj bos olamaz';
  end if;

  if length(trim(p_metin)) > 2000 then
    raise exception 'Mesaj cok uzun';
  end if;

  -- Kapi kapaliyken TEK ve AYNI hata: "engellendin" ile "henuz bagli
  -- degilsiniz" ayirt edilmiyor (Faz 2b sessizlik ilkesi).
  if not bag.yazabilir_mi(p_kullanici_id) then
    raise exception 'Bu kisiye su an mesaj gonderemezsin';
  end if;

  -- Sirali cift anahtari: bir ciftin tek konusmasi olur.
  v_anahtar := least(auth.uid()::text, p_kullanici_id::text)
               || ':' ||
               greatest(auth.uid()::text, p_kullanici_id::text);

  select id into v_konusma_id
  from public.konusmalar
  where birebir_anahtar = v_anahtar;

  if v_konusma_id is null then
    insert into public.konusmalar (tur, birebir_anahtar)
    values ('birebir', v_anahtar)
    on conflict (birebir_anahtar) do nothing
    returning id into v_konusma_id;

    -- Yaris: baska bir islem ayni anda olusturmus olabilir.
    if v_konusma_id is null then
      select id into v_konusma_id
      from public.konusmalar
      where birebir_anahtar = v_anahtar;
    end if;

    insert into public.konusma_uyeleri (konusma_id, kullanici_id)
    values (v_konusma_id, auth.uid()), (v_konusma_id, p_kullanici_id)
    on conflict do nothing;
  end if;

  insert into public.mesajlar (konusma_id, gonderen_id, metin)
  values (v_konusma_id, auth.uid(), trim(p_metin));

  -- Iki uyenin de gizliligi kalkar: karar 44'un "karsi taraf yazinca
  -- konusma geri gelir" kismi burada kuruluyor. Gonderenin son_okuma'si
  -- ilerler, kendi mesaji okunmamis sayilmasin diye.
  update public.konusma_uyeleri
     set gizlendi_mi = false,
         son_okuma = case when kullanici_id = auth.uid() then now() else son_okuma end
   where konusma_id = v_konusma_id;

  return v_konusma_id;
end;
$$;

revoke execute on function public.mesaj_gonder(uuid, text) from public, anon;
grant execute on function public.mesaj_gonder(uuid, text) to authenticated;
```

- [ ] **Step 2: Uygula**

```bash
cd mobil
supabase db push
npm run test:sema
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: mesaj_gonder RPC"
```

---

### Task 8: Okuma RPC'leri

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_mesaj_okuma_rpcleri.sql`

**Interfaces:**
- Consumes: Task 3-7.
- Produces:
  - `public.konusmalarim()` -> tablo
    `(konusma_id uuid, kisi_id uuid, kullanici_adi text, ad text,
      son_mesaj text, son_mesaj_zamani timestamptz,
      okunmamis int, yazilabilir_mi boolean)`
  - `public.mesajlari_getir(p_konusma_id uuid, p_once timestamptz, p_limit int)`
    -> tablo `(id uuid, gonderen_id uuid, metin text, olusturuldu timestamptz)`
  - `public.konusmayi_okundu_isaretle(p_konusma_id uuid) returns void`
  - `public.konusmayi_gizle(p_konusma_id uuid) returns void`

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new mesaj_okuma_rpcleri
```

```sql
-- Mesaj kutusu. Gizlenmis konusmalar listede cikmaz.
create or replace function public.konusmalarim()
returns table (
  konusma_id uuid,
  kisi_id uuid,
  kullanici_adi text,
  ad text,
  son_mesaj text,
  son_mesaj_zamani timestamptz,
  okunmamis int,
  yazilabilir_mi boolean
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
  select
    k.id,
    d.kullanici_id,
    p.kullanici_adi,
    p.ad,
    sm.metin,
    sm.olusturuldu,
    (
      select count(*)::int from public.mesajlar m
      where m.konusma_id = k.id
        and m.gonderen_id <> auth.uid()
        and (benim.son_okuma is null or m.olusturuldu > benim.son_okuma)
    ),
    bag.yazabilir_mi(d.kullanici_id)
  from public.konusmalar k
  join public.konusma_uyeleri benim
    on benim.konusma_id = k.id and benim.kullanici_id = auth.uid()
  join public.konusma_uyeleri d
    on d.konusma_id = k.id and d.kullanici_id <> auth.uid()
  join public.profiller p on p.id = d.kullanici_id
  left join lateral (
    select m.metin, m.olusturuldu
    from public.mesajlar m
    where m.konusma_id = k.id
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    and not gizli.engelli_mi(d.kullanici_id)
  order by sm.olusturuldu desc nulls last;
end;
$$;

revoke execute on function public.konusmalarim() from public, anon;
grant execute on function public.konusmalarim() to authenticated;

-- Sayfali gecmis, yeniden eskiye. p_once null ise en yeniden baslar.
create or replace function public.mesajlari_getir(
  p_konusma_id uuid,
  p_once timestamptz default null,
  p_limit int default 50
) returns table (
  id uuid,
  gonderen_id uuid,
  metin text,
  olusturuldu timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not exists (
    select 1 from public.konusma_uyeleri u
    where u.konusma_id = p_konusma_id and u.kullanici_id = auth.uid()
  ) then
    raise exception 'Konusma bulunamadi';
  end if;

  return query
  select m.id, m.gonderen_id, m.metin, m.olusturuldu
  from public.mesajlar m
  where m.konusma_id = p_konusma_id
    and (p_once is null or m.olusturuldu < p_once)
  order by m.olusturuldu desc
  limit least(coalesce(p_limit, 50), 100);
end;
$$;

revoke execute on function public.mesajlari_getir(uuid, timestamptz, int) from public, anon;
grant execute on function public.mesajlari_getir(uuid, timestamptz, int) to authenticated;

create or replace function public.konusmayi_okundu_isaretle(p_konusma_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.konusma_uyeleri
     set son_okuma = now()
   where konusma_id = p_konusma_id and kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;
end;
$$;

revoke execute on function public.konusmayi_okundu_isaretle(uuid) from public, anon;
grant execute on function public.konusmayi_okundu_isaretle(uuid) to authenticated;

-- "Gizle", "sil" degil: karar 44. Yalnizca cagiranin tarafinda gizler.
create or replace function public.konusmayi_gizle(p_konusma_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.konusma_uyeleri
     set gizlendi_mi = true
   where konusma_id = p_konusma_id and kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;
end;
$$;

revoke execute on function public.konusmayi_gizle(uuid) from public, anon;
grant execute on function public.konusmayi_gizle(uuid) to authenticated;
```

- [ ] **Step 2: Uygula**

```bash
cd mobil
supabase db push
npm run test:sema
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: mesaj okuma RPC'leri"
```

---

### Task 9: Realtime yayini ve mesaj sikayeti

**Files:**
- Create: `mobil/supabase/migrations/<timestamp>_realtime_ve_mesaj_sikayeti.sql`

**Interfaces:**
- Consumes: Task 5, ve mevcut `sikayet_gonder`.
- Produces: `mesajlar` tablosunun Realtime yayinina eklenmesi;
  `sikayet_gonder`'in `mesaj` hedef turunu kabul etmesi.

- [ ] **Step 1: Migrasyonu olustur ve yaz**

```bash
cd mobil
supabase migration new realtime_ve_mesaj_sikayeti
```

```sql
-- Realtime: mesajlar tablosunun insert olaylari yayina ekleniyor.
-- Yetki kontrolu okuma RLS'inden geliyor; ayri bir filtre kurulmuyor,
-- yoksa iki yerde iki kural olur ve ayrisir.
alter publication supabase_realtime add table public.mesajlar;

-- Sikayet hedef turlerine `mesaj` ekleniyor. Govde
-- 20260820070000_sohbet_geri_cek_sikayet_dogrulama_gunluk_budama.sql'den
-- BIREBIR kopyalanmali; yalnizca izin verilen tur listesi genisliyor.
-- O dosyayi ac ve govdeyi oradan al; asagidaki yalnizca degisen satiri
-- gosteriyor:
--
--   if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj') then
--     raise exception 'Gecersiz sikayet hedefi';
--   end if;
```

**Uygulayiciya:** `sikayet_gonder`'in tamamini en guncel kaynaktan
kopyala (yukarida adi gecen migrasyon), yalnizca `not in (...)` listesine
`'mesaj'` ekle, ve kopyanin sadik oldugunu diff'leyip raporunda belirt.
Auth guard, `p_hedef_id` ve `p_sebep` dogrulamalari, kendini sikayet
kontrolu ve insert sutun listesi degismemeli.

- [ ] **Step 2: Uygula ve dogrula**

```bash
cd mobil
supabase db push
npm run test:sema
```

- [ ] **Step 3: Commit**

```bash
git add mobil/supabase/migrations
git commit -m "mobil: mesajlar realtime yayininda, sikayet mesaji kabul ediyor"
```

---

### Task 10: `lib/sohbet.ts` istemci modulu

**Files:**
- Create: `mobil/lib/sohbet.ts`
- Test: `mobil/lib/sohbet.test.ts`

**Interfaces:**
- Consumes: Task 7-9'un RPC'leri.
- Produces:
  - `type Konusma = { konusmaId: string; kisiId: string; kullaniciAdi: string; ad: string; sonMesaj: string | null; sonMesajZamani: string | null; okunmamis: number; yazilabilirMi: boolean }`
  - `type Mesaj = { id: string; gonderenId: string; metin: string; olusturuldu: string }`
  - `mesajGonder(kullaniciId: string, metin: string): Promise<string>`
  - `konusmalarimiGetir(): Promise<Konusma[]>`
  - `mesajlariGetir(konusmaId: string, once?: string | null, limit?: number): Promise<Mesaj[]>`
  - `konusmayiOkunduIsaretle(konusmaId: string): Promise<void>`
  - `konusmayiGizle(konusmaId: string): Promise<void>`
  - `mesajlaraAbonelOl(konusmaId: string, geldi: (m: Mesaj) => void): () => void`

  Task 11-15'teki ekranlar bunlari kullanir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/sohbet.test.ts`. Dosyadaki mevcut `lib/bag.test.ts` desenine
uy: `jest.mock('./supabase', ...)`, `supabase.rpc` mock'lanir.

Beklenen RPC adlarini ve parametre adlarini **migrasyon dosyalarindan**
oku, `sohbet.ts`'ten degil - yoksa test modulun kendisiyle uyustugunu
iddia eden totolojiye doner ve tam yakalamasi gereken hatayi kacirir.

En az su testler:

```ts
describe('mesajGonder', () => {
  it('RPC-yi dogru ad ve parametrelerle cagirir', async () => {
    mockRpc.mockResolvedValue({ data: 'konusma-1', error: null })
    const id = await mesajGonder('kisi-1', 'merhaba')
    expect(mockRpc).toHaveBeenCalledWith('mesaj_gonder', {
      p_kullanici_id: 'kisi-1',
      p_metin: 'merhaba',
    })
    expect(id).toBe('konusma-1')
  })

  it('hata donerse firlatir', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Bu kisiye su an mesaj gonderemezsin' },
    })
    await expect(mesajGonder('kisi-1', 'merhaba')).rejects.toThrow(
      'Bu kisiye su an mesaj gonderemezsin'
    )
  })
})
```

Ayni sekilde `konusmalarimiGetir` (satirlarin camelCase'e cevrildigini
iddia et), `mesajlariGetir`, `konusmayiOkunduIsaretle`,
`konusmayiGizle` icin birer cagri testi ve birer hata testi.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand lib/sohbet.test.ts
```

Beklenen: modul bulunamadigi icin FAIL.

- [ ] **Step 3: Modulu yaz**

`mobil/lib/sohbet.ts`. `lib/bag.ts`'teki `rpcCagir` desenine uy: hata
varsa `throw new Error(error.message)`. Sunucu zaten Turkce mesaj
uretiyor, istemci yalnizca iletiyor.

`mesajlaraAbonelOl` icin Supabase Realtime kanali:

```ts
export function mesajlaraAbonelOl(
  konusmaId: string,
  geldi: (m: Mesaj) => void
): () => void {
  const kanal = supabase
    .channel(`mesajlar:${konusmaId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mesajlar',
        filter: `konusma_id=eq.${konusmaId}`,
      },
      (olay) => {
        const s = olay.new as {
          id: string
          gonderen_id: string
          metin: string
          olusturuldu: string
        }
        geldi({
          id: s.id,
          gonderenId: s.gonderen_id,
          metin: s.metin,
          olusturuldu: s.olusturuldu,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(kanal)
  }
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

```bash
cd mobil
npx jest --runInBand lib/sohbet.test.ts
npx jest --runInBand
npx tsc --noEmit
```

Tam kosum artmali ve gecmeli; `tsc` bes hatada kalmali.

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/sohbet.ts mobil/lib/sohbet.test.ts
git commit -m "mobil: sohbet istemci modulu"
```

---

### Task 11: `lib/bag.ts` karsilikli takibe uysun

**Files:**
- Modify: `mobil/lib/bag.ts`
- Modify: `mobil/lib/bag.test.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces: `takipciyiCikar` KALDIRILMIS `lib/bag.ts`.

- [ ] **Step 1: Testi guncelle**

`mobil/lib/bag.test.ts` icindeki `takipciyiCikar` testlerini sil (RPC
artik yok). Yerine `takibiBirak`'in **iki yonu de** kaldirdigini anlatan
bir yorum ve mevcut cagri testinin durdugunu dogrula.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand lib/bag.test.ts
```

- [ ] **Step 3: Modulu guncelle**

`mobil/lib/bag.ts` icinden `takipciyiCikar` disa acimini ve govdesini
kaldir. Baska hicbir seye dokunma; `bagDurumunuGetir`'in dort alani
oldugu gibi kaliyor (`takip` ve `gelenTakip` artik kabul durumunda ikisi
de `'kabul'` olacak, bu beklenen).

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

`tsc` `takipciyiCikar`'i kullanan bir yer kaldiysa hata verir - o yeri de
duzelt (Task 12 bunu zaten ele aliyor, ama tsc temiz olmali).

- [ ] **Step 5: Commit**

```bash
git add mobil/lib/bag.ts mobil/lib/bag.test.ts
git commit -m "mobil: takipciyiCikar kaldirildi, takip karsilikli"
```

---

### Task 12: `baglar` ekraninda tek takip listesi

**Files:**
- Modify: `mobil/src/app/baglar.tsx`
- Modify: `mobil/__tests__/ekranlar/baglar.test.tsx`

**Interfaces:**
- Consumes: Task 11.

- [ ] **Step 1: Testi guncelle**

Iki ayri liste ("Takipcilerim" ve "Takip ettiklerim") yerine tek liste
bekleyen testler yaz. Basligi **"Takipcilerim"** (karar 47). Satir
basina tek buton: **"Bagi kopar"**, `takibiBirak` cagirir.

`gidenIstekleriGetir` ve gelen istek bolumleri **degismiyor**.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand __tests__/ekranlar/baglar.test.tsx
```

- [ ] **Step 3: Ekrani guncelle**

`takipcilerimiGetir` ve `takipEttiklerimiGetir` artik ayni kumeyi
donduruyor (kabul iki yon de yazdigi icin). Birini kullan, digerinin
cagrisini kaldir. Iki `FlatList` yerine tek `FlatList`. "Cikar" butonunu
kaldir, "Bagi kopar" birak.

`lib/bag-listeleri.ts`'te artik kullanilmayan disa acim kaliyorsa onu da
kaldir ve testini guncelle.

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/baglar.tsx "mobil/__tests__/ekranlar/baglar.test.tsx" mobil/lib
git commit -m "mobil: baglar ekraninda tek takip listesi"
```

---

### Task 13: `mesajlar` ekrani (mesaj kutusu)

**Files:**
- Create: `mobil/src/app/mesajlar.tsx`
- Test: `mobil/__tests__/ekranlar/mesajlar.test.tsx`

**Interfaces:**
- Consumes: Task 10.
- Produces: `/mesajlar` rotasi. Task 15 buraya yonlendirir.

- [ ] **Step 1: Basarisiz testi yaz**

En az su testler (`await render`, `await fireEvent` - 14.0.1 asenkron):

1. Konusmalari listeler: karsi kisinin adi ve son mesaj onizlemesi
   gorunur.
2. Okunmamis sayisi sifirdan buyukse rozet gorunur; sifirsa rozet
   **hic** render edilmez (`queryByText(/^\d+$/)` null).
3. Bir satira basinca `/sohbet/<kisiId>` rotasina yonlendirir.
4. "Gizle" butonuna basinca `konusmayiGizle` dogru konusma id'siyle
   cagrilir ve satir listeden kalkar.
5. Gizleme reddedilirse hata mesaji gorunur ve satir listede **kalir**.
6. Liste bossa bos durum metni gorunur.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand __tests__/ekranlar/mesajlar.test.tsx
```

- [ ] **Step 3: Ekrani yaz**

`mobil/src/app/kisiler.tsx` ekraninin yapisini ornek al (tek `FlatList`,
`ListEmptyComponent`, hata bandi). Iyimser guncelleme deseni: durumu
yalnizca `await` cozuldukten **sonra** degistir, hata halinde mesaji
goster ve durumu oldugu gibi birak.

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/mesajlar.tsx "mobil/__tests__/ekranlar/mesajlar.test.tsx"
git commit -m "mobil: mesaj kutusu ekrani"
```

---

### Task 14: `sohbet/[kullaniciId]` ekrani

**Files:**
- Create: `mobil/src/app/sohbet/[kullaniciId].tsx`
- Test: `mobil/__tests__/ekranlar/sohbet/[kullaniciId].test.tsx`

**Interfaces:**
- Consumes: Task 10.
- Produces: `/sohbet/[kullaniciId]` rotasi. Task 15 ve 16 buraya
  yonlendirir.

- [ ] **Step 1: Basarisiz testi yaz**

En az su testler:

1. Gecmis mesajlari yeniden eskiye listeler.
2. Yazip gonderince `mesajGonder` dogru kullanici id'si ve metinle
   cagrilir, ve giris alani temizlenir.
3. Gonderme reddedilirse hata mesaji gorunur ve **yazilan metin giris
   alaninda kalir** (kullanici yazdigini kaybetmesin).
4. Bos ya da yalnizca bosluk metinle gonder butonu etkin degil.
5. `yazilabilirMi` false donerse giris alani yerine kisa bir not gorunur
   ve gecmis yine okunur.
6. Ekran acilinca `konusmayiOkunduIsaretle` cagrilir.
7. Sikayet butonuna basinca sikayet ekranina `hedef_tur = 'mesaj'` ile
   yonlendirir.

**`yazilabilirMi` nereden geliyor:** `konusmalarimiGetir()` her satirda
bunu donduruyor. Bu ekran acilirken o listeyi cekip `kisiId`'si eslesen
satiri bulur.

Satir yoksa (henuz hic mesaj gonderilmemis, yani konusma da yok) ekran
yazma alanini **acik** birakir ve kapiyi ilk `mesajGonder` cagrisinin
hatasi bildirir. Gerekce: `bagDurumunuGetir`'e ikinci bir kaynak olarak
bakmak, ayni kurali iki yerde iki bicimde soylemek olurdu ve ayrisirdi.
Sunucudaki `mesaj_gonder` zaten tek yetkili kapi; istemcinin gosterdigi
her sey ondan turemeli.

Bu davranisi testte de boyle kur: konusma yokken yazma alani acik,
gonderme reddedilince hata gorunur ve metin giris alaninda kalir.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand "__tests__/ekranlar/sohbet"
```

- [ ] **Step 3: Ekrani yaz**

Realtime aboneligi `useEffect` icinde kurulur ve donen fonksiyonla
temizlenir. Gelen mesaj listeye eklenir.

Mesaj listesi icin `FlatList` `inverted` kullan; en yeni altta gorunsun.

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "mobil/src/app/sohbet" "mobil/__tests__/ekranlar/sohbet"
git commit -m "mobil: konusma ekrani"
```

---

### Task 15: Ana ekranda "Mesajlar" girisi

**Files:**
- Modify: `mobil/src/app/index.tsx`
- Modify: `mobil/__tests__/ekranlar/index.test.tsx`

**Interfaces:**
- Consumes: Task 10, 13.

- [ ] **Step 1: Testi yaz**

1. "Mesajlar" butonuna basinca `/mesajlar` rotasina yonlendirir.
2. Okunmamis toplami sifirdan buyukse yaninda sayi gorunur.
3. Toplam sifirsa sayi **hic** gorunmez.
4. `konusmalarimiGetir` reddedilirse ekran yine cizilir ve sayi
   gorunmez (mevcut "Baglar" rozetinin deseni).

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand __tests__/ekranlar/index.test.tsx
```

- [ ] **Step 3: Ekrani guncelle**

"Baglar" butonunun hemen altina, ayni `stiller.ikincilButon` /
`stiller.ikincilButonYazi` stilleriyle. Rozet icin mevcut "Baglar"
rozetinin bicimlendirmesini kullan. Sayi `konusmalarimiGetir()`
sonuclarindaki `okunmamis` alanlarinin toplami.

Mevcut `useFocusEffect` blogunda hem bag sayisini hem mesaj sayisini
tazele.

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add mobil/src/app/index.tsx "mobil/__tests__/ekranlar/index.test.tsx"
git commit -m "mobil: ana ekranda mesajlar girisi"
```

---

### Task 16: Profilde "Mesaj gonder" butonu

**Files:**
- Modify: `mobil/src/app/kullanici/[id].tsx`
- Modify: `mobil/__tests__/ekranlar/kullanici/[id].test.tsx`

**Interfaces:**
- Consumes: Task 14.

- [ ] **Step 1: Testi yaz**

1. Karsilikli takip varken (`takip: 'kabul'`) "Mesaj gonder" butonu
   gorunur ve basinca `/sohbet/<kullaniciId>` rotasina yonlendirir.
2. Kabul edilmis sohbet istegi varken (`sohbet: 'kabul'` ya da
   `gelenSohbet: 'kabul'`) de gorunur.
3. Hicbir bag yokken (`takip: 'yok'`, `sohbet: 'yok'`,
   `gelenSohbet: 'yok'`) buton **gorunmez**.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

```bash
cd mobil
npx jest --runInBand "__tests__/ekranlar/kullanici"
```

- [ ] **Step 3: Ekrani guncelle**

Buton, mevcut bag butonlarinin altina. Gorunme kosulu:

```tsx
{(bagDurum?.takip === 'kabul' ||
  bagDurum?.sohbet === 'kabul' ||
  bagDurum?.gelenSohbet === 'kabul') && (
  <Pressable
    style={stiller.birincilButon}
    onPress={() => router.push(`/sohbet/${kullaniciId}`)}
  >
    <Text style={stiller.birincilButonYazi}>Mesaj gonder</Text>
  </Pressable>
)}
```

Bu istemci tarafi bir kolaylik; asil kapi sunucuda `mesaj_gonder`
icinde. Ikisi ayrisirsa sunucu kazanir.

- [ ] **Step 4: Dogrula**

```bash
cd mobil
npx jest --runInBand
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add "mobil/src/app/kullanici" "mobil/__tests__/ekranlar/kullanici"
git commit -m "mobil: profilde mesaj gonder butonu"
```

---

### Task 17: Gercek veritabani senaryolari

Bu gorev fazin asil kanitidir. Onceki gorevlerin Jest testleri Supabase'i
mock'luyor; bu paket gercek veritabanina soruyor.

**Files:**
- Modify: `mobil/gorunurluk-testleri/calistir.ts`
- Modify: `mobil/gorunurluk-testleri/README.md`

**Interfaces:**
- Consumes: Task 1-9.

- [ ] **Step 1: Mevcut senaryolari onar**

Task 2'den sonra 19-28 arasindaki takip yonuyle ilgili senaryolar duser.
Karsilikli takibe gore guncelle:

- Kabul sonrasi **iki** satir bekleniyor (tek degil).
- `takipciyi_cikar` cagrilari `takibi_birak`'a cevriliyor.
- "Takipciyi cikarinca akis kesilir" senaryosu artik "bagi koparinca
  akis kesilir": iki satir da gitmeli.

**Hicbir iddiayi gecsin diye zayiflatma.** Kural degistiyse iddiayi yeni
kurali AYNI SERTLIKTE soyleyecek sekilde yeniden yaz. Kod yanlissa bu
gercek bir bulgudur; raporla, ustunu ortme.

- [ ] **Step 2: 13 yeni senaryo ekle**

| # | Senaryo | Iddia |
|---|---|---|
| 32 | Kabul iki satir yazar | A gonderir, B kabul eder; `takipler`'de A->B ve B->A, ikisi de `kabul` |
| 33 | Bagi koparmak iki satiri da siler | A `takibi_birak(B)` cagirir; iki satir da yok |
| 34 | Karsilikli takipliler yazabilir | A ve B takipli; `mesaj_gonder` basarili, mesaj B'ye gorunur |
| 35 | Sohbet istegiyle baglananlar yazabilir | Takip YOK, sohbet istegi kabul; `mesaj_gonder` basarili |
| 36 | Bagsiz kisi yazamaz | Hicbir bag yok; hata "mesaj gonderemezsin" iceriyor |
| 37 | Engelli yazamaz, hata AYNI | A, B'yi engeller; B'nin hatasi 36'daki mesajla **birebir ayni** |
| 38 | Engelleme konusmayi gizler | Engellemeden once mesaj var; sonra B, A'nin mesajlarini goremiyor |
| 39 | Bag kopunca salt-okunur | Mesajlasip bagi koparinca: `mesajlari_getir` calisir, `mesaj_gonder` reddedilir |
| 40 | Iki yol ayni konusmaya cikar | Once sohbet istegiyle mesajlas, sonra takiples; `konusmalarim` **tek** satir doner |
| 41 | Gizlenen konusma geri gelir | A gizler, `konusmalarim`'da yok; B yazar, tekrar var |
| 42 | Okunmamis sayisi dogru | B iki mesaj yazar, A'da `okunmamis = 2`; A okundu isaretler, `0` |
| 43 | Kimliksiz cagrilar reddedilir | Anon istemciyle `mesaj_gonder` ve `konusmalarim` reddedilir |
| 44 | Kendine mesaj yok | A kendine `mesaj_gonder` cagirir; reddedilir |

Her senaryo kendi olusturdugu takip, engelleme ve konusma kayitlarini
temizler; temizlik `esitMi` ile dogrulanir, sessiz birakilmaz.
Konusmalari silmek icin kosucunun **yonetici istemcisi** kullanilir
(Task 1) - istemcinin `konusmalar` uzerinde delete yetkisi yok.

**Negatif iddialarin pozitif kontrolu olsun.** "C goremez" gibi bir
iddia, C hic olusmadiysa da gecer. Her negatif iddianin yaninda
kurulumun gercekten olustugunu gosteren bir pozitif kontrol dursun.

- [ ] **Step 3: README'yi guncelle**

`mobil/gorunurluk-testleri/README.md` icine yeni senaryolari ve Task
1'de eklenen kota temizligini yaz.

- [ ] **Step 4: Calistir**

```bash
cd mobil
npm run test:gorunurluk
```

Sifir hataya ulasmali. **`--tavan` calistirma.**

- [ ] **Step 5: Commit**

```bash
git add mobil/gorunurluk-testleri
git commit -m "mobil: sohbet senaryolari ve karsilikli takip guncellemesi"
```

---

### Task 18: Kapanis

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/konusma-gunlugu.md`
- Modify: `docs/faz3a-takip-isleri.md`

- [ ] **Step 1: Butun kosumlar**

```bash
cd mobil
npx jest --runInBand
npm run test:sema
npm run test:gorunurluk
npx tsc --noEmit
```

Dordu de tam gecmeli; `tsc` bes onceden var olan hatada kalmali.

- [ ] **Step 2: Uygulamanin acildigini dogrula**

```bash
cd mobil
npx expo start --web --clear --port 8084 > /tmp/expo8084.log 2>&1 &
```

Sonra **onplanda, kendiliginden biten** bir bekleme:

```bash
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8084 || true)
  if [ "$code" = "200" ]; then echo "HAZIR $code"; break; fi
  sleep 3
done
echo "son: $code"
cat /tmp/expo8084.log | grep -E "Web Bundled|ERROR"
```

Beklenen: `200`, `Web Bundled ... (N modules)` satiri var, `ERROR` yok.
Sonra sunucuyu kapat - acik kalan dev sunucusu tam Jest kosumlarinda
zaman asimi uretiyor.

- [ ] **Step 3: Hafizayi guncelle**

`CLAUDE.md`'ye Faz 3b bolumu: yeni tablolar, RPC'ler, ekranlar, test
sayilari, ve **karsilikli takip degisikliginin Faz 3a'yi degistirdigi**.
`docs/konusma-gunlugu.md` karar defterine 42-47 numarali kararlari
spec'ten kisaltarak ekle.

`docs/faz3a-takip-isleri.md` icindeki "takip TEK YONLU" ifadelerini
duzelt - artik yanlis ve gelecekte okuyan birini yaniltir.

Yazmadan once uc dosyayi da bastan sona **yeniden oku**; baska bir oturum
da bu dosyalari duzenleyebiliyor. Yalnizca ekleme yap (faz3a-takip-isleri
disinda, orada duzeltme gerekiyor).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/
git commit -m "docs: Faz 3b tamamlandi, proje hafizasi guncellendi"
```

---

## Ozet

| # | Gorev | Cikti |
|---|---|---|
| 1 | Kosucunun kota temizligi | Paket kendi kendini zehirlemiyor |
| 2 | Takip karsilikli | Faz 3a bag modeli revizyonu |
| 3 | `konusmalar` | Konusma kabi |
| 4 | `konusma_uyeleri` | Uyelik, gizleme, okuma imleci |
| 5 | `mesajlar` | Mesaj govdesi ve okuma politikasi |
| 6 | `bag.yazabilir_mi` | Tek yazma kapisi |
| 7 | `mesaj_gonder` | Gonderme + bul-ya-olustur |
| 8 | Okuma RPC'leri | Kutu, gecmis, okundu, gizle |
| 9 | Realtime + sikayet | Canli akis, mesaj sikayeti |
| 10 | `lib/sohbet.ts` | Istemci sarmalayicilari |
| 11 | `lib/bag.ts` | `takipciyiCikar` kaldirildi |
| 12 | `baglar` ekrani | Tek takip listesi |
| 13 | `mesajlar` ekrani | Mesaj kutusu |
| 14 | `sohbet/[kullaniciId]` | Konusma ekrani |
| 15 | Ana ekran | Mesajlar girisi + rozet |
| 16 | Profil | Mesaj gonder butonu |
| 17 | Canli senaryolar | 13 yeni + 19-28 guncelleme |
| 18 | Kapanis | Tam kosum, hafiza |
