-- ETIKET ONAYI ARTIK BIR GIZLILIK AYARI
--
-- Kullanicinin karari (2026-09-06): "Bir kullanici arkadas oldugu
-- birisini direk etiketleyebilir. Ayarlar gizlilik ayarlarinda herkes
-- etiketleyebilir ya da etiketleyemez gibi bir gizlilik ayari
-- getirelim. Etiket onayi kapali olan birini birisi etiketlemek
-- istedigi zaman o kisiye onay bildirimi gelsin."
--
-- Onceki kural (2026-08-29): HER etiket onay bekliyordu. Artik
-- varsayilan DIREK: karsilikli arkadasin seni etiketleyebiliyor.
-- Isteyen "once bana sor" diyebiliyor.
--
-- KARSILIKLI ARKADASLIK SARTI DEGISMEDI. Bu ayar yalnizca onayin
-- gerekip gerekmedigini belirliyor; yabanci hala etiketleyemiyor
-- (INSERT politikasindaki `bag.takip_ediyor_mu`).

alter table public.profiller
  add column if not exists etiket_onayi_gerekli boolean not null default false;

comment on column public.profiller.etiket_onayi_gerekli is
  'true ise beni etiketlemek onayima bagli; false ise arkadasim direk etiketler.';

-- DURUMU ARTIK SUNUCU BELIRLIYOR.
--
-- Onceden INSERT politikasi `durum = ''bekliyor''` sart kosuyordu -
-- yoksa etiketleyen kisi kendi etiketini onaylanmis yazabilirdi.
-- Simdi durum hedefin AYARINA bagli, yani istemcinin yazdigi deger
-- hic dikkate alinmamali: tetikleyici ne gelirse gelsin EZIYOR.
--
-- Tetikleyici `security definer`: `profiller` uzerindeki RLS yalnizca
-- kendi satirini gosteriyor, etiketleyen kisi hedefin ayarini
-- okuyamaz.
create or replace function public.etiket_durumunu_belirle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_onay_gerekli boolean;
begin
  select etiket_onayi_gerekli into v_onay_gerekli
  from public.profiller
  where id = new.kullanici_id;

  -- Profil bulunamazsa GUVENLI TARAF: onay bekle.
  new.durum := case when coalesce(v_onay_gerekli, true) then 'bekliyor' else 'onaylandi' end;
  return new;
end;
$$;

drop trigger if exists etiket_durumu on public.check_in_etiketleri;
create trigger etiket_durumu
  before insert on public.check_in_etiketleri
  for each row execute function public.etiket_durumunu_belirle();

-- INSERT politikasindan `durum` sarti KALKIYOR: artik tetikleyici
-- zorluyor ve istemcinin gonderdigi deger hicbir sey ifade etmiyor.
-- Geri kalan kosullar aynen duruyor.
drop policy if exists "kendi check-in'ine bagli oldugu kisiyi etiketleyebilir"
  on public.check_in_etiketleri;
create policy "kendi check-in'ine bagli oldugu kisiyi etiketleyebilir"
  on public.check_in_etiketleri for insert
  to authenticated
  with check (
    kullanici_id <> auth.uid()
    and exists (
      select 1 from public.check_inler c
      where c.id = check_in_id and c.kullanici_id = auth.uid()
    )
    and bag.takip_ediyor_mu(auth.uid(), kullanici_id)
  );

-- Ayari kullanici yalnizca KENDI satirinda degistirebiliyor; sutun
-- yetkisi acikca veriliyor (profiller'de sutun bazli kisitlama var,
-- bkz. 20260819124813).
grant update (etiket_onayi_gerekli) on public.profiller to authenticated;
