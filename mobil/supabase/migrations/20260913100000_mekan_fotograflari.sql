-- MEKAN FOTOGRAF ALANI (kullanicinin istegi 2026-09-13).
--
-- "Konumlara bir fotograf alani olustur, check-in'lere konan
-- fotograflar orada gorunecek." Dis kaynak yok: mekan sayfasi, o
-- mekanda yapilmis check-in'lerin fotograflarini listeliyor.
--
-- GORUNURLUK: `security invoker`. `check_inler` RLS'i aynen isliyor,
-- yani kisi ancak zaten gorebildigi check-in'in fotografini gorur
-- (kendi, arkadasinin, ya da herkese acik bir ani). Kova politikasi da
-- (20260825120000) ayni RLS'e bagli: satir gorunmuyorsa dosya da
-- imzalanmiyor. Gizlilik modeli bu is kalemiyle DEGISMIYOR - liste
-- "Son check-inler"le ayni kapidan geciyor. Moderasyonla gizlenen
-- satirlar RLS'in en dis kosuluyla zaten disarida.
--
-- 24 SAAT SUZGECI YOK: fotograf alani bir GALERI, "su an kim burada"
-- listesi degil. Eski bir fotograf da mekani anlatiyor.
--
-- OFSET SAYFALAMA: siralama olusturma zamanina gore ve yeni bir
-- fotograf eklendiginde pencere bir kayar, ama galeride bunun bedeli
-- tek bir fotografin iki kez gorunmesi (istemci kimlikle eliyor);
-- imlecli sayfalamanin karmasikligina degmiyor.
create or replace function public.mekan_fotograflari(
  p_mekan_id uuid,
  p_limit integer default 30,
  p_ofset integer default 0
)
returns table (
  id uuid,
  kullanici_id uuid,
  kullanici_adi text,
  olusturma_zamani timestamptz,
  fotograf text
)
language sql
stable
set search_path to ''
as $function$
  select c.id, c.kullanici_id, c.kullanici_adi, c.olusturma_zamani, c.fotograf
  from public.check_inler c
  where c.mekan_id = p_mekan_id
    and c.fotograf is not null
  order by c.olusturma_zamani desc, c.id desc
  limit least(greatest(coalesce(p_limit, 30), 1), 60)
  offset greatest(coalesce(p_ofset, 0), 0);
$function$;

revoke execute on function public.mekan_fotograflari(uuid, integer, integer) from public;
grant execute on function public.mekan_fotograflari(uuid, integer, integer) to authenticated;

-- Kismi indeks: yalnizca fotografli satirlar, mekan + zaman sirasiyla.
-- Mevcut `check_inler_fotograf_idx` fotograf ADINA gore (kova
-- politikasi icin); bu sorgu mekana gore suzuyor.
create index if not exists check_inler_mekan_fotograf_idx
  on public.check_inler (mekan_id, olusturma_zamani desc)
  where fotograf is not null;
