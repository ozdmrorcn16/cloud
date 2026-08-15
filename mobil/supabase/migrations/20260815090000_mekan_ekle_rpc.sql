create or replace function public.mekan_ekle(
  p_ad text,
  p_tur text,
  p_lat double precision,
  p_lng double precision,
  p_cihaz_lat double precision,
  p_cihaz_lng double precision,
  p_adres text default null
) returns public.mekanlar
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gunluk_sayi int;
  v_yeni public.mekanlar;
begin
  if not ST_DWithin(
    ST_MakePoint(p_lng, p_lat)::geography,
    ST_MakePoint(p_cihaz_lng, p_cihaz_lat)::geography,
    200
  ) then
    raise exception 'Mekana yakin olmalisin (~200 m icinde)';
  end if;

  select count(*) into v_gunluk_sayi
  from public.mekanlar
  where ekleyen_kullanici = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_gunluk_sayi >= 5 then
    raise exception 'Gunluk mekan ekleme limitine ulastin (5)';
  end if;

  insert into public.mekanlar (ad, tur, konum, adres, ekleyen_kullanici)
  values (p_ad, p_tur, ST_MakePoint(p_lng, p_lat)::geography, p_adres, auth.uid())
  returning * into v_yeni;

  return v_yeni;
end;
$$;
