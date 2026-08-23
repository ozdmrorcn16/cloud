-- Moderator uyeligi bir ROL degil, satir duzeyinde bir gercektir.
-- Boylece cok-moderatorlu modele gecis bir insert'ten ibaret olur
-- (spec karar 55) ve Postgres rol yonetimine hic dokunulmaz.
create table public.moderatorler (
  kullanici_id uuid primary key references auth.users(id) on delete cascade,
  rol          text not null default 'moderator'
                 check (rol in ('moderator', 'yonetici')),
  eklendi      timestamptz not null default now(),
  ekleyen_id   uuid references auth.users(id) on delete set null
);

-- RLS acik ve HICBIR politika yok: PostgREST uzerinden hicbir rol bu
-- tabloyu okuyamaz. Yalnizca security definer yardimcilar gorur.
-- Kimlerin moderator oldugu bilgisi de bir sizinti yuzeyidir.
alter table public.moderatorler enable row level security;
revoke all on public.moderatorler from authenticated, anon;

-- Yetki iki kosulu BIRLIKTE arar. aal2, TOTP ile dogrulanmis oturum
-- demektir; yalnizca parolayla alinmis oturum (aal1) hicbir moderator
-- RPC'sini cagiramaz. Kontrolun arayuzde degil burada olmasi sart:
-- istemcinin cagirmayi secebilecegi bir kural, kural degildir.
create or replace function moderasyon.yetkili_mi()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select auth.uid() is not null
     and (auth.jwt() ->> 'aal') = 'aal2'
     and exists (
       select 1 from public.moderatorler m
        where m.kullanici_id = auth.uid()
     );
$fn$;

create or replace function moderasyon.yetkili_mi_zorla()
returns void
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not moderasyon.yetkili_mi() then
    raise exception 'Yetkisiz';
  end if;
end;
$fn$;

-- Panelin acilista sordugu tek istisna: hata firlatmaz, yalnizca
-- "bu oturum panele girebilir mi" sorusunu cevaplar.
create or replace function public.moderator_muyum()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select moderasyon.yetkili_mi();
$fn$;

revoke execute on function public.moderator_muyum() from public, anon;
grant execute on function public.moderator_muyum() to authenticated;
