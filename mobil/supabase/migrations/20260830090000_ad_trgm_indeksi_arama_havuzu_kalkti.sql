-- ---------------------------------------------------------------- --
-- pg_trgm indeksi ve arama havuzunun kaldirilmasi (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Kullanici Supabase Pro plana gecti; 500 MB'lik ucretsiz sinir
-- kalkti. Migrasyon 20260828090000'in "Pro plana gecilirse ilk
-- yapilacak is" dedigi sey bu: `tr_kucuk(ad)` uzerinde pg_trgm GIN
-- indeksi. Indeks canli veritabaninda kuruldu ve 51 MB geldi
-- (veritabani 420 MB -> 471 MB).
--
-- Olcum (Bursa merkezi, EXPLAIN ANALYZE, ayni sorgu bicimi):
--
--   sorgu                              onceki (havuzsuz)  simdi
--   nadir terim ("Küpeli")               47.700 ms        177 ms
--   iki kelime ("İstanbul Kafe")         ~14.000 ms       217 ms
--   yaygin terim ("kafe")                  ~900 ms        905 ms
--
-- Yaygin terimde planlayici trgm indeksini DEGIL konum indeksini
-- seciyor (KNN + filtre): sonuc zaten yakinlarda bulundugu icin
-- dogru secim ve sure degismiyor. Nadir terimde ise trgm indeksi
-- devreye giriyor. Yani sorguyu tek bicime indirip secimi
-- planlayiciya birakmak yeterli; 20.000'lik "arama havuzu" artik
-- gereksiz ve KALDIRILDI.
--
-- KULLANICIYA ETKISI: baska sehirdeki bir mekan artik aramada
-- BULUNUYOR. Onceki sinir ("Bursa merkezinde 20.000 mekan ~18 km")
-- gecersiz. Siralama yine en yakindan; kesfet listesi (aramasiz)
-- degismedi, hala en yakin 50.
--
-- tr_kucuk IMMUTABLE oldugu icin ifade indeksi kurulabiliyor;
-- fonksiyon degisirse indeksin yeniden kurulmasi gerekir.

create extension if not exists pg_trgm with schema extensions;

create index if not exists mekanlar_ad_trgm_idx
  on public.mekanlar using gin (public.tr_kucuk(ad) extensions.gin_trgm_ops);

comment on index public.mekanlar_ad_trgm_idx is
  'Mekan adinda alt dize aramasi (like %...%) icin; tr_kucuk ile ayni normallestirme. Kuruldu 2026-08-30, Pro plana gecisle.';

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
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
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

comment on function public.yakin_mekanlar_yogunluk(double precision, double precision, integer, text) is
  'Kesfet: en yakin 50 mekan ve her birinde su an kac kisi oldugu. Arama butun tabloda (trgm indeksi), siralama en yakindan; yaricap null ise mesafe siniri yok.';
