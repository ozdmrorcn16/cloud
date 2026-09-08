-- ------------------------------------------------------------------ --
-- BASKASININ PROFILI ARTIK ARKADAS SAYISI DA DONDURUYOR
--
-- Kullanicinin istegi (2026-09-08): baskasinin profili, kisinin KENDI
-- profil ekraniyla ayni duzende gorunsun. O ekranda uc sayac var
-- (Ani / Fotograf / Arkadas); ilk ikisi zaten istemcide hesaplanabiliyor
-- (gorunen anilar ve fotograflar), arkadas sayisi ise sunucudan
-- gelmek zorunda.
--
-- SAYI EVET, LISTE HAYIR. Ayni ayrim mekan sayfasinda da var
-- (2026-09-06): bir SAYI kimseyi tanimlamiyor, ama kimlerin arkadas
-- oldugu bag listesi RLS'e tabi ve bu RPC onu ACMIYOR.
--
-- Takip 2026-08-20'den beri KARSILIKLI (Faz 3b, karar 42): kabul iki
-- satir birden yaziyor. Dolayisiyla kisinin arkadas sayisi, o kisinin
-- takip eden tarafta oldugu kabul edilmis satirlarin sayisi.
--
-- Donus tipi degistigi icin DROP gerekiyor (42P13). Drop yetkileri de
-- siliyor, o yuzden `grant execute` hemen altinda yeniden veriliyor -
-- bu ders 2026-09-06'da mekan sayfasi RPC'lerinde ogrenildi.
-- ------------------------------------------------------------------ --

drop function if exists public.baskasinin_profili(uuid);

create function public.baskasinin_profili(p_kullanici_id uuid)
returns table (
  id uuid,
  kullanici_adi text,
  ad text,
  biyografi text,
  fotograflar text[],
  profil_gizli boolean,
  arkadas_sayisi integer
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

  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.fotograflar, p.profil_gizli,
           (
             select count(*)::int
             from public.takipler t
             where t.takip_eden_id = p.id and t.durum = 'kabul'
           )
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$function$;

grant execute on function public.baskasinin_profili(uuid) to authenticated;
