-- YAKIN MEKANLAR LISTESINE KAPAK FOTOGRAFI (2026-09-14)
--
-- Kullanicinin referans gorseli: listedeki her kartin solunda mekanin
-- fotografi. Fotograf DIS KAYNAKTAN GELMIYOR (2026-08-24 karari
-- duruyor): yalnizca bir kullanicinin cekip moderatorden gecirdigi
-- `mekanlar.kapak_fotograf` (2026-09-09) gosteriliyor. Mekan sayfasi
-- bunu zaten okuyordu; liste RPC'si sutunu dondurmuyordu.
--
-- Donus tipi degistigi icin CREATE OR REPLACE yetmiyor: once DROP.
-- Yetkiler bu yuzden yeniden veriliyor.
--
-- Karttaki avatarlar (su an orada olan kisiler) icin RPC DEGISMEDI:
-- istemci `check_inler`i dogrudan okuyor ve satir guvenligi
-- ("check-in gorunurlugu" politikasi) mekan sayfasindaki "kim burada"
-- listesiyle AYNEN uygulaniyor - listede, sayfada gorunmeyen kimse
-- gorunmuyor. `kisi_sayisi` ise eskisi gibi kimliksiz toplam.

drop function if exists public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer, integer
);

create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null,
  p_turler text[] default null,
  p_limit integer default null,
  p_ofset integer default 0
)
returns table (
  id uuid, ad text, tur text, semt text, il text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamptz, kisi_sayisi integer, toplam_check_in integer,
  kapak_fotograf text
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_ofset integer := greatest(coalesce(p_ofset, 0), 0);
  v_il text := null;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_yaricap_metre is null and (p_arama is not null or p_turler is not null) then
    select i.ad into v_il
    from public.iller i
    where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
    limit 1;

    if v_il is null then
      return;
    end if;
  end if;

  return query
  with suzulmus as (
    select m.*
    from public.mekanlar m
    where m.tur not in ('test', 'yer-degil')
      and not m.kapali
      and (
        p_yaricap_metre is null
        or ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      )
      and (
        p_arama is null
        or public.tr_kucuk(m.ad) like '%' || public.tr_kucuk(p_arama) || '%'
      )
      and (p_turler is null or m.tur = any (p_turler))
      and (v_il is null or m.il = v_il)
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit v_limit
    offset v_ofset
  )
  select s.id, s.ad, s.tur, s.semt, s.il, s.kaynak, s.konum, s.adres,
         s.osm_id, s.ekleyen_kullanici, s.olusturuldu,
         (
           select count(*)::int
           from public.check_inler c
           where c.mekan_id = s.id
             and c.konum is not null
             and c.bitis_zamani > now()
             and moderasyon.hesap_aktif_mi(c.kullanici_id)
             and not c.moderasyon_gizli
         ) as kisi_sayisi,
         (
           select count(*)::int
           from public.check_inler c
           where c.mekan_id = s.id
             and moderasyon.hesap_aktif_mi(c.kullanici_id)
             and not c.moderasyon_gizli
         ) as toplam_check_in,
         s.kapak_fotograf
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$function$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;
