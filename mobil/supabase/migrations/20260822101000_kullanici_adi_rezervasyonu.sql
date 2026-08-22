-- Spec karar 70. Silinen kullanici adi hemen serbest kalirsa bir baskasi
-- onu alip silinen kisinin yerine gecebilir - tanisma uygulamasinda
-- gercek bir taklit riski.
--
-- Tablo kisiyle HICBIR BAGI OLMADAN tutuluyor: yalnizca ad ve serbest
-- kalma tarihi. Silinmis bir kisinin tanitici bilgisini suresiz
-- saklamamak icin 90 gun sonra budaniyor.
create table public.kullanici_adi_rezervasyonlari (
  kullanici_adi text primary key,
  serbest_kalma timestamptz not null
);

-- RLS acik, POLITIKA YOK: istemci bu tabloyu hic goremez. Gorebilseydi
-- silinmis hesaplarin kullanici adlari listelenebilir hale gelirdi.
alter table public.kullanici_adi_rezervasyonlari enable row level security;
revoke all on public.kullanici_adi_rezervasyonlari from authenticated, anon;

-- Istemci bu sorguyu kendisi yapamaz: profiller'in RLS politikasi
-- yalnizca kendi satirini gosterir, dolayisiyla "bu ad baskasinda var
-- mi" sorusu her zaman "yok" cevabini dondururdu.
--
-- Musaitlik kontrolu rezervasyonlari da hesaba katiyor. Govde
-- 20260819124003_kullanici_adi_musait_mi.sql'den kopyalandi; tek fark
-- ikinci not exists blogu.
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
  ) and not exists (
    select 1 from public.kullanici_adi_rezervasyonlari r
     where r.kullanici_adi = p_ad and r.serbest_kalma > now()
  );
end;
$fn$;

revoke execute on function public.kullanici_adi_musait_mi from public, anon;
grant execute on function public.kullanici_adi_musait_mi to authenticated;

-- Edge Function silme sirasinda cagirir. moderasyon semasinda, cunku
-- public'teki her fonksiyonu PostgREST istemciye RPC olarak sunar ve
-- bu cagri istemciye ait degil, Task 15'in Edge Function'ina ait.
create or replace function moderasyon.kullanici_adini_rezerve_et(p_ad text)
returns void
language sql
security definer
set search_path = public
as $fn$
  insert into public.kullanici_adi_rezervasyonlari (kullanici_adi, serbest_kalma)
  values (p_ad, now() + interval '90 days')
  on conflict (kullanici_adi)
    do update set serbest_kalma = excluded.serbest_kalma;
$fn$;

revoke execute on function moderasyon.kullanici_adini_rezerve_et(text)
  from public, anon, authenticated;

-- Suresi dolan rezervasyonlar gunluk budaniyor; ad yeniden alinabilir
-- hale gelir. istek_gunlugu budamasiyla ayni kalip. Ayni jobname ile
-- cron.schedule cagrildiginda isi degistirir, ikinci is yaratmaz.
select cron.schedule(
  'kullanici-adi-rezervasyon-buda',
  '30 4 * * *',
  $fn$ delete from public.kullanici_adi_rezervasyonlari
      where serbest_kalma < now(); $fn$
);
