-- ---------------------------------------------------------------- --
-- check_inler.kullanici_adi profil adiyla ESITLENIR (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Karar #18 (Faz 2a): ad, check_inler'e denormalize yazilir, cunku
-- profiller'in RLS'i baskasinin satirini okutmuyor. Ama ad yalnizca
-- check-in ANINDA kopyalaniyordu; kullanici adini degistirince eski
-- kayitlar eski adla kaldi. Canlida gorulen ornek: profil "Orçun
-- özdemir" derken 13 check-in "Test Kullanici" diyordu.
--
-- Cozum: profiller.ad degisince o kullanicinin butun check-in'lerinde
-- ad guncellenir (tetikleyici) + mevcut kayitlar bir kez esitlenir.
-- Denormalizasyon duruyor (okuma yolu degismedi), yalnizca artik
-- kaynakla senkron.

create or replace function public.check_in_adini_esitle()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.ad is distinct from old.ad then
    update public.check_inler
    set kullanici_adi = new.ad
    where kullanici_id = new.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists check_in_adini_esitle on public.profiller;
create trigger check_in_adini_esitle
  after update of ad on public.profiller
  for each row
  execute function public.check_in_adini_esitle();

comment on function public.check_in_adini_esitle() is
  'profiller.ad degisince ayni kullanicinin check_inler.kullanici_adi degerini guncel ada ceker (karar #18 denormalizasyonunu senkron tutar).';

-- Bir kerelik esitleme: bugune kadar adini degistirmis herkes.
update public.check_inler c
set kullanici_adi = p.ad
from public.profiller p
where p.id = c.kullanici_id
  and c.kullanici_adi is distinct from p.ad;
