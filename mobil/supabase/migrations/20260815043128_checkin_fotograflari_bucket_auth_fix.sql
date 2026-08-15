alter policy "kendi check-in fotografini yukleyebilir"
  on storage.objects to authenticated;

alter policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects to authenticated;
