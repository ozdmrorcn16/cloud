-- Gorunurluk testleri kalici test mekanlari birakiyor (mekanlar
-- tablosunda delete politikasi yok, bilincli). Ama bu satirlar GERCEK
-- kullanicilara da gorunuyordu: "GORUNURLUK-TEST-MEKAN-1" gibi adlar
-- mekan aramasinda cikiyor.
--
-- Cozum tabloyu degistirmek degil, okuma yollarini filtrelemek: test
-- satirlari yerinde kalir (testler onlari yeniden kullaniyor) ama
-- kullaniciya gorunmez.
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default 5000,
  p_arama text default null
)
returns table(
  id uuid, ad text, tur text, konum geography, adres text,
  osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamp with time zone, kisi_sayisi integer
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
               and not c.moderasyon_gizli
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
      -- Test mekanlari kullaniciya gorunmez.
      and m.tur <> 'test'
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$fn$;

-- Ayni filtre arama RPC'sinde de gecerli.
create or replace function public.yakin_mekanlar(
  p_lat double precision,
  p_lng double precision,
  p_arama text default null
)
returns setof public.mekanlar
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select m.*
      from public.mekanlar m
     where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, 3000)
       and (p_arama is null or m.ad ilike '%' || p_arama || '%')
       and m.tur <> 'test'
     order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
     limit 50;
end;
$fn$;
