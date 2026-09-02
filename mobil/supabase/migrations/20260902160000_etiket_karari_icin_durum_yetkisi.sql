-- ETIKET ONAYI HIC CALISMIYORDU: `durum` sutununda update yetkisi yoktu.
--
-- Bulunus: gorunurluk paketine etiket onayi senaryolari (63-64) yazilinca
-- ortaya cikti. Etiketlenen kisi onayla/reddet dedigi anda sunucu su
-- hatayi donduruyordu:
--
--   42501 permission denied for table check_in_etiketleri
--
-- KOK NEDEN iki migrasyonun arasinda kaldi. 20260826200000 tabloyu
-- kurarken "Guncelleme yok: etiket ya vardir ya yoktur" gerekcesiyle
-- `revoke update ... from authenticated` yazmisti. Uc gun sonra
-- 20260829090000 onay modelini getirdi ve "etiketlenen kisi karar verir"
-- UPDATE POLITIKASINI ekledi - ama tablo duzeyindeki yetkiyi geri
-- vermedi. Politika, yetki olmadan hic degerlendirilmiyor; yani politika
-- yazildigi gunden beri olu koddu.
--
-- SONUCU: her etiket sonsuza kadar 'bekliyor' kaliyordu. `etiketleriGetir`
-- yalnizca 'onaylandi' satirlari okudugu icin etiketler hicbir yerde
-- gorunmuyordu - ozellik gonderildigi gunden beri kapaliydi. Veri kaybi
-- yok: duzeltme aninda tabloda hic satir yoktu (canlida olculdu).
--
-- YETKI TABLO GENELINDE DEGIL, YALNIZCA `durum` SUTUNUNDA veriliyor.
-- Sebep politikadaki bir bosluk: "etiketlenen kisi karar verir"
-- politikasinin `with check` kolu `kullanici_id = auth.uid()` ve
-- `durum in ('onaylandi','reddedildi')` diyor ama `check_in_id`
-- HAKKINDA HICBIR SEY SOYLEMIYOR. Tablo geneli update yetkisi verilseydi,
-- etiketlenen kisi bekleyen satirinin `check_in_id` degerini bir
-- baskasinin check-in'ine tasiyabilirdi - yani kendini davet edilmedigi
-- bir konuma etiketleyebilirdi. Sutun yetkisi bu yolu kapatiyor; ayni
-- desen `profiller.kullanici_adi` icin de kullaniliyor.

grant update (durum) on public.check_in_etiketleri to authenticated;

comment on column public.check_in_etiketleri.durum is
  'bekliyor | onaylandi | reddedildi. Yalnizca etiketlenen kisi ve yalnizca bu sutun guncellenebilir.';
