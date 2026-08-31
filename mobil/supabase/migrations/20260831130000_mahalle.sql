-- MAHALLE: sutun, hazirlik tablosu ve aktarim cron'u.
-- Bu dosya canliya MCP ile uygulanan uc migrasyonun birlesik kaydidir:
--   mekanlar_mahalle_sutunu / yakin_mekanlar_mahalle_donsun / mahalle_aktarim_cron
--
-- Kullanicinin istegi (2026-08-31): "Mahalle bilgileri yanlis daha
-- hassas ve dogru olmali."
--
-- `semt` ILCE tutuyordu (Nilufer) ve ekranda o gorunuyordu. Mahalle bir
-- kademe daha hassas (Ertugrul) ve AYRI sutunda duruyor; ekran mahalle
-- varsa onu, yoksa ilceyi gosteriyor.
--
-- Kaynak: OpenStreetMap yerlesim noktalari (ODbL). Turkiye'de OSM'de
-- mahalle SINIRI yok - olculdu, admin_level=10 poligon sayisi SIFIR;
-- var olan sinirlar il (81), ilce (969) ve belde (1.627) duzeyinde.
-- Bu yuzden atama "ayni ilcedeki en yakin mahalle merkezi" yontemiyle
-- yerelde yapildi (araclar/osm-mahalle-ata.py). Kapsama olculdu:
-- mekanlarin %99,1'inin 2 km icinde bir mahalle noktasi var, ortanca
-- uzaklik 360 m. Sinir poligonu olmadigi icin mahalle sinirindaki bir
-- mekan komsu mahalleyi alabilir; ilce kisiti bunu daraltiyor.
--
-- ILCE de bu isle DUZELDI: eski `semt` degeri Overture komsulugundan
-- CIKARILMISTI ve hatali ornekleri vardi (bir Nilufer mekaninda
-- 'Osmangazi', 'Burda', 'Nilufer, Bursa', bozuk karakterli 'Ni̇lüfer').
-- Yeni deger 969 ilce poligonuna nokta-icinde testiyle atandi.

alter table public.mekanlar add column if not exists mahalle text;

comment on column public.mekanlar.mahalle is
  'Mahalle adi (OSM yerlesim noktalarindan turetildi). `semt` ILCE tutar.';

create table if not exists public.mahalle_hazirlik (
  fsq_place_id text primary key,
  mahalle text,
  ilce text,
  islendi boolean not null default false
);

alter table public.mahalle_hazirlik enable row level security;
-- Politika YOK: yalnizca service_role erisir (bakim tablosu).

create index if not exists mahalle_hazirlik_islenmemis_idx
  on public.mahalle_hazirlik (fsq_place_id) where not islendi;

-- Aktarim DILIM DILIM: tek UPDATE ile 5,9 milyon satir islenmiyor.
-- Denendi - id'lerin %90'i '5' ile basladigi icin harf dilimleri de
-- dengesiz (5.322.042 / 313.723 / 258.612 / kalani birkac yuz); tek
-- ifade statement_timeout'a takilip GERI ALINIYOR, yani bosa is. Ayni
-- ders Foursquare aktariminda da alinmisti (20260830130000).
create or replace function public.mahalle_aktarim_adimi()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kalan bigint;
begin
  with dilim as (
    select h.fsq_place_id, h.mahalle, h.ilce
    from public.mahalle_hazirlik h
    where not h.islendi
    limit 150000
  ), yazildi as (
    update public.mekanlar m
    set mahalle = d.mahalle,
        semt = d.ilce
    from dilim d
    where m.fsq_place_id = d.fsq_place_id
    returning 1
  )
  update public.mahalle_hazirlik h
  set islendi = true
  from dilim d
  where h.fsq_place_id = d.fsq_place_id;

  select count(*) into v_kalan from public.mahalle_hazirlik where not islendi;

  -- Is bitince kendini kapatiyor: yoksa cron bos yere her dakika calisir.
  if v_kalan = 0 then
    perform cron.unschedule('mahalle-aktarim');
  end if;
end;
$$;

-- select cron.schedule('mahalle-aktarim', '* * * * *',
--                      'select public.mahalle_aktarim_adimi()');
-- (Tek seferlik is; yukleme bitince kendini unschedule ediyor.)

-- RPC artik mahalle de donduruyor.
drop function if exists public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer
);

create function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null,
  p_turler text[] default null,
  p_limit integer default null
)
returns table (
  id uuid, ad text, tur text, semt text, mahalle text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamptz, kisi_sayisi integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  with suzulmus as (
    select m.*
    from public.mekanlar m
    where m.tur not in ('test', 'yer-degil')
      and (
        p_yaricap_metre is null
        or ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      )
      and (
        p_arama is null
        or public.tr_kucuk(m.ad) like '%' || public.tr_kucuk(p_arama) || '%'
      )
      and (p_turler is null or m.tur = any (p_turler))
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit v_limit
  )
  select s.id, s.ad, s.tur, s.semt, s.mahalle, s.kaynak, s.konum, s.adres, s.osm_id,
         s.ekleyen_kullanici, s.olusturuldu,
         (
           select count(*)::int
           from public.check_inler c
           where c.mekan_id = s.id
             and c.konum is not null
             and c.bitis_zamani > now()
             and moderasyon.hesap_aktif_mi(c.kullanici_id)
             and not c.moderasyon_gizli
         ) as kisi_sayisi
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$$;

grant execute on function public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer
) to authenticated;
