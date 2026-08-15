create or replace function public.check_inden_ayril(p_check_in_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.check_inler
  set konum = null
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and konum is not null;
end;
$$;

revoke execute on function public.check_inden_ayril from public, anon;
grant execute on function public.check_inden_ayril to authenticated;
