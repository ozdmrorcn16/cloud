-- Kullanici kendi klasorundeki dosyayi silebilsin. Check-in bucket'inda
-- olmayan bu politika olmadan, profil fotografini degistiren kullanicinin
-- eski dosyasi ve gorunurluk testinin yukledigi dosyalar bucket'ta
-- kalici olarak birikiyordu.
create policy "kendi fotografini silebilir"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
