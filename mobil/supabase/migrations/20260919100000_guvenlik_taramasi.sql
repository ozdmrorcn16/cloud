-- GUVENLIK TARAMASI (2026-09-19): bastan sona denetimde bulunan
-- sunucu tarafi acik ve borclarin tek migrasyonda kapatilmasi.
--
-- Bulgular ve bu dosyadaki karsiliklari:
--   1) check_in_yap `p_fotograf` yolunun SAHIBINI kontrol etmiyordu.
--      Storage'daki "check-in fotografini gorunurluk kuraliyla
--      okuyabilir" politikasi `exists (check_inler.fotograf = name)`
--      ile calistigi icin biri BASKASININ fotograf yolunu kendi
--      check-in'ine yazip o dosyayi (engellenmis / gizli profil olsa
--      da) okunur hale getirebiliyordu. mekan_duzenleme_talebi_gonder
--      ayni kontrolu zaten tasiyordu; buraya da kondu.
--   2) profiller.fotograflar kullanicinin dogrudan yazdigi bir sutun ve
--      degeri dogrulanmiyordu. Baskasinin klasorundeki bir yol kendi
--      profiline yazilabiliyordu (okuma politikasi klasor sahibine
--      baktigi icin sizinti yoktu ama kimlik taklidi mumkundu).
--      Tetikleyici: her eleman `<kendi id>/` ile baslamak zorunda.
--   3) mahalle_aktarim_adimi() bir defalik veri isiydi (2026-08-31),
--      isi bitmis ve cron'u kapanmisti ama fonksiyon HERKESE (anon
--      dahil) acik kalmisti: kimliksiz bir cagri 5 dakikalik bir
--      guncelleme dilimini tetikleyebiliyordu. Dusuruldu.
--   4) yakin_mekanlar'in 2026-08-15'ten kalan 4 parametreli asiri
--      yuklemesi (security invoker, search_path yok, ilike joker
--      kacisi yok) hic kullanilmiyordu. Dusuruldu; 3 parametreli
--      surum (mekan ekleme ekranindaki kopya kontrolu) duruyor.
--   5) Postgres `public` semasindaki her yeni fonksiyona PUBLIC'e
--      EXECUTE verir; yani her migrasyon acikca `revoke ... from
--      public, anon` yazmazsa fonksiyon anon'a acilir. 27 fonksiyon
--      boyle acilmisti (danisman raporu). Hepsi `auth.uid() is null`
--      kontrolu tasidigi icin sizinti OLCULMEDI, ama kapi kapatiliyor
--      ve VARSAYILAN YETKI degistiriliyor: bundan sonra postgres'in
--      olusturdugu her fonksiyon otomatik olarak yalnizca authenticated
--      + service_role tarafindan cagrilabilir; anon icin acik `grant`
--      gerekir (eposta_kayitli_mi, telefon_kayitli_mi, profil_karti
--      bilerek acik kaliyor - kayit ve paylasim sayfasi kimliksiz).
--   6) mekan_turleri matview'i ve iller tablosu anon'a acikti; ikisi de
--      yalnizca giris yapmis kullanicinin ihtiyaci (ildeki_turler RPC).
--   7) Kovalarin boyut ve tur siniri yoktu: kimlikli herhangi bir
--      kullanici kendi klasorune sinirsiz boyutta, her turden dosya
--      yukleyebiliyordu. Istemci yalnizca image/jpeg (fotograf) ve
--      application/json (disa aktarim) gonderiyor.
--   8) bag.ani_gorunurlugu search_path tasimiyordu (danisman uyarisi);
--      saf ifade, tablo okumuyor - yine de sabitlendi. tr_kucuk'e
--      BILEREK dokunulmadi: GIN indeksinin ifadesi, SET eklemek SQL
--      satir ici acilimini kapatip plani degistirebilir.

-- ------------------------------------------------------------------ --
-- 1) check_in_yap: fotograf yolu cagiranin kendi klasorunde olmali
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
  v_mekan_kapali boolean;
  v_kullanici_adi text;
  v_not text;
  v_fotograf text;
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

  -- Fotograf yolu `<kullanici_id>/<dosya>` duzeninde ve cagiranin KENDI
  -- klasorunde olmali (lib/checkin-fotograf-yukle.ts ile ayni desen).
  -- Storage okuma politikasi bu satira bakarak dosyayi acar; baskasinin
  -- yolu buraya girerse o dosya sizardi.
  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  select konum, kapali into v_mekan_konum, v_mekan_kapali
  from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if v_mekan_kapali then
    raise exception 'Bu mekan kalici olarak kapandi';
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
    auth.uid(), p_mekan_id, v_not, v_fotograf, now() + interval '1 hour',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

