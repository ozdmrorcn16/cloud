-- CHECK-IN CANLI SURESI 4 SAAT -> 30 DAKIKA.
--
-- Kullanicinin karari (2026-08-29): "4 saat kuralini kaldiriyoruz...
-- yapilan checkinde o an 'su an burada' ibaresi bulunucak 30dk
-- sonrasinda o ibare kalkicak".
--
-- "Canli" olmanin uygulamadaki karsiligi `konum` sutununun dolu
-- olmasi; sure dolunca cron (her 10 dakikada bir) o sutunu bosaltiyor
-- ve kayit aniya donusuyor. Yani sureyi kisaltmak iki seyi birden
-- yapiyor:
--   1. "su an burada" iddiasi 30 dakikayla sinirlaniyor
--   2. yogunluk sayaci ("7 kisi burada") da 30 dakikalik pencereye
--      donuyor - ki dogrusu bu: 3 saat once gelen biri "su an burada"
--      degil.
--
-- GIZLILIK ACISINDAN IYILESME: koordinat artik en fazla ~40 dakika
-- (30 dk + cron araligi) sakli kaliyor, 4 saat degil. Gizlilik metni
-- de bu sureye gore guncellendi.
--
-- Check-in AKISTA VE PROFILDE KALMAYA DEVAM EDIYOR; degisen tek sey
-- canlilik penceresi. Ani olarak zaten hemen gorunuyordu.
--
-- Fonksiyonun tam govdesi icin canli veritabanina bakildi; burada
-- yalnizca `interval '4 hours'` -> `interval '30 minutes'` degisti.

create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
)
returns check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_bulunurluk is null or p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 1000) then
    raise exception 'Mekana cok uzaksin (~1 km icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk
  )
  values (
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '30 minutes',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;
