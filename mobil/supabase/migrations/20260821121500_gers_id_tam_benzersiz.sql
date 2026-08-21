-- Duzeltme: kismi benzersiz indeks PostgREST upsert'inin ON CONFLICT
-- hedefi olamiyor (42P10). Duz benzersiz kisit yeterli - Postgres'te
-- NULL'lar birbirine esit sayilmaz, kullanici mekanlarinin gers_id'siz
-- olmasi sorun cikarmaz.
drop index if exists mekanlar_gers_id_benzersiz;
alter table public.mekanlar
  add constraint mekanlar_gers_id_benzersiz unique (gers_id);
