create table public.sikayetler (
  id uuid primary key default gen_random_uuid(),
  sikayet_eden_id uuid not null references auth.users(id) on delete cascade,
  hedef_tur text not null check (hedef_tur in ('kullanici', 'check_in')),
  hedef_id uuid not null,
  sebep text not null,
  aciklama text,
  durum text not null default 'yeni'
    check (durum in ('yeni', 'incelendi', 'islem_yapildi', 'reddedildi')),
  olusturuldu timestamptz not null default now()
);

create index sikayetler_hedef_idx on public.sikayetler (hedef_tur, hedef_id);
create index sikayetler_durum_idx on public.sikayetler (durum);

alter table public.sikayetler enable row level security;

create policy "kendi sikayetlerini okuyabilir"
  on public.sikayetler for select
  to authenticated
  using (sikayet_eden_id = auth.uid());
