-- MEKAN SAYFASI: istatistikler, liderlik tablosu ve son check-inler
--
-- Kullanicinin istegi (2026-09-06): konum ekrani (mekan adina basinca
-- acilan sayfa) referans gorseldeki gibi bir MEKAN SAYFASINA donusuyor:
-- ustte uc sayi, altinda "su an burada" seridi ve iki sekme
-- (Liderlik Tablosu / Son Check-inler).
--
-- IKI FARKLI GIZLILIK REJIMI VAR ve bilerek ayri tutuldular:
--
--   SAYILAR (`mekan_istatistikleri`) `security definer`. Kimseyi
--   tanimlamiyorlar ve mevcut yogunluk sayaciyla ayni siniftalar -
--   `yakin_mekanlar_yogunluk` da butun check-in'leri sayiyor, ustelik
--   karar 71 ile gizli check-in'in bile sayaca girmesi kabul edilmisti.
--
--   KISI LISTELERI (`mekan_liderlik`, `mekan_son_check_inler`)
--   `security invoker`. Yani `check_inler` RLS'i AYNEN calisiyor:
--   ekrani acan kisi kimi gormeye hakki varsa onu goruyor. Canli bir
--   check-in'de `herkese_acik` bile ancak AYNI MEKANDA CANLIYSAN ya da
--   ARKADASINSA gorunuyor; anilarda `gorunurluk` kademesi isliyor.
--   Buralarda `security definer` KULLANILMADI - kullanilsaydi tek bir
--   ekran butun gorunurluk modelini delerdi.
--
-- Sonucu KASITLI bir fark: ustte "7 kisi burada" yazarken asagida
-- yalnizca 2 avatar gorunebilir. Aradaki fark ekranda "+5 diger"
-- olarak duruyor - sayi sizmaya devam ediyor, kimlikler sizmiyor.

-- ---------------------------------------------------------------------
-- 1) Sayilar
-- ---------------------------------------------------------------------
--
-- ILCE SIRALAMASI hakkinda: `check_inler` bugun kucuk (binler
-- mertebesi), bu yuzden ilcedeki mekanlari gruplayip siralamak ucuz.
-- Tablo yuz binlere cikarsa bu sorgu her mekan sayfasi acilisinda
-- yeniden hesaplanmamali; o gun dogru cozum gunluk tazelenen bir
-- materialized view olur. Bugun icin erken optimizasyon olurdu.
create or replace function public.mekan_istatistikleri(p_mekan_id uuid)
returns table (
  su_an_kisi integer,
  bugun_check_in integer,
  toplam_check_in integer,
  ilce_sirasi integer,
  ilce_mekan_sayisi integer,
  ilce text
)
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_ilce text;
begin
  -- Kimliksiz cagri: bu sayilar giris yapmis kullanici icin.
  if auth.uid() is null then
    raise exception 'Once giris yapmalisin';
  end if;

  select m.semt into v_ilce
  from public.mekanlar m
  where m.id = p_mekan_id;

  return query
  with ilce_sayimlari as (
    -- Ilce bilinmiyorsa (poligon disinda kalan nadir kayitlar) siralama
    -- URETILMIYOR: "kacinci" sorusunun bir evreni olmadan cevabi olmaz.
    select c.mekan_id, count(*) as n
    from public.check_inler c
    join public.mekanlar m on m.id = c.mekan_id
    where v_ilce is not null
      and m.semt = v_ilce
      and moderasyon.hesap_aktif_mi(c.kullanici_id)
      and not c.moderasyon_gizli
    group by c.mekan_id
  ),
  siralanmis as (
    select mekan_id, rank() over (order by n desc) as sira
    from ilce_sayimlari
  )
  select
    (select count(*)::int
       from public.check_inler c
      where c.mekan_id = p_mekan_id
        and c.konum is not null
        and c.bitis_zamani > now()
        and moderasyon.hesap_aktif_mi(c.kullanici_id)
        and not c.moderasyon_gizli),
    (select count(*)::int
       from public.check_inler c
      where c.mekan_id = p_mekan_id
        and c.olusturma_zamani >= date_trunc('day', now())
        and moderasyon.hesap_aktif_mi(c.kullanici_id)
        and not c.moderasyon_gizli),
    (select count(*)::int
       from public.check_inler c
      where c.mekan_id = p_mekan_id
        and moderasyon.hesap_aktif_mi(c.kullanici_id)
        and not c.moderasyon_gizli),
    (select s.sira::int from siralanmis s where s.mekan_id = p_mekan_id),
    (select count(*)::int from ilce_sayimlari),
    v_ilce;
