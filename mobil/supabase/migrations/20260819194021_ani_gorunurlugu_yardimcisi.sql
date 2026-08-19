-- Ani donusumunde gorunurluk daraltmasi tek bir yardimciya cikarildi.
-- Sebep: bu mantik artik UC yerde birden gerekiyor ve elle kopyalanan
-- uc kopya sessizce ayrisir.
--
-- Yardimci `bag` semasinda, `public`te DEGIL: public'teki her fonksiyonu
-- PostgREST istemciye RPC olarak sunar (Task 3 ve Task 6'nin yerlesik
-- deseni). Hicbir tabloya dokunmadigi icin `security definer` degil,
-- saf `immutable` bir ifade fonksiyonu; auth guard gerekmiyor.
--
-- Kural tek yonlu: gorunurluk yalnizca DARALIR, hicbir kolda genislemez.
create or replace function bag.ani_gorunurlugu(
  p_bulunurluk text,
  p_gorunurluk text
) returns text
language sql
immutable
as $$
  select case
    when p_bulunurluk = 'gizli' then 'kimse'
    when p_bulunurluk = 'takipcilerim' and p_gorunurluk = 'herkese_acik' then 'takipcilerim'
    else p_gorunurluk
  end;
$$;

revoke execute on function bag.ani_gorunurlugu(text, text) from public, anon;
grant execute on function bag.ani_gorunurlugu(text, text) to authenticated;

-- 1) check_in_yap: eski aktif check-in kapatilirken de daraltilsin.
--    Govde 20260819190832_check_in_yap_bulunurluk.sql'den birebir
--    kopyalandi; yalnizca kapatma update'i degisti.
create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
) returns public.check_inler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 500) then
    raise exception 'Mekana cok uzaksin (~500 m icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  -- Eski aktif check-in de bir ANI'ya donusuyor; ayni daraltma burada da
  -- uygulanmali, yoksa gizli bir check-in herkese acik bir ani olarak kalir.
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
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '4 hours',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

-- 2) check_inden_ayril: elle yazilmis case yerine yardimciyi cagirsin.
create or replace function public.check_inden_ayril(p_check_in_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and konum is not null;
end;
$$;

revoke execute on function public.check_inden_ayril from public, anon;
grant execute on function public.check_inden_ayril to authenticated;

-- 3) pg_cron isi: ayni yardimciyi cagirsin. Ayni jobname ile schedule
--    cagirmak isi degistirir, ikinci bir is yaratmaz.
select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler
     set konum = null,
         gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
     where konum is not null and bitis_zamani <= now(); $$
);
