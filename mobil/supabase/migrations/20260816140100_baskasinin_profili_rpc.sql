create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (id uuid, ad text, biyografi text, fotograflar text[])
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Engelleme her iki yonde de profili gizler; "bulunamadi" gibi davranir.
  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  return query
    select p.id, p.ad, p.biyografi, p.fotograflar
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
