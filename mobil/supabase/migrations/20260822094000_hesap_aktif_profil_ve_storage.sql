-- Profil guncelleme ve fotograf yukleme, askidaki kullaniciya kapatiliyor.
-- Bu iki yol RPC degil POLITIKA ile korunuyor, cunku istemci
-- profiller'i dogrudan (sutun bazli grant ile) guncelliyor ve fotografi
-- dogrudan Storage'a yukluyor.
--
-- Onemli: yalnizca UPDATE kapatiliyor, INSERT DEGIL. Kayit sirasinda
-- henuz profil satiri yok ve hesap_durumlari satiri da yok, yani insert
-- zaten aktif bir hesapla yapiliyor; oraya kontrol koymak yeni kullanici
-- akisini gereksizce riske atardi.

-- Politika adi ve mevcut kosul 20260813115636_profiller.sql'de dogrulandi
-- (pg_policies): "kendi profilini guncelleyebilir", UPDATE, roles {public},
-- yani su ana kadar "to authenticated" yoktu. Asagida bilincli olarak
-- ekleniyor (sikilastirma) ve aktiflik kontrolu ekleniyor.
drop policy "kendi profilini guncelleyebilir" on public.profiller;

create policy "kendi profilini guncelleyebilir"
  on public.profiller for update
  to authenticated
  using (auth.uid() = id and moderasyon.hesap_aktif_mi(auth.uid()));

-- Yukleme politikasi 20260813091930_profil_fotograflari_bucket.sql'de
-- kurulmus, 20260819160359 ile authenticated'a daraltilmisti. pg_policies
-- ile dogrulandi: "kendi fotografini yukleyebilir", INSERT, roles
-- {authenticated}. Ayni kosullara aktiflik ekleniyor; politikanin adi ve
-- bucket kosulu degismiyor.
drop policy "kendi fotografini yukleyebilir" on storage.objects;

create policy "kendi fotografini yukleyebilir"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
    and moderasyon.hesap_aktif_mi(auth.uid())
  );
