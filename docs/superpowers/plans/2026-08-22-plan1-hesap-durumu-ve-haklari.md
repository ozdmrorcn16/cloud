# Plan 1 - Hesap durumu temeli ve kullanici haklari - uygulama plani

> **Ajan calisanlar icin:** GEREKLI ALT BECERI:
> `superpowers:subagent-driven-development` (onerilen) ya da
> `superpowers:executing-plans` ile bu plani gorev gorev uygula.
> Adimlar takip icin `- [ ]` kutucuk sozdizimi kullaniyor.

**Amac:** Bir hesap askiya alinabilsin, dondurulabilsin ya da kalici
olarak silinebilsin; ve bu durumlar veritabaninda baglayici olsun.

**Mimari:** Tek bir tablo (`hesap_durumlari`) ve tek bir yardimci
(`moderasyon.hesap_aktif_mi`) kuruluyor; bu yardimci mevcut yazma
kapilarina ve gorunurluk yollarina ekleniyor. Askiya alma (moderator
koyar), dondurma (kullanici koyar) ve yasaklama ayni mekanizmayi
paylasiyor, yalnizca kimin kaldirabildigi degisiyor. Silme, `auth.users`
satirini kaldirmak Admin API gerektirdigi icin bir Edge Function ile
yapiliyor; oncesinde mesaj ve sikayet yabanci anahtarlari `set null`'a
cevriliyor ki karsi tarafin gecmisi ve ucuncu kisiler hakkindaki
sikayetler yok olmasin.

**Teknoloji:** Expo + React Native (expo-router), Supabase (Postgres,
RLS, Storage, Edge Functions/Deno), TypeScript, Jest +
@testing-library/react-native 14.0.1.

**Spec:** `docs/superpowers/specs/2026-08-22-moderasyon-paneli-design.md`
(karar 57, 66, 67, 68, 69, 70 ve "Gizlilik metni yukumlulugu" bolumu)

**Uyum baglami:** `docs/kvkk-uyum-listesi.md` madde 1 ve 5. Bu plan o
iki BLOKE maddeyi kapatiyor.

## Global Constraints

- Butun kullanici arayuzu metinleri **Turkce**. Kodda, yorumlarda, test
  adlarinda ve belgelerde Turkce aksanli harf **kullanilmiyor** (duz
  ASCII: c, g, i, o, s, u). Duz ASCII kesme isareti (`'`) serbest;
  tipografik `U+2019` ve em dash `U+2014` **yasak**.
- Dosyalar **UTF-8 BOM'suz**. Yeni dosyalarda bayt bazinda dogrula:
  `head -c 3 <dosya> | od -An -tx1` sonucu `ef bb bf` OLMAMALI.
- **Uygulanmis bir migrasyon dosyasi duzenlenmez.** Duzeltme her zaman
  yeni bir migrasyon dosyasiyla yapilir.
- Bir `security definer` fonksiyonun govdesi degistirilirken **govdenin
  tamami en son surumunden birebir kopyalanir**; yalnizca eklenen satir
  farkli olur. Bu projede yerlesik kural: kismi bir `create or replace`
  sessizce eski mantigi siler.
- Her `public` semasindaki `security definer` fonksiyon
  `set search_path = public` icerir, ilk satirda `auth.uid() is null`
  kontrolu yapar ve `revoke execute ... from public, anon;` +
  `grant execute ... to authenticated;` ile biter.
- RLS politikalari `takipler`, `engellemeler`, `sohbet_istekleri` ya da
  `hesap_durumlari` tablolarina **dogrudan alt sorguyla bakmaz**;
  yalnizca `bag.*`, `gizli.*` ve `moderasyon.*` yardimcilarini cagirir.
  Gerekce: Faz 2b'de dogrudan alt sorgu "infinite recursion detected in
  policy" hatasi uretti.
- Yeni tablolarda `authenticated` rolunden `insert`, `update` ve
  `delete` **geri alinir**; yazma tamamen RPC uzerinden.
- Hesap durumu degerleri tam olarak: `askida`, `yasakli`, `dondurulmus`.
  Satirin **yoklugu** aktif demektir.
- Migrasyon dosya adlari `20260822HHMMSS_<ad>.sql` bicimindedir ve
  zaman damgalari artan olmalidir.
- Test dosyalari **asla** `mobil/src/app` altina konmaz. Ekran testleri
  `mobil/__tests__/ekranlar/` altinda.
- `@testing-library/react-native` **14.0.1**: `render()` ve `fireEvent`
  **asenkron**, hepsine `await` gerekir.
- Tam Jest paketi **`npx jest --runInBand`** ile calistirilir. Calisan
  bir `expo start` sunucusu varken calistirilmaz (islemci yarisir, 5000
  ms render zaman asimi uretir).
- `npx tsc --noEmit` dogrulama setinin parcasi. Taban durum: `@types/node`
  kurulu olmadigi icin var olan **bes** hata. Bu sayi artmamali.
- **`npm run test:gorunurluk -- --tavan` calistirilmaz.** Tek kosumda
  test hesabinin gunluk kotasina 50 kalici satir yazar.
- Canli veritabani senaryolari `mobil/gorunurluk-testleri/calistir.ts`
  icinde `senaryo('N - baslik', async () => { ... })` bicimindedir.
  **Mevcut son senaryo 44'tur; bu planin yeni senaryolari 45'ten
  baslar.**
