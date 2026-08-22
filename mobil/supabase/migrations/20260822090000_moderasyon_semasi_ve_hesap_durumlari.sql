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
as $fn$
  select not exists (
    select 1 from public.hesap_durumlari d
     where d.kullanici_id = p_kullanici_id
       and (d.durum in ('yasakli', 'dondurulmus') or d.aski_bitisi > now())
  );
$fn$;

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
  $fn$ delete from public.hesap_durumlari
      where durum = 'askida' and aski_bitisi < now() - interval '90 days'; $fn$
);
