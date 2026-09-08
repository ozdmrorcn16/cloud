-- ------------------------------------------------------------------ --
-- TUR SUZGECI ZAMAN ASIMINA UGRUYORDU - IL ARTIK ZORUNLU
--
-- Kullanicinin bildirdigi hata (2026-09-08): "filtrede bir tur sectim
-- islem zaman asimina ugradi diye uyari verdi".
--
-- KOK NEDEN OLCULDU. Il, nokta-icinde-poligon testiyle bulunuyor ve
-- BULUNAMAZSA suzgec uygulanmiyordu ("sinirsiz kalir" - 2026-09-01'de
-- ARAMA icin alinmis bir karardi). Arama tarafinda bu zararsiz, cunku
-- trigram indeksi var. TUR tarafinda ise felaket:
--
--   il suzgeci VAR  : mekanlar_il_tur_idx,  "Plaj" 1,1 sn
--   il suzgeci YOK  : KNN taramasi, 40 saniyede BITMEDI
--
-- Sebep secicilik: KNN en yakindan uzaga giderek 100 eslesme arıyor ve
-- nadir bir turde milyonlarca satir geziyor. Mesafe tavani koymak da
-- COZMUYOR, olculdu: 100 km'lik ST_DWithin BitmapAnd'i 1,66 milyon
-- satira cikariyor ve sure 27 saniye oluyor.
--
-- COZUM: tur suzgeci varken il ZORUNLU. Poligon testi bos donerse
-- (GPS sapmasi, il sinirina cok yakin bir nokta, deniz, yurt disi)
-- EN YAKIN il seciliyor - 81 poligonda GIST ile 4,4 ms.
--
-- ARAMA DAVRANISI DEGISMEDI: orada il bulunamazsa suzgec yine
-- uygulanmiyor, cunku o kullanicinin acik karariydi ve orada
-- performans sorunu yok.
-- ------------------------------------------------------------------ --

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
  olusturuldu timestamp with time zone,
  kisi_sayisi integer, toplam_check_in integer
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

  -- ARAMA ya da TUR SUZGECI varsa il sinirina bakiliyor. Ikisi de
  -- yoksa ("Yakininda" listesi) sinir uygulanmiyor: orada zaten dar bir
  -- yaricap var ve il sinirini oraya koymak, il sinirinda oturan birinin
  -- 300 m otesindeki mekani gormesini engellerdi.
  if p_arama is not null or p_turler is not null then
    select i.ad into v_il
    from public.iller i
    where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
    limit 1;

    -- TUR SUZGECINDE IL ZORUNLU. Bos kalirsa sorgu KNN taramasina
    -- duesuyor ve zaman asimina ugruyor (olculdu). En yakin il, 81
    -- poligonda GIST ile 4,4 ms.
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