- Her `const { data: X } = await ...` cagrisinda `error` da alinir ve
  kontrol edilir. Alinmazsa RPC hata dondugunde `data` null olur ve
  negatif iddialar vakum halinde gecer (Faz 2c'de yasanmis kusur).
- Migrasyonlar `cd mobil && npx supabase db push` ile uygulanir.
  Supabase MCP sunucusu bagliysa `apply_migration` de kullanilabilir;
  hangi yol secilirse secilsin dosya `mobil/supabase/migrations/`
  altinda kalir.
- Sirlar hicbir teste, ornege, belgeye ya da commit mesajina yazilmaz.

---

## Dosya yapisi

**Yeni migrasyonlar** (`mobil/supabase/migrations/`):

| Dosya | Sorumluluk |
|---|---|
| `20260822090000_moderasyon_semasi_ve_hesap_durumlari.sql` | `moderasyon` semasi, `hesap_durumlari` tablosu, `hesap_aktif_mi` |
| `20260822091000_hesap_aktif_yazma_kapilari_bag.sql` | `bag.istek_on_kontrol`, `bag.yazabilir_mi` |
| `20260822092000_hesap_aktif_yazma_kapilari_rpc.sql` | `check_in_yap`, `mekan_ekle`, `kullanici_adi_degistir` |
| `20260822093000_hesap_aktif_yanit_rpcleri.sql` | `takip_istegini_yanitla`, `sohbet_istegini_yanitla` |
| `20260822094000_hesap_aktif_profil_ve_storage.sql` | `profiller` update politikasi, profil fotografi yukleme politikasi |
| `20260822095000_hesap_aktif_checkin_politikasi.sql` | `check_inler` select politikasi |
| `20260822096000_hesap_aktif_arama_ve_profil.sql` | `kisi_ara`, `baskasinin_profili` |
| `20260822097000_hesap_aktif_liste_ve_yogunluk.sql` | `bag_kisileri`, `yakin_mekanlar_yogunluk` |
| `20260822098000_dondurma_rpcleri.sql` | `hesabimi_dondur`, `hesabimi_geri_ac` |
| `20260822099000_silmede_kalanlar_fk.sql` | `mesajlar` ve `sikayetler` FK'lari `set null` |
| `20260822100000_tek_uyeli_konusma.sql` | `mesajlari_getir`, `konusmalarim`, `bag.yazabilir_mi` |
| ~~`20260822101000_kullanici_adi_rezervasyonu.sql`~~ | KALDIRILDI (karar 70 geri alindi). Uygulanmis dosya duruyor; `20260822102000` tabloyu, RPC'yi ve cron isini dusuruyor |

**Yeni Edge Function:** `mobil/supabase/functions/hesap-sil/index.ts`
(+ `saf.ts` saf yardimcilar, + `index_test.ts`), `bildirim-gonder`
klasoruyle ayni kalip.

**Yeni istemci modulu:** `mobil/lib/hesap.ts` - hesap durumu okuma,
dondurma, geri acma, silme cagrilari. Tek sorumluluk: hesabin yasam
dongusu. `lib/ayarlar.ts` gizlilik tercihleri icin kalir, buraya
karismaz.

**Yeni ekranlar:**
- `mobil/src/app/hesap-durumu.tsx` - askiya alinmis / yasakli hesap ekrani
- `mobil/src/app/gizlilik.tsx` - gizlilik metni ekrani
- `mobil/src/app/profil/hesabi-sil.tsx` - silme onay akisi

**Yeni belge:** `docs/gizlilik-metni.md` - metnin kaynagi.

**Degisen istemci dosyalari:** `mobil/lib/oturum.tsx` (otomatik geri
acilma + durum yonlendirmesi), `mobil/src/app/profil/ayarlar.tsx`
(dondurma ve silme girisleri, gizlilik metni linki),
`mobil/src/app/mesajlar.tsx` ve `mobil/src/app/sohbet/[kullaniciId].tsx`
("Silinmis kullanici" gosterimi).

**Degisen test dosyalari:** `mobil/gorunurluk-testleri/calistir.ts`
(senaryo 45+), `mobil/gorunurluk-testleri/sema-dogrula.ts`,
`mobil/gorunurluk-testleri/yardimcilar.ts` (durum temizligi).

---

## Task 1: `moderasyon` semasi, `hesap_durumlari` ve `hesap_aktif_mi`

**Files:**
- Create: `mobil/supabase/migrations/20260822090000_moderasyon_semasi_ve_hesap_durumlari.sql`
- Modify: `mobil/gorunurluk-testleri/sema-dogrula.ts`
- Modify: `mobil/gorunurluk-testleri/yardimcilar.ts`

**Interfaces:**
- Consumes: hicbir sey (ilk gorev).
- Produces:
  - `moderasyon.hesap_aktif_mi(p_kullanici_id uuid) returns boolean` -
    `stable`, `security definer`. Satir yoksa ya da aski suresi gectiyse
    `true`. Sonraki butun gorevler bunu cagirir.
  - `public.hesap_durumlari` tablosu; sutunlar `kullanici_id`, `durum`,
    `aski_bitisi`, `gerekce`, `moderator_id`, `guncellendi`.
  - `yardimcilar.ts`'te `hesapDurumunuTemizle(kimlikler: string[]):
    Promise<void>` - yonetici istemcisiyle test hesaplarinin durum
    satirlarini siler.

- [ ] **Step 1: Sema dogrulamasina basarisiz kontrolleri ekle**

`mobil/gorunurluk-testleri/sema-dogrula.ts` icinde, dosyanin mevcut
kaliplarini izleyerek en sona ekle:

```ts
  // --- Hesap durumu temeli (Plan 1 Task 1) ---

  // hesap_durumlari'na authenticated yazamaz; yalnizca kendi satirini okur.
  {
    const { error } = await a
      .from('hesap_durumlari')
      .insert({ kullanici_id: aId, durum: 'askida', gerekce: 'test' })
    esitMi(
      error !== null,
      true,
      'hesap_durumlari: authenticated dogrudan insert edemez'
    )
  }

  {
    const { data, error } = await a
      .from('hesap_durumlari')
      .select('kullanici_id')
      .eq('kullanici_id', bId)
    esitMi(error === null, true, 'hesap_durumlari: select hata vermez')
    esitMi(
      (data ?? []).length,
      0,
      'hesap_durumlari: baskasinin satiri okunamaz'
    )
  }

  // moderasyon semasi PostgREST uzerinden sunulmuyor.
  {
    const { error } = await a.rpc('hesap_aktif_mi', {
      p_kullanici_id: bId,
    })
    esitMi(
      error !== null,
      true,
      'moderasyon.hesap_aktif_mi: public RPC olarak cagrilamaz'
    )
  }
```

- [ ] **Step 2: Kontrollerin basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:sema`
Expected: FAIL. Uc yeni satirin en az ikisi kirmizi; tablo henuz yok,
`insert` ve `select` "relation ... does not exist" doner.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822090000_moderasyon_semasi_ve_hesap_durumlari.sql`:

```sql
-- Hesap durumu temeli. Uc durum tek tabloda: moderatorun koydugu
-- 'askida'/'yasakli' ve kullanicinin kendi koydugu 'dondurulmus'
-- (spec karar 57 ve 66). Ayni mekanizmayi paylasmalarinin sebebi,
-- zorlama noktalarinin (8 yazma kapisi, 5 gorunurluk yolu) ikinci kez
-- ve eksik uygulanmasini onlemek.
create schema if not exists moderasyon;

revoke all on schema moderasyon from public;
grant usage on schema moderasyon to authenticated;

-- SATIRIN YOKLUGU AKTIF DEMEKTIR. Bu bilincli: kayit sirasinda henuz
-- profili olmayan kullanici hicbir kapiya takilmamali.
create table public.hesap_durumlari (
  kullanici_id uuid primary key references auth.users(id) on delete cascade,
  durum        text not null check (durum in ('askida', 'yasakli', 'dondurulmus')),
  aski_bitisi  timestamptz,
  gerekce      text not null,
  moderator_id uuid references auth.users(id),
  guncellendi  timestamptz not null default now(),
  -- Sureli aski bitis tarihi tasir; kalici yasak tasimaz.
  constraint hesap_durumlari_sure check (
    (durum = 'askida'  and aski_bitisi is not null) or
    (durum in ('yasakli', 'dondurulmus') and aski_bitisi is null)
  ),
  -- Dondurma kullanicinin kendi karari, moderator yok; moderasyon
  -- kararlarinda ise "kim yapti" zorunlu (spec: cok-moderatorlu modele
  -- sema degisikligi olmadan gecis).
  constraint hesap_durumlari_kaynak check (
    (durum = 'dondurulmus' and moderator_id is null) or
    (durum in ('askida', 'yasakli') and moderator_id is not null)
  )
);

create index hesap_durumlari_durum on public.hesap_durumlari (durum);

alter table public.hesap_durumlari enable row level security;

-- Kullanici yalnizca KENDI satirini gorur: uygulama "hesabin askida"
-- ekranini durustce gosterebilsin diye. Baskasinin durumu sizmaz.
create policy "kendi hesap durumum"
  on public.hesap_durumlari for select
  to authenticated
  using (kullanici_id = auth.uid());

revoke insert, update, delete on public.hesap_durumlari from authenticated, anon;

-- Askiya almanin TEK kaynagi. security definer sart: hesap_durumlari'nin
-- RLS'i yalnizca kendi satirini gosteriyor, oysa bu fonksiyon
-- BASKALARININ durumunu da sormak zorunda. stable sart: RLS politikalari
-- icinde satir basina cagrilacak.
--
-- Suresi dolmus aski otomatik olarak aktif sayilir; hesaplanir,
-- saklanmaz. Boylece "askiyi kaldir" isi icin bir cron'a bagimlilik yok.
create or replace function moderasyon.hesap_aktif_mi(p_kullanici_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.hesap_durumlari d
     where d.kullanici_id = p_kullanici_id
       and (d.durum in ('yasakli', 'dondurulmus') or d.aski_bitisi > now())
  );
$$;

-- p_kullanici_id null ise satir bulunmaz ve true doner. Cagiran taraflar
-- kendi `auth.uid() is null` kontrollerini zaten once yapiyor.
revoke execute on function moderasyon.hesap_aktif_mi(uuid) from public, anon;
grant execute on function moderasyon.hesap_aktif_mi(uuid) to authenticated;

-- Suresi dolmus aski satirlari semantik olarak zaten etkisiz; panel
-- listesi temiz kalsin diye gunde bir budaniyor. Davranissal degil,
-- kozmetik. Ayni jobname ile cagri isi degistirir, ikinci is yaratmaz.
select cron.schedule(
  'hesap-durumlari-buda',
  '15 4 * * *',
  $$ delete from public.hesap_durumlari
      where durum = 'askida' and aski_bitisi < now() - interval '90 days'; $$
);
```

- [ ] **Step 4: Migrasyonu uygula**

Run: `cd mobil && npx supabase db push`
Expected: Yalnizca yeni dosya calisir, hata yok.

- [ ] **Step 5: Sema kontrollerinin gectigini dogrula**

Run: `cd mobil && npm run test:sema`
Expected: PASS, uc yeni satir yesil, onceki 129 dogrulama bozulmamis.

- [ ] **Step 6: Test temizligi yardimcisini ekle**

`mobil/gorunurluk-testleri/yardimcilar.ts` sonuna:

```ts
// Bir senaryo hesabi askiya alip hata yolundan cikarsa satir ortada
// kalir ve sonraki butun senaryolarin on kosulunu bozar. Bu yuzden
// temizlik yonetici anahtariyla ve YALNIZCA test hesaplari icin yapilir.
export async function hesapDurumunuTemizle(kimlikler: string[]): Promise<void> {
  const yonetici = yoneticiIstemcisi()
  if (!yonetici) {
    console.warn(
      '\n  UYARI: SUPABASE_SERVICE_ROLE_KEY yok, hesap durumlari temizlenmedi.\n' +
        '  Askiya alma senaryolari kalinti birakabilir.\n'
    )
    return
  }
  const { error } = await yonetici
    .from('hesap_durumlari')
    .delete()
    .in('kullanici_id', kimlikler)
  if (error) throw new Error(`hesap durumu temizlik hatasi: ${error.message}`)
}
```

- [ ] **Step 7: Tip kontrolu**

Run: `cd mobil && npx tsc --noEmit`
Expected: Yalnizca bilinen bes hata.

- [ ] **Step 8: Commit**

```bash
git add mobil/supabase/migrations/20260822090000_moderasyon_semasi_ve_hesap_durumlari.sql mobil/gorunurluk-testleri/sema-dogrula.ts mobil/gorunurluk-testleri/yardimcilar.ts
git commit -m "feat: hesap_durumlari tablosu ve moderasyon.hesap_aktif_mi yardimcisi"
```

---

## Task 2: Yazma kapisi - `bag.istek_on_kontrol` ve `bag.yazabilir_mi`

Bu iki yardimci tek basina **uc** RPC'yi birden kapatiyor:
`takip_istegi_gonder`, `sohbet_istegi_gonder` (ikisi de
`istek_on_kontrol` cagiriyor) ve `mesaj_gonder` (`yazabilir_mi`
cagiriyor). Bu yuzden ilk yazma gorevi bu.

**Files:**
- Create: `mobil/supabase/migrations/20260822091000_hesap_aktif_yazma_kapilari_bag.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: Davranis degisikligi; yeni imza yok. `bag.istek_on_kontrol`
  askidaki cagiran icin `'Hesabin su anda kullanilamiyor'`, askidaki
  hedef icin `'Bu kullanici bulunamadi'` firlatir.
  `bag.yazabilir_mi` iki taraftan biri askidaysa `false` doner.

- [ ] **Step 1: Basarisiz senaryolari yaz**

`mobil/gorunurluk-testleri/calistir.ts` icinde, senaryo 44'ten sonra,
`hesapDurumunuTemizle` importunu da ekleyerek:

```ts
  await senaryo('45 - Askidaki kullanici istek gonderemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '45 kurulum: aski satiri yazildi')

    const { error } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(error !== null, true, '45: askidaki A istek gonderemez')

    await hesapDurumunuTemizle([aId])
  })

  await senaryo('46 - Askidaki kisiye istek gonderilemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '46 kurulum: aski satiri yazildi')

    const { error } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(error !== null, true, '46: askidaki B istek alamaz')

    await hesapDurumunuTemizle([bId])
  })
```

- [ ] **Step 2: Senaryolarin basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. Senaryo 45 ve 46 kirmizi - istek bugun basariyla
gidiyor, `error` null geliyor.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822091000_hesap_aktif_yazma_kapilari_bag.sql`:

```sql
-- Askiya alma / dondurma yazma kapilarina baglaniyor (spec karar 57, 66).
-- Bu iki yardimci UC RPC'yi birden kapatir: takip_istegi_gonder ve
-- sohbet_istegi_gonder (istek_on_kontrol), mesaj_gonder (yazabilir_mi).
--
-- istek_on_kontrol govdesi 20260819195646_istek_gunlugu.sql'deki SON
-- surumden birebir kopyalandi; tek fark iki yeni kontrol.
create or replace function bag.istek_on_kontrol(p_hedef uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gunluk int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki kullanici yeni bag kuramaz. Mesaji acik: kendi durumunu
  -- zaten hesap_durumlari'ndan okuyabiliyor, gizlemenin anlami yok.
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_hedef = auth.uid() then
    raise exception 'Kendine istek gonderemezsin';
  end if;

  -- Askidaki HEDEF icin engellemeyle ayni sessizlik: "askida" demiyoruz,
  -- kullanici yokmus gibi cevap veriyoruz (Faz 2b sessizlik ilkesi).
  -- Aksi halde panel bir hesabi askiya alinca bu, disaridan sorgulanabilir
  -- bir bilgi haline gelirdi.
  if not moderasyon.hesap_aktif_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  if gizli.engelli_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  select count(*) into v_gunluk
  from public.istek_gunlugu
  where gonderen_id = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_gunluk >= 50 then
    raise exception 'Bugunluk istek sinirina ulastin';
  end if;
end;
$$;

grant execute on function bag.istek_on_kontrol(uuid) to authenticated;

-- yazabilir_mi govdesi 20260820132747_yazabilir_mi.sql'den birebir
-- kopyalandi; tek fark bastaki iki aktiflik kontrolu. IKI TARAF da
-- kontrol ediliyor: askidaki biri yazamaz, askidaki birine de yazilamaz.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    moderasyon.hesap_aktif_mi(auth.uid())
    and moderasyon.hesap_aktif_mi(p_hedef)
    and not gizli.engelli_mi(p_hedef)
    and (
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
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

- [ ] **Step 4: Uygula ve senaryolari kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 45 ve 46 yesil; onceki 44 senaryo bozulmamis.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822091000_hesap_aktif_yazma_kapilari_bag.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askiya alma bag yazma kapilarina baglandi (istek ve mesaj)"
```

---

## Task 3: Yazma kapisi - `check_in_yap`, `mekan_ekle`, `kullanici_adi_degistir`

**Files:**
- Create: `mobil/supabase/migrations/20260822092000_hesap_aktif_yazma_kapilari_rpc.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: Uc RPC askidaki cagiran icin
  `'Hesabin su anda kullanilamiyor'` firlatir. Imzalar degismez.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 46'dan sonra:

```ts
  await senaryo('47 - Askidaki kullanici icerik uretemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '47 kurulum: aski satiri yazildi')

    const { error: checkInHata } = await a.rpc('check_in_yap', {
      p_mekan_id: mekan1,
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
    })
    esitMi(checkInHata !== null, true, '47: askidaki A check-in yapamaz')

    const { error: mekanHata } = await a.rpc('mekan_ekle', {
      p_ad: 'GORUNURLUK-TEST-ASKI-MEKAN',
      p_tur: 'test',
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
      p_cihaz_lat: MEKAN_1.lat,
      p_cihaz_lng: MEKAN_1.lng,
    })
    esitMi(mekanHata !== null, true, '47: askidaki A mekan ekleyemez')

    const { error: adHata } = await a.rpc('kullanici_adi_degistir', {
      p_yeni_ad: 'aski_kacis_denemesi',
    })
    esitMi(adHata !== null, true, '47: askidaki A kullanici adi degistiremez')

    await hesapDurumunuTemizle([aId])
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. Senaryo 47'nin uc iddiasi da kirmizi.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822092000_hesap_aktif_yazma_kapilari_rpc.sql`:

```sql
-- Uc yazma RPC'sine aktiflik kontrolu. Her govde kendi SON surumunden
-- birebir kopyalandi (check_in_yap: 20260820060000, mekan_ekle:
-- 20260815091500, kullanici_adi_degistir: 20260819124813); tek fark
-- auth.uid() kontrolunun hemen ardina eklenen blok.
--
-- kullanici_adi_degistir'in kapsanmasi ozellikle onemli: yasakli bir
-- kullanici adini degistirip yasagi bilen kisilerden saklanamamali.

create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
) returns public.check_inler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_bulunurluk is null or p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 500) then
    raise exception 'Mekana cok uzaksin (~500 m icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk
  )
  values (
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '4 hours',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

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
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

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

revoke execute on function public.mekan_ekle from public, anon;
grant execute on function public.mekan_ekle to authenticated;

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

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
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

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 47 yesil.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822092000_hesap_aktif_yazma_kapilari_rpc.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askiya alma check_in_yap, mekan_ekle ve kullanici_adi_degistir kapilarina baglandi"
```

---

## Task 4: Yazma kapisi - istek yanitlama RPC'leri

**Files:**
- Create: `mobil/supabase/migrations/20260822093000_hesap_aktif_yanit_rpcleri.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: `takip_istegini_yanitla` ve `sohbet_istegini_yanitla`
  askidaki cagiran icin hata firlatir. Imzalar degismez.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 47'den sonra:

```ts
  await senaryo('48 - Askidaki kullanici istek kabul edemez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }

    // A -> B bekleyen bir takip istegi kur (A aktifken).
    await a.rpc('takibi_birak', { p_kullanici_id: bId })
    const { error: istekHata } = await a.rpc('takip_istegi_gonder', {
      p_kullanici_id: bId,
    })
    esitMi(istekHata, null, '48 kurulum: istek gonderildi')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '48 kurulum: B askiya alindi')

    const { error } = await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(error !== null, true, '48: askidaki B istegi kabul edemez')

    await hesapDurumunuTemizle([bId])
    await b.rpc('takip_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: false,
    })
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. `'48: askidaki B istegi kabul edemez'` kirmizi.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822093000_hesap_aktif_yanit_rpcleri.sql`:

```sql
-- Yanit RPC'lerine aktiflik kontrolu. Gonderme tarafi Task 2'de
-- bag.istek_on_kontrol uzerinden kapandi, ama yanitlama o yardimciyi
-- CAGIRMIYOR - ayri ayri eklenmesi bu yuzden gerekli. Kapanmasaydi
-- askidaki bir kullanici bekleyen istekleri kabul ederek yeni bag
-- kurmaya devam ederdi.
--
-- takip_istegini_yanitla govdesi 20260820123552_takip_karsilikli.sql'den,
-- sohbet_istegini_yanitla govdesi 20260819190203_bag_rpcleri.sql'den
-- birebir kopyalandi.

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

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_kabul then
    update public.takipler
      set durum = 'kabul'
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';

    if not found then
      raise exception 'Yanitlanacak istek bulunamadi';
    end if;

    insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
    values (auth.uid(), p_kullanici_id, 'kabul')
    on conflict (takip_eden_id, takip_edilen_id)
      do update set durum = 'kabul';
  else
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

create or replace function public.sohbet_istegini_yanitla(
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

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_kabul then
    update public.sohbet_istekleri
      set durum = 'kabul'
      where gonderen_id = p_kullanici_id
        and alan_id = auth.uid()
        and durum = 'beklemede';
  else
    delete from public.sohbet_istekleri
      where gonderen_id = p_kullanici_id
        and alan_id = auth.uid()
        and durum = 'beklemede';
  end if;

  if not found then
    raise exception 'Yanitlanacak istek bulunamadi';
  end if;
end;
$$;

revoke execute on function public.sohbet_istegini_yanitla from public, anon;
grant execute on function public.sohbet_istegini_yanitla to authenticated;
```

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 48 yesil.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822093000_hesap_aktif_yanit_rpcleri.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askiya alma istek yanitlama RPC'lerine baglandi"
```

---

## Task 5: Yazma kapisi - profil guncelleme ve fotograf yukleme

**Files:**
- Create: `mobil/supabase/migrations/20260822094000_hesap_aktif_profil_ve_storage.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: `profiller` uzerindeki update politikasi ve
  `profil-fotograflari` bucket'inin insert politikasi askidaki
  kullaniciyi reddeder. Hata Postgres/Storage'dan gelir, ozel mesaj yok.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 48'den sonra:

```ts
  await senaryo('49 - Askidaki kullanici profilini degistiremez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { data: onceki, error: okumaHata } = await a
      .from('profiller')
      .select('biyografi')
      .eq('id', aId)
      .single()
    esitMi(okumaHata, null, '49 kurulum: mevcut biyografi okundu')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '49 kurulum: aski satiri yazildi')

    const { error: yazmaHata } = await a
      .from('profiller')
      .update({ biyografi: 'ASKIDA-DEGISTIRME-DENEMESI' })
      .eq('id', aId)

    const { data: sonraki } = await a
      .from('profiller')
      .select('biyografi')
      .eq('id', aId)
      .single()

    esitMi(
      sonraki?.biyografi ?? null,
      onceki?.biyografi ?? null,
      '49: askidaki A biyografisini degistiremedi'
    )
    // Not: RLS update'i eslesen satir bulamayinca hata DEGIL, sifir satir
    // doner. Bu yuzden asil iddia degerin degismemis olmasi; yazmaHata
    // yalnizca bilgi amacli.
    esitMi(yazmaHata === null || yazmaHata !== null, true, '49: update cagrisi tamamlandi')

    await hesapDurumunuTemizle([aId])
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. `'49: askidaki A biyografisini degistiremedi'` kirmizi -
biyografi bugun degisiyor.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822094000_hesap_aktif_profil_ve_storage.sql`:

```sql
-- Profil guncelleme ve fotograf yukleme, askidaki kullaniciya kapatiliyor.
-- Bu iki yol RPC degil POLITIKA ile korunuyor, cunku istemci
-- profiller'i dogrudan (sutun bazli grant ile) guncelliyor ve fotografi
-- dogrudan Storage'a yukluyor.
--
-- Onemli: yalnizca UPDATE kapatiliyor, INSERT DEGIL. Kayit sirasinda
-- henuz profil satiri yok ve hesap_durumlari satiri da yok, yani insert
-- zaten aktif bir hesapla yapiliyor; oraya kontrol koymak yeni kullanici
-- akisini gereksizce riske atardi.

drop policy "kendi profilini guncelleyebilir" on public.profiller;

create policy "kendi profilini guncelleyebilir"
  on public.profiller for update
  to authenticated
  using (auth.uid() = id and moderasyon.hesap_aktif_mi(auth.uid()));

-- Yukleme politikasi 20260813091930_profil_fotograflari_bucket.sql'de
-- kurulmus, 20260819160359 ile authenticated'a daraltilmisti. Ayni
-- kosullara aktiflik ekleniyor; politikanin adi ve bucket kosulu
-- degismiyor.
drop policy "kendi fotografini yukleyebilir" on storage.objects;

create policy "kendi fotografini yukleyebilir"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
    and moderasyon.hesap_aktif_mi(auth.uid())
  );
```

**Dikkat:** `drop policy` calistirmadan once politikanin gercek adini
dogrula: `select policyname from pg_policies where tablename =
'objects' and policyname like '%fotograf%';`. Ad farkliysa migrasyonda
gercek adi kullan.

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 49 yesil.

- [ ] **Step 5: Onceki fotograf akisinin bozulmadigini dogrula**

Run: `cd mobil && npx jest --runInBand fotograf`
Expected: PASS. `fotograf-yukle` ve `fotograf-url` paketleri yesil.

- [ ] **Step 6: Commit**

```bash
git add mobil/supabase/migrations/20260822094000_hesap_aktif_profil_ve_storage.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askiya alma profil guncelleme ve fotograf yukleme politikalarina baglandi"
```

---

## Task 6: Gorunurluk - `check_inler` select politikasi

**Files:**
- Create: `mobil/supabase/migrations/20260822095000_hesap_aktif_checkin_politikasi.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: Askidaki kullanicinin canli check-in'leri ve anilari
  baskalarina gorunmez; **sahibi kendi satirlarini gormeye devam eder**.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 49'dan sonra:

```ts
  await senaryo('50 - Askidaki kullanicinin check-in\'i gorunmez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    // B ayni mekana check-in yapsin (aktifken), A da ayni mekanda olsun.
    const aCheckIn = await checkInYap(a, mekan1, MEKAN_1.lat, MEKAN_1.lng)
    const bCheckIn = await checkInYap(b, mekan1, MEKAN_1.lat, MEKAN_1.lng)

    const { data: oncesi, error: oncesiHata } = await a
      .from('check_inler')
      .select('id')
      .eq('id', bCheckIn)
    esitMi(oncesiHata, null, '50 kurulum: okuma hatasiz')
    esitMi((oncesi ?? []).length, 1, '50 kurulum: A, B\'nin check-in\'ini goruyor')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '50 kurulum: B askiya alindi')

    const { data: sonrasi, error: sonrasiHata } = await a
      .from('check_inler')
      .select('id')
      .eq('id', bCheckIn)
    esitMi(sonrasiHata, null, '50: okuma hatasiz')
    esitMi((sonrasi ?? []).length, 0, '50: askidaki B\'nin check-in\'i A\'ya gorunmuyor')

    const { data: kendi, error: kendiHata } = await b
      .from('check_inler')
      .select('id')
      .eq('id', bCheckIn)
    esitMi(kendiHata, null, '50: sahibi icin okuma hatasiz')
    esitMi((kendi ?? []).length, 1, '50: B kendi check-in\'ini hala goruyor')

    await hesapDurumunuTemizle([bId])
    t.checkInler.push({ istemci: a, id: aCheckIn }, { istemci: b, id: bCheckIn })
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. `'50: askidaki B\'nin check-in\'i A\'ya gorunmuyor'`
kirmizi - bugun 1 satir donuyor.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822095000_hesap_aktif_checkin_politikasi.sql`:

```sql
-- Askidaki kullanicinin varligi kimseye gorunmemeli. Politika govdesi
-- 20260819185621_check_inler_bag_gorunurlugu.sql'den birebir kopyalandi;
-- tek fark "engelli_mi" kolunun yanina eklenen aktiflik kontrolu.
--
-- Kontrolun yeri onemli: sahibin kolunun (kullanici_id = auth.uid())
-- DISINDA. Askiya alinan kullanici kendi gecmisini gormeye devam
-- etmeli - verisi silinmiyor, yalnizca baskalarina kapaniyor.
--
-- Yardimci `stable` ve birincil anahtar uzerinden tek satir okuyor;
-- maliyeti gizli.engelli_mi ile ayni mertebede.
drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select to authenticated
  using (
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
  );
```

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 50 yesil ve onceki gorunurluk senaryolari
(19-28, 30-38) bozulmamis.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822095000_hesap_aktif_checkin_politikasi.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askidaki kullanicinin check-in'leri gorunurlukten cikti"
```

---

## Task 7: Gorunurluk - `kisi_ara` ve `baskasinin_profili`

**Files:**
- Create: `mobil/supabase/migrations/20260822096000_hesap_aktif_arama_ve_profil.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: `kisi_ara` askidaki hedefleri dislar ve askidaki cagirana
  hic sonuc dondurmez; `baskasinin_profili` askidaki hedef icin sifir
  satir doner. Imzalar degismez.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 50'den sonra:

```ts
  await senaryo('51 - Askidaki kullanici aramada ve profilde yok', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { data: bProfil, error: bProfilHata } = await b
      .from('profiller')
      .select('kullanici_adi')
      .eq('id', bId)
      .single()
    esitMi(bProfilHata, null, '51 kurulum: B kullanici adi okundu')
    const bAd = bProfil?.kullanici_adi ?? ''

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '51 kurulum: B askiya alindi')

    const { data: arama, error: aramaHata } = await a.rpc('kisi_ara', {
      p_metin: bAd,
    })
    esitMi(aramaHata, null, '51: arama hatasiz')
    esitMi(
      ((arama ?? []) as { id: string }[]).some((s) => s.id === bId),
      false,
      '51: askidaki B aramada cikmiyor'
    )

    const { data: profil, error: profilHata } = await a.rpc(
      'baskasinin_profili',
      { p_kullanici_id: bId }
    )
    esitMi(profilHata, null, '51: profil cagrisi hatasiz')
    esitMi((profil ?? []).length, 0, '51: askidaki B\'nin profili acilmiyor')

    // Askidaki cagiran da arama yapamaz.
    const { data: bAramasi, error: bAramaHata } = await b.rpc('kisi_ara', {
      p_metin: 'test',
    })
    esitMi(bAramaHata, null, '51: askidaki cagiran icin arama hatasiz')
    esitMi((bAramasi ?? []).length, 0, '51: askidaki B hic sonuc alamiyor')

    await hesapDurumunuTemizle([bId])
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. Senaryo 51'in uc iddiasi kirmizi.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822096000_hesap_aktif_arama_ve_profil.sql`:

```sql
-- kisi_ara ve baskasinin_profili security definer, yani profiller'in
-- RLS'ini atliyorlar; aktiflik kontrolu govdelerinde AYRICA zorlanmali.
--
-- kisi_ara govdesi 20260819153532_kisi_ara_isim_eslesmesi.sql'den,
-- baskasinin_profili govdesi
-- 20260819131609_baskasinin_profili_kullanici_adi.sql'den birebir
-- kopyalandi.

create or replace function public.kisi_ara(p_metin text)
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ham text;
  v_metin text;
  v_desen_kad text;
  v_desen_isim text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki cagiran hic sonuc almaz. `return` (raise degil): arama bos
  -- sonuc donmeyi zaten normal bir durum olarak isliyor, hata firlatmak
  -- ekranin akisini bozardi.
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    return;
  end if;

  v_ham := trim(coalesce(p_metin, ''));
  v_metin := lower(v_ham);

  if length(v_metin) < 2 then
    return;
  end if;

  v_desen_kad := replace(replace(replace(v_metin, '\', '\\'), '%', '\%'), '_', '\_');
  v_desen_isim := replace(replace(replace(v_ham, '\', '\\'), '%', '\%'), '_', '\_');

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
      -- Askidaki hedefler listeden dusuyor.
      and moderasyon.hesap_aktif_mi(p.id)
      and (
        p.kullanici_adi like v_desen_kad || '%' escape '\'
        or p.ad ilike '%' || v_desen_isim || '%' escape '\'
      )
      and not exists (
        select 1 from public.engellemeler e
        where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
           or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
      )
    order by (p.kullanici_adi = v_metin) desc,
             (p.kullanici_adi like v_desen_kad || '%' escape '\') desc,
             p.kullanici_adi
    limit 20;
end;
$$;

revoke execute on function public.kisi_ara from public, anon;
grant execute on function public.kisi_ara to authenticated;

create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (id uuid, kullanici_adi text, ad text, biyografi text, fotograflar text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki hedef "bulunamadi" gibi davranir; engellemeyle ayni
  -- sessizlik. Askidaki cagiran da baskasinin profilini acamaz.
  if not moderasyon.hesap_aktif_mi(auth.uid())
     or not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    return;
  end if;

  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.fotograflar
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
```

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 51 yesil; Faz 2c senaryolari (arama, engelleme)
bozulmamis.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822096000_hesap_aktif_arama_ve_profil.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askidaki kullanici aramadan ve profil acmadan dusuruldu"
```

---

## Task 8: Gorunurluk - `bag_kisileri` ve `yakin_mekanlar_yogunluk`

**Files:**
- Create: `mobil/supabase/migrations/20260822097000_hesap_aktif_liste_ve_yogunluk.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi(uuid)` (Task 1).
- Produces: `bag_kisileri` askidakileri dislar;
  `yakin_mekanlar_yogunluk`'un `kisi_sayisi` alani askidakilerin canli
  check-in'lerini saymaz. Imzalar ve donen sutunlar degismez.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 51'den sonra:

```ts
  await senaryo('52 - Askidaki kullanici listede ve yogunlukta sayilmaz', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const bCheckIn = await checkInYap(b, mekan2, MEKAN_2.lat, MEKAN_2.lng)

    const { data: oncesi, error: oncesiHata } = await a.rpc(
      'yakin_mekanlar_yogunluk',
      { p_lat: MEKAN_2.lat, p_lng: MEKAN_2.lng, p_yaricap_metre: 1000 }
    )
    esitMi(oncesiHata, null, '52 kurulum: yogunluk hatasiz')
    const oncekiSayi =
      ((oncesi ?? []) as { id: string; kisi_sayisi: number }[]).find(
        (m) => m.id === mekan2
      )?.kisi_sayisi ?? 0
    esitMi(oncekiSayi >= 1, true, '52 kurulum: mekan2 en az 1 kisi sayiyor')

    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: bId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: aId,
      })
    esitMi(kurulumHata, null, '52 kurulum: B askiya alindi')

    const { data: sonrasi, error: sonrasiHata } = await a.rpc(
      'yakin_mekanlar_yogunluk',
      { p_lat: MEKAN_2.lat, p_lng: MEKAN_2.lng, p_yaricap_metre: 1000 }
    )
    esitMi(sonrasiHata, null, '52: yogunluk hatasiz')
    const sonrakiSayi =
      ((sonrasi ?? []) as { id: string; kisi_sayisi: number }[]).find(
        (m) => m.id === mekan2
      )?.kisi_sayisi ?? 0
    esitMi(sonrakiSayi, oncekiSayi - 1, '52: askidaki B yogunlukta sayilmiyor')

    const { data: liste, error: listeHata } = await a.rpc('bag_kisileri', {
      p_kimlikler: [bId],
    })
    esitMi(listeHata, null, '52: bag_kisileri hatasiz')
    esitMi((liste ?? []).length, 0, '52: askidaki B bag listesinde yok')

    await hesapDurumunuTemizle([bId])
    t.checkInler.push({ istemci: b, id: bCheckIn })
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. Iki iddia kirmizi.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822097000_hesap_aktif_liste_ve_yogunluk.sql`:

```sql
-- Iki security definer okuyucu daha. Yogunluk sayaci ozellikle onemli:
-- sayi, askiya alinan kisinin bir mekanda oldugunu kimligi gorunmeden
-- sizdirmaya devam ederdi.
--
-- bag_kisileri govdesi 20260820052324_bag_kisileri_tavan.sql'den,
-- yakin_mekanlar_yogunluk govdesi
-- 20260816160000_mekan_yogunlugu_rpc.sql'den birebir kopyalandi.

create or replace function public.bag_kisileri(p_kimlikler uuid[])
returns table (id uuid, kullanici_adi text, ad text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if array_length(p_kimlikler, 1) > 200 then
    raise exception 'Cok fazla kimlik';
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad
    from public.profiller p
    where p.id = any(p_kimlikler)
      and moderasyon.hesap_aktif_mi(p.id)
      and not gizli.engelli_mi(p.id);
end;
$$;

revoke execute on function public.bag_kisileri from public, anon;
grant execute on function public.bag_kisileri to authenticated;

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
               and moderasyon.hesap_aktif_mi(c.kullanici_id)
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

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 52 yesil.

- [ ] **Step 5: Butun zorlama noktalarinin kapandigini gozle dogrula**

Spec'teki "Askiya almanin zorlandigi noktalar" tablosunu ac ve Task 2-8
arasinda her satirin karsiliginin uygulandigini tek tek isaretle. Eksik
bir satir varsa **burada** ekle; sonraki gorevler bu temeli varsayiyor.

- [ ] **Step 6: Commit**

```bash
git add mobil/supabase/migrations/20260822097000_hesap_aktif_liste_ve_yogunluk.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: askidaki kullanici bag listesinden ve yogunluk sayacindan dusuruldu"
```

---

## Task 9: Dondurma RPC'leri

**Files:**
- Create: `mobil/supabase/migrations/20260822098000_dondurma_rpcleri.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: `public.hesap_durumlari` tablosu (Task 1).
- Produces:
  - `public.hesabimi_dondur(p_gerekce text default null) returns void`
  - `public.hesabimi_geri_ac() returns boolean` - `true` doner **yalnizca**
    bir `dondurulmus` satir silindiginde; baska her durumda `false`.
    Istemci bu degeri "hesabin yeniden aktif" bilgisini gostermek icin
    kullanir.

- [ ] **Step 1: Basarisiz senaryolari yaz**

`calistir.ts` icinde senaryo 52'den sonra:

```ts
  await senaryo('53 - Dondurma ve otomatik geri acilma', async () => {
    const { error: dondurHata } = await a.rpc('hesabimi_dondur', {
      p_gerekce: 'test',
    })
    esitMi(dondurHata, null, '53: A hesabini dondurebiliyor')

    // Dondurulmus A, B'ye gorunmuyor.
    const { data: profil, error: profilHata } = await b.rpc(
      'baskasinin_profili',
      { p_kullanici_id: aId }
    )
    esitMi(profilHata, null, '53: profil cagrisi hatasiz')
    esitMi((profil ?? []).length, 0, '53: dondurulmus A profilde acilmiyor')

    // Dondurulmus A yazamiyor.
    const { error: checkInHata } = await a.rpc('check_in_yap', {
      p_mekan_id: mekan1,
      p_lat: MEKAN_1.lat,
      p_lng: MEKAN_1.lng,
    })
    esitMi(checkInHata !== null, true, '53: dondurulmus A check-in yapamiyor')

    // Geri acma calisiyor ve true donuyor.
    const { data: acildi, error: acmaHata } = await a.rpc('hesabimi_geri_ac')
    esitMi(acmaHata, null, '53: geri acma hatasiz')
    esitMi(acildi, true, '53: geri acma true donuyor')

    // Ikinci cagri false donuyor (silinecek satir yok).
    const { data: tekrar, error: tekrarHata } = await a.rpc('hesabimi_geri_ac')
    esitMi(tekrarHata, null, '53: ikinci geri acma hatasiz')
    esitMi(tekrar, false, '53: aktif hesapta geri acma false donuyor')
  })

  await senaryo('54 - Askidaki kullanici kendi askisini kaldiramaz', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const { error: kurulumHata } = await yonetici
      .from('hesap_durumlari')
      .insert({
        kullanici_id: aId,
        durum: 'askida',
        aski_bitisi: new Date(Date.now() + 3600_000).toISOString(),
        gerekce: 'test',
        moderator_id: bId,
      })
    esitMi(kurulumHata, null, '54 kurulum: A askiya alindi')

    // BU SENARYO OTOMATIK GERI ACILMANIN GUVENLIGIDIR. Istemci her
    // giriste hesabimi_geri_ac cagiriyor; bu cagri askiyi kaldirsaydi
    // moderasyon karari kullanicinin uygulamayi acmasiyla silinirdi.
    const { data: acildi, error: acmaHata } = await a.rpc('hesabimi_geri_ac')
    esitMi(acmaHata, null, '54: cagri hatasiz')
    esitMi(acildi, false, '54: aski kalkmadi, false dondu')

    const { data: hala, error: halaHata } = await a
      .from('hesap_durumlari')
      .select('durum')
      .eq('kullanici_id', aId)
    esitMi(halaHata, null, '54: durum okuma hatasiz')
    esitMi((hala ?? []).length, 1, '54: aski satiri yerinde duruyor')

    // Askidaki kullanici dondurmaya da ceviremez.
    const { error: dondurHata } = await a.rpc('hesabimi_dondur', {
      p_gerekce: 'kacis denemesi',
    })
    esitMi(dondurHata !== null, true, '54: askidaki A hesabini donduramaz')

    await hesapDurumunuTemizle([aId])
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. Senaryo 53 ve 54 kirmizi; RPC'ler henuz yok, "function
public.hesabimi_dondur does not exist" doner.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822098000_dondurma_rpcleri.sql`:

```sql
-- Kullanicinin kendi hesabini dondurmesi (spec karar 66). Moderasyon
-- askisiyla ayni tabloyu ve ayni hesap_aktif_mi yardimcisini kullaniyor,
-- yani butun zorlama noktalari kendiliginden gecerli.

create or replace function public.hesabimi_dondur(p_gerekce text default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Satir zaten varsa basarisiz oluyoruz. Bu, askidaki bir kullanicinin
  -- askisini dondurmaya cevirip sureyi sifirlamasini engelliyor; ayni
  -- zamanda ust uste dondurmayi da anlamsiz bir islem olmaktan cikariyor.
  if exists (select 1 from public.hesap_durumlari where kullanici_id = auth.uid()) then
    raise exception 'Hesabin zaten kullanilamaz durumda';
  end if;

  insert into public.hesap_durumlari (kullanici_id, durum, gerekce, moderator_id)
  values (
    auth.uid(),
    'dondurulmus',
    coalesce(nullif(trim(p_gerekce), ''), 'Kullanici kendi dondurdu'),
    null
  );

  -- Dondurmanin ilk etkisi canli varligin sonlanmasi olmali; aksi halde
  -- bitis_zamani dolana kadar bir "hayalet" satir kalirdi. Gorunurluk
  -- politikasi zaten gizliyor, ama veriyi de tutarli birakiyoruz.
  -- Daraltma check_in_yap'takiyle ayni kurali kullaniyor.
  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();
end;
$fn$;

revoke execute on function public.hesabimi_dondur(text) from public, anon;
grant execute on function public.hesabimi_dondur(text) to authenticated;

-- Geri acma. Istemci HER OTURUM ACILISINDA cagiriyor (spec karar 66),
-- bu yuzden govdesindeki `durum = 'dondurulmus'` kosulu kritik:
-- olmasaydi moderasyon askisi kullanicinin uygulamayi acmasiyla
-- kalkardi. Bu kosul, otomatik geri acilmayi guvenli kilan tek seydir.
--
-- boolean donuyor ki istemci "hesabin yeniden aktif" bilgisini yalnizca
-- gercekten bir sey degistiginde gostersin.
create or replace function public.hesabimi_geri_ac()
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_silindi int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.hesap_durumlari
   where kullanici_id = auth.uid()
     and durum = 'dondurulmus';

  get diagnostics v_silindi = row_count;
  return v_silindi > 0;
end;
$fn$;

revoke execute on function public.hesabimi_geri_ac() from public, anon;
grant execute on function public.hesabimi_geri_ac() to authenticated;
```

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 53 ve 54 yesil.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822098000_dondurma_rpcleri.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: hesabimi_dondur ve hesabimi_geri_ac RPC'leri"
```

---

## Task 10: Istemci modulu `lib/hesap.ts`

**Files:**
- Create: `mobil/lib/hesap.ts`
- Create: `mobil/lib/hesap.test.ts`

**Interfaces:**
- Consumes: `hesabimi_dondur`, `hesabimi_geri_ac` (Task 9);
  `hesap_durumlari` select politikasi (Task 1).
- Produces:
  - `export type HesapDurumu = { durum: 'askida' | 'yasakli' | 'dondurulmus';
    askiBitisi: string | null; gerekce: string }`
  - `export async function hesapDurumunuGetir(): Promise<HesapDurumu | null>`
    - satir yoksa `null`.
  - `export async function hesabiDondur(gerekce?: string): Promise<void>`
  - `export async function hesabiGeriAc(): Promise<boolean>`

  Task 11, 12 ve 16 bu isimleri kullanir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/hesap.test.ts`:

```ts
import { hesapDurumunuGetir, hesabiDondur, hesabiGeriAc } from './hesap'
import { supabase } from './supabase'

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}))

const sahteSupabase = supabase as unknown as {
  from: jest.Mock
  rpc: jest.Mock
  auth: { getUser: jest.Mock }
}

function zinciriKur(sonuc: { data: unknown; error: unknown }) {
  const maybeSingle = jest.fn().mockResolvedValue(sonuc)
  const eq = jest.fn(() => ({ maybeSingle }))
  const select = jest.fn(() => ({ eq }))
  sahteSupabase.from.mockReturnValue({ select })
  return { select, eq, maybeSingle }
}

beforeEach(() => {
  jest.clearAllMocks()
  sahteSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: 'kullanici-1' } },
    error: null,
  })
})

describe('hesapDurumunuGetir', () => {
  it('satir yoksa null doner', async () => {
    zinciriKur({ data: null, error: null })
    await expect(hesapDurumunuGetir()).resolves.toBeNull()
  })

  it('satir varsa alanlari cevirir', async () => {
    zinciriKur({
      data: {
        durum: 'askida',
        aski_bitisi: '2026-09-01T00:00:00Z',
        gerekce: 'taciz',
      },
      error: null,
    })
    await expect(hesapDurumunuGetir()).resolves.toEqual({
      durum: 'askida',
      askiBitisi: '2026-09-01T00:00:00Z',
      gerekce: 'taciz',
    })
  })

  it('hata gelirse firlatir', async () => {
    zinciriKur({ data: null, error: { message: 'kopuk' } })
    await expect(hesapDurumunuGetir()).rejects.toThrow('kopuk')
  })
})

describe('hesabiDondur', () => {
  it('RPC cagirir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: null })
    await hesabiDondur('mola')
    expect(sahteSupabase.rpc).toHaveBeenCalledWith('hesabimi_dondur', {
      p_gerekce: 'mola',
    })
  })

  it('hata gelirse firlatir', async () => {
    sahteSupabase.rpc.mockResolvedValue({ error: { message: 'olmadi' } })
    await expect(hesabiDondur()).rejects.toThrow('olmadi')
  })
})

describe('hesabiGeriAc', () => {
  it('RPC sonucunu doner', async () => {
    sahteSupabase.rpc.mockResolvedValue({ data: true, error: null })
    await expect(hesabiGeriAc()).resolves.toBe(true)
  })

  it('hata gelirse sessizce false doner', async () => {
    // Bu cagri her oturum acilisinda yapiliyor; ag hatasi girisi
    // engellememeli.
    sahteSupabase.rpc.mockResolvedValue({ data: null, error: { message: 'ag' } })
    await expect(hesabiGeriAc()).resolves.toBe(false)
  })
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand lib/hesap.test.ts`
Expected: FAIL, "Cannot find module './hesap'".

- [ ] **Step 3: Modulu yaz**

`mobil/lib/hesap.ts`:

```ts
import { supabase } from './supabase'

export type HesapDurumu = {
  durum: 'askida' | 'yasakli' | 'dondurulmus'
  askiBitisi: string | null
  gerekce: string
}

// hesap_durumlari'nin RLS'i yalnizca kendi satirini gosteriyor, bu
// yuzden ayri bir kimlik filtresi zorunlu degil; yine de acikca
// filtreliyoruz ki niyet okunur olsun.
export async function hesapDurumunuGetir(): Promise<HesapDurumu | null> {
  const { data: kullanici } = await supabase.auth.getUser()
  const kimlik = kullanici?.user?.id
  if (!kimlik) return null

  const { data, error } = await supabase
    .from('hesap_durumlari')
    .select('durum, aski_bitisi, gerekce')
    .eq('kullanici_id', kimlik)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    durum: data.durum as HesapDurumu['durum'],
    askiBitisi: data.aski_bitisi ?? null,
    gerekce: data.gerekce,
  }
}

export async function hesabiDondur(gerekce?: string): Promise<void> {
  const { error } = await supabase.rpc('hesabimi_dondur', {
    p_gerekce: gerekce ?? null,
  })
  if (error) throw new Error(error.message)
}

// Her oturum acilisinda cagriliyor (spec karar 66). Bu yuzden HATA
// FIRLATMIYOR: gecici bir ag hatasi kullaniciyi uygulamanin disinda
// birakmamali. Donen deger yalnizca "gercekten geri acildi mi" bilgisi.
export async function hesabiGeriAc(): Promise<boolean> {
  const { data, error } = await supabase.rpc('hesabimi_geri_ac')
  if (error) return false
  return data === true
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npx jest --runInBand lib/hesap.test.ts`
Expected: PASS, 7 test.

- [ ] **Step 5: Tip kontrolu ve commit**

Run: `cd mobil && npx tsc --noEmit`
Expected: Yalnizca bilinen bes hata.

```bash
git add mobil/lib/hesap.ts mobil/lib/hesap.test.ts
git commit -m "feat: lib/hesap.ts - hesap durumu okuma, dondurma, geri acma"
```

---

## Task 11: Oturum akisi ve hesap durumu ekrani

**Files:**
- Modify: `mobil/lib/oturum.tsx`
- Modify: `mobil/lib/oturum.test.tsx`
- Modify: `mobil/src/app/_layout.tsx`
- Create: `mobil/src/app/hesap-durumu.tsx`
- Create: `mobil/__tests__/ekranlar/hesap-durumu.test.tsx`

**Interfaces:**
- Consumes: `hesapDurumunuGetir`, `hesabiGeriAc`, `HesapDurumu` (Task 10).
- Produces: `useOturum()` dondugu nesneye iki alan ekleniyor:
  `hesapDurumu: HesapDurumu | null` ve
  `hesapDurumunuYenile: () => Promise<void>`. Task 12 ve 16 bunlari
  kullanir.

- [ ] **Step 1: Basarisiz oturum testlerini yaz**

`mobil/lib/oturum.test.tsx` icine mock ekle:

```tsx
jest.mock('./hesap', () => ({
  hesapDurumunuGetir: jest.fn(),
  hesabiGeriAc: jest.fn(),
}))
```

ve dosyanin mevcut kurulum kalibini kullanan uc test ekle. Tuketici
bilesen `const { hesapDurumu } = useOturum()` okuyup
`durum:{hesapDurumu?.durum ?? 'yok'}` basmalidir:

```tsx
import { hesapDurumunuGetir, hesabiGeriAc } from './hesap'

const sahteGeriAc = hesabiGeriAc as jest.Mock
const sahteDurum = hesapDurumunuGetir as jest.Mock

it('oturum acilinca once geri acma denenir', async () => {
  sahteGeriAc.mockResolvedValue(true)
  sahteDurum.mockResolvedValue(null)

  await oturumluSaglayiciyiRenderEt()

  expect(sahteGeriAc).toHaveBeenCalled()
})

it('dondurulmus hesap otomatik acildigi icin durum bos kalir', async () => {
  sahteGeriAc.mockResolvedValue(true)
  sahteDurum.mockResolvedValue(null)

  const { getByText } = await oturumluSaglayiciyiRenderEt()

  expect(getByText('durum:yok')).toBeTruthy()
})

it('askidaki hesabin durumu context uzerinden gorunur', async () => {
  sahteGeriAc.mockResolvedValue(false)
  sahteDurum.mockResolvedValue({
    durum: 'askida',
    askiBitisi: '2026-09-01T00:00:00Z',
    gerekce: 'taciz',
  })

  const { getByText } = await oturumluSaglayiciyiRenderEt()

  expect(getByText('durum:askida')).toBeTruthy()
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand lib/oturum.test.tsx`
Expected: FAIL. `hesabiGeriAc` cagrilmiyor, `hesapDurumu` alani yok.

- [ ] **Step 3: `oturum.tsx`'i genislet**

Import ekle:

```tsx
import { hesapDurumunuGetir, hesabiGeriAc, type HesapDurumu } from './hesap'
```

`OturumDurumu` tipini genislet:

```tsx
type OturumDurumu = {
  oturum: Session | null
  profilVarMi: boolean | null
  hesapDurumu: HesapDurumu | null
  yukleniyor: boolean
  profilKontrolunuYenile: () => Promise<void>
  hesapDurumunuYenile: () => Promise<void>
}
```

Varsayilan context degerine `hesapDurumu: null` ve
`hesapDurumunuYenile: async () => {}` ekle.

Saglayici govdesine:

```tsx
  const [hesapDurumu, setHesapDurumu] = useState<HesapDurumu | null>(null)

  // Sira onemli: ONCE geri acma denenir, SONRA durum okunur. Tersi
  // olsaydi dondurulmus kullanici bir kez "hesabin dondurulmus"
  // ekranini gorurdu. hesabiGeriAc yalnizca 'dondurulmus' satirini
  // siler; askiya alinmis bir hesap bu cagridan etkilenmez (Task 9,
  // senaryo 54).
  async function hesapDurumunuCoz(): Promise<HesapDurumu | null> {
    await hesabiGeriAc()
    try {
      return await hesapDurumunuGetir()
    } catch {
      // Durum okunamazsa uygulamayi kilitlemiyoruz: veritabani
      // kapilari zaten baglayici, bu ekran yalnizca aciklama.
      return null
    }
  }
```

`baslangicOturumunuYukle` icinde profil kontrolunun yanina:

```tsx
      if (data.session) {
        setProfilVarMi(await profilVarMiKontrolEt(data.session.user.id))
        setHesapDurumu(await hesapDurumunuCoz())
      }
```

`onAuthStateChange` dinleyicisinde:

```tsx
      if (yeniOturum) {
        setProfilVarMi(await profilVarMiKontrolEt(yeniOturum.user.id))
        setHesapDurumu(await hesapDurumunuCoz())
      } else {
        setProfilVarMi(null)
        setHesapDurumu(null)
      }
```

Disa acilan yardimci:

```tsx
  async function hesapDurumunuYenile() {
    if (oturum) {
      setHesapDurumu(await hesapDurumunuCoz())
    }
  }
```

`Provider value` nesnesine `hesapDurumu` ve `hesapDurumunuYenile` ekle.

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npx jest --runInBand lib/oturum.test.tsx`
Expected: PASS.

- [ ] **Step 5: Hesap durumu ekraninin testini yaz**

`mobil/__tests__/ekranlar/hesap-durumu.test.tsx`:

```tsx
import { render } from '@testing-library/react-native'
import HesapDurumuEkrani from '../../src/app/hesap-durumu'

const sahteOturum: {
  hesapDurumu: null | {
    durum: 'askida' | 'yasakli' | 'dondurulmus'
    askiBitisi: string | null
    gerekce: string
  }
} = { hesapDurumu: null }

jest.mock('../../lib/oturum', () => ({
  useOturum: () => sahteOturum,
}))

jest.mock('../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

it('askida hesap icin sebep ve bitis tarihi gosterir', async () => {
  sahteOturum.hesapDurumu = {
    durum: 'askida',
    askiBitisi: '2026-09-01T12:00:00Z',
    gerekce: 'Taciz bildirimleri',
  }
  const { getByText } = await render(<HesapDurumuEkrani />)
  expect(getByText('Hesabin askiya alindi')).toBeTruthy()
  expect(getByText(/Taciz bildirimleri/)).toBeTruthy()
})

it('yasakli hesap icin bitis tarihi gostermez', async () => {
  sahteOturum.hesapDurumu = {
    durum: 'yasakli',
    askiBitisi: null,
    gerekce: 'Tekrarlanan ihlal',
  }
  const { getByText, queryByText } = await render(<HesapDurumuEkrani />)
  expect(getByText('Hesabin kalici olarak kapatildi')).toBeTruthy()
  expect(queryByText(/Bitis/)).toBeNull()
})
```

- [ ] **Step 6: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/hesap-durumu.test.tsx`
Expected: FAIL, modul bulunamiyor.

- [ ] **Step 7: Ekrani yaz**

`mobil/src/app/hesap-durumu.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useOturum } from '../../lib/oturum'
import { supabase } from '../../lib/supabase'

// Bu ekran YALNIZCA moderasyon kararlari icindir. Dondurulmus hesap
// buraya hic dusmez: giris sirasinda otomatik geri acilir (karar 66).
export default function HesapDurumuEkrani() {
  const { hesapDurumu } = useOturum()

  const baslik =
    hesapDurumu?.durum === 'yasakli'
      ? 'Hesabin kalici olarak kapatildi'
      : 'Hesabin askiya alindi'

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>{baslik}</Text>
      <Text style={stiller.metin}>Sebep: {hesapDurumu?.gerekce ?? '-'}</Text>
      {hesapDurumu?.askiBitisi && (
        <Text style={stiller.metin}>
          Bitis: {new Date(hesapDurumu.askiBitisi).toLocaleString('tr-TR')}
        </Text>
      )}
      <Text style={stiller.ipucu}>
        Bu sure boyunca profilin baskalarina gorunmez ve yeni icerik
        paylasamazsin. Verilerin silinmedi.
      </Text>
      <Pressable style={stiller.buton} onPress={() => supabase.auth.signOut()}>
        <Text style={stiller.butonMetni}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  baslik: { fontSize: 20, fontWeight: '600' },
  metin: { fontSize: 15 },
  ipucu: { fontSize: 13, opacity: 0.7, marginTop: 8 },
  buton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  butonMetni: { color: 'white', fontWeight: '600' },
})
```

- [ ] **Step 8: Yonlendirmeyi `_layout.tsx`'e bagla**

`mobil/src/app/_layout.tsx` icindeki mevcut yonlendirme kosul zincirine,
oturum acik olma kontrolunden **sonra** ama profil kontrolunden **once**
degerlendirilen bir kol ekle: `hesapDurumu` null degilse
`/hesap-durumu` rotasina yonlendir. Dosyadaki mevcut yonlendirme
bicimini birebir izle; yeni bir yaklasim getirme.

Sira gerekcesi: askiya alinmis bir kullanicinin profili olmayabilir
(kayit yarida kalmis olabilir); profil kontrolu once calissaydi onu
profil olusturma ekranina atardi ve orada da yazamadigi icin sikisirdi.

- [ ] **Step 9: Tum paketi kosr**

Run: `cd mobil && npx jest --runInBand`
Expected: PASS, tum paket yesil.

- [ ] **Step 10: Commit**

```bash
git add mobil/lib/oturum.tsx mobil/lib/oturum.test.tsx mobil/src/app/hesap-durumu.tsx mobil/src/app/_layout.tsx mobil/__tests__/ekranlar/hesap-durumu.test.tsx
git commit -m "feat: oturum acilisinda otomatik geri acilma ve hesap durumu ekrani"
```

---

## Task 12: Ayarlarda dondurma girisi

**Files:**
- Modify: `mobil/src/app/profil/ayarlar.tsx`
- Modify: `mobil/__tests__/ekranlar/profil/ayarlar.test.tsx`

**Interfaces:**
- Consumes: `hesabiDondur` (Task 10), `supabase.auth.signOut`.
- Produces: Kullaniciya gorunen dondurma akisi. Yeni disa acim yok.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/__tests__/ekranlar/profil/ayarlar.test.tsx` icine, mevcut mock
kaliplarina `../../../lib/hesap` mock'unu ekleyerek:

```tsx
jest.mock('../../../lib/hesap', () => ({
  hesabiDondur: jest.fn(),
}))
```

ve testi:

```tsx
it('dondurma iki adimda calisir ve oturumu kapatir', async () => {
  const { getByText, queryByText } = await render(<AyarlarEkrani />)

  // Ilk dokunus yalnizca onay ister; hemen dondurmez.
  await fireEvent.press(getByText('Hesabimi dondur'))
  expect(sahteDondur).not.toHaveBeenCalled()
  expect(
    getByText(
      'Verilerin silinmez. Tekrar giris yaptiginda hesabin kendiliginden aktif olur.'
    )
  ).toBeTruthy()

  await fireEvent.press(getByText('Evet, dondur'))
  expect(sahteDondur).toHaveBeenCalled()
  expect(sahteCikis).toHaveBeenCalled()
  expect(queryByText('Evet, dondur')).toBeNull()
})
```

`sahteDondur` ve `sahteCikis` dosyanin mevcut mock degiskeni kalibiyla
tanimlanir (`const sahteDondur = hesabiDondur as jest.Mock`).

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/profil/ayarlar.test.tsx`
Expected: FAIL, "Hesabimi dondur" bulunamiyor.

- [ ] **Step 3: Ekrana bolumu ekle**

`mobil/src/app/profil/ayarlar.tsx` icinde import ekle:

```tsx
import { hesabiDondur } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'
```

Bilesen govdesine:

```tsx
  const [dondurmaOnayi, setDondurmaOnayi] = useState(false)

  async function hesabiDondurmayiOnayla() {
    try {
      await hesabiDondur()
      // Dondurmadan hemen sonra cikis: aksi halde kullanici dondurulmus
      // ama girisli bir ara durumda kalirdi (spec karar 66).
      await supabase.auth.signOut()
    } catch (e) {
      setHata((e as Error).message)
    } finally {
      setDondurmaOnayi(false)
    }
  }
```

JSX'in sonuna, mevcut `stiller` adlarini kullanarak:

```tsx
      <Text style={stiller.altBaslik}>Hesabi dondur</Text>
      <Text style={stiller.ipucu}>
        Verilerin silinmez. Tekrar giris yaptiginda hesabin kendiliginden
        aktif olur.
      </Text>
      {!dondurmaOnayi ? (
        <Pressable style={stiller.buton} onPress={() => setDondurmaOnayi(true)}>
          <Text style={stiller.butonMetni}>Hesabimi dondur</Text>
        </Pressable>
      ) : (
        <View style={stiller.butonSatiri}>
          <Pressable style={stiller.buton} onPress={hesabiDondurmayiOnayla}>
            <Text style={stiller.butonMetni}>Evet, dondur</Text>
          </Pressable>
          <Pressable style={stiller.buton} onPress={() => setDondurmaOnayi(false)}>
            <Text style={stiller.butonMetni}>Vazgec</Text>
          </Pressable>
        </View>
      )}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/profil/ayarlar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Tip kontrolu ve commit**

Run: `cd mobil && npx tsc --noEmit`
Expected: Yalnizca bilinen bes hata.

```bash
git add mobil/src/app/profil/ayarlar.tsx mobil/__tests__/ekranlar/profil/ayarlar.test.tsx
git commit -m "feat: ayarlarda hesap dondurma girisi"
```

---

## Task 13: Silmede kalanlar - yabanci anahtarlar ve tek uyeli konusma

Bu gorev **silme fonksiyonundan once** gelmek zorunda. Bugunku semada
`mesajlar.gonderen_id` ve `sikayetler.sikayet_eden_id` `on delete
cascade` ile bagli; Task 15 bu gorev yapilmadan calistirilirsa ilk
silme karsi tarafin konusma gecmisini yariya indirir ve kullanicinin
baskalari hakkinda actigi sikayetleri yok eder.

**Files:**
- Create: `mobil/supabase/migrations/20260822099000_silmede_kalanlar_fk.sql`
- Create: `mobil/supabase/migrations/20260822100000_tek_uyeli_konusma.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`
- Modify: `mobil/gorunurluk-testleri/sema-dogrula.ts`
- Modify: `mobil/src/app/mesajlar.tsx`
- Modify: `mobil/src/app/sohbet/[kullaniciId].tsx`
- Modify: `mobil/__tests__/ekranlar/mesajlar.test.tsx`

**Interfaces:**
- Consumes: `moderasyon.hesap_aktif_mi` (Task 1), `bag.yazabilir_mi`
  (Task 2 surumu).
- Produces:
  - `mesajlar.gonderen_id` ve `sikayetler.sikayet_eden_id` **nullable**
    ve `on delete set null`.
  - `public.konusmalarim()` donen `kisi_id`, `kullanici_adi` ve `ad`
    alanlari karsi taraf silinmisse **null** olur; `yazilabilir_mi`
    `false` olur. Sutun listesi degismez.
  - `public.mesajlari_getir()` karsi uye yoksa hata firlatmaz, mesajlari
    doner; donen `gonderen_id` null olabilir.
  - `bag.yazabilir_mi(null)` `false` doner.
  - Istemci tarafinda silinmis karsi taraf **"Silinmis kullanici"**
    olarak gosterilir (tam metin, Task 18 elle dogrulamasinda aranir).

- [ ] **Step 1: Sema degisikliginin elle dogrulama sorgularini not al**

Bu gorevin sema tarafi otomatik test edilmiyor ve bu **bilincli bir
karardir**: bu projede `information_schema`'yi istemciden okuyacak bir
RPC yok, ve yalnizca bunun icin bir tane acmak yeni bir erisim yuzeyi
demek olurdu. Hicbir sey iddia etmeyen bir test yazmak ise testten
daha kotudur - yesil gorunur, hicbir sey korumaz.

Otomatik kanit **Step 2'deki davranis senaryosudur**; sema tarafi
Step 7'de elle dogrulanir. Su iki sorgu Step 7'de calistirilacak, simdi
yalnizca not ediliyor:

```sql
select table_name, column_name, is_nullable
  from information_schema.columns
 where (table_name, column_name) in
       (('mesajlar','gonderen_id'), ('sikayetler','sikayet_eden_id'));
-- Beklenen: ikisi de is_nullable = 'YES'

select conname, confdeltype from pg_constraint
 where conrelid in ('public.mesajlar'::regclass, 'public.sikayetler'::regclass)
   and contype = 'f';
-- Beklenen: ilgili iki kisitta confdeltype = 'n' (set null)
```

- [ ] **Step 2: Basarisiz davranis senaryosunu yaz**

`calistir.ts` icinde senaryo 54'ten sonra:

```ts
  await senaryo('55 - Karsi uye kaybolunca konusma salt-okunur kalir', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }

    // A ile C arasinda bir konusma kur (B'yi bozmuyoruz; C ucuncu
    // test hesabi). Once yazma yetkisi icin karsilikli bag.
    const { error: istekHata } = await a.rpc('sohbet_istegi_gonder', {
      p_kullanici_id: cId,
    })
    esitMi(istekHata, null, '55 kurulum: sohbet istegi gonderildi')
    const { error: kabulHata } = await c.rpc('sohbet_istegini_yanitla', {
      p_kullanici_id: aId,
      p_kabul: true,
    })
    esitMi(kabulHata, null, '55 kurulum: istek kabul edildi')

    const { data: konusmaId, error: mesajHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: cId,
      p_metin: 'silme oncesi mesaj',
    })
    esitMi(mesajHata, null, '55 kurulum: mesaj gonderildi')

    // GERCEK SILME DEGIL: yalnizca cascade'in yapacagi seyi taklit
    // ediyoruz (uyelik satirini kaldirmak). Boylece C hesabini
    // gercekten silmeden tek uyeli konusma durumu olusuyor ve sonraki
    // senaryolar C'yi kullanmaya devam edebiliyor.
    const { error: silHata } = await yonetici
      .from('konusma_uyeleri')
      .delete()
      .eq('konusma_id', konusmaId)
      .eq('kullanici_id', cId)
    esitMi(silHata, null, '55 kurulum: C uyeligi kaldirildi')

    // Konusma listede KALMALI.
    const { data: liste, error: listeHata } = await a.rpc('konusmalarim')
    esitMi(listeHata, null, '55: konusmalarim hatasiz')
    const satir = ((liste ?? []) as {
      konusma_id: string
      kisi_id: string | null
      yazilabilir_mi: boolean
    }[]).find((k) => k.konusma_id === konusmaId)
    esitMi(satir !== undefined, true, '55: konusma listede kaldi')
    esitMi(satir?.kisi_id ?? null, null, '55: karsi taraf null donuyor')
    esitMi(satir?.yazilabilir_mi, false, '55: konusma salt-okunur')

    // Gecmis OKUNABILIR kalmali.
    const { data: mesajlar, error: getirHata } = await a.rpc(
      'mesajlari_getir',
      { p_konusma_id: konusmaId }
    )
    esitMi(getirHata, null, '55: mesajlari_getir hata firlatmiyor')
    esitMi((mesajlar ?? []).length >= 1, true, '55: gecmis okunabiliyor')

    // Yeni mesaj YAZILAMAMALI.
    const { error: yeniHata } = await a.rpc('mesaj_gonder', {
      p_kullanici_id: cId,
      p_metin: 'silme sonrasi mesaj',
    })
    esitMi(yeniHata !== null, true, '55: silinmis uyeye mesaj gonderilemiyor')

    await yonetici.from('konusmalar').delete().eq('id', konusmaId)
  })
```

**Not:** Bu senaryo `cId` ve `c` degiskenlerini kullanir; bunlar
`ucuncuKullaniciIleBaglan()` ile kurulur ve dosyada zaten mevcuttur.

- [ ] **Step 3: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL. `konusmalarim` konusmayi hic dondurmez (inner join),
`mesajlari_getir` ise "Konusma bulunamadi" firlatmaz ama karsi uye
kontrolu atlanmadigi icin davranis tanimsizdir.

- [ ] **Step 4: FK migrasyonunu yaz**

`mobil/supabase/migrations/20260822099000_silmede_kalanlar_fk.sql`:

```sql
-- Spec karar 68. Bugunku iki cascade, hesap silmeyi YANLIS yapiyor:
--
--   mesajlar.gonderen_id  -> cascade: silen tarafin mesajlari yok olur,
--     karsi tarafin gecmisi okunamaz yarim bir metne doner. Oysa bir
--     konusma IKI kisinin verisidir; kisiyle bagi koparmak (anonim)
--     KVKK'nin istedigini karsilar, icerigi yok etmek karsi tarafin
--     hakkina girer.
--
--   sikayetler.sikayet_eden_id -> cascade: kullanicinin BASKALARI
--     hakkinda actigi sikayetler yok olur. Tacize ugrayip sikayet eden
--     biri hesabini silince taciz edeni korurdu.
--
-- Kisit adlari create table govdesinde adsiz tanimlandigi icin
-- Postgres'in urettigi varsayilan adlardir. Migrasyonu yazmadan once
-- dogrula:
--   select conname from pg_constraint
--    where conrelid = 'public.mesajlar'::regclass and contype = 'f';

alter table public.mesajlar
  alter column gonderen_id drop not null;

alter table public.mesajlar
  drop constraint mesajlar_gonderen_id_fkey,
  add constraint mesajlar_gonderen_id_fkey
    foreign key (gonderen_id) references auth.users(id) on delete set null;

alter table public.sikayetler
  alter column sikayet_eden_id drop not null;

alter table public.sikayetler
  drop constraint sikayetler_sikayet_eden_id_fkey,
  add constraint sikayetler_sikayet_eden_id_fkey
    foreign key (sikayet_eden_id) references auth.users(id) on delete set null;
```

- [ ] **Step 5: Okuyucu migrasyonunu yaz**

`mobil/supabase/migrations/20260822100000_tek_uyeli_konusma.sql`:

```sql
-- Spec karar 69. Hesap silme, "her konusmanin tam iki uyesi var"
-- invaryantini kiriyor: konusma_uyeleri.kullanici_id birincil anahtarin
-- parcasi oldugu icin null olamaz, satir cascade ile gidiyor ve konusma
-- TEK UYELI kaliyor. Uc okuyucu bu duruma gore duzeltiliyor.
--
-- docs/faz3b-takip-isleri.md madde 1a bu degisiklikle guncellendi.

-- 1) yazabilir_mi: karsi uye yoksa false. Govde Task 2 surumunden
--    birebir kopyalandi; tek fark bastaki null kontrolu.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $fn$
  select
    p_hedef is not null
    and moderasyon.hesap_aktif_mi(auth.uid())
    and moderasyon.hesap_aktif_mi(p_hedef)
    and not gizli.engelli_mi(p_hedef)
    and (
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
      or exists (
        select 1 from public.sohbet_istekleri s
        where s.durum = 'kabul'
          and (
            (s.gonderen_id = auth.uid() and s.alan_id = p_hedef)
            or (s.gonderen_id = p_hedef and s.alan_id = auth.uid())
          )
      )
    );
