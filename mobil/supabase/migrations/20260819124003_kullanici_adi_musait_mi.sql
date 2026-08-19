-- Istemci bu sorguyu kendisi yapamaz: profiller'in RLS politikasi
-- yalnizca kendi satirini gosterir, dolayisiyla "bu ad baskasinda var
-- mi" sorusu her zaman "yok" cevabini dondururdu.
create or replace function public.kullanici_adi_musait_mi(p_ad text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Bicime uymayan deger icin hata degil false doniyor; bicim mesajini
  -- ekran zaten kendisi gosteriyor, iki ayri hata yolu gerekmiyor.
  if p_ad is null or p_ad !~ '^[a-z0-9._]{3,20}$' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiller p where p.kullanici_adi = p_ad
  );
end;
$$;

revoke execute on function public.kullanici_adi_musait_mi from public, anon;
grant execute on function public.kullanici_adi_musait_mi to authenticated;
