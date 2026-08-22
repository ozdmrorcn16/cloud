-- Onceki migrasyon (20260822093000) yalnizca YANITLAYANIN aktifligine
-- bakiyordu. Ama gonderen istegi gonderdiginde aktifti - bag.istek_on_kontrol
-- o an kontrol etti - yanit anina kadar askiya alinmis olabilir. Somut
-- senaryo: A aktifken B'ye takip istegi gonderir, A askiya alinir, B
-- (aktif) istegi kabul eder - kontrol yalnizca B'ye baktigi icin gecer ve
-- askidaki A ile karsilikli bir bag kurulur. Spec'in zorlama tablosunda
-- bag.istek_on_kontrol icin "askidaki birine de istek gitmez (iki taraf
-- da kontrol edilir)" yaziyor; bekleyen bir istegin askidaki biriyle bag
-- kurmasi da ayni ilkeye aykiri. Bu migrasyon karsi tarafin (p_kullanici_id)
-- aktifligini de kontrol ediyor.
--
-- Hata metni bilerek MEVCUT 'Yanitlanacak istek bulunamadi': karsi
-- tarafin askida oldugu disaridan sorgulanabilir olmamali
-- (bag.istek_on_kontrol'deki sessizlik ilkesinin aynisi) ve istemci bu
-- hatayi zaten isliyor.
--
-- Govdeler 20260822093000_hesap_aktif_yanit_rpcleri.sql'den birebir
-- kopyalandi; yalnizca eklenen karsi-taraf kontrolu farkli.

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

  if not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    raise exception 'Yanitlanacak istek bulunamadi';
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

  if not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    raise exception 'Yanitlanacak istek bulunamadi';
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
