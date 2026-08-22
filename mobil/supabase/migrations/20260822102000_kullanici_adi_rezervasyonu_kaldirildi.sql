-- Kullanici adi rezervasyonu ozelligi kullanicinin karariyla TAMAMEN
-- KALDIRILDI (20260822101000_kullanici_adi_rezervasyonu.sql'de
-- eklenmisti). Bilinen sonucu: silinen bir kullanici adi ARTIK ANINDA
-- serbest kaliyor, yani bir baskasi o adi hemen alip silinen kisinin
-- yerine gecebilir - taklit korumasi yok. Bu bilincli bir tercih,
-- kusur DEGIL; ileride okuyan biri "burada bir koruma eksik" diye geri
-- eklemesin diye burada aciklaniyor.
--
-- Sira onemli: once fonksiyonu rezervasyon tablosuna bakmayan haline
-- dondur, sonra rezervasyonu yazan fonksiyonu ve cron isini kaldir, en
-- son tabloyu dusur. Tersi sirada tablo once giderse
-- kullanici_adi_musait_mi var olmayan bir tabloya bakmaya devam eder.

-- 1) public.kullanici_adi_musait_mi rezervasyon ONCESI haline donuyor.
-- Govde 20260819124003_kullanici_adi_musait_mi.sql'den birebir
-- kopyalandi (yorumlar dahil) - yalnizca profiller kontrolu var,
-- rezervasyon alt sorgusu yok.
--
-- Istemci bu sorguyu kendisi yapamaz: profiller'in RLS politikasi
-- yalnizca kendi satirini gosterir, dolayisiyla "bu ad baskasinda var
-- mi" sorusu her zaman "yok" cevabini dondururdu.
create or replace function public.kullanici_adi_musait_mi(p_ad text)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Bicime uymayan deger icin hata degil false doniyor; bicim mesajini
  -- ekran zaten kendisi gosteriyor, iki ayri hata yolu gerekmiyor.
  if p_ad is null or p_ad !~ '^[a-z0-9._]{3,20}$' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiller p where p.kullanici_adi = p_ad
  );
end;
$fn$;

revoke execute on function public.kullanici_adi_musait_mi from public, anon;
grant execute on function public.kullanici_adi_musait_mi to authenticated;

-- 2) Rezervasyon yazan fonksiyon artik gereksiz.
drop function if exists moderasyon.kullanici_adini_rezerve_et(text);

-- 3) Budama isi artik gereksiz. Is yoksa (jobname eslesmezse) sessizce
-- hicbir satir etkilemez; duz cron.unschedule('ad') is bulunamazsa
-- hata firlatirdi, bu yuzden jobid uzerinden yapiliyor.
select cron.unschedule(jobid) from cron.job
 where jobname = 'kullanici-adi-rezervasyon-buda';

-- 4) Tablo artik gereksiz.
drop table if exists public.kullanici_adi_rezervasyonlari;
