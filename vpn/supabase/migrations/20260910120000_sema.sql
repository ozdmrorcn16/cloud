-- vpn — temel sema
--
-- Tablolar:
--   profiles      : auth.users ile bire bir eslesen kullanici profili
--   subscriptions : abonelik kaydi (odeme saglayicisi sonra baglanacak)
--   servers       : WireGuard sunucu listesi (ulke, ad, endpoint, acik anahtar)
--   peers         : bir kullanici cihazinin bir sunucudaki WireGuard kaydi
--
-- RLS kurallari ayri bir migration'da (20260910120100_rls.sql).

-- ---------------------------------------------------------------- yardimcilar

create or replace function public.guncelleme_zamanini_yaz()
returns trigger
language plpgsql
as $$
begin
  new.guncellenme = now();
  return new;
end;
$$;

-- ------------------------------------------------------------------ profiles

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  eposta       text,
  ad           text,
  olusturulma  timestamptz not null default now(),
  guncellenme  timestamptz not null default now()
);

comment on table public.profiles is
  'auth.users ile bire bir eslesen kullanici profili. Kayit sirasinda trigger ile olusur.';

drop trigger if exists profiles_guncellenme on public.profiles;
create trigger profiles_guncellenme
  before update on public.profiles
  for each row execute function public.guncelleme_zamanini_yaz();

-- Yeni kullanici kaydolunca profili otomatik ac.
create or replace function public.yeni_kullanici_profili()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, eposta)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_kullanici_olusunca on auth.users;
create trigger auth_kullanici_olusunca
  after insert on auth.users
  for each row execute function public.yeni_kullanici_profili();

-- ------------------------------------------------------------- subscriptions

do $$
begin
  if not exists (select 1 from pg_type where typname = 'abonelik_durumu') then
    create type public.abonelik_durumu as enum ('deneme', 'aktif', 'gecikmis', 'iptal');
  end if;
end
$$;

create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users (id) on delete cascade,
  durum        public.abonelik_durumu not null default 'deneme',
  plan         text not null default 'aylik',
  baslangic    timestamptz not null default now(),
  bitis        timestamptz,
  -- Odeme saglayicisindaki kayit (Google Play / Stripe) sonra doldurulacak.
  saglayici    text,
  saglayici_id text,
  olusturulma  timestamptz not null default now(),
  guncellenme  timestamptz not null default now()
);

comment on table public.subscriptions is
  'Abonelik kaydi. Yalnizca sunucu tarafi (service_role) yazar; istemci sadece okur.';

create index if not exists subscriptions_kullanici_idx
  on public.subscriptions (kullanici_id);

create unique index if not exists subscriptions_saglayici_idx
  on public.subscriptions (saglayici, saglayici_id)
  where saglayici_id is not null;

drop trigger if exists subscriptions_guncellenme on public.subscriptions;
create trigger subscriptions_guncellenme
  before update on public.subscriptions
  for each row execute function public.guncelleme_zamanini_yaz();

-- Aboneligi gecerli mi? (deneme veya aktif, ve suresi dolmamis)
create or replace function public.abonelik_gecerli_mi(p_kullanici_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.subscriptions s
     where s.kullanici_id = p_kullanici_id
       and s.durum in ('deneme', 'aktif')
       and (s.bitis is null or s.bitis > now())
  );
$$;

-- ------------------------------------------------------------------- servers

create table if not exists public.servers (
  id          uuid primary key default gen_random_uuid(),
  ulke        text not null,                     -- 'Almanya'
  ulke_kodu   text not null,                     -- 'DE'
  ad          text not null,                     -- 'Frankfurt 1'
  endpoint    text not null,                     -- '203.0.113.10' veya alan adi
  port        integer not null default 51820,
  public_key  text not null,                     -- sunucunun WireGuard acik anahtari
  dns         text not null default '1.1.1.1',
  alt_ag      cidr not null default '10.66.66.0/24',  -- tunel ic agi
  aktif       boolean not null default true,
  siralama    integer not null default 100,      -- listede gosterim sirasi
  kapasite    integer not null default 250,
  olusturulma timestamptz not null default now(),
  guncellenme timestamptz not null default now()
);

comment on table public.servers is
  'WireGuard sunucu listesi. Sunucunun OZEL anahtari burada TUTULMAZ, yalnizca VPS uzerinde durur.';

create unique index if not exists servers_endpoint_port_idx
  on public.servers (endpoint, port);

create index if not exists servers_aktif_idx
  on public.servers (aktif, siralama);

drop trigger if exists servers_guncellenme on public.servers;
create trigger servers_guncellenme
  before update on public.servers
  for each row execute function public.guncelleme_zamanini_yaz();

-- --------------------------------------------------------------------- peers

create table if not exists public.peers (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users (id) on delete cascade,
  sunucu_id    uuid not null references public.servers (id) on delete cascade,
  cihaz_adi    text not null default 'Android',
  public_key   text not null,          -- cihazin acik anahtari (ozel anahtar cihazda kalir)
  tunel_ip     inet not null,          -- 10.66.66.x/32
  aktif        boolean not null default true,
  son_gorulme  timestamptz,
  olusturulma  timestamptz not null default now(),
  guncellenme  timestamptz not null default now()
);

comment on table public.peers is
  'Bir cihazin bir sunucudaki WireGuard peer kaydi. VPS''teki esitle.sh bu tabloyu okuyup wg set ile uygular.';

create unique index if not exists peers_public_key_idx
  on public.peers (public_key);

create unique index if not exists peers_sunucu_ip_idx
  on public.peers (sunucu_id, tunel_ip);

create index if not exists peers_kullanici_idx
  on public.peers (kullanici_id);

create index if not exists peers_sunucu_aktif_idx
  on public.peers (sunucu_id, aktif);

drop trigger if exists peers_guncellenme on public.peers;
create trigger peers_guncellenme
  before update on public.peers
  for each row execute function public.guncelleme_zamanini_yaz();

-- Sunucunun alt agindaki ilk bos tunel IP'sini bulur.
-- .1 sunucunun kendisidir; istemciler .2'den baslar.
create or replace function public.sonraki_tunel_ip(p_sunucu_id uuid)
returns inet
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alt_ag cidr;
  v_aday   inet;
  i        integer;
begin
  select alt_ag into v_alt_ag from public.servers where id = p_sunucu_id;
  if v_alt_ag is null then
    raise exception 'Sunucu bulunamadi: %', p_sunucu_id;
  end if;

  for i in 2..254 loop
    v_aday := set_masklen(network(v_alt_ag)::inet + i, 32);
    if not exists (
      select 1 from public.peers
       where sunucu_id = p_sunucu_id and tunel_ip = v_aday
    ) then
      return v_aday;
    end if;
  end loop;

  raise exception 'Sunucuda bos IP kalmadi: %', p_sunucu_id;
end;
$$;
