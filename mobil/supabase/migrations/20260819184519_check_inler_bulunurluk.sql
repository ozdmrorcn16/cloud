-- gizli_mi (boolean) yerine uc kademeli bulunurluk (karar #39):
--   herkese_acik -> ayni mekandakiler + takipciler gorur
--   takipcilerim -> yalnizca takipciler gorur
--   gizli        -> yalnizca sahibi gorur
--
-- Faz 2b karar #25 degisti: gizli check-in artik mekandakilere de
-- gorunmuyor. O karar "gizli ile hic check-in yapmamis olmak ayni seye
-- duser" gerekcesine dayaniyordu; o gerekce uzaktan gorunme yuzeyi
-- olmadigi icin gecerliydi ve bu faz o yuzeyi yaratiyor.
alter table public.check_inler add column bulunurluk text;

update public.check_inler
  set bulunurluk = case when gizli_mi then 'gizli' else 'herkese_acik' end;

alter table public.check_inler
  alter column bulunurluk set not null,
  alter column bulunurluk set default 'herkese_acik',
  add constraint check_inler_bulunurluk
    check (bulunurluk in ('herkese_acik', 'takipcilerim', 'gizli'));

alter table public.check_inler drop column gizli_mi;

-- Ani ekseni ucuncu degerini kaziniyor. Tabloda bu sutun icin bir check
-- kisiti yoktu; simdi ekleniyor ki gecersiz bir deger yazilamasin.
alter table public.check_inler
  add constraint check_inler_gorunurluk
    check (gorunurluk in ('herkese_acik', 'takipcilerim', 'kimse'));
