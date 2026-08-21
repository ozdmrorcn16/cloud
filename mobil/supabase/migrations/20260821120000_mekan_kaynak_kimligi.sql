-- Mekan verisinin kaynak kimligi: Overture yuklemesi icin upsert anahtari.
-- gers_id: Overture'un kalici kimligi (GERS). Aylik tazeleme bu anahtarla
-- upsert yapar. osm_id eski kolon olarak duruyor (hic dolmadi ama sema
-- uyumu icin kaldi).
alter table public.mekanlar
  add column if not exists gers_id text,
  add column if not exists kaynak text not null default 'kullanici',
  add column if not exists guven double precision,
  add column if not exists guncellendi timestamptz not null default now();

-- Var olan satirlar (test mekanlari) kullanici eklemesi sayilir.
update public.mekanlar
   set kaynak = case when ekleyen_kullanici is not null then 'kullanici' else 'osm' end;

-- Upsert anahtari: gers_id doluysa benzersiz olmali.
create unique index if not exists mekanlar_gers_id_benzersiz
  on public.mekanlar (gers_id) where gers_id is not null;

-- Kaynak degerleri sinirli kalsin.
alter table public.mekanlar
  add constraint mekanlar_kaynak_gecerli
  check (kaynak in ('kullanici', 'osm', 'overture'));
