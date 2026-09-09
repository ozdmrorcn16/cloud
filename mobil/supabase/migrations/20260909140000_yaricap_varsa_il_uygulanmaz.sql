-- TUR SUZGECINDE ARTIK YARICAP VAR, IL SINIRI YOK
--
-- Kullanicinin istegi (2026-09-09): "yakinindaki mekanlar kisminda
-- kullanicinin bulundugu konumdan 1 km mesafe icerisindeki yerler
-- sadece listelenecek, haritada da ayni sekilde listedeki yerler
-- gorunecek."
--
-- Bu, 2026-09-06'daki "filtrelemede km siniri yok, bulundugu sehirdeki
-- kayitlara gore sonuclar" kuralini GERI ALIYOR. Istemci artik tur
-- suzgeci varken de `p_yaricap_metre` gonderiyor (1 km).
--
-- IL SUZGECI BIR PERFORMANS KORUMASIYDI: arama ya da tur suzgeci
-- varken sinirsiz KNN taramasi zaman asimina duesuyordu (2026-09-08'de
-- olculdu: tur suzgecinde 40 sn'de bitmedi). Yaricap verildiginde o
-- koruma GEREKSIZ - 1 km'lik ST_DWithin zaten cok secici. Olculdu:
--
--     tur suzgeci + 1 km yaricap : 27 ms (sicak) / 2.488 ms (soguk)
--     il bazli sinirsiz sorgu    : 946 ms (2026-09-06 olcumu)
--
-- Ustelik il suzgeci yaricapla birlikte ZARARLI olurdu: il sinirinda
-- oturan birinin 300 m otesindeki mekani elerdi. Ayni gerekce
-- "Yakininda" listesinde bastan beri gecerliydi.
--
-- ARAMA DEGISMEDI: orada yaricap yok (kullanici baska sehirdeki mekani
-- arayabiliyor, 2026-09-01 karari) ve il siniri o yolda DURUYOR.

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

    -- Tur suzgecinde il ZORUNLU: bos kalirsa sorgu sinirsiz KNN
    -- taramasina duesuyor ve zaman asimina ugruyor (2026-09-08).
    if v_il is null and p_turler is not null then
      select i.ad into v_il
      from public.iller i
      order by i.sinir <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
      limit 1;
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
