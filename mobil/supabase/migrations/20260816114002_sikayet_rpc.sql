create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur not in ('kullanici', 'check_in') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
