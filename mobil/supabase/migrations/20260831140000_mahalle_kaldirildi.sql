-- MAHALLE TAMAMEN KALDIRILDI, ILCE + IL KALDI.
-- Canliya MCP ile uygulandi; bu dosya kaydidir.
--
-- Kullanicinin karari (2026-08-31):
--   "Mahalle adres bilgisi aktarimini durdur ve sil, sadece konumlarin
--    ilce ve il bilgisini gosterecegiz TAM DOGRULUK ADINA."
--
-- Mahalle UC ayri yoldan denendi, ucu de yanlis sonuc verdi:
--   1. OSM yerlesim noktalarindan "ayni ilcedeki en yakin merkez" -
--      komsu mahalleyi seciyordu (Ertugrul 683 m secildi, dogrusu
--      Alaaddinbey 1415 m). Yaricap daraltmak da cozmuyordu; Apple
--      Haritalar'in reverseGeocode'u da ayni hatayi yapiyordu.
--   2. Mekanin kendi adresinden cikarip komsuluga yayma - kapsama
--      %80,3 ama kullanici turetilmis veri istemedi.
--   3. Yalnizca kendi adres kaydi (%11,4) - bu kez KAYNAK kirli cikti:
--      "Hadim erikli subesi" kaydinda adres "Bursa Erik mah.", ilce
--      alaninda IL, il alaninda MAHALLE yaziyordu. 2.139 boyle kayit.
--
-- ILCE ve IL kaliyor cunku TAHMIN DEGIL: koordinat hangi idari sinir
-- poligonunun icindeyse o atandi. 945 ilce (%98,6), 81 il (%100).

alter table public.mekanlar drop column if exists mahalle;
alter table public.mahalle_hazirlik drop column if exists mahalle;

-- Aktarim yalnizca ilce ve il yaziyor.
create or replace function public.mahalle_aktarim_adimi(p_kol integer default 0)
returns void
language plpgsql
security definer
set search_path = public
set statement_timeout = '5min'
as $$
declare
  v_kalan bigint;
begin
  if not pg_try_advisory_lock(hashtext('mahalle_aktarim_' || p_kol)) then
    return;
  end if;

  with dilim as (
    select h.fsq_place_id, h.ilce, h.il
    from public.mahalle_hazirlik h
    where not h.islendi
      and abs(hashtext(h.fsq_place_id)) % 2 = p_kol
    limit 60000
  ), yazildi as (
    update public.mekanlar m
    set semt = coalesce(d.ilce, m.semt),
        il = coalesce(d.il, m.il)
    from dilim d
    where m.fsq_place_id = d.fsq_place_id
    returning 1
  )
  update public.mahalle_hazirlik h
  set islendi = true
  from dilim d
  where h.fsq_place_id = d.fsq_place_id;

  select count(*) into v_kalan from public.mahalle_hazirlik where not islendi;

  if v_kalan = 0 then
    perform cron.unschedule(j.jobname)
    from cron.job j where j.jobname in ('mahalle-aktarim', 'mahalle-aktarim-2');
  end if;

  perform pg_advisory_unlock(hashtext('mahalle_aktarim_' || p_kol));
end;
$$;

-- RPC'den de mahalle cikti (tam govde icin bir onceki migrasyona bak;
-- burada yalnizca imza ve donen sutunlar degisiyor).
drop function if exists public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer
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
  id uuid, ad text, tur text, semt text, il text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamptz, kisi_sayisi integer
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
         ) as kisi_sayisi
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$$;

grant execute on function public.yakin_mekanlar_yogunluk(
  double precision, double precision, integer, text, text[], integer
) to authenticated;
