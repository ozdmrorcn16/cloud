-- Faz 3a takip isleri, bolum 2 ve 3'un kapanisi. Uc bagimsiz madde:
--
-- 1) sohbet_istegini_geri_cek: takip tarafinda takibi_birak zaten
--    durum'a bakmadan sildigi icin bekleyen istegi de kapsiyor, ayri bir
--    RPC gerekmiyor (baglayici karar 1). Ama sohbet_istekleri'ne
--    sohbet_istegini_yanitla disinda hicbir RPC dokunmuyor ve o da
--    yalnizca ALICIYA acik; GONDERENIN bekleyen istegini geri cekecek
--    hicbir yol yok. Bu RPC o boslugu kapatiyor.
--
--    Onemli: istek_gunlugu'ne DOKUNMUYOR. Gunluk ekle-only ve gunluk
--    kota tam olarak bunu sayiyor; geri cekme gunlukten satir silseydi
--    "gonder -> geri cek -> sayac dussun -> tekrarla" ile 50 istek/gun
--    tavani tamamen atlatilirdi (baglayici karar 3, pazarlik konusu degil).
create or replace function public.sohbet_istegini_geri_cek(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Yalnizca GONDEREN geri cekebilir, ve yalnizca hala beklemede olan bir
  -- istegi: kabul edilmis bir sohbeti "geri cekmek" ayri bir ozellik
  -- (sohbeti bitirmek) ve kapsam disi (baglayici karar 2).
  delete from public.sohbet_istekleri
    where gonderen_id = auth.uid()
      and alan_id = p_kullanici_id
      and durum = 'beklemede';

  if not found then
    raise exception 'Geri cekilecek istek bulunamadi';
  end if;
end;
$$;

revoke execute on function public.sohbet_istegini_geri_cek(uuid) from public, anon;
grant execute on function public.sohbet_istegini_geri_cek(uuid) to authenticated;

-- 2) sikayet_gonder parametre dogrulamasi. p_hedef_id ve p_sebep hic
--    dogrulanmiyordu; NULL verilince sikayetler tablosunun `not null`
--    kisitina carpip ham 23502 donuyordu (p_hedef_tur ayni sorunu
--    20260820060000_null_korumasi_ve_olu_politika.sql'de cozmustu, bu
--    ikisi o zaman bilerek kapsam disi birakilmisti).
--
--    Govdenin geri kalani SON surumden (20260820060000, o migrasyondaki
--    2c bolumu) birebir kopyalandi; tek fark iki yeni `if` bloguydu.
create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_id is null then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_sebep is null or trim(p_sebep) = '' then
    raise exception 'Sikayet sebebi belirtilmeli';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;

-- 3) istek_gunlugu suresiz buyuyor (ekle-only, hicbir RPC silmiyor).
--    Gunde bir calisan bir is 2 gunden eski satirlari budasin. 1 gun
--    degil 2 gun: tavan 24 saatlik kayan pencereyi sayiyor, 1 gunde
--    budamak sinirdaki satirlari erken silip kotayi gevsetebilirdi.
--    Ayni jobname ile cron.schedule cagrildiginda isi degistirir, ikinci
--    is yaratmaz (20260819194021_ani_gorunurlugu_yardimcisi.sql'deki
--    kalip ayni).
select cron.schedule(
  'istek-gunlugu-buda',
  '0 4 * * *',
  $$ delete from public.istek_gunlugu where olusturuldu < now() - interval '2 days'; $$
);
