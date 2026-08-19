-- Engelleme artik takip bagini da kaldiriyor. Bu olmadan engellenen
-- kisi, takipci oldugu icin konum akisini gormeye devam ederdi ve
-- Faz 2b'nin sessiz engelleme ilkesi delinmis olurdu.
--
-- Govde 20260816150000_engelleme_rpc.sql'den birebir kopyalandi
-- (auth guard ve kendini engelleme kontrolu dahil); yalnizca iki
-- delete eklendi.
create or replace function public.engelle(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kullanici_id = auth.uid() then
    raise exception 'Kendini engelleyemezsin';
  end if;

  insert into public.engellemeler (engelleyen_id, engellenen_id)
  values (auth.uid(), p_kullanici_id)
  on conflict do nothing;

  -- Iki yonde de: hem benim ona, hem onun bana olan bagi.
  delete from public.takipler
    where (takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id)
       or (takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid());

  delete from public.sohbet_istekleri
    where (gonderen_id = auth.uid() and alan_id = p_kullanici_id)
       or (gonderen_id = p_kullanici_id and alan_id = auth.uid());
end;
$$;

revoke execute on function public.engelle from public, anon;
grant execute on function public.engelle to authenticated;
