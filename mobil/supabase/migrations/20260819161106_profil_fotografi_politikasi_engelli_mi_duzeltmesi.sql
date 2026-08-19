-- Task 17'de eklenen "baskasinin profil fotografini okuyabilir" politikasi
-- engellemeler tablosuna DOGRUDAN alt sorguyla bakiyordu. Faz 2b'de
-- check_inler icin ayni hata yapilip duzeltilmisti (bkz.
-- 20260816140000_gizli_engelli_mi_fonksiyonu.sql): engellemeler'in kendi
-- RLS'i yalnizca "engelleyen_id = auth.uid()" satirlarini gosteriyor, yani
-- "ben engellendim mi" yonunu (engellenen_id = auth.uid()) sorgulayan taraf
-- o satiri hic goremiyor ve "not exists" hep true donuyordu -- engelleme
-- storage'ta hicbir zaman calismiyordu. gorunurluk-testleri/calistir.ts
-- senaryo 18'de canliya karsi yakalandi.
--
-- Cozum ayni: security definer yardimci fonksiyon gizli.engelli_mi
-- kullanmak, RLS'i by-pass edip iki yonlu engellemeyi dogru okumak icin.
drop policy "baskasinin profil fotografini okuyabilir" on storage.objects;

create policy "baskasinin profil fotografini okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and not gizli.engelli_mi((storage.foldername(name))[1]::uuid)
  );
