-- PROFIL GIZLILIGI: "Profilim gizli"
--
-- Kullanicinin istegi (2026-09-02). Davranis karari da onun:
-- gizli profilde AD, KULLANICI ADI ve FOTOGRAF gorunmeye devam eder;
-- gizlenen sey PAYLASIMLARDIR (anilar ve check-in'ler, GECMIS DAHIL).
-- Instagram'daki gizli hesap deseni.
--
-- Neden ad ve fotograf acik: tamamen gizlemek "seni taniyan biri bile
-- emin olamaz" sonucunu veriyor ve arkadaslik istegi gelme ihtimalini
-- duesuruyor. Taninabilir kalmak, icerigi korumakla celismiyor.
--
-- MEVCUT AYARLARLA ILISKISI:
--   aramada_gorunsun      -> aramada cikip cikmama (AYRI ayar)
--   varsayilan_bulunurluk -> YENI check-in'lerin varsayilani
--   profil_gizli          -> BUNLARIN UZERINDE bir kapi
alter table public.profiller
  add column if not exists profil_gizli boolean not null default false;

comment on column public.profiller.profil_gizli is
  'Acikken paylasimlar (anilar ve check-in''ler) yalnizca arkadaslara gorunur; ad, kullanici adi ve fotograf herkese acik kalir.';

create or replace function gizli.profil_gizli_mi(p_kullanici_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (select p.profil_gizli from public.profiller p where p.id = p_kullanici_id),
    false
  );
$$;

-- YETKI SART: fonksiyon RLS politikasinin ICINDEN cagriliyor, yani
-- cagiran rol calistirma yetkisine sahip olmali. Ilk kosumda unutuldu
-- ve butun check_inler okumalari "permission denied" verdi.
revoke all on function gizli.profil_gizli_mi(uuid) from public;
grant execute on function gizli.profil_gizli_mi(uuid) to authenticated;

-- Mevcut kurala TEK bir kapi eklendi; butun dallari (ani/canli,
-- herkese_acik/takipcilerim) birden kapsiyor. Kendi kayitlarina
-- dokunulmuyor - kisi kendi paylasimini her zaman gorur.
drop policy if exists "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu" on public.check_inler
for select
using (
  (not moderasyon_gizli)
  and (
    kullanici_id = auth.uid()
    or (
      moderasyon.hesap_aktif_mi(kullanici_id)
      and (not gizli.engelli_mi(kullanici_id))
      and (
        not gizli.profil_gizli_mi(kullanici_id)
        or bag.takip_ediyor_mu(auth.uid(), kullanici_id)
      )
      and case
        when konum is null then (
          gorunurluk = 'herkese_acik'
          or (gorunurluk = 'takipcilerim' and bag.takip_ediyor_mu(auth.uid(), kullanici_id))
        )
        else (
          (
            bulunurluk = 'herkese_acik'
            and (
              gizli.ayni_mekanda_canli_mi(mekan_id)
              or bag.takip_ediyor_mu(auth.uid(), kullanici_id)
            )
          )
          or (bulunurluk = 'takipcilerim' and bag.takip_ediyor_mu(auth.uid(), kullanici_id))
        )
      end
    )
  )
);

-- Ekranin "bu profil gizli" diyebilmesi icin bilgi gerekiyor.
-- Paylasimlarin KENDISI zaten RLS ile kesiliyor; bu alan yalnizca
-- ekranin dogru cumleyi kurmasi icin.
--
-- `create or replace` KULLANILAMIYOR: donus tipi degisiyor ve Postgres
-- OUT parametreleri degisen bir fonksiyonu degistirmiyor.
drop function if exists public.baskasinin_profili(uuid);

create function public.baskasinin_profili(p_kullanici_id uuid)
returns table(
  id uuid,
  kullanici_adi text,
  ad text,
  biyografi text,
  fotograflar text[],
  profil_gizli boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid())
     or not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    return;
  end if;

  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  -- Dogum tarihi hicbir kosulda donmuyor (Faz 2b karar #27).
  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.fotograflar, p.profil_gizli
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$function$;

revoke all on function public.baskasinin_profili(uuid) from public;
grant execute on function public.baskasinin_profili(uuid) to authenticated;