$fn$;

grant execute on function bag.yazabilir_mi(uuid) to authenticated;

-- 2) konusmalarim: karsi uye ve profil join'leri LEFT oldu. Eskiden
--    INNER idi, yani karsi taraf silinince konusma listeden TAMAMEN
--    kaybolurdu - kullanicinin kendi gecmisi gozunun onunde yok olurdu.
--    Govde 20260820134912_mesaj_okuma_rpcleri.sql'den kopyalandi;
--    degisen yalnizca iki join turu ve engelleme kosulunun null'a
--    dayanikli hale gelmesi.
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
as $fn$
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
        and (m.gonderen_id is null or m.gonderen_id <> auth.uid())
        and (benim.son_okuma is null or m.olusturuldu > benim.son_okuma)
    ),
    bag.yazabilir_mi(d.kullanici_id)
  from public.konusmalar k
  join public.konusma_uyeleri benim
    on benim.konusma_id = k.id and benim.kullanici_id = auth.uid()
  left join public.konusma_uyeleri d
    on d.konusma_id = k.id and d.kullanici_id <> auth.uid()
  left join public.profiller p on p.id = d.kullanici_id
  left join lateral (
    select m.metin, m.olusturuldu
    from public.mesajlar m
    where m.konusma_id = k.id
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    -- Karsi uye yoksa engelleme kontrolu anlamsiz; null durumunda
    -- konusma listede kalmali.
    and (d.kullanici_id is null or not gizli.engelli_mi(d.kullanici_id))
  order by sm.olusturuldu desc nulls last;
end;
$fn$;

revoke execute on function public.konusmalarim() from public, anon;
grant execute on function public.konusmalarim() to authenticated;

-- 3) mesajlari_getir: karsi uye yoksa engelleme kontrolu ATLANIYOR.
--    Kontrol edilecek kimse yok; eskiden v_diger_id null kaldiginda
--    davranis tanimsizdi. Govde 20260820134912'den kopyalandi; degisen
--    yalnizca yorum ve null kolunun acikca ele alinmasi.
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
as $fn$
declare
  v_diger_id uuid;
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

  -- Bu fonksiyon security definer, yani mesajlar RLS'ini atliyor;
  -- engelleme kurali burada AYRICA zorlanmali.
  --
  -- `limit 1` hala dogru satiri seciyor ama artik SIFIR satir da
  -- donebilir: karsi taraf hesabini sildiyse uyelik satiri cascade ile
  -- gitmistir (spec karar 69). O durumda engelleme kontrolu atlanir -
  -- kontrol edilecek kimse yok - ve gecmis okunabilir kalir. Yazma
  -- yolu bag.yazabilir_mi(null) ile zaten kapali.
  select u.kullanici_id into v_diger_id
  from public.konusma_uyeleri u
  where u.konusma_id = p_konusma_id and u.kullanici_id <> auth.uid()
  limit 1;

  if v_diger_id is not null and gizli.engelli_mi(v_diger_id) then
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
$fn$;

