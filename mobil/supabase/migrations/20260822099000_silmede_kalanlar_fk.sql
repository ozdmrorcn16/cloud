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
-- dogrulandi:
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
