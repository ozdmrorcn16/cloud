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
end;
$$;

create or replace function public.engeli_kaldir(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.engellemeler
  where engelleyen_id = auth.uid() and engellenen_id = p_kullanici_id;
end;
$$;

revoke execute on function public.engelle from public, anon;
grant execute on function public.engelle to authenticated;
revoke execute on function public.engeli_kaldir from public, anon;
grant execute on function public.engeli_kaldir to authenticated;