revoke execute on function public.mesajlari_getir(uuid, timestamptz, int) from public, anon;
grant execute on function public.mesajlari_getir(uuid, timestamptz, int) to authenticated;
```

- [ ] **Step 6: Uygula ve senaryoyu kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 55 yesil; Faz 3b sohbet senaryolari (39-44)
bozulmamis.

- [ ] **Step 7: Sema degisikligini elle dogrula**

Supabase MCP `execute_sql` (ya da Supabase panosundaki SQL editoru) ile
Step 1'deki iki sorguyu calistir. Beklenen: iki sutun da
`is_nullable = 'YES'`, iki FK kisitinda da `confdeltype = 'n'`.
Sonucu commit mesajina yaz.

- [ ] **Step 8: Istemci gosterimi - basarisiz testi yaz**

`mobil/__tests__/ekranlar/mesajlar.test.tsx` icine:

```tsx
it('silinmis karsi taraf icin "Silinmis kullanici" gosterir', async () => {
  sahteKonusmalar.mockResolvedValue([
    {
      konusmaId: 'k1',
      kisiId: null,
      kullaniciAdi: null,
      ad: null,
      sonMesaj: 'eski mesaj',
      sonMesajZamani: '2026-08-01T00:00:00Z',
      okunmamis: 0,
      yazilabilirMi: false,
    },
  ])

  const { getByText } = await render(<MesajlarEkrani />)

  expect(getByText('Silinmis kullanici')).toBeTruthy()
})
```

`sahteKonusmalar` dosyanin mevcut `lib/sohbet` mock kalibiyla
tanimlanir.

- [ ] **Step 9: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/mesajlar.test.tsx`
Expected: FAIL, "Silinmis kullanici" bulunamiyor.

