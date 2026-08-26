-- ESKI PROFIL FOTOGRAFI SAHIBINE DE KAPALI
--
-- Kullanicinin kurali (2026-08-26): "Profil resmi kismina tek bir
-- fotograf yukleniyor, eskisi siliniyor, eskisi hicbir yerde kayitli
-- kalmiyor, kullanici kendi dahil eskisini kimse gormuyor, yeni profil
-- resmi olmasi gereken yerinde gorunuyor. O kadar."
--
-- Bir onceki migrasyon (20260826210000) eski fotografi BASKALARINA
-- kapatmisti; sahibi kendi eski dosyalarini hala gorebiliyordu. Bu
-- migrasyon o kapiyi da kapatiyor: kovadaki bir dosya, ancak sahibinin
-- GUNCEL profil fotografiysa okunabilir.
--
-- BUNU YAPMAK NEDEN GUVENLI: `profil-fotograflari` kovasi YALNIZCA
-- profil fotografi tutuyor. Check-in fotograflari ayri bir kovada
-- (`check-in-fotograflari`), dolayisiyla bu daraltma baska hicbir
-- okuma yolunu etkilemiyor.
--
-- INSERT ve DELETE politikalari DEGISMIYOR: kullanici yeni fotograf
-- yukleyebilmeli ve eskisini silebilmeli. Kapatilan tek sey OKUMA.
--
-- Moderator okuma politikasi da DEGISMIYOR. Kullanicinin ayrica
-- verdigi bir karar var: isletmeci yetkisi gizlilik gerekcesiyle
-- daraltilmaz, koruma denetim iziyle saglanir. Zaten dosya gercekten
-- silindiginde moderator de bir sey gormez; bu politika yalnizca
-- silinememis bir artik icin anlamli.

drop policy "kendi fotografini okuyabilir" on storage.objects;

create policy "kendi fotografini okuyabilir"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = (auth.uid())::text
    -- Guncel olmayan dosya sahibine de kapali.
    and gizli.profil_fotografi_guncel_mi(name)
  );
