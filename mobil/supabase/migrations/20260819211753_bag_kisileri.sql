-- takipler ve profiller arasinda FK yok; ayrica profiller'in RLS'i
-- yalnizca kendi satirini gosteriyor. Faz 2a'da tam bu ikisi yuzunden
-- mekan detay ekrani canli veritabaninda hic calismamisti (karar #18).
-- Bu yuzden liste ekrani join denemiyor, security definer bir RPC
-- kullaniyor.
create or replace function public.bag_kisileri(p_kimlikler uuid[])
returns table (id uuid, kullanici_adi text, ad text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad
    from public.profiller p
    where p.id = any(p_kimlikler)
      and not gizli.engelli_mi(p.id);
end;
$$;

revoke execute on function public.bag_kisileri from public, anon;
grant execute on function public.bag_kisileri to authenticated;
