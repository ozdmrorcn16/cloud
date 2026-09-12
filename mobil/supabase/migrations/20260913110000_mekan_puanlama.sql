-- MEKAN PUANLAMA (kullanicinin istegi 2026-09-13, Swarm'daki gibi).
--
-- Uc seviye: 1 = Kotu, 2 = Iyi, 3 = Harika. Kisi basina mekan basina
-- TEK oy; sonradan degistirilebilir (upsert). Puan 0-10 olcegi:
--   Kotu = 2, Iyi = 7, Harika = 10 -> ortalama, bir ondalik.
-- Formul bilerek seffaf ve sabit; Foursquare'in kapali formulunu
-- taklit etmek yerine kullaniciya anlatilabilir bir sey secildi.
--
-- EN AZ 3 PUANLAMA olmadan puan DONMUYOR (null): tek oyla "10.0" hem
-- anlamsiz hem de o kisinin oyunu ele verir. Seviye sayilari (kac
-- Harika, kac Iyi, kac Kotu) her zaman donuyor - toplam bir sayi
-- kimseyi tanimlamiyor (mekan istatistikleriyle ayni sinif, karar 71).
--
-- YALNIZCA ORADA CHECK-IN YAPMIS KISI PUAN VEREBILIR. Mekan
-- duzeltmelerindeki ilke ("orada bulunan insan hepsinden iyi biliyor")
-- burada da gecerli; ayrica uzaktan oy sisirmenin en ucuz yolunu
-- kapatiyor. Kural SUNUCUDA - istemci atlayamaz.
--
-- KVKK: kisinin oyu bir gorus verisi. Kendi oyu YALNIZCA kendisine
-- gorunur (mekan_puan_ozeti icindeki benim_puanim), herkes yalnizca
-- toplamlari gorur. Hesap silinince oy da silinir (cascade). Veri
-- disa aktarimina 'puanlarim' olarak giriyor (ayri migrasyon).

create table if not exists public.mekan_puanlari (
  mekan_id uuid not null references public.mekanlar(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  puan smallint not null check (puan between 1 and 3),
  olusturma_zamani timestamptz not null default now(),
  guncelleme_zamani timestamptz not null default now(),
  primary key (mekan_id, kullanici_id)
);

comment on table public.mekan_puanlari is
  'Mekan puanlari: 1 kotu, 2 iyi, 3 harika. Kisi basina mekan basina tek satir. Yalnizca RPC ile yazilir.';

alter table public.mekan_puanlari enable row level security;
-- Politika YOK: tabloya dogrudan erisim kapali, iki RPC tek kapi.
revoke all on public.mekan_puanlari from anon, authenticated;

-- ------------------------------------------------------------------ --
-- Puan verme / guncelleme
-- ------------------------------------------------------------------ --
create or replace function public.mekan_puanla(
  p_mekan_id uuid,
  p_puan smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_kisi uuid := auth.uid();
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if not moderasyon.hesap_aktif_mi(v_kisi) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;
  if p_puan is null or p_puan not between 1 and 3 then
    raise exception 'Gecersiz puan';
  end if;
  if not exists (select 1 from public.mekanlar m where m.id = p_mekan_id) then
    raise exception 'Mekan bulunamadi';
  end if;
  -- Orada bulunmus olma sarti: herhangi bir zamanda o mekanda
  -- check-in. Canli olmasi gerekmiyor - ani da sayilir.
  if not exists (
    select 1 from public.check_inler c
    where c.mekan_id = p_mekan_id and c.kullanici_id = v_kisi
  ) then
    raise exception 'Puan vermek icin once burada check-in yapmalisin';
  end if;

  insert into public.mekan_puanlari (mekan_id, kullanici_id, puan)
  values (p_mekan_id, v_kisi, p_puan)
  on conflict (mekan_id, kullanici_id) do update
    set puan = excluded.puan,
        guncelleme_zamani = now();
end;
$fn$;

revoke execute on function public.mekan_puanla(uuid, smallint) from public;
grant execute on function public.mekan_puanla(uuid, smallint) to authenticated;

-- ------------------------------------------------------------------ --
-- Ozet: sayilar + puan + cagiranin kendi oyu + puan verebilir mi
-- ------------------------------------------------------------------ --
create or replace function public.mekan_puan_ozeti(p_mekan_id uuid)
returns table (
  harika integer,
  iyi integer,
  kotu integer,
  toplam integer,
  puan numeric,
  benim_puanim smallint,
  puan_verebilir boolean
)
language sql
stable
security definer
set search_path = public
as $fn$
  with sayilar as (
    select
      count(*) filter (where p.puan = 3)::int as harika,
      count(*) filter (where p.puan = 2)::int as iyi,
      count(*) filter (where p.puan = 1)::int as kotu,
      count(*)::int as toplam,
      avg(case p.puan when 3 then 10 when 2 then 7 else 2 end) as ort
    from public.mekan_puanlari p
    where p.mekan_id = p_mekan_id
  )
  select
    s.harika, s.iyi, s.kotu, s.toplam,
    case when s.toplam >= 3 then round(s.ort::numeric, 1) else null end as puan,
    (select mp.puan from public.mekan_puanlari mp
      where mp.mekan_id = p_mekan_id and mp.kullanici_id = auth.uid()) as benim_puanim,
    (auth.uid() is not null and exists (
      select 1 from public.check_inler c
      where c.mekan_id = p_mekan_id and c.kullanici_id = auth.uid()
    )) as puan_verebilir
  from sayilar s;
$fn$;

revoke execute on function public.mekan_puan_ozeti(uuid) from public;
grant execute on function public.mekan_puan_ozeti(uuid) to authenticated;

-- Kisi + mekan zaten birincil anahtar; mekana gore toplama icin
-- birincil anahtarin ilk sutunu yetiyor.
