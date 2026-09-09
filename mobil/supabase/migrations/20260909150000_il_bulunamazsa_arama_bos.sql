-- ARAMA HER ZAMAN BIR ILE BAGLI; IL YOKSA SONUC DA YOK
--
-- Kullanicinin kurali (2026-09-09): "mekan aramada kullanicinin o an
-- bulundugu konum hangi ile bagliysa o ile bagli arama sonuclari
-- gosterilecek, km siniri bulundugu ille sinirli olacak."
--
-- Arama zaten il ile siniriydi (2026-09-01) ve CANLI OLCUELDUE:
-- Bursa'dan "kafe" -> yalnizca Bursa; Bursa'dan "kadikoy" -> yine
-- yalnizca Bursa. Degisen tek sey IL BULUNAMADIGINDA ne oldugu.
--
-- KURAL AYNI GUN IKI KEZ DEGISTI:
--   once  : il bulunamazsa arama SINIRSIZ ("ekran bombos kalmasin")
--   sonra : il bulunamazsa EN YAKIN il
--   son   : "ekran oyle yerlerde bos kalabilir" -> SONUC YOK
--
-- Son hal kullanicinin karari ve daha durust: kisinin BULUNMADIGI bir
-- ilin sonuclarini gostermek yaniltici olurdu. Ayrica en ucuz yol -
-- sorgu hic calismiyor. Sinirsiz arama bir performans riskiydi: nadir
-- bir terimde KNN taramasi 47 saniyeye cikiyor ve PostgREST'in 8
-- saniyelik sinirini asiyordu (2026-08-28 olcumu).
--
-- Canli dogrulama: `araclar/il-sinirli-arama-test.py`, 7/7. Ege
-- Denizi'nden yapilan arama 0 sonuc donduruyor.

create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null,
  p_turler text[] default null,
  p_limit integer default null
)
returns table (
  id uuid, ad text, tur text, semt text, il text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamptz, kisi_sayisi integer, toplam_check_in integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_il text := null;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- IL SINIRI YALNIZCA YARICAP YOKKEN (bkz. dosya basindaki gerekce).
  if p_yaricap_metre is null and (p_arama is not null or p_turler is not null) then
    select i.ad into v_il
    from public.iller i
    where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
    limit 1;

    -- IL BULUNAMAZSA SONUC YOK (bkz. dosya basi).
    if v_il is null then
      return;
    end if;
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
      and (v_il is null or m.il = v_il)
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit v_limit
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
         ) as toplam_check_in
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$function$;
