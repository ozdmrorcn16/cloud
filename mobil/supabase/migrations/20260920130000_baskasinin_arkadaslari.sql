-- BASKASININ ARKADAS LISTESI (kullanicinin istegi 2026-09-20: baskasinin
-- profilindeki "Ani / Fotograf / Arkadas" sayaclarina basilabilsin;
-- 2026-09-13'te sayaclar salt sayiydi).
--
-- `takipler` RLS'i yalnizca kendi satirlarini veriyor; baskasinin
-- arkadaslarini listelemek icin sunucuda kapi yoktu. Kapi PAYLASIMLARLA
-- AYNI KURAL (20260902120000 check-in politikasi): hedef aktif,
-- aramizda engel yok, profili gizliyse arkadas olmaliyim. Listedeki
-- kisiler de tek tek eleniyor: pasif hesap ya da beni engelleyen /
-- engelledigim kisi gorunmez (`bag_kisileri` ile ayni suzgec).
--
-- KVKK: arkadaslik iliskisi kisisel veridir; gizlilik metni "arkadaslik
-- bilgin" maddesini zaten sayiyor. Gorunurluk paylasimlarla ayni
-- cizgide oldugu icin yeni bir kapsam acilmiyor - gizli profilin
-- arkadaslarini yalnizca arkadaslari gorur.

create or replace function public.baskasinin_arkadaslari(p_kullanici_id uuid)
returns table (id uuid, kullanici_adi text, ad text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid())
     or not moderasyon.hesap_aktif_mi(p_kullanici_id)
     or gizli.engelli_mi(p_kullanici_id) then
    return;
  end if;

  if p_kullanici_id <> auth.uid()
     and gizli.profil_gizli_mi(p_kullanici_id)
     and not bag.takip_ediyor_mu(auth.uid(), p_kullanici_id) then
    return;
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad
    from public.takipler t
    join public.profiller p on p.id = t.takip_edilen_id
    where t.takip_eden_id = p_kullanici_id
      and t.durum = 'kabul'
      and moderasyon.hesap_aktif_mi(p.id)
      and not gizli.engelli_mi(p.id)
    order by p.ad, p.kullanici_adi
    limit 200;
end;
$$;

revoke execute on function public.baskasinin_arkadaslari(uuid) from public, anon;
grant execute on function public.baskasinin_arkadaslari(uuid) to authenticated, service_role;
