-- Iki security definer okuyucu daha. Yogunluk sayaci ozellikle onemli:
-- sayi, askiya alinan kisinin bir mekanda oldugunu kimligi gorunmeden
-- sizdirmaya devam ederdi.
--
-- bag_kisileri govdesi 20260820052324_bag_kisileri_tavan.sql'den,
-- yakin_mekanlar_yogunluk govdesi
-- 20260816160000_mekan_yogunlugu_rpc.sql'den birebir kopyalandi
-- (yorumlar dahil); yalnizca eklenen satirlar farkli.

create or replace function public.bag_kisileri(p_kimlikler uuid[])
returns table (id uuid, kullanici_adi text, ad text)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if array_length(p_kimlikler, 1) > 200 then
    raise exception 'Cok fazla kimlik';
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad
    from public.profiller p
    where p.id = any(p_kimlikler)
      and moderasyon.hesap_aktif_mi(p.id)
      and not gizli.engelli_mi(p.id);
end;
$fn$;

revoke execute on function public.bag_kisileri from public, anon;
grant execute on function public.bag_kisileri to authenticated;

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
as $fn$
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
               and moderasyon.hesap_aktif_mi(c.kullanici_id)
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$fn$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;
