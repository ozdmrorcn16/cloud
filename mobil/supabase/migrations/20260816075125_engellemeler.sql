create table public.engellemeler (
  engelleyen_id uuid not null references auth.users(id) on delete cascade,
  engellenen_id uuid not null references auth.users(id) on delete cascade,
  olusturuldu timestamptz not null default now(),
  primary key (engelleyen_id, engellenen_id),
  constraint kendini_engelleyemez check (engelleyen_id <> engellenen_id)
);

create index engellemeler_engellenen_idx on public.engellemeler (engellenen_id);

alter table public.engellemeler enable row level security;

create policy "kendi engellemelerini okuyabilir"
  on public.engellemeler for select
  to authenticated
  using (engelleyen_id = auth.uid());
