-- bag_kisileri (20260819211753_bag_kisileri.sql) sinirsiz uzunlukta bir
-- uuid[] kabul ediyordu. Tek cagriyla toplu bir kimlik dizini taramasi
-- yapilmasin diye bir tavan koyuyoruz; govdenin geri kalani kaynaktan
-- birebir.
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

  if array_length(p_kimlikler, 1) > 200 then
    raise exception 'Cok fazla kimlik';
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
