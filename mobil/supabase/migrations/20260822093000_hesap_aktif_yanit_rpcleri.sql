-- Yanit RPC'lerine aktiflik kontrolu. Gonderme tarafi Task 2'de
-- bag.istek_on_kontrol uzerinden kapandi, ama yanitlama o yardimciyi
-- CAGIRMIYOR - ayri ayri eklenmesi bu yuzden gerekli. Kapanmasaydi
-- askidaki bir kullanici bekleyen istekleri kabul ederek yeni bag
-- kurmaya devam ederdi.
--
-- takip_istegini_yanitla govdesi 20260820123552_takip_karsilikli.sql'den,
-- sohbet_istegini_yanitla govdesi 20260819190203_bag_rpcleri.sql'den
-- birebir kopyalandi.

create or replace function public.takip_istegini_yanitla(
  p_kullanici_id uuid,
  p_kabul boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  -- Yalnizca ALICI yanitlayabilir: where kosulundaki takip_edilen_id
  -- auth.uid(). Gonderen kendi istegini kabul edemez.
  if p_kabul then
    update public.takipler
      set durum = 'kabul'
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';

    if not found then
      raise exception 'Yanitlanacak istek bulunamadi';
    end if;

    -- Ayna satir: bag karsilikli. `not found` kontrolu bu insert'ten
    -- ONCE yapilmali, yoksa insert `found`'u ezer ve olmayan bir istek
    -- sessizce kabul edilmis gorunur.
    insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
    values (auth.uid(), p_kullanici_id, 'kabul')
    on conflict (takip_eden_id, takip_edilen_id)
      do update set durum = 'kabul';
  else
    -- Red satiri siliniyor (karar #37).
    delete from public.takipler
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';

    if not found then
      raise exception 'Yanitlanacak istek bulunamadi';
    end if;
  end if;
end;
$$;

revoke execute on function public.takip_istegini_yanitla(uuid, boolean) from public, anon;
grant execute on function public.takip_istegini_yanitla(uuid, boolean) to authenticated;

create or replace function public.sohbet_istegini_yanitla(
  p_kullanici_id uuid,
  p_kabul boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_kabul then
    update public.sohbet_istekleri
      set durum = 'kabul'
      where gonderen_id = p_kullanici_id
        and alan_id = auth.uid()
        and durum = 'beklemede';
  else
    delete from public.sohbet_istekleri
      where gonderen_id = p_kullanici_id
        and alan_id = auth.uid()
        and durum = 'beklemede';
  end if;

  if not found then
    raise exception 'Yanitlanacak istek bulunamadi';
  end if;
end;
$$;

revoke execute on function public.sohbet_istegini_yanitla from public, anon;
grant execute on function public.sohbet_istegini_yanitla to authenticated;
