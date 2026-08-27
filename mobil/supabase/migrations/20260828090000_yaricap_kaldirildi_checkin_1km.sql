-- YARICAP SINIRI KALDIRILDI + CHECK-IN YAKINLIGI 500 m -> 1 km
--
-- Kullanicinin karari (2026-08-28): "en ustteki yazan km leri kaldir",
-- "gorunus olarak bir km siniri olmucak oncelik olarak ama en ustlerde
-- konumuna en yakin yerler gorunecek", "konum aramasi yaptiginda bir km
-- siniri olmucak ama checkin yapmak istedigi konuma 1km yakininda
-- olmasi gerek".
--
-- Yani: LISTELEME ve ARAMA sinirsiz, nokta atisi kural yalnizca
-- check-in'de ve 1 km.
--
-- ---------------------------------------------------------------- --
-- 1. yakin_mekanlar_yogunluk: yaricap artik ZORUNLU DEGIL
-- ---------------------------------------------------------------- --
--
-- `p_yaricap_metre` null gelirse ST_DWithin filtresi hic uygulanmiyor;
-- siralamayi PostGIS'in KNN operatoru (`<->`) yapiyor ve GIST indeksi
-- en yakin 50 kaydi dogrudan veriyor.
--
-- ARAMADA NEDEN BIR HAVUZ VAR - olculerek karar verildi. Ad uzerinde
-- `like '%...%'` calisiyor ve `pg_trgm` indeksi KURULU DEGIL
-- (veritabani 500 MB ucretsiz sinirin dibinde). Bursa merkezinden
-- olculen gercek sureler:
--
--   yaricapsiz, aramasiz (KNN + limit 50)          ->    125 ms
--   yaricapsiz, nadir bir arama terimi             -> 47.700 ms  (!)
--   200 km yaricap, nadir terim                    -> 13.900 ms  (!)
--    25 km yaricap, nadir terim                    ->    710 ms
--   en yakin 20.000 mekan havuzu, nadir terim      ->    470 ms
--
-- PostgREST'in zaman asimi 8 saniye; ilk iki satir kullaniciya hata
-- olarak doner. Bu yuzden arama, KILOMETREYLE degil SAYIYLA
-- sinirlaniyor: en yakin 20.000 mekan taraniyor. Kullanicinin
-- gordugu sey "km siniri yok, en yakinlar ustte" - istedigi buydu -
-- ama maliyet arama terimi ne olursa olsun sabit kaliyor.
--
-- Bursa merkezinde 20.000 mekan ~18 km yariCapa denk geliyor (5.000
-- -> 8 km, 50.000 -> 79 km). Yani sehir ve cevresi kapsaniyor; baska
-- bir sehirdeki mekan aramada CIKMAZ. Bunu kaldirmanin tek yolu
-- `pg_trgm` GIN indeksi, o da Pro plandaki disk payini gerektiriyor.
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null
)
returns table(
  id uuid, ad text, tur text, semt text, kaynak text, konum geography,
  adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamp with time zone, kisi_sayisi integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  -- Arama yapilirken taranacak en yakin mekan sayisi. Ustteki olcum
  -- notuna bak; buyutulurse arama yavaslar.
  arama_havuzu constant int := 20000;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  with aday as (
    select m.*
    from public.mekanlar m
    where m.tur not in ('test', 'yer-degil')
      and (
        p_yaricap_metre is null
        or ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      )
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit case when p_arama is null then 50 else arama_havuzu end
  ),
  suzulmus as (
    select a.*
    from aday a
    where p_arama is null
       or public.tr_kucuk(a.ad) like '%' || public.tr_kucuk(p_arama) || '%'
    order by a.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50
  )
  select s.id, s.ad, s.tur, s.semt, s.kaynak, s.konum, s.adres, s.osm_id,
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
$function$;

-- ---------------------------------------------------------------- --
-- 2. check_in_yap: yakinlik 500 m -> 1 km
-- ---------------------------------------------------------------- --
--
-- Listeleme sinirsiz oldugu icin kullanici artik cok uzaktaki bir
-- mekani da gorebiliyor. Check-in'in "gercekten oradasin" anlamini
-- koruyan tek sey bu kontrol; kullanicinin karariyla 1 km.
create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
)
returns check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_bulunurluk is null or p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 1000) then
    raise exception 'Mekana cok uzaksin (~1 km icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  -- Eski aktif check-in de bir ANI'ya donusuyor; ayni daraltma burada da
  -- uygulanmali, yoksa gizli bir check-in herkese acik bir ani olarak kalir.
  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk
  )
  values (
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '4 hours',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;
