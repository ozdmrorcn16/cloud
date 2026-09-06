-- TUR FILTRESI: temel turler, il bazli, km sinirsiz
--
-- Kullanicinin istekleri (2026-09-06, sirayla):
--   "Filtre tusuna basinca bizim mevcuttaki turlerimizin listesi
--    ciksin, o listeden sectigi turlere gore sadece o konumlar
--    listelensin."
--   "Filtrede butun verilerimizin turleri gorulmeli."
--   "Temel turleri goster, 300 cok fazla olur."
--   "Filtrelemede km siniri yok, filtreleme yapan biri bulundugu
--    sehirdeki kayitlara gore sonuclar bulur."
--   "Yaptigi filtrelemeye gore yakindan uzaga mekanlar listelenir,
--    bulundugu konuma gore."
--
-- Gosterilen TUR LISTESI istemcide sabit (`TEMEL_TUR_GRUPLARI`);
-- buradaki parcalar yalnizca ADETLERI ve SUZGECI sagliyor.

-- ---------------------------------------------------------------------
-- 1) Tur adetleri: il basina, onceden hesaplanmis
-- ---------------------------------------------------------------------
--
-- NEDEN MATERIALIZED VIEW: il bazli tur sayimi OLCULDU, 13,5 saniye
-- surdu (122.896 blok okuma) - `mekanlar_il_idx` kullanilmasina
-- ragmen. PostgREST'in ifade siniri 8 saniye, yani canli sorgulanamaz.
-- Gorunum 81 il x ~300 tur = en fazla 24 bin satir.

drop materialized view if exists public.mekan_turleri;

create materialized view public.mekan_turleri as
select il, tur, count(*)::int as toplam
from public.mekanlar
where tur not in ('test', 'yer-degil')
  and il is not null
group by il, tur;

-- CONCURRENTLY tazeleme icin tekil indeks SART.
create unique index mekan_turleri_il_tur_idx
  on public.mekan_turleri (il, tur);

comment on materialized view public.mekan_turleri is
  'Tur secicideki adetler: il basina tur sayilari. Ham sayim 13,5 sn, o yuzden onceden hesaplaniyor.';

grant select on public.mekan_turleri to authenticated;

select cron.schedule(
  'mekan-turleri-tazele',
  '17 3 * * *',
  $$refresh materialized view concurrently public.mekan_turleri$$
);

-- ---------------------------------------------------------------------
-- 2) Kullanicinin ILINDEKI tur sayilari
-- ---------------------------------------------------------------------
--
-- `yakin_turler` (yaricap icindeki turler) DUSURULDU: yaricap kurali
-- artik yok.
drop function if exists public.yakin_turler(double precision, double precision, integer);

create or replace function public.ildeki_turler(
  p_lat double precision,
  p_lng double precision
)
returns table(tur text, adet integer, il text)
language plpgsql
security definer
stable
set search_path to 'public'
as $function$
declare
  v_il text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Il NOKTA-ICINDE-POLIGON testiyle bulunuyor; "en yakin mekanin ili"
  -- bir tahmin olurdu ve il sinirina yakin yerlerde yanilirdi.
  select i.ad into v_il
  from public.iller i
  where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
  limit 1;

  -- Il bulunamazsa (denizde, sinirda, yurt disinda) adet gosterilmiyor
  -- ama secici yine aciliyor: tur listesi ISTEMCIDE sabit.
  if v_il is null then
    return;
  end if;

  return query
  select t.tur, t.toplam, v_il
  from public.mekan_turleri t
  where t.il = v_il;
end;
$function$;

comment on function public.ildeki_turler(double precision, double precision) is
  'Tur secicideki adetler: kullanicinin ilindeki tur sayilari.';

revoke all on function public.ildeki_turler(double precision, double precision) from public;
grant execute on function public.ildeki_turler(double precision, double precision) to authenticated;

-- ---------------------------------------------------------------------
-- 3) (il, tur) BILESIK INDEKSI - suzgecin calisabilmesi icin sart
-- ---------------------------------------------------------------------
--
-- OLCULDU: indekssiz halde "Bursa'daki kafeler, yakindan uzaga, ilk
-- 100" sorgusu 6.452 ms suruyordu ve PostgREST'in 8 sn sinirinda zaman
-- asimina duesuyordu. Plan sunu gosteriyordu: `mekanlar_il_ad_trgm_idx`
-- ile `mekanlar_tur_idx` BitmapAnd ile birlestiriliyor, bitmap TASIYOR
-- (lossy=43209) ve 1.214.581 satir heap'ten yeniden okunuyordu.
--
-- Bilesik indeksle tek bir Index Scan kaliyor: 946 ms, blok okuma
-- 47.383 -> 6.050. Indeks 42 MB.
--
-- Canlida `create index concurrently` ile kuruldu (tablo 5,9M satir ve
-- uygulama calisiyordu); burada normal bicimde duruyor cunku migrasyon
-- islem icinde kosuyor ve CONCURRENTLY orada calismaz.
create index if not exists mekanlar_il_tur_idx
  on public.mekanlar (il, tur);
