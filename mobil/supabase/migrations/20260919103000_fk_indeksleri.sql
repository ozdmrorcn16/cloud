-- PERFORMANS DANISMANI (2026-09-19 taramasi): kapsayan indeksi olmayan
-- yabanci anahtarlar ve bir cift indeks.
--
-- Neden simdi: bu sutunlar iki yerde taranir - (a) hesap silinirken
-- CASCADE / SET NULL kontrolleri (her referans tablosunda kullaniciyi
-- arar), (b) sikayet gunluk tavani (`sikayet_eden_id` + son 24 saat).
-- Bugun tablolar kucuk; buyudukce her hesap silme ve her sikayet
-- sirali tarama olurdu. Indeksler ucuz, yazma maliyeti ihmal edilir.
--
-- Moderator sutunlari (hesap_durumlari.moderator_id vb.) BILEREK
-- disarida: tek moderator var, o tablolar kucuk kalir.
--
-- `check_inler_mekan_idx` ile `check_inler_mekan_id_idx` birebir ayni
-- (mekan_id); ikisi de her yazmada guncelleniyordu. Ilki dusuruldu.

create index if not exists begeniler_kullanici_idx
  on public.begeniler (kullanici_id);

create index if not exists mesajlar_gonderen_idx
  on public.mesajlar (gonderen_id);

create index if not exists yorumlar_kullanici_idx
  on public.yorumlar (kullanici_id);

create index if not exists mekan_puanlari_kullanici_idx
  on public.mekan_puanlari (kullanici_id);

create index if not exists sikayetler_eden_zaman_idx
  on public.sikayetler (sikayet_eden_id, olusturuldu desc);

drop index if exists public.check_inler_mekan_idx;
