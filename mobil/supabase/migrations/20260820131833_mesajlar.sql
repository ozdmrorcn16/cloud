create table public.mesajlar (
  id           uuid primary key default gen_random_uuid(),
  konusma_id   uuid not null references public.konusmalar(id) on delete cascade,
  gonderen_id  uuid not null references auth.users(id) on delete cascade,
  metin        text not null check (length(trim(metin)) between 1 and 2000),
  olusturuldu  timestamptz not null default now()
);

-- Hem gecmis sayfalamasi hem son mesaj sorgusu bu indeksi kullanir.
create index mesajlar_konusma_zaman
  on public.mesajlar (konusma_id, olusturuldu desc);

alter table public.mesajlar enable row level security;

-- Uyesi oldugun konusmanin mesajlarini gorursun, ve engelli iliski
-- varsa hicbir sey gormezsin. Politika takipler/engellemeler tablolarina
-- DOGRUDAN bakmiyor; yalnizca gizli.engelli_mi yardimcisini cagiriyor
-- (Faz 2b'de dogrudan alt sorgu "infinite recursion" hatasi vermisti).
create policy "mesaj uyeligi"
  on public.mesajlar for select
  to authenticated
  using (
    exists (
      select 1 from public.konusma_uyeleri u
      where u.konusma_id = mesajlar.konusma_id
        and u.kullanici_id = auth.uid()
    )
    and not gizli.engelli_mi(mesajlar.gonderen_id)
  );

revoke insert, update, delete on public.mesajlar from authenticated;
