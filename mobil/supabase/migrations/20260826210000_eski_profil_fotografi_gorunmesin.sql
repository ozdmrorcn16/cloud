-- ESKI PROFIL FOTOGRAFLARI BASKALARINA GORUNMESIN
--
-- Bulgu (2026-08-26): profil fotografi degistirildiginde eski dosya
-- Storage'da kaliyor ve okuma politikasi dosyanin HALA KULLANIMDA olup
-- olmadigina bakmiyordu:
--
--   bucket = 'profil-fotograflari' AND NOT engelli_mi(klasor_sahibi)
--
-- Yani giris yapmis ve engellenmemis herhangi biri, bir kullanicinin
-- klasorunu LISTELEYIP bugune kadar yukledigi butun fotograflari -
-- degistirdikleri dahil - cekebiliyordu. Kullanici acisindan
-- "fotografimi degistirdim" demek eskisinin erisilemez olmasi
-- demektir; oyle degildi.
--
-- Cozum iki katmanli. Bu migrasyon ASIL KORUMAYI koyuyor: politika
-- artik yalnizca GUNCEL fotografi aciyor. Istemcideki "degistirirken
-- eskisini sil" adimi ikinci katman - silme basarisiz olsa bile
-- sizinti olmuyor.
--
-- Kendi fotograflarini okuma politikasi DEGISMEDI: kisi kendi eski
-- dosyalarini gorebilir, sorun baskalarina acik olmasiydi.

create or replace function gizli.profil_fotografi_guncel_mi(p_yol text)
returns boolean
language plpgsql
security definer
stable
set search_path = public, storage
as $$
declare
  v_sahip uuid;
begin
  -- Yol her zaman "<kullanici_id>/<zaman>.jpg" bicimde degil olabilir;
  -- bozuk bir ad geldiginde politika ACILMAMALI.
  begin
    v_sahip := ((storage.foldername(p_yol))[1])::uuid;
  exception when others then
    return false;
  end;

  return exists (
    select 1
    from public.profiller p
    where p.id = v_sahip
      and p_yol = any(p.fotograflar)
  );
end;
$$;

revoke execute on function gizli.profil_fotografi_guncel_mi(text) from public, anon;
grant execute on function gizli.profil_fotografi_guncel_mi(text) to authenticated;

drop policy "baskasinin profil fotografini okuyabilir" on storage.objects;

create policy "baskasinin profil fotografini okuyabilir"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    -- Once guncellik: bozuk ya da oksuz bir adda buradan false donuyor
    -- ve asagidaki uuid cast'ine hic gelinmiyor.
    and gizli.profil_fotografi_guncel_mi(name)
    and not gizli.engelli_mi(((storage.foldername(name))[1])::uuid)
  );
