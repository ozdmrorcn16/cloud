alter table public.sikayetler
  add column karar_veren_id uuid references auth.users(id) on delete set null,
  add column karar_zamani   timestamptz,
  add column moderator_notu text;

-- Karar 62: 'mesaj' turu bugun RPC tarafindan kabul ediliyor ama tablo
-- tanimadigi icin insert 23514 ile patliyor - yani bir mesaj sikayeti
-- HIC gonderilemiyor. Kisit adi canlida dogrulandi:
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.sikayetler'::regclass and contype = 'c';
--   -> sikayetler_hedef_tur_check, CHECK (hedef_tur in ('kullanici','check_in'))
alter table public.sikayetler
  drop constraint sikayetler_hedef_tur_check,
  add  constraint sikayetler_hedef_tur_check
    check (hedef_tur in ('kullanici', 'check_in', 'mesaj'));

-- Karar sutunlarina istemci yazamaz; tek yazma yolu
-- moderasyon_sikayeti_karara_bagla RPC'sidir.
revoke update on public.sikayetler from authenticated, anon;