-- ------------------------------------------------------------------ --
-- 2) profiller.fotograflar: her yol kendi klasorunde
-- ------------------------------------------------------------------ --
create or replace function gizli.profil_fotograf_yollarini_dogrula()
returns trigger
language plpgsql
set search_path to ''
as $$
declare
  v_yol text;
begin
  if new.fotograflar is null then
    return new;
  end if;

  foreach v_yol in array new.fotograflar loop
    if v_yol is null
       or split_part(v_yol, '/', 1) <> new.id::text
       or split_part(v_yol, '/', 2) = '' then
      raise exception 'Bu fotograf sana ait degil';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists profil_fotograf_yollari on public.profiller;
create trigger profil_fotograf_yollari
  before insert or update of fotograflar on public.profiller
  for each row execute function gizli.profil_fotograf_yollarini_dogrula();

-- ------------------------------------------------------------------ --
-- 3) Bitmis veri isi: mahalle_aktarim_adimi
-- ------------------------------------------------------------------ --
drop function if exists public.mahalle_aktarim_adimi();

-- ------------------------------------------------------------------ --
-- 4) Eski yakin_mekanlar asiri yuklemesi
-- ------------------------------------------------------------------ --
drop function if exists public.yakin_mekanlar(double precision, double precision, integer, text);

-- ------------------------------------------------------------------ --
-- 5) anon'a acik kalmis fonksiyonlar + varsayilan yetki
-- ------------------------------------------------------------------ --
-- Bundan sonra postgres'in public'te olusturdugu her fonksiyon: PUBLIC
-- ve dolayisiyla anon icin KAPALI, authenticated + service_role icin
-- ACIK. Kimliksiz cagri isteyen fonksiyona acikca `grant ... to anon`.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  grant execute on functions to authenticated, service_role;

-- Mevcut fonksiyonlar: uzantiya (PostGIS vb.) ait olmayan, anon'un
-- cagirabildigi her public fonksiyon; uc kimliksiz fonksiyon ve
-- tr_kucuk (GIN indeks ifadesi - indeks bakiminda her yazan rol
-- cagirabilmeli, saf metin fonksiyonu) haric.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as imza
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname not in ('eposta_kayitli_mi', 'telefon_kayitli_mi', 'profil_karti', 'tr_kucuk')
      and has_function_privilege('anon', p.oid, 'execute')
      and not exists (
        select 1 from pg_depend d
        where d.objid = p.oid and d.classid = 'pg_proc'::regclass
          and d.deptype = 'e'
      )
  loop
    execute format('revoke execute on function %s from public, anon', r.imza);
    -- PUBLIC'ten alinca authenticated ve service_role da kaybediyor;
    -- ikisine acikca geri veriliyor (bugunku davranis korunuyor).
    execute format('grant execute on function %s to authenticated, service_role', r.imza);
  end loop;
end
$$;

-- ------------------------------------------------------------------ --
-- 6) Kimliksiz okunabilen referans verisi
-- ------------------------------------------------------------------ --
revoke select on public.mekan_turleri from anon;

drop policy if exists "iller herkese acik" on public.iller;
create policy "iller giris yapana acik" on public.iller
  for select to authenticated using (true);
revoke all on public.iller from anon;

-- ------------------------------------------------------------------ --
-- 7) Kova sinirlari
-- ------------------------------------------------------------------ --
update storage.buckets
   set file_size_limit = 10 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id in ('profil-fotograflari', 'check-in-fotograflari', 'mekan-fotograflari');

update storage.buckets
   set file_size_limit = 50 * 1024 * 1024,
       allowed_mime_types = array['application/json']
 where id = 'veri-disa-aktarim';

-- ------------------------------------------------------------------ --
-- 8) search_path
-- ------------------------------------------------------------------ --
alter function bag.ani_gorunurlugu(text, text) set search_path = '';

notify pgrst, 'reload schema';
