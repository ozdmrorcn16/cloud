-- DENETIM IZI 'yorum' TURUNU KABUL ETMIYORDU.
--
-- Canli dogrulamada bulundu (araclar/moderasyon-yorum-canli-test.py):
-- `moderasyon_yorumu_gizle` ve `moderasyon_yorum_gizlemeyi_kaldir`
-- fonksiyonlari denetim izine hedef_tur = 'yorum' yaziyor, ama
-- `moderasyon_kayitlari` uzerindeki kontrol kisiti yalnizca
-- kullanici / check_in / sikayet / konusma kabul ediyordu. Yani iki RPC
-- de HER CAGRIDA patliyordu: moderator bir yorumu gizleyemiyor,
-- gizlemeyi de kaldiramiyordu.
--
-- Iz ekleme-only oldugu icin kisit ihlali islemin TAMAMINI geri
-- aliyordu - yani gizleme yarim kalmiyor, hic olmuyordu. Belirti
-- moderatore yalnizca "islem basarisiz" olarak gorunurdu.
--
-- Ders: yeni bir moderasyon eylemi eklerken denetim izinin hedef_tur
-- kisiti da genisletilmeli; iz yazilamazsa eylemin kendisi olmuyor.
alter table public.moderasyon_kayitlari
  drop constraint if exists moderasyon_kayitlari_hedef_tur_check;

alter table public.moderasyon_kayitlari
  add constraint moderasyon_kayitlari_hedef_tur_check
  check (hedef_tur in ('kullanici', 'check_in', 'sikayet', 'konusma', 'yorum'));