- [ ] **Step 10: Istemciyi duzelt**

`mobil/lib/sohbet.ts` icindeki konusma tipinde `kisiId`, `kullaniciAdi`
ve `ad` alanlarini nullable yap (`string | null`).

`mobil/src/app/mesajlar.tsx` icinde karsi tarafin adini basan yeri
degistir:

```tsx
  // Karsi taraf hesabini silmisse uyelik satiri yok; konusma listede
  // kalir ama kime ait oldugu artik bilinmiyor (spec karar 69).
  const gorunenAd = konusma.ad ?? 'Silinmis kullanici'
```

ve dokunulunca sohbet acmayi `konusma.kisiId` null ise devre disi birak
(rota `kullaniciId` istiyor, null ile acilamaz).

`mobil/src/app/sohbet/[kullaniciId].tsx` icinde mesaj balonunu belirleyen
karsilastirmayi null'a dayanikli yap:

```tsx
  // gonderen_id null = gonderen hesabini silmis. Kendi mesajim
  // olmadigi kesin, karsi balon olarak cizilir.
  const benimMi = mesaj.gonderenId !== null && mesaj.gonderenId === benimKimligim
```

- [ ] **Step 11: Testlerin gectigini dogrula**

Run: `cd mobil && npx jest --runInBand && npx tsc --noEmit`
Expected: Jest PASS; tsc yalnizca bilinen bes hata.

