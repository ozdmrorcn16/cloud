-- "ANILARIM KIMLERE GORUNSUN" AYARI KALDIRILDI (kullanicinin karari
-- 2026-09-20, secenek B).
--
-- Olay: kullanicinin 29 anisinin hepsi `gorunurluk = 'kimse'` idi ve
-- arkadasi hicbirini goremiyordu. Tek yazan yer bu RPC'ydi (tum
-- anilari toplu yazar); ekrani (`profil/ani-gorunurlugu`) 2026-09-19
-- ayarlar yeniden yaziminda menuden dusmus, RPC durmus - geri alma
-- yolu kalmamisti. Iki ayri gizlilik anahtari ("Profilim gizli" ve bu)
-- birbirini eziyordu; tek anahtar kaliyor: `profiller.profil_gizli`.
--
-- `bag.ani_gorunurlugu` DURUYOR: cron ve check_in_yap canli -> ani
-- donusumunde hala kullaniyor. 'kimse' degeri artik yalnizca gizli
-- check-in'den donusumle olusur.

drop function if exists public.ani_gorunurlugunu_ayarla(text);
