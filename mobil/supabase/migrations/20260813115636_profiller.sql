create table public.profiller (
  id uuid primary key references auth.users(id) on delete cascade,
  ad text not null,
  dogum_tarihi date not null,
  biyografi text,
  fotograflar text[] not null default '{}',
  olusturuldu timestamptz not null default now()
);

alter table public.profiller enable row level security;

create policy "kendi profilini okuyabilir"
  on public.profiller for select
  using (auth.uid() = id);

create policy "kendi profilini olusturabilir"
  on public.profiller for insert
  with check (auth.uid() = id);

create policy "kendi profilini guncelleyebilir"
  on public.profiller for update
  using (auth.uid() = id);
