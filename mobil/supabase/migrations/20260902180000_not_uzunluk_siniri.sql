-- CHECK-IN NOTUNA UZUNLUK SINIRI: 500 KARAKTER.
--
-- Kullanicinin karari (2026-09-02): notu duzenleme ozelligi
-- gonderilirken "sinir yok, magaza oncesi konmali" diye acik borc
-- yazilmisti; kullanici bunu kabul etmedi - "Konmalıysa koy sonraya iş
-- bırakma."
--
-- 500 SAYISI KEYFI DEGIL: yorumlar tablosunda zaten ayni tavan var
-- (migrasyon 20260902130000, `length(trim(metin)) between 1 and 500`).
-- Ayni uygulamada iki serbest metin alaninin iki farkli siniri olmasi
-- icin bir sebep yok.
--
-- SINIR UC KATMANDA:
--   1. Sutun kisiti - her yazma yolunu kalici olarak kapatiyor. Ileride
--      yeni bir RPC yazilsa bile bu kisiti atlayamaz.
--   2. Iki RPC'de acik kontrol - kullanici dostane bir Turkce mesaj
--      goruyor, ham 23514 degil.
--   3. Istemcide `NOT_EN_FAZLA` ile kirpma - kullanici sinira
--      carpmadan once duruyor (yorum kutusundaki desenin aynisi).
--
-- Kisit su an guvenle eklenebiliyor: canlida notlu tek bir satir bile
-- yok (olculdu), yani geriye donuk kirilan kayit yok.

alter table public.check_inler
  drop constraint if exists check_inler_not_uzunlugu;

alter table public.check_inler
  add constraint check_inler_not_uzunlugu
  check (not_metni is null or length(btrim(not_metni)) <= 500);

-- ------------------------------------------------------------------ --
-- check_in_yap: uzunluk kontrolu + notun normallestirilmesi
-- ------------------------------------------------------------------ --
--
-- Govde canli veritabanindan alindi (20260829100000 ile birebir ayni),
-- iki sey eklendi:
--   - uzunluk kontrolu
--   - `nullif(btrim(...))` ile normallestirme. Onceden yalnizca
--     bosluktan olusan bir not oldugu gibi yaziliyordu ve kart onu
--     "notu var" sayip bos bir satir ciziyordu. Duzenleme yolu
--     (check_in_notunu_guncelle) bastan beri normallestiriyordu; iki
--     yolun ayni girdiye ayni cevabi vermesi gerekiyor.

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
  v_not text;
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

  v_not := nullif(btrim(coalesce(p_not_metni, '')), '');
  if length(coalesce(v_not, '')) > 500 then
    raise exception 'Not en fazla 500 karakter olabilir';
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
    auth.uid(), p_mekan_id, v_not, p_fotograf, now() + interval '30 minutes',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;

-- ------------------------------------------------------------------ --
-- check_in_notunu_guncelle: ayni kontrol
-- ------------------------------------------------------------------ --

create or replace function public.check_in_notunu_guncelle(
  p_check_in_id uuid,
  p_not text default null
)
returns public.check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_satir public.check_inler;
  v_temiz text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  v_temiz := nullif(btrim(coalesce(p_not, '')), '');

  if length(coalesce(v_temiz, '')) > 500 then
    raise exception 'Not en fazla 500 karakter olabilir';
  end if;

  update public.check_inler
  set not_metni = v_temiz
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and not moderasyon_gizli
  returning * into v_satir;

  if v_satir.id is null then
    raise exception 'Bu paylasim bulunamadi';
  end if;

  return v_satir;
end;
$function$;
