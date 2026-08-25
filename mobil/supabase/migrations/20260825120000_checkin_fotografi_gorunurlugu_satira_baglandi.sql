-- Check-in fotografinin gorunurlugu artik SATIRIN gorunurlugune bagli.
--
-- Sorun (2026-08-25, ana sayfa akisi yapilirken bulundu): fotograf
-- politikasi kendi kurallarini yaziyordu ve satir politikasindan farkli
-- davraniyordu. Iki yonu de yanlisti:
--
--   1. FAZLA DAR - takiplestigin biri BASKA bir mekanda su an canliysa
--      satirini goruyordun ama fotografini goremiyordun; politikadaki uc
--      koldan (sahibi / ani / ayni mekanda canli) hicbiri bu duruma
--      uymuyordu. Akista kart fotografsiz geliyordu.
--   2. FAZLA GENIS - "konum is null" kolu, aniya donusmus HER fotografi
--      dosya yolunu bilen her girisli kullaniciya aciyordu. Satirin ani
--      gorunurlugu 'kimse' olsa bile.
--
-- Cozum: kurali tekrar yazmak yerine satira devretmek. Alt sorgu
-- public.check_inler'i okuyor ve o tablonun RLS'i cagiran kullanici icin
-- uygulaniyor - yani "satiri gorebiliyorsan fotografini da gorursun,
-- goremiyorsan gormezsin". Engelleme, askiya alinmis hesap, moderasyon
-- gizlemesi ve uc kademeli bulunurluk/ani gorunurlugu boylece TEK
-- yerde tanimli kaliyor; iki kural birbirinden kayamaz.
--
-- Mekanizma canlida olculdu (rol taklidiyle, gercek satirlarla):
--   takip yokken  -> herkese_acik false, gizli false
--   takip varken  -> herkese_acik TRUE,  gizli false
drop policy "check-in fotografini gorunurluk kuraliyla okuyabilir" on storage.objects;

create policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'check-in-fotograflari'
    and exists (
      select 1 from public.check_inler c
      where c.fotograf = storage.objects.name
    )
  );

-- Politika her fotograf erisiminde bu sutundan tek satir ariyor.
-- Kismi indeks: fotografi olmayan check-in'ler indekse girmiyor.
create index if not exists check_inler_fotograf_idx
  on public.check_inler (fotograf)
  where fotograf is not null;

-- Ayni alanda bulunan ikinci kusur: moderatorun check-in fotografi
-- politikasi olmayan bir bucket adini ('checkin-fotograflari') suzuyordu;
-- gercek ad 'check-in-fotograflari'. Yani moderator sikayet edilen
-- check-in fotografini HIC acamiyordu. Yetki daraltilmiyor, yazim
-- yanlisi duzeltiliyor.
drop policy "moderator ani fotograflarini okur" on storage.objects;

create policy "moderator ani fotograflarini okur"
  on storage.objects for select to authenticated
  using (bucket_id = 'check-in-fotograflari' and moderasyon.yetkili_mi());
