-- Askiya alma / dondurma yazma kapilarina baglaniyor (spec karar 57, 66).
-- Bu iki yardimci UC RPC'yi birden kapatir: takip_istegi_gonder ve
-- sohbet_istegi_gonder (istek_on_kontrol), mesaj_gonder (yazabilir_mi).
--
-- istek_on_kontrol govdesi 20260819195646_istek_gunlugu.sql'deki SON
-- surumden birebir kopyalandi; tek fark iki yeni kontrol.
create or replace function bag.istek_on_kontrol(p_hedef uuid) returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_gunluk int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki kullanici yeni bag kuramaz. Mesaji acik: kendi durumunu
  -- zaten hesap_durumlari'ndan okuyabiliyor, gizlemenin anlami yok.
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_hedef = auth.uid() then
    raise exception 'Kendine istek gonderemezsin';
  end if;

  -- Askidaki HEDEF icin engellemeyle ayni sessizlik: "askida" demiyoruz,
  -- kullanici yokmus gibi cevap veriyoruz (Faz 2b sessizlik ilkesi).
  -- Aksi halde panel bir hesabi askiya alinca bu, disaridan sorgulanabilir
  -- bir bilgi haline gelirdi.
  if not moderasyon.hesap_aktif_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  if gizli.engelli_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  select count(*) into v_gunluk
  from public.istek_gunlugu
  where gonderen_id = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_gunluk >= 50 then
    raise exception 'Bugunluk istek sinirina ulastin';
  end if;
end;
$fn$;

grant execute on function bag.istek_on_kontrol(uuid) to authenticated;

-- yazabilir_mi govdesi 20260820132747_yazabilir_mi.sql'den birebir
-- kopyalandi; tek fark bastaki iki aktiflik kontrolu. IKI TARAF da
-- kontrol ediliyor: askidaki biri yazamaz, askidaki birine de yazilamaz.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $fn$
  select
    moderasyon.hesap_aktif_mi(auth.uid())
    and moderasyon.hesap_aktif_mi(p_hedef)
    and not gizli.engelli_mi(p_hedef)
    and (
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
      or exists (
        select 1 from public.sohbet_istekleri s
        where s.durum = 'kabul'
          and (
            (s.gonderen_id = auth.uid() and s.alan_id = p_hedef)
            or (s.gonderen_id = p_hedef and s.alan_id = auth.uid())
          )
      )
    );
$fn$;

grant execute on function bag.yazabilir_mi(uuid) to authenticated;
