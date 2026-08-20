-- gizlendi_mi karar 44'un tasiyicisi: konusmayi "silmek" yalnizca kendi
-- tarafinda gizler. mesaj_gonder iki uyenin de bayragini indirir, boylece
-- karsi taraf yazinca konusma geri gelir.
create table public.konusma_uyeleri (
  konusma_id    uuid not null references public.konusmalar(id) on delete cascade,
  kullanici_id  uuid not null references auth.users(id) on delete cascade,
  gizlendi_mi   boolean not null default false,
  son_okuma     timestamptz,
  primary key (konusma_id, kullanici_id)
);

create index konusma_uyeleri_kullanici on public.konusma_uyeleri (kullanici_id);

alter table public.konusma_uyeleri enable row level security;

-- Yalnizca kendi uyelik satirlarini gorursun.
create policy "kendi uyeliklerim"
  on public.konusma_uyeleri for select
  to authenticated
  using (kullanici_id = auth.uid());

revoke insert, update, delete on public.konusma_uyeleri from authenticated;

-- konusmalar'in select politikasi burada kuruluyor, cunku
-- konusma_uyeleri'ne bakiyor ve o tablo bu migrasyonda aciliyor.
create policy "konusma uyeligi"
  on public.konusmalar for select
  to authenticated
  using (
    exists (
      select 1 from public.konusma_uyeleri u
      where u.konusma_id = konusmalar.id
        and u.kullanici_id = auth.uid()
    )
  );