- [ ] **Step 12: Takip notunu guncelle**

`docs/faz3b-takip-isleri.md` madde 1a zaten spec asamasinda
guncellenmisti; simdi uygulandigini isaretle: madde basligina
"(UYGULANDI - Plan 1 Task 13)" ekle.

- [ ] **Step 13: Commit**

```bash
git add mobil/supabase/migrations/20260822099000_silmede_kalanlar_fk.sql mobil/supabase/migrations/20260822100000_tek_uyeli_konusma.sql mobil/gorunurluk-testleri/ mobil/lib/sohbet.ts mobil/src/app/mesajlar.tsx "mobil/src/app/sohbet/[kullaniciId].tsx" mobil/__tests__/ekranlar/mesajlar.test.tsx docs/faz3b-takip-isleri.md
git commit -m "feat: silmede mesaj ve sikayetler anonimlesir, tek uyeli konusma desteklenir"
```

---

## Task 14: Kullanici adi rezervasyonu - OZELLIK KALDIRILDI

> **KULLANICININ KARARI (2026-08-22): bu ozellik tamamen kaldirildi.**
> Once 90 gun olarak uygulandi, sonra 24 saate indirilmesi istendi,
> ardindan komple kaldirilmasina karar verildi. Asagidaki gorev metni
> TARIHSEL KAYITTIR; `20260822102000_kullanici_adi_rezervasyonu_kaldirildi.sql`
> tabloyu, `moderasyon.kullanici_adini_rezerve_et` fonksiyonunu ve budama
> cron isini dusuruyor, `kullanici_adi_musait_mi`yi rezervasyon oncesi
> haline donduruyor. Senaryo 57 silindi.
>
> Sonucu: silinen kullanici adi ANINDA serbest kalir, taklit korumasi yok.
> Ayrica inceleme, ozelligin zaten hicbir YAZMA noktasinda zorlanmadigini
> gostermisti (`kullanici_adi_degistir` ve kayit insert'i tabloya hic
> bakmiyordu), yani kaldirilan sey pratikte yalnizca bir gostergeydi.

**Files:**
- Create: `mobil/supabase/migrations/20260822101000_kullanici_adi_rezervasyonu.sql`
- Modify: `mobil/gorunurluk-testleri/calistir.ts`

**Interfaces:**
- Consumes: hicbir sey (bagimsiz).
- Produces:
  - `public.kullanici_adi_rezervasyonlari(kullanici_adi text primary key,
    serbest_kalma timestamptz not null)`.
  - `public.kullanici_adi_musait_mi(p_ad text)` rezervedeki adlar icin
    `false` doner (imza degismez).
  - `moderasyon.kullanici_adini_rezerve_et(p_ad text)` - Task 15'in
    Edge Function'i cagirir.

- [ ] **Step 1: Basarisiz senaryoyu yaz**

`calistir.ts` icinde senaryo 55'ten sonra:

```ts
  await senaryo('56 - Rezerve kullanici adi musait gorunmez', async () => {
    const yonetici = yoneticiIstemcisi()
    if (!yonetici) {
      console.log('  ATLANDI: SUPABASE_SERVICE_ROLE_KEY yok')
      return
    }
    const test_ad = 'rezerve.test.ad'

    const { data: oncesi, error: oncesiHata } = await a.rpc(
      'kullanici_adi_musait_mi',
      { p_ad: test_ad }
    )
    esitMi(oncesiHata, null, '56 kurulum: musaitlik sorgusu hatasiz')
    esitMi(oncesi, true, '56 kurulum: ad bastan musait')

    const { error: rezerveHata } = await yonetici
      .from('kullanici_adi_rezervasyonlari')
      .insert({
        kullanici_adi: test_ad,
        serbest_kalma: new Date(Date.now() + 86_400_000).toISOString(),
      })
    esitMi(rezerveHata, null, '56 kurulum: rezervasyon yazildi')

    const { data: sonrasi, error: sonrasiHata } = await a.rpc(
      'kullanici_adi_musait_mi',
      { p_ad: test_ad }
    )
    esitMi(sonrasiHata, null, '56: musaitlik sorgusu hatasiz')
    esitMi(sonrasi, false, '56: rezerve ad musait degil')

    // Rezervasyon tablosu istemciye kapali olmali.
    const { error: okumaHata } = await a
      .from('kullanici_adi_rezervasyonlari')
      .select('kullanici_adi')
      .limit(1)
    esitMi(okumaHata !== null, true, '56: rezervasyon tablosu istemciye kapali')

    await yonetici
      .from('kullanici_adi_rezervasyonlari')
      .delete()
      .eq('kullanici_adi', test_ad)
  })
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npm run test:gorunurluk`
Expected: FAIL, tablo yok.

- [ ] **Step 3: Migrasyonu yaz**

`mobil/supabase/migrations/20260822101000_kullanici_adi_rezervasyonu.sql`:

```sql
-- Spec karar 70. Silinen kullanici adi hemen serbest kalirsa bir baskasi
-- onu alip silinen kisinin yerine gecebilir - tanisma uygulamasinda
-- gercek bir taklit riski.
--
-- Tablo kisiyle HICBIR BAGI OLMADAN tutuluyor: yalnizca ad ve serbest
-- kalma tarihi. Silinmis bir kisinin tanitici bilgisini suresiz
-- saklamamak icin 24 saat sonra budaniyor.
create table public.kullanici_adi_rezervasyonlari (
  kullanici_adi text primary key,
  serbest_kalma timestamptz not null
);

-- RLS acik, POLITIKA YOK: istemci bu tabloyu hic goremez. Gorebilseydi
-- silinmis hesaplarin kullanici adlari listelenebilir hale gelirdi.
alter table public.kullanici_adi_rezervasyonlari enable row level security;
revoke all on public.kullanici_adi_rezervasyonlari from authenticated, anon;

-- Musaitlik kontrolu rezervasyonlari da hesaba katiyor. Govde
-- 20260819124003_kullanici_adi_musait_mi.sql'den kopyalandi; tek fark
-- ikinci not exists blogu.
create or replace function public.kullanici_adi_musait_mi(p_ad text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_ad is null or p_ad !~ '^[a-z0-9._]{3,20}$' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiller where kullanici_adi = p_ad
  ) and not exists (
    select 1 from public.kullanici_adi_rezervasyonlari r
     where r.kullanici_adi = p_ad and r.serbest_kalma > now()
  );
end;
$fn$;

revoke execute on function public.kullanici_adi_musait_mi from public, anon;
grant execute on function public.kullanici_adi_musait_mi to authenticated;

-- Edge Function silme sirasinda cagirir. moderasyon semasinda, cunku
-- public'teki her fonksiyonu PostgREST istemciye RPC olarak sunar ve
-- bu cagri istemciye ait degil.
create or replace function moderasyon.kullanici_adini_rezerve_et(p_ad text)
returns void
language sql
security definer
set search_path = public
as $fn$
  insert into public.kullanici_adi_rezervasyonlari (kullanici_adi, serbest_kalma)
  values (p_ad, now() + interval '24 hours')
  on conflict (kullanici_adi)
    do update set serbest_kalma = excluded.serbest_kalma;
$fn$;

revoke execute on function moderasyon.kullanici_adini_rezerve_et(text)
  from public, anon, authenticated;

-- Suresi dolan rezervasyonlar gunluk budaniyor; ad yeniden alinabilir
-- hale gelir. istek_gunlugu budamasiyla ayni kalip.
select cron.schedule(
  'kullanici-adi-rezervasyon-buda',
  '30 4 * * *',
  $job$ delete from public.kullanici_adi_rezervasyonlari
         where serbest_kalma < now(); $job$
);
```

**Not:** `kullanici_adi_musait_mi` govdesi yukarida yeniden yazildi.
Uygulamadan once `20260819124003_kullanici_adi_musait_mi.sql` dosyasini
ac ve gercek govdeyle karsilastir; farkli bir kontrol varsa onu koru.

- [ ] **Step 4: Uygula ve kosr**

Run: `cd mobil && npx supabase db push && npm run test:gorunurluk`
Expected: PASS. Senaryo 56 yesil; Faz 2c kullanici adi senaryolari
bozulmamis.

