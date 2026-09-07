-- ------------------------------------------------------------------ --
-- TEKRAR KURALI YALNIZCA MEKAN LISTESINE AIT (kullanicinin duzeltmesi
-- 2026-09-07)
--
-- Kullanicinin ifadesi:
--   "Kural mekan listesi icin gecerli. Ana sayfa ve profil akisi
--    paylasilanlar oldugu gibi kaliyor, kisi paylasima ozel duzenleme
--    ve silme yapabiliyor."
--
-- Bir onceki migrasyon (20260907120000) "ayni kisi ayni yerde 24 saat
-- icinde tekrar check-in yaparsa guncellenir" kuralini YAZMA YOLUNA
-- indirmisti: `check_in_yap` yeni satir acmak yerine mevcut satiri
-- guncelliyordu. O bir asiri genellemeydi - kural bir LISTENIN gosterim
-- kuraliydi, veri modelinin degil.
--
-- Yanlisin somut sonucu: kisinin ayni gun ayni mekana yaptigi iki
-- ziyaret icin TEK paylasim oluyordu; ikinci ziyaret ana sayfada ve
-- profilde yeni bir paylasim olarak gorunmuyor, eskisinin zamani
-- ilerliyordu. Dolayisiyla kisi iki ziyareti ayri ayri duzenleyip
-- silemiyordu.
--
-- ------------------------------------------------------------------ --
-- SIMDIKI DAGILIM - hangi kural nerede yasiyor
--
--   check_in_yap ................ HER ZAMAN yeni satir. Her check-in
--                                 kendi paylasimi; duzenleme ve silme
--                                 paylasim basina.
--   mekan_son_check_inler ....... 24 saat suzgeci + kisi basina TEK
--                                 satir (en yenisi). DEGISMIYOR -
--                                 kullanicinin tarif ettigi davranis
--                                 tam olarak burasi.
--   mekan_liderlik .............. satir sayiyor, yani her check-in
--                                 sayaci artiriyor. Ust sinir 3.
--   Canlilik .................... 1 saat (20260907120000'den, gecerli).
--
-- Boylece bir onceki migrasyonun cozmek zorunda kaldigi celiski de
-- KENDILIGINDEN ortadan kalkti: satirlar birikmeye devam ettigi icin
-- liderlik sayaci dogal olarak buyuyor ve "24 saati ilk kayittan say"
-- gibi bir capaya ihtiyac kalmiyor.
-- ------------------------------------------------------------------ --

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

  -- Tek aktif check-in kurali: onceki canli kayit aniya donuyor.
  -- Ayni mekana tekrar check-in yapmak da bu kurala tabi - onceki
  -- paylasim YERINDE KALIYOR, yalnizca canliligi bitiyor.
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
    auth.uid(), p_mekan_id, v_not, p_fotograf, now() + interval '1 hour',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;

grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

-- ------------------------------------------------------------------ --
-- Liderlik: esitlik bozucu `ilk_check_in`den `olusturma_zamani`na
-- donuyor, cunku o sutun dusuruluyor (asagida).
-- ------------------------------------------------------------------ --
create or replace function public.mekan_liderlik(
  p_mekan_id uuid,
  p_limit integer default 3
)
returns table (
  kullanici_id uuid,
  kullanici_adi text,
  check_in_sayisi integer
)
language sql
stable
set search_path to ''
as $function$
  select c.kullanici_id,
         (array_agg(c.kullanici_adi order by c.olusturma_zamani desc))[1],
         count(*)::int
  from public.check_inler c
  where c.mekan_id = p_mekan_id
  group by c.kullanici_id
  order by count(*) desc, min(c.olusturma_zamani) asc
  limit least(greatest(coalesce(p_limit, 3), 1), 3);
$function$;

grant execute on function public.mekan_liderlik(uuid, integer) to authenticated;

-- ------------------------------------------------------------------ --
-- OLU SEMA BIRAKMIYORUZ.
--
-- `ilk_check_in` yalnizca yazma yolundaki guncelleme dalinin 24 saatlik
-- capasiydi; o dal kalktigina gore her satir kendi ilk check-in'i ve
-- sutun `olusturma_zamani`nin kopyasi. Adi bir kurali IMA ediyor -
-- kalsa ileride "demek ki tekrar check-in kaydi gunceller" diye
-- okunurdu. Veri kaybi yok: sutun bugun eklendi ve uretimde hicbir
-- satirda `olusturma_zamani`ndan farkli bir deger almadi (olculdu).
-- ------------------------------------------------------------------ --
drop index if exists public.check_inler_kullanici_mekan_ilk_idx;
alter table public.check_inler drop column if exists ilk_check_in;
