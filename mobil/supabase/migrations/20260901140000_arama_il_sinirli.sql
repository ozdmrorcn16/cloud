-- ARAMA KULLANICININ BULUNDUGU ILLE SINIRLI
--
-- Kullanicinin kurali (2026-09-01): "Km siniri yok ama kullanicinin
-- bulundugu konum Bursa'daysa arattigi kelimeye gore sadece Bursa'daki
-- konumlari gorecek; o an hangi sehirdeyse o sehrin konumlarini."
--
-- Bu, 2026-08-28'deki "arama tamamen sinirsiz, baska sehir de aranabilir"
-- kuralinin yerini aliyor.

-- ---------------------------------------------------------------------
-- 1) IL SINIRLARI
-- ---------------------------------------------------------------------
-- Kullanicinin ili NOKTA-ICINDE-POLIGON testiyle bulunuyor. "En yakin
-- mekanin ilini al" YAPILMADI: o bir TAHMIN olurdu ve il sinirina yakin
-- yerlerde yanilirdi. Poligon testi kesin cevap veriyor ve mekanlara il
-- atarken kullanilan yontemin aynisi, yani veriyle tutarli.
--
-- Kaynak: OpenStreetMap idari sinirlari (ODbL; atif kesfet ekraninda
-- zaten duruyor). Poligonlar ~100 m toleransla basitlestirildi -
-- nokta-icinde testi icin fazlasiyla hassas, sorgu ise cok daha hizli.
-- Yukleyici: araclar/il-yukle.py
create table if not exists public.iller (
  ad text primary key,
  sinir geometry(MultiPolygon, 4326) not null
);

create index if not exists iller_sinir_gist on public.iller using gist (sinir);

-- Idari sinir kamuya acik veri; kisisel veri tasimiyor.
alter table public.iller enable row level security;

drop policy if exists "iller herkese acik" on public.iller;
create policy "iller herkese acik" on public.iller
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------
-- 2) INDEKSLER
-- ---------------------------------------------------------------------
-- OLCULDU: il suzgeci eklendiginde "kafe" aramasi 2.646 ms'ye cikti ve
-- PostgREST'in 8 sn sinirinda zaman asimina duesuyordu. Sebep plan:
-- trgm indeksi 18.580 satir buluyor, bunlarin 16.911'i HEAP'ten okunup
-- il suzgeciyle ELENIYORDU (17.658 blok okuma).
--
-- Cozum, il'i indeksin ICINE almak. btree_gin, GIN indeksinde skaler bir
-- sutunu trgm ile birlikte kullanmayi sagliyor; boylece eleme heap'e
-- inmeden yapiliyor.
--
-- Yalnizca `il` uzerine btree indeks DENENDI ve YETMEDI: planlayici onu
-- secmedi (trgm satir tahmini 594 iken gercek 18.580 - istatistik sapmasi),
-- plan degismedi ve olculen hizlanma yalnizca onbellegin isinmasindan
-- geliyordu.
create extension if not exists btree_gin;

create index if not exists mekanlar_il_ad_trgm_idx
  on public.mekanlar using gin (il, public.tr_kucuk(ad) gin_trgm_ops);

-- Sinirsiz arama yolu (kullanici bir il poligonunun disindaysa) hala
-- calisir: btree_gin ile kurulan bilesik GIN'de sutunlar bagimsiz
-- anahtarlar, yani `il` kosulu olmadan da trgm tarafi kullanilabiliyor.
create index if not exists mekanlar_il_idx on public.mekanlar (il);

-- ---------------------------------------------------------------------
-- 3) ARAMA FONKSIYONU
-- ---------------------------------------------------------------------
-- SINIR YALNIZCA ARAMAYA UYGULANIR. p_arama null oldugunda ("Yakininda"
-- listesi) hicbir sey degismiyor; orada zaten yaricap suzgeci var ve il
-- sinirini oraya da koymak, il sinirinda oturan birinin 300 m otesindeki
-- mekani gormesini engellerdi.
--
-- Il bulunamazsa (denizde, sinirda, yurt disinda) arama SINIRSIZ kaliyor,
-- yani eski davranis. Aksi halde ekran sebebi gorunmeden bombos kalirdi.
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null,
  p_turler text[] default null,
  p_limit integer default null
)
returns table(
  id uuid, ad text, tur text, semt text, il text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamp with time zone, kisi_sayisi integer
)
language plpgsql
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

  -- Kullanicinin ili yalnizca ARAMA yapilirken gerekiyor; bos aramada
  -- bu sorgu hic calistirilmiyor.
  if p_arama is not null then
    select i.ad into v_il
    from public.iller i
    where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
    limit 1;
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
      -- v_il null ise (arama yok, ya da kullanici bir il poligonunun
      -- disinda) bu kosul her satirda dogru: sinir uygulanmiyor.
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
         ) as kisi_sayisi
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$function$;
