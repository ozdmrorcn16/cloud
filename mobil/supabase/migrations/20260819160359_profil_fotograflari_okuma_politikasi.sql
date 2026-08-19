-- Faz 2a dersi: rol belirtilmeyen politika `public` role'une yazilir,
-- yani kimliksiz istemci de kapsama girer. Mevcut iki politikayi
-- authenticated'a daraltiyoruz (check-in bucket'inda ayni duzeltme
-- 20260815043128 ile yapilmisti, profil bucket'inda atlanmis).
alter policy "kendi fotografini yukleyebilir"
  on storage.objects to authenticated;

alter policy "kendi fotografini okuyabilir"
  on storage.objects to authenticated;

-- Profil fotograflari tasarim geregi baskalarina aciktir (Faz 2b karar
-- #27: baskasinin profilinde ad, fotograflar ve biyografi gorunur).
-- Bucket private kaldigi icin erisim yalnizca imzali URL uzerinden olur;
-- bu politika o imzayi kimin alabilecegini belirler. Engelleme iki
-- yonde de erisimi keser -- baskasinin_profili ve kisi_ara ile ayni kural.
create policy "baskasinin profil fotografini okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and not exists (
      select 1 from public.engellemeler e
      where (
        e.engelleyen_id = auth.uid()
        and e.engellenen_id::text = (storage.foldername(name))[1]
      ) or (
        e.engellenen_id = auth.uid()
        and e.engelleyen_id::text = (storage.foldername(name))[1]
      )
    )
  );
