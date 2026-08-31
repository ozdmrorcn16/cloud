-- Yakin mekan sorgusuna TUR SUZGECI ve LIMIT parametresi.
--
-- Kullanicinin bildirdigi hata (2026-08-31): "yakinimdaki konumlar
-- kismi da yanlis ya da eksik ... en yakin 500 mt icerisindeki
-- konumlar yakindan uzaga siralanmali".
--
-- KOK NEDEN (olculdu): daraltma yanlis katmandaydi. Sunucu en yakin 50
-- kaydi TUR AYRIMI YAPMADAN donduruyor, istemci (`kesfetIcinSuz`)
-- sonra sosyal turlere suzuyordu. Kullanicinin bolgesinde (Nilufer,
-- 40.2106/28.9213) olcum:
--     500 m icindeki sosyal mekan ........ 111
--     sunucudan gelen 50 kaydin sosyali ..   3
--     50 kaydin bittigi mesafe ........... 222 m
-- Yani dolu bir cevrede liste neredeyse bos gorunuyordu.
--
-- Cozum: suzgec sunucuya tasindi. Tur listesi ISTEMCIDEN geliyor
-- (`SOSYAL_TURLER`), boylece tek kaynak korunuyor - ayni listeyi hem
-- kodda hem veritabaninda tutup senkron tutmaya calismiyoruz.
--
-- Limit de parametre oldu: yogun yerlerde 500 m icinde binlerce sosyal
-- mekan var (Kadikoy 5.363, Taksim 4.045), hepsini gondermek anlamsiz;
-- siralama en yakindan oldugu icin ilk N zaten en yakinlar. Tavan 200.
--
-- Parametre EKLENDIGI icin eski imza dusuruluyor: PostgreSQL'de
-- parametre sayisi degisince `create or replace` yeni bir asiri yukleme
-- yaratir ve PostgREST hangisini cagiracagini bilemez.

drop function if exists public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text
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
  id uuid,
  ad text,
  tur text,
  semt text,
  kaynak text,
  konum geography,
  adres text,
  osm_id bigint,
  ekleyen_kullanici uuid,
  olusturuldu timestamptz,
  kisi_sayisi integer
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
$$;

grant execute on function public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer
) to authenticated;
