create or replace function public.yakin_mekanlar(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre int default 3000,
  p_arama text default null
) returns setof public.mekanlar
language sql
stable
as $$
  select *
  from public.mekanlar
  where ST_DWithin(konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
    and (p_arama is null or ad ilike '%' || p_arama || '%')
  order by konum <-> ST_MakePoint(p_lng, p_lat)::geography
  limit 50;
$$;
