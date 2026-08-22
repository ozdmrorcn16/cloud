-- Task 15 incelemesinde bulunan I2: bir moderatorun hesabi silinmeye
-- kalkilinca `hesap_durumlari.moderator_id` FK'si (varsayilan NO ACTION)
-- ihlal edilir ve `auth.admin.deleteUser` patlar. Bu bulgu Task 1'de
-- kaydedilmisti, Task 15'e tasinmasi atlanmisti.
--
-- Kisit adlari create table govdesinde adsiz tanimlandigi icin
-- Postgres'in urettigi varsayilan adlardir. Migrasyonu yazmadan once
-- dogrulandi (canli veritabaninda):
--   select conname, confdeltype from pg_constraint
--    where conrelid = 'public.hesap_durumlari'::regclass and contype = 'f';
--   -> hesap_durumlari_moderator_id_fkey, confdeltype = 'a' (NO ACTION)

alter table public.hesap_durumlari
  drop constraint hesap_durumlari_moderator_id_fkey,
  add constraint hesap_durumlari_moderator_id_fkey
    foreign key (moderator_id) references auth.users(id) on delete set null;

-- `hesap_durumlari_kaynak` CHECK'inin iki yarisi vardi: (a) dondurulmus
-- ise moderator_id NULL olmali, (b) askida/yasakli ise moderator_id DOLU
-- olmali. (b) yukaridaki `set null`la CELISIR: bir moderator silinince
-- onun verdigi askida/yasakli kararlarin moderator_id'si NULL'a duser ve
-- CHECK ihlal edilip silme yine patlar. (b) DUSURULUYOR; (a) KALIYOR.
--
-- Gerekce: kalici "kim yapti" kaydi zaten `moderasyon_kayitlari`nda
-- (Plan 2) tutulacak; `hesap_durumlari` guncel DURUMU tasiyan bir tablo,
-- tarihi degil. Bir moderatorun hesabi silindiginde verdigi kararlarin
-- moderator_id'sinin NULL'a dusmesi karar 68'in "anonimlestir, yok
-- etme" cizgisiyle tutarli - karar duruyor, kimin verdigi bilgisi
-- kalici kayda (Plan 2) devrediliyor.
alter table public.hesap_durumlari
  drop constraint hesap_durumlari_kaynak,
  add constraint hesap_durumlari_kaynak check (
    durum <> 'dondurulmus' or moderator_id is null
  );
