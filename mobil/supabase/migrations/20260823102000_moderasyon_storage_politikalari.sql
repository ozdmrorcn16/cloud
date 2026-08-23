-- Moderator, sikayet edilen gorseli gorebilmeli. Mevcut politikalar
-- degistirilmez; bunlar EK politikalardir (Postgres politikalari OR'lanir).
-- Service-role'e gerek birakmayan tek yol budur (spec karar 55).
--
-- Mevcut politika adlari canlida dogrulandi, cakisma yok:
--   baskasinin profil fotografini okuyabilir, check-in fotografini
--   gorunurluk kuraliyla okuyabilir, kendi check-in fotografini
--   yukleyebilir, kendi fotografini okuyabilir/silebilir/yukleyebilir.
create policy "moderator ani fotograflarini okur"
  on storage.objects for select to authenticated
  using (bucket_id = 'checkin-fotograflari' and moderasyon.yetkili_mi());

create policy "moderator profil fotograflarini okur"
  on storage.objects for select to authenticated
  using (bucket_id = 'profil-fotograflari' and moderasyon.yetkili_mi());