end;
$$;

comment on function public.mekan_istatistikleri(uuid) is
  'Mekan sayfasinin ust seridi: su an kac kisi, bugun kac check-in, toplam, ve ilcedeki sirasi. Sayilar kimseyi tanimlamaz.';

revoke all on function public.mekan_istatistikleri(uuid) from public;
grant execute on function public.mekan_istatistikleri(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2) Liderlik tablosu
-- ---------------------------------------------------------------------
--
-- `security invoker`: RLS calisiyor, yani listede yalnizca cagiranin
-- gormeye hakki oldugu check-in'ler sayiliyor. Bunun bir sonucu var ve
-- kabul ediliyor: iki farkli kullanici ayni mekanda FARKLI bir liderlik
-- tablosu gorebilir. Alternatifi (herkese ayni tabloyu gostermek)
-- gorunurluk tercihlerini gecersiz kilardi.
--
-- Ad `check_inler`de denormalize duruyor (karar #18) ve kisi adini
-- degistirdiyse eski satirlarda eski ad kalir; bu yuzden EN YENI satirin
-- adi aliniyor, `max()` degil.
create or replace function public.mekan_liderlik(
  p_mekan_id uuid,
  p_limit integer default 5
)
returns table (
  kullanici_id uuid,
  kullanici_adi text,
  check_in_sayisi integer
)
language sql
security invoker
stable
set search_path = ''
as $$
  select
    c.kullanici_id,
    (array_agg(c.kullanici_adi order by c.olusturma_zamani desc))[1],
    count(*)::int
  from public.check_inler c
  where c.mekan_id = p_mekan_id
  group by c.kullanici_id
  order by count(*) desc, min(c.olusturma_zamani) asc
  limit least(greatest(coalesce(p_limit, 5), 1), 20);
$$;

comment on function public.mekan_liderlik(uuid, integer) is
  'Bu mekana en cok check-in yapanlar. security invoker: RLS gorunurluk tercihlerini uyguluyor.';

revoke all on function public.mekan_liderlik(uuid, integer) from public;
grant execute on function public.mekan_liderlik(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Son check-inler
-- ---------------------------------------------------------------------
create or replace function public.mekan_son_check_inler(
  p_mekan_id uuid,
  p_limit integer default 10
)
returns table (
  id uuid,
  kullanici_id uuid,
  kullanici_adi text,
  olusturma_zamani timestamptz,
  not_metni text,
  canli_mi boolean
)
language sql
security invoker
stable
set search_path = ''
as $$
  select
    c.id,
    c.kullanici_id,
    c.kullanici_adi,
    c.olusturma_zamani,
    c.not_metni,
    (c.konum is not null and c.bitis_zamani > now())
  from public.check_inler c
  where c.mekan_id = p_mekan_id
  order by c.olusturma_zamani desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

comment on function public.mekan_son_check_inler(uuid, integer) is
  'Mekanin son check-inleri. security invoker: RLS gorunurluk tercihlerini uyguluyor.';

revoke all on function public.mekan_son_check_inler(uuid, integer) from public;
grant execute on function public.mekan_son_check_inler(uuid, integer) to authenticated;

-- Uc sorgu da mekan_id uzerinden filtreliyor.
create index if not exists check_inler_mekan_id_idx
  on public.check_inler (mekan_id);
