-- RLS satir duzeyindedir, sutun duzeyinde degil. Ayni gerekce
-- 20260819123253_profiller_sutun_yetkileri.sql'de yazildi: istemcinin
-- cagirmayi secebilecegi bir kural, kural degildir.
--
-- check_inler icin bu daha da kritik: canli okuma politikasinin
-- USING ifadesi su kola sahip (20260819185621_check_inler_bag_gorunurlugu.sql):
--   bulunurluk = 'herkese_acik' and (gizli.ayni_mekanda_canli_mi(mekan_id) or ...)
-- ve gizli.ayni_mekanda_canli_mi yalnizca "cagiranin o mekan_id ile canli
-- bir satiri var mi" diye soruyor. authenticated rolunun check_inler
-- uzerinde sutun bazinda update yetkisi olsaydi, bir kullanici gercek bir
-- check-in yaptiktan sonra kendi satirinin mekan_id'sini baska bir mekana
-- cevirip bitis_zamani'ni ileri atarak o mekandaki butun herkese_acik
-- canli check-in'leri oraya hic gitmeden okuyabilirdi (konum sutunu dahil
-- - yani hedefin GERCEK GPS noktasi sizar) ve kullanici_adi'ni taklit
-- edebilirdi. Bu, projenin kendi belgelerinde yazan cekirdek risk.
--
-- Cozum: hicbir sutun bazinda update grant'i yok. authenticated rolu bu
-- tabloyu dogrudan guncelleyemez; tek yazma yolu check_in_yap,
-- check_inden_ayril ve asagidaki ani_gorunurlugunu_ayarla RPC'leridir.
--
-- DIKKAT: delete yetkisine DOKUNULMADI. lib/checkin.ts:119 (aniyiSil)
-- aniyi silmek icin dogrudan .delete() kullaniyor ve bu calismaya devam
-- etmeli.
revoke update on public.check_inler from authenticated;

-- mobil/lib/ayarlar.ts'deki "Butun anilarimi kim gorsun" eylemi eskiden
-- kosulsuz bir .update({ gorunurluk: deger }) yapiyordu: kullanicinin
-- bilerek 'gizli' yaptigi bir check-in'ten donen 'kimse' anisi da dahil,
-- BUTUN satirlarini istenen degere ZORLUYORDU. Bu, fazin kendi yazili
-- degismezligini ("gorunurluk hicbir zaman genislemez") deliyordu.
-- Yukaridaki revoke zaten bu dogrudan update'i imkansiz hale getirdi;
-- asagidaki RPC tek yazma yolu ve daraltmayi sunucuda ZORUNLU kiliyor.
--
-- Guncelleme her satiri KENDI bulunurluk degerine gore kelepceliyor:
-- bag.ani_gorunurlugu (20260819194021_ani_gorunurlugu_yardimcisi.sql)
-- asla genisletmez, yalnizca daraltir ya da aynen birakir. Boylece
-- "Herkes gorsun" bir gizli check-in'ten gelen aniyi yine 'kimse'
-- birakir, 'takipcilerim' olani en fazla 'takipcilerim' yapar.
--
-- konum is null kosulu onemli: yalnizca ANILAR etkilenmeli, canli
-- check-in kayitlari degil.
create or replace function public.ani_gorunurlugunu_ayarla(p_deger text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_deger not in ('herkese_acik', 'takipcilerim', 'kimse') then
    raise exception 'Gecersiz gorunurluk degeri';
  end if;

  update public.check_inler
     set gorunurluk = bag.ani_gorunurlugu(bulunurluk, p_deger)
   where kullanici_id = auth.uid() and konum is null;
end;
$$;

revoke execute on function public.ani_gorunurlugunu_ayarla(text) from public, anon;
grant execute on function public.ani_gorunurlugunu_ayarla(text) to authenticated;
