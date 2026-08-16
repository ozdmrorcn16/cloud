create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre int default 5000,
  p_arama text default null
) returns table (
  id uuid,
  ad text,
  tur text,
  konum geography,
  adres text,
  osm_id bigint,
  ekleyen_kullanici uuid,
  olusturuldu timestamptz,
  kisi_sayisi int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select m.id, m.ad, m.tur, m.konum, m.adres, m.osm_id,
           m.ekleyen_kullanici, m.olusturuldu,
           (
             select count(*)::int
             from public.check_inler c
             where c.mekan_id = m.id
               and c.konum is not null
               and c.bitis_zamani > now()
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;
