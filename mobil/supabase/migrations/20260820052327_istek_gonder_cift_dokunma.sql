-- takip_istegi_gonder ve sohbet_istegi_gonder (20260819195646_istek_gunlugu.sql)
-- bir exists on-kontrolu yapip sonra insert ediyor; bu atomik degil.
-- Gercek bir cift-dokunma yarisinda ikinci cagri exists kontrolunu
-- gecebilir ve insert'te ham bir Postgres hatasiyla ("duplicate key
-- value violates ...") karsilasip bunu oldugu gibi kullaniciya
-- sizdirabilir. kullanici_adi_degistir'in 23505'i cevirmesiyle ayni
-- gerekce (20260819124813_kullanici_adi_degistir.sql).
--
-- Govdenin geri kalani 20260819195646_istek_gunlugu.sql'den birebir
-- kopyalandi; yalnizca insert'i saran exception bloklari eklendi.
create or replace function public.takip_istegi_gonder(p_kullanici_id uuid) returns void
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

  begin
    insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
    values (auth.uid(), p_kullanici_id, 'beklemede');
  exception
    when unique_violation then
      raise exception 'Istegin zaten gonderilmis';
  end;

  insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
end;
$$;

create or replace function public.sohbet_istegi_gonder(p_kullanici_id uuid) returns void
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

  begin
    insert into public.sohbet_istekleri (gonderen_id, alan_id, durum)
    values (auth.uid(), p_kullanici_id, 'beklemede');
  exception
    when unique_violation then
      raise exception 'Istegin zaten gonderilmis';
  end;

  insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
end;
$$;

revoke execute on function public.takip_istegi_gonder(uuid) from public, anon;
grant execute on function public.takip_istegi_gonder(uuid) to authenticated;
revoke execute on function public.sohbet_istegi_gonder(uuid) from public, anon;
grant execute on function public.sohbet_istegi_gonder(uuid) to authenticated;