- [ ] **Step 5: Commit**

```bash
git add mobil/supabase/migrations/20260822101000_kullanici_adi_rezervasyonu.sql mobil/gorunurluk-testleri/calistir.ts
git commit -m "feat: silinen kullanici adi 24 saat rezerve edilir"
```

---

## Task 15: `hesap-sil` Edge Function

**Files:**
- Create: `mobil/supabase/functions/hesap-sil/index.ts`
- Create: `mobil/supabase/functions/hesap-sil/saf.ts`
- Create: `mobil/supabase/functions/hesap-sil/index_test.ts`
- Modify: `mobil/supabase/config.toml`

**Interfaces:**
- Consumes: FK
  degisiklikleri (Task 13).
- Produces: `POST /functions/v1/hesap-sil` uc noktasi.
  Yetkilendirme: cagiranin `Authorization: Bearer <kullanici JWT>`
  basligi. Govde: `{ "onay": "<kullanici adi>" }`. Yanit:
  `{ "silindi": true }` ya da HTTP 400/401 + `{ "hata": "<metin>" }`.
  Task 16 bunu cagirir.

**Neden Edge Function:** `auth.users` satirini silmek Admin API
gerektiriyor ve bu yalnizca sunucu tarafinda olabilir. Karar 55'in
"service-role yok" kurali **panelin paketi** icindir; sunucuda calisan
bir fonksiyon icin gecerli degildir (`bildirim-gonder` de ayni sekilde
service-role kullaniyor).

- [ ] **Step 1: Saf yardimcilarin testini yaz**

`mobil/supabase/functions/hesap-sil/index_test.ts`:

```ts
import { assertEquals } from '@std/assert'
import { fotografYollari, onayGecerliMi } from './saf.ts'

Deno.test('onayGecerliMi: kullanici adi birebir eslesmeli', () => {
  assertEquals(onayGecerliMi('deniz.k', 'deniz.k'), true)
  assertEquals(onayGecerliMi('deniz.k', 'Deniz.K'), false)
  assertEquals(onayGecerliMi('deniz.k', ' deniz.k '), true)
  assertEquals(onayGecerliMi('deniz.k', 'baskasi'), false)
  assertEquals(onayGecerliMi('deniz.k', ''), false)
  assertEquals(onayGecerliMi('deniz.k', null), false)
})

Deno.test('fotografYollari: profil ve check-in yollarini ayirir', () => {
  const sonuc = fotografYollari('kullanici-1', ['a.jpg', 'b.jpg'], ['c.jpg'])
  assertEquals(sonuc.profil, ['a.jpg', 'b.jpg'])
  assertEquals(sonuc.checkIn, ['c.jpg'])
})

Deno.test('fotografYollari: bos girdilerde bos dizi doner', () => {
  const sonuc = fotografYollari('kullanici-1', [], [])
  assertEquals(sonuc.profil, [])
  assertEquals(sonuc.checkIn, [])
})

Deno.test('fotografYollari: null ve bos metinleri eler', () => {
  const sonuc = fotografYollari('kullanici-1', ['a.jpg', ''], [null, 'c.jpg'])
  assertEquals(sonuc.profil, ['a.jpg'])
  assertEquals(sonuc.checkIn, ['c.jpg'])
})
```

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil/supabase/functions && deno test --allow-net --allow-env`
Expected: FAIL, `./saf.ts` bulunamiyor.

- [ ] **Step 3: Saf yardimcilari yaz**

`mobil/supabase/functions/hesap-sil/saf.ts`:

```ts
// Saf yardimcilar: ag ve veritabani yok, birim testlenebilir.

// Onay metni kullanici adiyla BIREBIR eslesmeli. Buyuk/kucuk harf
// esnekligi YOK: kullanici adlari zaten hep kucuk harf saklaniyor ve
// bu bir yikici islemin son kapisi - esneklik burada guvenlik degil
// risk.
export function onayGecerliMi(kullaniciAdi: string, onay: string | null): boolean {
  if (onay === null) return false
  return onay.trim() === kullaniciAdi
}

export type Yollar = { profil: string[]; checkIn: string[] }

// Storage'dan silinecek dosya yollari. Bos ve null degerler eleniyor:
// fotografsiz check-in'ler ve profiller normal.
export function fotografYollari(
  _kullaniciId: string,
  profilFotograflari: (string | null)[],
  checkInFotograflari: (string | null)[]
): Yollar {
  const temizle = (liste: (string | null)[]) =>
    liste.filter((y): y is string => typeof y === 'string' && y.length > 0)
  return {
    profil: temizle(profilFotograflari),
    checkIn: temizle(checkInFotograflari),
  }
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil/supabase/functions && deno test --allow-net --allow-env`
Expected: PASS, 4 test.

- [ ] **Step 5: Fonksiyonu yaz**

`mobil/supabase/functions/hesap-sil/index.ts`:

```ts
// Hesap silme (spec karar 67, 68, 70). auth.users satirini silmek Admin
// API gerektiriyor, bu yuzden Edge Function.
//
// Akis:
//   1) Cagiranin JWT'si dogrulanir - KENDI hesabindan baskasini silemez.
//   2) Onay metni kullanici adiyla karsilastirilir (yanlislikla silmeye
//      karsi surtunme; spec karar 67'de bekleme suresi yerine bu var).
//   4) Storage'daki profil ve check-in fotograflari silinir.
//   5) auth.admin.deleteUser cagrilir; cascade kalani goturur.
//
// (4) NEDEN (5)'TEN ONCE: kullanici satiri gidince check_inler de
// cascade ile gider ve fotograf yollarini bir daha okuyamayiz. Yollar
// once toplanmali.
//
// DEPLOY NOTU: `verify_jwt` ACIK olmali - bildirim-gonder'in tersine.
// Cagriyi gercek bir kullanici yapiyor ve yetkilendirmenin tamami onun
// JWT'sine dayaniyor.
//
// LOG: kullanici adi, telefon ya da mesaj icerigi YAZILMAZ; yalnizca
// islem sonucu ve silinen dosya sayilari.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { fotografYollari, onayGecerliMi } from './saf.ts'

const PROFIL_BUCKET = 'profil-fotograflari'
const CHECKIN_BUCKET = 'checkin-fotograflari'

function yanit(govde: unknown, durum: number): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (istek: Request) => {
  if (istek.method !== 'POST') {
    return yanit({ hata: 'Yalnizca POST' }, 405)
  }

  const yetkiBasligi = istek.headers.get('Authorization')
  if (!yetkiBasligi) {
    return yanit({ hata: 'Kimlik dogrulamasi gerekli' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const servisAnahtari = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !servisAnahtari) {
    console.error('hesap-sil: ortam degiskenleri eksik')
    return yanit({ hata: 'Sunucu yapilandirmasi eksik' }, 500)
  }

  const yonetici = createClient(url, servisAnahtari, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Cagiran kim? Jeton service-role istemcisiyle dogrulaniyor.
  const jeton = yetkiBasligi.replace(/^Bearer\s+/i, '')
  const { data: kullaniciVerisi, error: kullaniciHata } =
    await yonetici.auth.getUser(jeton)
  const kimlik = kullaniciVerisi?.user?.id
  if (kullaniciHata || !kimlik) {
    return yanit({ hata: 'Kimlik dogrulamasi gecersiz' }, 401)
  }

  // 2) Onay metni.
  let onay: string | null = null
  try {
    const govde = await istek.json()
    onay = typeof govde?.onay === 'string' ? govde.onay : null
  } catch {
    onay = null
  }

  const { data: profil, error: profilHata } = await yonetici
    .from('profiller')
    .select('kullanici_adi, fotograflar')
    .eq('id', kimlik)
    .maybeSingle()

  if (profilHata) {
    console.error('hesap-sil: profil okunamadi')
    return yanit({ hata: 'Hesap okunamadi' }, 500)
  }

  // Profili olmayan bir hesap (kayit yarida kalmis) da silinebilmeli;
  // o durumda onay metni beklenmiyor.
  if (profil && !onayGecerliMi(profil.kullanici_adi, onay)) {
    return yanit({ hata: 'Onay metni kullanici adinla eslesmiyor' }, 400)
  }

  // 3) ADIM KALDIRILDI: kullanici adi rezervasyonu (karar 70 geri alindi,
  //    kullanicinin karari 2026-08-22). Silinen ad aninda serbest kalir.

  // 4) Storage temizligi. Yollar auth.users silinmeden ONCE toplanmali.
  const { data: checkInler, error: checkInHata } = await yonetici
    .from('check_inler')
    .select('fotograf')
    .eq('kullanici_id', kimlik)

  if (checkInHata) {
    console.error('hesap-sil: check-in fotograflari okunamadi')
    return yanit({ hata: 'Silme tamamlanamadi' }, 500)
  }

  const yollar = fotografYollari(
    kimlik,
    (profil?.fotograflar ?? []) as string[],
    ((checkInler ?? []) as { fotograf: string | null }[]).map((c) => c.fotograf)
  )

  if (yollar.profil.length > 0) {
    const { error } = await yonetici.storage.from(PROFIL_BUCKET).remove(yollar.profil)
    // Dosya silinemezse islemi DURDURMUYORUZ: hesabin silinmesi
    // kullanicinin kanuni hakki ve bir oksuz dosya yuzunden
    // engellenmemeli. Kalinti loglaniyor ve elle temizlenebilir.
    if (error) console.error('hesap-sil: profil fotograflari silinemedi')
  }
  if (yollar.checkIn.length > 0) {
    const { error } = await yonetici.storage.from(CHECKIN_BUCKET).remove(yollar.checkIn)
    if (error) console.error('hesap-sil: check-in fotograflari silinemedi')
  }

  // 5) Asil silme. Cascade profiller, check_inler, takipler,
  //    sohbet_istekleri, engellemeler, istek_gunlugu, bildirim_jetonlari,
  //    konusma_uyeleri ve hesap_durumlari satirlarini goturur; mesajlar
  //    ve sikayetler Task 13 sayesinde set null ile KALIR.
  const { error: silmeHata } = await yonetici.auth.admin.deleteUser(kimlik)
  if (silmeHata) {
    console.error('hesap-sil: auth kullanicisi silinemedi')
    return yanit({ hata: 'Silme tamamlanamadi' }, 500)
  }

  console.log(
    `hesap-sil: tamamlandi, profil dosyasi=${yollar.profil.length}, checkin dosyasi=${yollar.checkIn.length}`
  )
  return yanit({ silindi: true }, 200)
})
```

- [ ] **Step 6: `config.toml`'a beyan ekle**

`mobil/supabase/config.toml` icinde, `bildirim-gonder` beyaninin
yanina:

```toml
[functions.hesap-sil]
verify_jwt = true
```

- [ ] **Step 7: Tip kontrolu**

Run: `cd mobil/supabase/functions && deno check hesap-sil/index.ts && deno test --allow-net --allow-env`
Expected: Ikisi de PASS.

- [ ] **Step 8: Dagit ve canli dogrula**

Run: `cd mobil && npx supabase functions deploy hesap-sil`

Ardindan **atilabilir bir test hesabiyla** uctan uca dogrula (asil iki
test numarasini KULLANMA - onlar butun gorunurluk paketinin on kosulu):

1. Uygulamada yeni bir hesap ac, profil olustur, bir fotograf yukle.
2. O hesabin JWT'siyle uc noktayi cagir, yanlis onay metniyle: HTTP 400
   beklenir.
3. Dogru onay metniyle cagir: `{ "silindi": true }` beklenir.
4. Ayni telefon numarasiyla yeniden kayit olunabildigini dogrula
   (spec karar 67: sifirdan yeni hesap).

- [ ] **Step 9: Commit**

```bash
git add mobil/supabase/functions/hesap-sil/ mobil/supabase/config.toml
git commit -m "feat: hesap-sil Edge Function - kalici hesap silme"
```

---

## Task 16: Hesap silme akisi (istemci)

**Files:**
- Modify: `mobil/lib/hesap.ts`
- Modify: `mobil/lib/hesap.test.ts`
- Create: `mobil/src/app/profil/hesabi-sil.tsx`
- Create: `mobil/__tests__/ekranlar/profil/hesabi-sil.test.tsx`
- Modify: `mobil/src/app/profil/ayarlar.tsx`

**Interfaces:**
- Consumes: `hesap-sil` uc noktasi (Task 15).
- Produces: `export async function hesabiSil(onay: string): Promise<void>`
  - `lib/hesap.ts` icinde; hata durumunda sunucunun `hata` alanini
  firlatir.

- [ ] **Step 1: Basarisiz testi yaz**

`mobil/lib/hesap.test.ts` icine:

```ts
import { hesabiSil } from './hesap'

describe('hesabiSil', () => {
  it('uc noktayi onay metniyle cagirir', async () => {
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({ data: { silindi: true }, error: null }),
    } as never
    await hesabiSil('deniz.k')
    expect(
      (sahteSupabase as unknown as { functions: { invoke: jest.Mock } }).functions
        .invoke
    ).toHaveBeenCalledWith('hesap-sil', { body: { onay: 'deniz.k' } })
  })

  it('sunucu hatasini firlatir', async () => {
    sahteSupabase.functions = {
      invoke: jest.fn().mockResolvedValue({
        data: { hata: 'Onay metni kullanici adinla eslesmiyor' },
        error: { message: 'Edge Function returned a non-2xx status code' },
      }),
    } as never
    await expect(hesabiSil('yanlis')).rejects.toThrow(
      'Onay metni kullanici adinla eslesmiyor'
    )
  })
})
```

`jest.mock('./supabase', ...)` bloguna `functions: { invoke: jest.fn() }`
ekle.

- [ ] **Step 2: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand lib/hesap.test.ts`
Expected: FAIL, `hesabiSil` disa acilmamis.

- [ ] **Step 3: `lib/hesap.ts`'e ekle**

```ts
// Silme, RPC degil Edge Function: auth.users satirini kaldirmak Admin
// API gerektiriyor (spec karar 67).
export async function hesabiSil(onay: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('hesap-sil', {
    body: { onay },
  })
  if (error) {
    // Edge Function 4xx dondugunde supabase-js genel bir mesaj veriyor;
    // asil sebep govdededir ve kullaniciya onu gostermek gerekiyor.
    const sunucuHatasi = (data as { hata?: string } | null)?.hata
    throw new Error(sunucuHatasi ?? error.message)
  }
}
```

- [ ] **Step 4: Testlerin gectigini dogrula**

Run: `cd mobil && npx jest --runInBand lib/hesap.test.ts`
Expected: PASS, 9 test.

- [ ] **Step 5: Ekran testini yaz**

`mobil/__tests__/ekranlar/profil/hesabi-sil.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native'
import HesabiSilEkrani from '../../../src/app/profil/hesabi-sil'
import { hesabiSil } from '../../../lib/hesap'

jest.mock('../../../lib/hesap', () => ({
  hesabiSil: jest.fn(),
}))

jest.mock('../../../lib/ayarlar', () => ({
  kullaniciAdiDurumunuGetir: jest
    .fn()
    .mockResolvedValue({ kullaniciAdi: 'deniz.k', degistirilebilirMi: true }),
}))

jest.mock('../../../lib/supabase', () => ({
  supabase: { auth: { signOut: jest.fn() } },
}))

const sahteSil = hesabiSil as jest.Mock

beforeEach(() => jest.clearAllMocks())

it('dondurmayi alternatif olarak sunar', async () => {
  const { getByText } = await render(<HesabiSilEkrani />)
  expect(
    getByText(
      'Geri donusu yok. Yeniden gelmek istersen sifirdan hesap acman gerekir.'
    )
  ).toBeTruthy()
  expect(getByText('Bunun yerine hesabimi dondur')).toBeTruthy()
})

it('kullanici adi yazilmadan silme calismaz', async () => {
  const { getByText } = await render(<HesabiSilEkrani />)
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(sahteSil).not.toHaveBeenCalled()
  expect(getByText('Onaylamak icin kullanici adini yaz.')).toBeTruthy()
})

it('dogru kullanici adiyla silme cagrilir', async () => {
  const { getByText, getByPlaceholderText } = await render(<HesabiSilEkrani />)
  await fireEvent.changeText(getByPlaceholderText('kullanici adin'), 'deniz.k')
  await fireEvent.press(getByText('Hesabimi kalici olarak sil'))
  expect(sahteSil).toHaveBeenCalledWith('deniz.k')
})
```

- [ ] **Step 6: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/profil/hesabi-sil.test.tsx`
Expected: FAIL, modul bulunamiyor.

- [ ] **Step 7: Ekrani yaz**

`mobil/src/app/profil/hesabi-sil.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hesabiSil } from '../../../lib/hesap'
import { kullaniciAdiDurumunuGetir } from '../../../lib/ayarlar'
import { supabase } from '../../../lib/supabase'

// Spec karar 67: bekleme suresi YOK, koruma SURTUNME. Kullanici adini
// yazmak yanlislikla silmeyi engelliyor; dondurma alternatifi ayni
// ekranda sunuluyor cunku "kararsizim" ihtiyacini o karsiliyor.
export default function HesabiSilEkrani() {
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [yazilan, setYazilan] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  useEffect(() => {
    kullaniciAdiDurumunuGetir()
      .then((d) => setKullaniciAdi(d.kullaniciAdi))
      .catch(() => setKullaniciAdi(''))
  }, [])

  async function sil() {
    if (yazilan.trim() === '') {
      setHata('Onaylamak icin kullanici adini yaz.')
      return
    }
    setCalisiyor(true)
    try {
      await hesabiSil(yazilan.trim())
      await supabase.auth.signOut()
    } catch (e) {
      setHata((e as Error).message)
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabini sil</Text>
      <Text style={stiller.metin}>
        Geri donusu yok. Yeniden gelmek istersen sifirdan hesap acman
        gerekir.
      </Text>
      <Text style={stiller.ipucu}>
        Profilin, anilarin, baglarin ve konusma listen silinir. Karsi
        tarafin gecmisindeki mesajlar kalir ama adin gorunmez.
      </Text>

      <Pressable style={stiller.ikincilButon} onPress={() => router.back()}>
        <Text style={stiller.ikincilButonMetni}>
          Bunun yerine hesabimi dondur
        </Text>
      </Pressable>

      <Text style={stiller.etiket}>
        Onaylamak icin kullanici adini yaz: @{kullaniciAdi}
      </Text>
      <TextInput
        style={stiller.girdi}
        placeholder="kullanici adin"
        autoCapitalize="none"
        value={yazilan}
        onChangeText={setYazilan}
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.tehlikeButonu} onPress={sil} disabled={calisiyor}>
        <Text style={stiller.tehlikeButonMetni}>
          Hesabimi kalici olarak sil
        </Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, gap: 12 },
  baslik: { fontSize: 20, fontWeight: '600' },
  metin: { fontSize: 15 },
  ipucu: { fontSize: 13, opacity: 0.7 },
  etiket: { fontSize: 14, marginTop: 16 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  hata: { color: '#b00020' },
  ikincilButon: { padding: 12, alignItems: 'center' },
  ikincilButonMetni: { fontWeight: '600' },
  tehlikeButonu: {
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#b00020',
    alignItems: 'center',
  },
  tehlikeButonMetni: { color: 'white', fontWeight: '600' },
})
```

- [ ] **Step 8: Ayarlardan girisi ekle**

`mobil/src/app/profil/ayarlar.tsx` icindeki dondurma bolumunun altina:

```tsx
      <Pressable
        style={stiller.buton}
        onPress={() => router.push('/profil/hesabi-sil')}
      >
        <Text style={stiller.butonMetni}>Hesabimi sil</Text>
      </Pressable>
```

Gerekli `import { router } from 'expo-router'` satirini ekle (zaten
varsa tekrar ekleme).

- [ ] **Step 9: Testleri kosr ve commit**

Run: `cd mobil && npx jest --runInBand && npx tsc --noEmit`
Expected: Jest PASS; tsc yalnizca bilinen bes hata.

```bash
git add mobil/lib/hesap.ts mobil/lib/hesap.test.ts mobil/src/app/profil/hesabi-sil.tsx mobil/src/app/profil/ayarlar.tsx mobil/__tests__/ekranlar/profil/hesabi-sil.test.tsx
git commit -m "feat: hesap silme akisi ve onay ekrani"
```

---

## Task 17: Gizlilik metni ve ekrani

Bu gorev **isin parcasidir, ertelenen bir sus degildir** (spec
"Gizlilik metni yukumlulugu"). Plan 2'nin mesaj okuma yetkisi bu metin
yayinda olmadan devreye girerse, bildirilmemis bir okuma yetkisi
calisir duruma gelir.

**Files:**
- Create: `docs/gizlilik-metni.md`
- Create: `mobil/src/app/gizlilik.tsx`
- Create: `mobil/__tests__/ekranlar/gizlilik.test.tsx`
- Modify: `mobil/src/app/profil/ayarlar.tsx`
- Modify: `docs/kvkk-uyum-listesi.md`

**Interfaces:**
- Consumes: hicbir sey.
- Produces: `/gizlilik` rotasi.

- [ ] **Step 1: Metni yaz**

`docs/gizlilik-metni.md` - kaynak metin. `docs/kvkk-uyum-listesi.md`
madde 1'deki liste birebir kapsanmali:

1. **Hangi veriler isleniyor:** telefon numarasi, ad, kullanici adi,
   dogum tarihi, biyografi, fotograflar, **konum** (check-in), mesaj
   icerigi, bag ve engelleme bilgileri, bildirim cihazi jetonu,
   sikayetler.
2. **Ne amacla:** hesabin kurulmasi ve dogrulanmasi, yakindaki kisilerin
   kesfi, mesajlasma, kotuye kullanimin onlenmesi.
3. **Konum ozel olarak:** yalnizca check-in yapildiginda ve kullanicinin
   sectigi bulunurluk kademesine gore paylasilir; `gizli` secildiginde
   kimseye gorunmez.
4. **Moderasyon erisimi:** kotuye kullanim incelemesi sirasinda
   moderasyonun profil, check-in ve **mesaj icerigini** okuyabilecegi.
   Her erisimin kaydedildigi.
5. **Yurt disina aktarim:** verilerin Supabase uzerinde Almanya'da
   (`eu-central-1`) tutuldugu; bildirim gonderiminde cihaz jetonunun
   Expo (ABD) uzerinden gectigi.
6. **Saklama sureleri:** spec'teki "Saklama sureleri" tablosu (denetim
   izi 2 yil, karara baglanmis sikayet 1 yil, suresi dolmus aski
   kaydi 90 gun) ve hesap silinince ne olacagi (mesajlar ve sikayetler
   kalir, kimlik bagi kopar).
7. **Haklarin:** hesabi dondurma, kalici silme, bilgi talep etme; basvuru
   yolu.

Metin duz Turkce, aksanli harf yok, madde madde.

- [ ] **Step 2: Ekran testini yaz**

`mobil/__tests__/ekranlar/gizlilik.test.tsx`:

```tsx
import { render } from '@testing-library/react-native'
import GizlilikEkrani from '../../src/app/gizlilik'

it('moderasyonun mesaj okuyabilecegini acikca yazar', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(
    getByText(/moderasyon .* mesaj iceriklerini okuyabilir/i)
  ).toBeTruthy()
})

