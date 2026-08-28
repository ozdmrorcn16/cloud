-- AKISTA PROFIL FOTOGRAFI: verilen kullanicilarin GUNCEL profil
-- fotograf yollarini doner.
--
-- Kullanicinin karari (2026-08-28): "bir kullanici engellenmedigi
-- surece bir kullanici tarafindan herkes herkesin profil resmini
-- gorebilir profil resmi varsa yoksa harf ikonu gorur engelliyse onu
-- engelleyen kullaniciyi zaten hic goremez."
--
-- NEDEN AYRI BIR RPC: `profiller` tablosunun select politikasi
-- "yalnizca kendi profilini okuyabilirsin". Yani akista gorunen
-- baskalarinin fotograf yolu dogrudan okunamiyor. Bu fonksiyon
-- `security definer` ve YALNIZCA iki alan doner: kimlik ve fotograf
-- yolu. Ad, biyografi, dogum tarihi, kullanici adi - hicbiri sizmaz.
--
-- ENGELLEME IKI YONLU kesiyor: engelleyen de engellenen de birbirinin
-- fotografini alamiyor. Zaten engellenen kisinin check-in'i akisa hic
-- duesmuyor; bu ikinci kapi, birincisi bir gun gevserse diye.
--
-- Askiya alinmis / dondurulmus / yasakli hesaplar da eleniyor;
-- projedeki diger okuma yollari ayni kontrolu yapiyor.
--
-- Depolama tarafi zaten hazir: "baskasinin profil fotografini
-- okuyabilir" politikasi var ve yalnizca kisinin GUNCEL fotografi
-- okunabiliyor (migrasyon 20260826210000/220000), eskisi sahibine
-- bile kapali.
create or replace function public.profil_fotograflari(p_kimlikler uuid[])
returns table (id uuid, fotograf text)
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

  -- Tek cagride en fazla 200 kisi; akis 50 kayitla sinirli, bu tavan
  -- yalnizca kotuye kullanimi kesiyor.
  if array_length(p_kimlikler, 1) > 200 then
    raise exception 'Cok fazla kimlik istendi';
  end if;

  return query
  select p.id, p.fotograflar[1]
  from public.profiller p
  where p.id = any(p_kimlikler)
    and p.fotograflar is not null
    and array_length(p.fotograflar, 1) > 0
    and moderasyon.hesap_aktif_mi(p.id)
    and not exists (
      select 1 from public.engellemeler e
      where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
         or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
    );
end;
$function$;

revoke all on function public.profil_fotograflari(uuid[]) from public;
grant execute on function public.profil_fotograflari(uuid[]) to authenticated;

comment on function public.profil_fotograflari(uuid[]) is
  'Akista ve listelerde avatar gostermek icin: verilen kullanicilarin guncel profil fotograf yolu. Yalnizca kimlik ve yol doner; engelleme iki yonlu keser.';
