-- Kullanicinin engelledigi kisileri ADIYLA listeler.
--
-- Neden ayri bir RPC gerekti: `engellemeler` tablosundan yalnizca
-- kimlikler okunabiliyor, isimler `profiller`de ve o tablonun RLS'i
-- kisiye yalnizca kendi satirini gosteriyor. Kimlikleri ada ceviren
-- mevcut yardimci `bag_kisileri` ise tam da engellenmis kisileri
-- ELIYOR (`not gizli.engelli_mi`). Yani engelledigin kisiyi ekranda
-- gostermenin yolu yoktu; liste bos kalirdi.
--
-- KVKK notu: burada acilan veri kullanicinin KENDI engelleme kaydidir
-- ve yalnizca engeli kaldirabilmesi icin gereken en az alan doner
-- (kullanici adi, ad, engelleme tarihi). Engellenen kisinin icerigi,
-- konumu ya da baska bir verisi acilmiyor. Erisim tek yonlu: yalnizca
-- ENGELLEYEN kendi listesini gorur; kimse kendisini kimin engelledigini
-- goremez.
--
-- Askiya alinmis ya da yasaklanmis hesaplar da listede kalir: aksi
-- halde kullanici o kisinin engelini kaldiramaz ve liste eksik gorunur.
create or replace function public.engellediklerim()
returns table (id uuid, kullanici_adi text, ad text, engellendi timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad, e.olusturuldu
    from public.engellemeler e
    join public.profiller p on p.id = e.engellenen_id
    where e.engelleyen_id = auth.uid()
    order by e.olusturuldu desc;
end;
$$;

revoke execute on function public.engellediklerim from public, anon;
grant execute on function public.engellediklerim to authenticated;
