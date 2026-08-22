-- Nihai butun-dal incelemesi (2026-08-22, D2): iki fonksiyonun
-- gerekcesi yalnizca UYGULANMIS eski migrasyon dosyalarinda
-- (20260819153532_kisi_ara_isim_eslesmesi.sql,
-- 20260820052324_bag_kisileri_tavan.sql) yaziliydi. Faz sirasinda her
-- ikisi baska migrasyonlarda `create or replace` ile yeniden
-- tanimlandi (en son govdeler
-- 20260822096000_hesap_aktif_arama_ve_profil.sql ve
-- 20260822097000_hesap_aktif_liste_ve_yogunluk.sql icinde), ama
-- gerekce metni tasinmadi - dosya sirasina bagli kalinca okuyan kisi
-- eski dosyayi bulmak zorunda kaliyor. `comment on function`
-- gerekceyi fonksiyonun kendisine yapistirir; `\df+` ve
-- `pg_description`'da her zaman gorunur, hangi migrasyonun onu son
-- degistirdigine bakilmaksizin.
comment on function public.kisi_ara(text) is
  'Arama metnini lower() ile kucultup hem kullanici_adi hem ad '
  'sutununda kullanmak yanlisti: lower() bazi ortamlarda (ozellikle '
  'Turkce harflerde) birlestirici noktali bir karakter uretebiliyor '
  've bu ilike eslesmesini bozabiliyor. Bu yuzden '
  'kullanici_adi icin KUCUK HARFLI desen (sutun zaten hep kucuk harf '
  'saklaniyor, like ile), ad icin ise HAM (yalnizca kirpilmis, kucuk '
  'harfe cevrilmemis) desen kullanilir (ilike zaten buyuk/kucuk harf '
  'duyarsiz oldugu icin lower() gereksiz). Bu ayrim bilinclidir, '
  'birlestirme hatasi degildir.';

comment on function public.bag_kisileri(uuid[]) is
  'p_kimlikler dizisine 200 kimlik tavani konuldu: fonksiyon '
  'security definer oldugu icin RLS atlar ve profiller tablosunu '
  'dogrudan sorgular; tavan olmadan tek cagriyla sinirsiz uzunlukta '
  'bir kimlik dizisi verilip toplu bir profil taramasi yapilabilirdi. '
  '200, istemcideki en buyuk gercek kullanim (bag listesi) icin '
  'rahatca yeterli, kotuye kullanimi sinirlayacak kadar dar.';
