-- Ortak on kontroller iki istek turu icin de ayni. Tekrari onlemek
-- icin tek bir yardimciya toplaniyor; bag semasinda duruyor ki
-- istemciye RPC olarak acilmasin.
create or replace function bag.istek_on_kontrol(p_hedef uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gunluk int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef = auth.uid() then
    raise exception 'Kendine istek gonderemezsin';
  end if;

  -- Engelli iliskide sessiz davraniyoruz: "engellendin" demiyoruz,
  -- kullanici yokmus gibi cevap veriyoruz (Faz 2b sessizlik ilkesi).
  if gizli.engelli_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  select
    (select count(*) from public.takipler
      where takip_eden_id = auth.uid() and olusturuldu > now() - interval '1 day')
    +
    (select count(*) from public.sohbet_istekleri
      where gonderen_id = auth.uid() and olusturuldu > now() - interval '1 day')
  into v_gunluk;

  -- Kisi basi sinir yok (karar #37); bu tavan tek hesabin yuzlerce
  -- kisiye istek atarak dizini taramasini engelliyor.
  if v_gunluk >= 50 then
    raise exception 'Bugunluk istek sinirina ulastin';
  end if;
end;
$$;

grant execute on function bag.istek_on_kontrol(uuid) to authenticated;

create or replace function public.takip_istegi_gonder(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  perform bag.istek_on_kontrol(p_kullanici_id);

  if exists (
    select 1 from public.takipler
    where takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id
  ) then
    raise exception 'Istegin zaten gonderilmis';
  end if;

  insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
  values (auth.uid(), p_kullanici_id, 'beklemede');
end;
$$;

revoke execute on function public.takip_istegi_gonder from public, anon;
grant execute on function public.takip_istegi_gonder to authenticated;

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
  else
    -- Red satiri silinir (karar #37).
    delete from public.takipler
      where takip_eden_id = p_kullanici_id
        and takip_edilen_id = auth.uid()
        and durum = 'beklemede';
  end if;

  if not found then
    raise exception 'Yanitlanacak istek bulunamadi';
  end if;
end;
$$;

revoke execute on function public.takip_istegini_yanitla from public, anon;
grant execute on function public.takip_istegini_yanitla to authenticated;

create or replace function public.takibi_birak(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.takipler
    where takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id;
end;
$$;

revoke execute on function public.takibi_birak from public, anon;
grant execute on function public.takibi_birak to authenticated;

create or replace function public.takipciyi_cikar(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.takipler
    where takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid();
end;
$$;

revoke execute on function public.takipciyi_cikar from public, anon;
grant execute on function public.takipciyi_cikar to authenticated;

create or replace function public.sohbet_istegi_gonder(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  perform bag.istek_on_kontrol(p_kullanici_id);

  if exists (
    select 1 from public.sohbet_istekleri
    where gonderen_id = auth.uid() and alan_id = p_kullanici_id
  ) then
    raise exception 'Istegin zaten gonderilmis';
  end if;

  insert into public.sohbet_istekleri (gonderen_id, alan_id, durum)
  values (auth.uid(), p_kullanici_id, 'beklemede');
end;
$$;

revoke execute on function public.sohbet_istegi_gonder from public, anon;
grant execute on function public.sohbet_istegi_gonder to authenticated;

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
