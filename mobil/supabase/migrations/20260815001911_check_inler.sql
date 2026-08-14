create table public.check_inler (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  mekan_id uuid not null references public.mekanlar(id) on delete cascade,
  not_metni text,
  fotograf text,
  olusturma_zamani timestamptz not null default now(),
  bitis_zamani timestamptz not null,
  konum geography(point, 4326),
  gorunurluk text not null default 'herkese_acik'
);

create index check_inler_mekan_idx on public.check_inler (mekan_id);
create index check_inler_kullanici_idx on public.check_inler (kullanici_id);

alter table public.check_inler enable row level security;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    kullanici_id = auth.uid()
    or konum is null
    or exists (
      select 1 from public.check_inler benim
      where benim.kullanici_id = auth.uid()
        and benim.mekan_id = check_inler.mekan_id
        and benim.konum is not null
        and benim.bitis_zamani > now()
    )
  );

create policy "kendi anisini silebilir"
  on public.check_inler for delete
  using (kullanici_id = auth.uid());