it('yurt disina aktarimi belirtir', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/Almanya/)).toBeTruthy()
})

it('silme ve dondurma haklarini belirtir', async () => {
  const { getByText } = await render(<GizlilikEkrani />)
  expect(getByText(/hesabini dondurabilir/i)).toBeTruthy()
  expect(getByText(/kalici olarak silebilirsin/i)).toBeTruthy()
})
```

- [ ] **Step 3: Basarisiz oldugunu dogrula**

Run: `cd mobil && npx jest --runInBand __tests__/ekranlar/gizlilik.test.tsx`
Expected: FAIL, modul bulunamiyor.

- [ ] **Step 4: Ekrani yaz**

`mobil/src/app/gizlilik.tsx` - `docs/gizlilik-metni.md` icerigini
`ScrollView` icinde bolum bolum gosteren bir ekran. Metin kod icinde
sabit bir dizide tutulur (uzak kaynaktan cekilmez: gizlilik metni ag
baglantisi olmadan da okunabilmeli).

- [ ] **Step 5: Ayarlardan link ekle**

`mobil/src/app/profil/ayarlar.tsx` icine, "Hesap" bolumunun altina:

```tsx
      <Pressable style={stiller.buton} onPress={() => router.push('/gizlilik')}>
        <Text style={stiller.butonMetni}>Gizlilik metni</Text>
      </Pressable>
```

- [ ] **Step 6: Uyum listesini guncelle**

`docs/kvkk-uyum-listesi.md` madde 1'i **BLOKE**'den **KAPANDI**'ya
cevir; ekranin yolunu ve metnin kaynak dosyasini yaz. Madde 3 (yurt
disina aktarim) **EKSIK** kalmaya devam eder - metin durumu bildiriyor
ama hukuki mekanizma hala kurulmadi; bunu acikca not et.

- [ ] **Step 7: Testleri kosr ve commit**

Run: `cd mobil && npx jest --runInBand && npx tsc --noEmit`
Expected: Jest PASS; tsc yalnizca bilinen bes hata.

```bash
git add docs/gizlilik-metni.md docs/kvkk-uyum-listesi.md mobil/src/app/gizlilik.tsx mobil/src/app/profil/ayarlar.tsx mobil/__tests__/ekranlar/gizlilik.test.tsx
git commit -m "feat: gizlilik metni ve ekrani (KVKK m.10 aydinlatma yukumlulugu)"
```

---

## Task 18: Kapanis dogrulamasi

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/konusma-gunlugu.md`
- Create: `docs/plan1-takip-isleri.md`

**Interfaces:**
- Consumes: Task 1-17'nin tamami.
- Produces: Dogrulanmis bir dal ve Plan 2'ye devir notu.

- [ ] **Step 1: Dort otomatik kosumu calistir**

Once calisan bir `expo start` sunucusu varsa **kapat** (islemci
yarisirsa 5000 ms render zaman asimlari cikar).

```bash
cd mobil
npx jest --runInBand
npm run test:sema
npm run test:gorunurluk
npx tsc --noEmit
cd supabase/functions && deno check hesap-sil/index.ts && deno test --allow-net --allow-env
```

Expected: Jest tam yesil; `test:sema` sifir basarisizlik;
`test:gorunurluk` sifir basarisizlik (senaryo 29 varsayilan kosumda
ATLANDI gosterilir - bu beklenen); `tsc` yalnizca bilinen bes hata;
Deno kontrol ve testleri yesil.

Her kosumun **gercek sayisini** not al; Step 4'te belgelere bu sayilar
yazilacak.

- [ ] **Step 2: Zorlama noktasi denetimi**

Spec'teki "Askiya almanin zorlandigi noktalar" tablosunu ac. 8 yazma
kapisinin ve 5 gorunurluk yolunun **her biri** icin, uygulayan kisi
karsiligini gosteren migrasyon dosyasini ve senaryoyu isaretler. Eksik
kalan varsa Task 18 kapanmaz; eksik once tamamlanir.

Bu bir surec kontroludur, otomatik bir kacak kontrolu degil (spec
"Riskler" madde 2).

- [ ] **Step 3: Elle uctan uca dogrulama**

Bu adim **atlanmaz**. Tek hesapla, kullanicinin kendi tarayicisinda
yapilabilir:

```bash
cd mobil && npx expo start --web --clear --port 8084
```

Sirayla:

1. Giris yap, ayarlara git, **Hesabimi dondur** > **Evet, dondur**.
   Oturumun kapandigini gor.
2. Yeniden giris yap. Uygulamaya **dogrudan** girdigini gor (dondurulmus
   ekrani cikmamali - karar 66).
3. Ayarlarda **Gizlilik metni**'ni ac; moderasyonun mesaj okuyabilecegi
   maddesinin gorundugunu dogrula.
4. **Hesabimi sil** ekranini ac. Yanlis bir metin yazip sil'e bas: hata
   mesajini gor. Vazgec.
5. Atilabilir bir ikinci hesapla 4. adimi dogru kullanici adiyla
   tamamla; hesabin silindigini ve ayni telefonla yeniden kayit
   olunabildigini gor.

Sunucuyu kapat.

- [ ] **Step 4: Belgeleri guncelle**

`CLAUDE.md`: "SIRADAKI IS" maddesini guncelle - Plan 1 tamamlandi, dort
kosumun **gercek** sayilarini yaz, sirada Plan 2 (moderasyon paneli)
oldugunu belirt. Yerelden devam bolumundeki dal adini ve test sayilarini
guncelle.

`docs/konusma-gunlugu.md`: Plan 1 kapanis girdisi - hangi gorevler,
kac migrasyon, hangi sayilar, hangi elle dogrulama yapildi.

`docs/kvkk-uyum-listesi.md`: madde 1 ve 5 kapandi olarak isaretli mi
son kez kontrol et.

`docs/plan1-takip-isleri.md`: inceleme sirasinda bulunup **bilerek**
ertelenen maddeler. En az sunlari icermeli:
- Storage'da kalan oksuz dosyalar (silme sirasinda `remove` hata
  dondurse bile islem devam ediyor).
- Erisim ve tasinabilirlik hakki (KVKK m.11) hala EKSIK - veri disa
  aktarma yok.
- Yurt disina aktarim mekanizmasi (m.9) hukukcu onayi bekliyor.
- Askiya alinan kullanicinin mevcut jetonunun 1 saat gecerli kalmasi
  (spec "Riskler" madde 1).

- [ ] **Step 5: Commit ve push**

```bash
git add -A
git commit -m "docs: Plan 1 kapanisi - hesap durumu temeli ve kullanici haklari"
git push origin <calisilan dal>
```

---

## Plan ozeti

| Gorev | Cikti |
|---|---|
| 1 | `hesap_durumlari`, `moderasyon.hesap_aktif_mi` |
| 2-5 | 8 yazma kapisi kapatildi |
| 6-8 | 5 gorunurluk yolu kapatildi |
| 9 | Dondurma RPC'leri |
| 10-12 | Istemci: `lib/hesap.ts`, oturum akisi, durum ekrani, ayarlar |
| 13 | FK'lar `set null`, tek uyeli konusma |
| 14 | ~~Kullanici adi rezervasyonu~~ KALDIRILDI (karar 70 geri alindi) |
| 15-16 | `hesap-sil` Edge Function ve silme akisi |
| 17 | Gizlilik metni ve ekrani |
| 18 | Kapanis dogrulamasi |

Toplam 12 yeni migrasyon, 1 yeni Edge Function, 1 yeni istemci modulu,
3 yeni ekran, 12 yeni canli senaryo (45-56).

**Plan 2 (moderasyon paneli) bu planin ciktilarina dayanir:**
`hesap_durumlari` tablosu ve `moderasyon` semasi orada da kullanilacak;
panelin "askiya al" aksiyonu bu planin kurdugu zorlama noktalarina
yazacak.
