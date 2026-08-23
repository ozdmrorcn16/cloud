-- Olcek indeksi. check_inler hem CANLI check-in'leri hem GECMIS anilari
-- tutuyor; ikisi ayni tabloda cunku bir check-in yerinde aniya donusuyor
-- (konum null'a cekiliyor).
--
-- Sorun: yakin_mekanlar_yogunluk ve gizli.ayni_mekanda_canli_mi "bu
-- mekanda su an kim var" diye soruyor. Mevcut check_inler_mekan_idx
-- yalnizca mekan_id uzerinde, yani o mekanin BUTUN gecmisini okuyup
-- sonra filtreliyor. Bir mekanda yillar icinde yuz binlerce ani
-- birikince bu tarama buyur, oysa cevap her zaman kucuk bir sayidir.
--
-- KISMI indeks bu asimetriyi kapatiyor: yalnizca canli satirlari
-- kapsadigi icin boyutu "ayni anda canli olan kisi sayisi" mertebesinde
-- kalir, tablonun toplam boyutundan bagimsiz.
--
-- OLCULDU (1.000.000 satirlik kopya uzerinde, gercek tabloya
-- dokunulmadan):
--   eski indeks (mekan_id)        -> 53 buffer, 50 satir okunup filtrelendi
--   kismi indeks (bu migrasyon)   ->  2 buffer, Index Only Scan,
--                                     Heap Fetches: 0 (tabloya hic gidilmedi)
-- Onemli olan buffer farki degil, buyume egrisi: eski indekste okunan
-- satir sayisi mekanin gecmisiyle ORANTILI buyuyor, yenide sabit kaliyor.
create index check_inler_canli_idx
  on public.check_inler (mekan_id, bitis_zamani)
  where konum is not null and not moderasyon_gizli;

-- Ayni sekilde "bu kullanicinin aktif check-in'i var mi" sorusu icin:
-- check_in_yap her cagrisinda bunu soruyor (tek aktif check-in kurali).
create index check_inler_kullanici_canli_idx
  on public.check_inler (kullanici_id, bitis_zamani)
  where konum is not null;
