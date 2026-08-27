-- Kayit ekraninda, SMS kodu gonderilmeden once "bu numarada zaten
-- hesap var mi" sorusunu cevaplar.
--
-- KULLANICININ ISTEGI (2026-08-27): "Bu ekrandayken kayitli bir telefon
-- numarasi girilirse direk bu ekranda hata vermeli ki bosuna kod
-- gonderimini direk engellemek icin."
--
-- ONCEKI KARARIN DEGISTIRILDIGI YER: 2026-08-26'da bu kontrol bilerek
-- kod GIRILDIKTEN SONRA (dogrula ekraninda) yapiliyordu; gerekce,
-- kimlik dogrulamamis birine "bu numara kayitli mi" sorusunu
-- cevaplamanin numara listesiyle tarama (enumeration) yapmaya izin
-- vermesiydi. Kullanici bosa SMS gonderiminin engellenmesini tercih
-- etti. Risk KALDIRILMADI, SINIRLANDI:
--
--   1. Cagri basina IP'ye gore saatlik tavan (TAVAN sabiti). Tavan
--      asilirsa fonksiyon CEVAP VERMEZ, hata firlatir; istemci de
--      eski akisa duser (kodu gonderir) - yani mesru kullanici
--      engellenmez, tarayici da cevap alamaz.
--   2. Fonksiyon YALNIZCA boolean doner; hangi hesap, ne zaman
--      acilmis, profil adi ne - hicbiri sizmaz.
--   3. Gunluk 1 saatten eski satirlari her cagride temizliyor, yani
--      kalici bir "kim hangi numarayi sordu" kaydi olusmuyor.
--
-- Kontrolun dogrula ekranindaki hali KALDIRILMADI: burasi hizli yol,
-- orasi son kapi. Tavan asildiginda ya da ag hatasinda akis eskisi
-- gibi calismaya devam ediyor.

create table if not exists public.telefon_kontrol_gunlugu (
  id bigserial primary key,
  -- IP adresi ya da alinamadiysa 'bilinmiyor'. Kisisel veri sayilir;
  -- bu yuzden 1 saatten uzun tutulmuyor (bkz. temizlik).
  kaynak text not null,
  zaman timestamptz not null default now()
);

create index if not exists telefon_kontrol_gunlugu_kaynak_zaman
  on public.telefon_kontrol_gunlugu (kaynak, zaman desc);

-- RLS acik ve HICBIR politika yok: tabloya yalnizca security definer
-- fonksiyon ve service_role erisebilir.
alter table public.telefon_kontrol_gunlugu enable row level security;

revoke all on table public.telefon_kontrol_gunlugu from anon, authenticated;

create or replace function public.telefon_kayitli_mi(p_telefon text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  -- Saatte bir IP'den en fazla bu kadar numara sorulabilir.
  tavan constant int := 15;
  v_kaynak text;
  v_sayi int;
  v_sonuc boolean;
begin
  -- E.164. Bicim disi girdi hic sorgulanmadan reddediliyor.
  if p_telefon is null or p_telefon !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefon numarasi bicimi gecersiz';
  end if;

  -- Supabase istegin basliklarini bu GUC icinde tasiyor. Basliklar
  -- okunamazsa (yerel psql, cron) tek bir kova kullaniliyor.
  v_kaynak := coalesce(
    nullif(
      split_part(
        coalesce(
          current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for',
          ''
        ),
        ',',
        1
      ),
      ''
    ),
    'bilinmiyor'
  );

  -- Saklama suresi: 1 saat. Hiz siniri icin gereken sure bu kadar.
  delete from public.telefon_kontrol_gunlugu
  where zaman < now() - interval '1 hour';

  select count(*) into v_sayi
  from public.telefon_kontrol_gunlugu
  where kaynak = v_kaynak
    and zaman > now() - interval '1 hour';

  if v_sayi >= tavan then
    raise exception 'Cok fazla deneme yapildi, biraz sonra tekrar deneyin';
  end if;

  insert into public.telefon_kontrol_gunlugu (kaynak) values (v_kaynak);

  -- "Kayitli" olmanin olcutu PROFIL SATIRIDIR, auth kaydi degil.
  -- Dogrula ekranindaki kontrol de ayni olcutu kullaniyor: yarim
  -- kalmis bir kayit (auth kaydi var, profil yok) kayit akisina
  -- devam edebilmeli.
  --
  -- auth.users.phone '+' ONEKSIZ saklaniyor (ornek: 905550000000).
  select exists (
    select 1
    from auth.users u
    join public.profiller p on p.id = u.id
    where u.phone = ltrim(p_telefon, '+')
  ) into v_sonuc;

  return v_sonuc;
end;
$$;

revoke all on function public.telefon_kayitli_mi(text) from public;
grant execute on function public.telefon_kayitli_mi(text) to anon, authenticated;

comment on function public.telefon_kayitli_mi(text) is
  'Kayit ekraninda SMS gonderilmeden once kullanilir. Yalnizca boolean doner, IP basina saatlik tavani vardir.';
