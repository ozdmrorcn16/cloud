-- ---------------------------------------------------------------- --
-- akis_profilleri: akista KULLANICI ADI (rumuz) + fotograf (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Kullanicinin karari: check-in kartinda ad-soyad degil KULLANICI ADI
-- yazacak ("byorcun"); bildirimlerde ise ad-soyad. check_inler'e
-- denormalize edilen alan AD (karar #18), kullanici adi orada yok;
-- profiller'in RLS'i de baskasinin satirini okutmuyor. Bu yuzden
-- `profil_fotograflari` RPC'sinin genisletilmis hali: ayni kurallarla
-- (hesap aktif, engelleme iki yonlu keser) kimlik -> kullanici adi,
-- ad ve guncel fotograf yolu. Fotografsiz kisi de doner (eskisi
-- yalnizca fotografli olanlari donduruyordu).
--
-- `profil_fotograflari` DURUYOR: donus tipi degistigi icin yerinde
-- degistirilemedi; istemci artik bunu kullaniyor, eskisi bir sonraki
-- temizlikte dusurulebilir.

create or replace function public.akis_profilleri(p_kimlikler uuid[])
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kimlikler is null or array_length(p_kimlikler, 1) is null then
    return;
  end if;

  if array_length(p_kimlikler, 1) > 200 then
    raise exception 'Cok fazla kimlik istendi';
  end if;

  return query
  select p.id, p.kullanici_adi, p.ad, p.fotograflar[1]
  from public.profiller p
  where p.id = any(p_kimlikler)
    and moderasyon.hesap_aktif_mi(p.id)
    and not exists (
      select 1 from public.engellemeler e
      where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
         or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
    );
end;
$function$;

revoke all on function public.akis_profilleri(uuid[]) from public;
grant execute on function public.akis_profilleri(uuid[]) to authenticated;

comment on function public.akis_profilleri(uuid[]) is
  'Akista ve listelerde: verilen kullanicilarin kullanici adi, adi ve guncel profil fotograf yolu. Engelleme iki yonlu keser, askidaki hesap donmez.';
