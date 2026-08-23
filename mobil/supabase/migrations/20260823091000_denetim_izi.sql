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

-- Tek yazma yolu. security definer, cunku tabloya hicbir rolun dogrudan
-- insert yetkisi yok. auth.uid() gercek degerdir (service-role
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

-- Saklama suresi (spec karar 65 onerisi): moderasyon erisim kayitlari
-- 2 yil. Sure degisirse degisen tek sey bu aralik. Kalip mevcut
-- 'istek-gunlugu-buda' isinden alindi.
select cron.schedule(
  'moderasyon-izi-buda',
  '45 4 * * *',
  'delete from public.moderasyon_kayitlari where olusturuldu < now() - interval ''2 years'';'
);
