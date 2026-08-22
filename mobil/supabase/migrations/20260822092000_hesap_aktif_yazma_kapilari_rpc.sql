-- Uc yazma RPC'sine aktiflik kontrolu. Her govde kendi SON surumunden
-- birebir kopyalandi (check_in_yap: 20260820060000, mekan_ekle:
-- 20260815091500, kullanici_adi_degistir: 20260819124813); tek fark
-- auth.uid() kontrolunun hemen ardina eklenen blok.
--
-- kullanici_adi_degistir'in kapsanmasi ozellikle onemli: yasakli bir
-- kullanici adini degistirip yasagi bilen kisilerden saklanamamali.

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
as $fn$
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
$fn$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

create or replace function public.mekan_ekle(
  p_ad text,
  p_tur text,
  p_lat double precision,
  p_lng double precision,
  p_cihaz_lat double precision,
  p_cihaz_lng double precision,
  p_adres text default null
) returns public.mekanlar
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_gunluk_sayi int;
  v_yeni public.mekanlar;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if not ST_DWithin(
    ST_MakePoint(p_lng, p_lat)::geography,
    ST_MakePoint(p_cihaz_lng, p_cihaz_lat)::geography,
    200
  ) then
    raise exception 'Mekana yakin olmalisin (~200 m icinde)';
  end if;

  select count(*) into v_gunluk_sayi
  from public.mekanlar
  where ekleyen_kullanici = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_gunluk_sayi >= 5 then
    raise exception 'Gunluk mekan ekleme limitine ulastin (5)';
  end if;

  insert into public.mekanlar (ad, tur, konum, adres, ekleyen_kullanici)
  values (p_ad, p_tur, ST_MakePoint(p_lng, p_lat)::geography, p_adres, auth.uid())
  returning * into v_yeni;

  return v_yeni;
end;
$fn$;

revoke execute on function public.mekan_ekle from public, anon;
grant execute on function public.mekan_ekle to authenticated;

create or replace function public.kullanici_adi_degistir(p_yeni_ad text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mevcut_ad text;
  v_son_degisiklik timestamptz;
  v_kalan_gun int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_yeni_ad is null or p_yeni_ad !~ '^[a-z0-9._]{3,20}$' then
    raise exception 'Kullanici adi kurallara uymuyor';
  end if;

  select kullanici_adi, kullanici_adi_degistirildi
    into v_mevcut_ad, v_son_degisiklik
    from public.profiller
    where id = auth.uid();

  if not found then
    raise exception 'Profil bulunamadi';
  end if;

  -- Ayni adi yeniden yazmak 30 gunluk hakki harcamamali.
  if v_mevcut_ad = p_yeni_ad then
    raise exception 'Zaten bu kullanici adini kullaniyorsun';
  end if;

  if v_son_degisiklik is not null
     and v_son_degisiklik > now() - interval '30 days' then
    v_kalan_gun := ceil(
      extract(epoch from (v_son_degisiklik + interval '30 days' - now())) / 86400
    );
    raise exception
      'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: % gun', v_kalan_gun;
  end if;

  -- Asil guvence unique kisiti; buradaki kontrol yalnizca daha okunakli
  -- bir hata mesaji uretmek icin. Iki es zamanli cagri yarisirsa
  -- kaybeden taraf kisit ihlaliyle (23505) doner, bu da dogru davranis.
  if exists (
    select 1 from public.profiller
    where kullanici_adi = p_yeni_ad and id <> auth.uid()
  ) then
    raise exception 'Bu kullanici adi alinmis';
  end if;

  update public.profiller
    set kullanici_adi = p_yeni_ad,
        kullanici_adi_degistirildi = now()
    where id = auth.uid();
end;
$fn$;

revoke execute on function public.kullanici_adi_degistir from public, anon;
grant execute on function public.kullanici_adi_degistir to authenticated;
