-- Takip artik KARSILIKLI (karar 42). Kabul iki yonu de yaziyor, bagi
-- koparmak iki yonu de siliyor. Sema degismiyor; degisen tek sey
-- satirlarin ne zaman yazildigi.
--
-- Karsiliklilik tek bir yerde, bu RPC'de kuruluyor. `takipler` tablosuna
-- yalnizca security definer RPC'ler yazabiliyor (insert/update politikasi
-- bilerek yok), dolayisiyla ikinci satiri atlayan bir yazma yolu yok.
--
-- Govde 20260819190203_bag_rpcleri.sql'den kopyalandi; yalnizca kabul
-- kolundaki ayna insert'i ve `not found` kontrolunun yeri degisti.

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

-- Bagi koparmak iki yonu de siler.
create or replace function public.takibi_birak(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.takipler
    where (takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id)
       or (takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid());
end;
$$;

revoke execute on function public.takibi_birak(uuid) from public, anon;
grant execute on function public.takibi_birak(uuid) to authenticated;

-- takipciyi_cikar artik takibi_birak ile ayni ise iniyor; dusuruluyor.
drop function if exists public.takipciyi_cikar(uuid);

-- Geri doldurma: mevcut kabul edilmis TEK YONLU satirlar icin ayna
-- satiri ekleniyor. Bekleyen istekler dokunulmadan kaliyor - onlar
-- henuz bag degil.
insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
select t.takip_edilen_id, t.takip_eden_id, 'kabul'
from public.takipler t
where t.durum = 'kabul'
on conflict (takip_eden_id, takip_edilen_id) do nothing;
