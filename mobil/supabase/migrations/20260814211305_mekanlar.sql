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
