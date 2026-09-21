-- IFADEYI SONRADAN DEGISTIRME (kullanicinin istegi 2026-09-21: akis
-- kartindaki yerinde duzenlemeye "ifade ekle", eklenen ifade
-- silinebilsin). `check_in_notunu_guncelle` ile ayni kapi: yalnizca
-- kendi, moderasyonla gizlenmemis paylasimi; slug `ifadeler`
-- sozlugunde olmali; null = kaldir.

create or replace function public.check_in_ifadesini_guncelle(p_check_in_id uuid, p_ifade text default null)
returns check_inler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_satir public.check_inler;
  v_ifade text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  v_ifade := nullif(btrim(coalesce(p_ifade, '')), '');
  if v_ifade is not null and not exists (select 1 from public.ifadeler i where i.slug = v_ifade) then
    raise exception 'Gecersiz ifade';
  end if;

  update public.check_inler
  set ifade = v_ifade
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and not moderasyon_gizli
  returning * into v_satir;

  if v_satir.id is null then
    raise exception 'Bu paylasim bulunamadi';
  end if;

  return v_satir;
end;
$$;

revoke execute on function public.check_in_ifadesini_guncelle(uuid, text) from public, anon;
grant execute on function public.check_in_ifadesini_guncelle(uuid, text) to authenticated, service_role;
