-- HIZ SINIRI KACIRILABILIYORDU - duzeltme.
--
-- 20260827090000 numarali migrasyonda kaynak adresi soyle bulunuyordu:
--
--   split_part(request.headers ->> 'x-forwarded-for', ',', 1)
--
-- yani zincirin ILK parcasi. Bu YANLIS ve olcerek dogrulandi: istemci
-- kendi `X-Forwarded-For` basligini yollarsa Cloudflare onu SILMIYOR,
-- kendi gordugu adresi zincirin SONUNA ekliyor. Yayindaki sistemde
-- olculen degerler:
--
--   normal cagri : x-forwarded-for = 88.234.83.64
--                  cf-connecting-ip = 88.234.83.64
--   taklit cagri : x-forwarded-for = 203.0.113.99,88.234.83.64
--                  cf-connecting-ip = 88.234.83.64
--
-- Yani ilk parcaya guvenen sayac, her istekte baska bir uydurma adres
-- yollanarak her seferinde BOS bir kovaya duesuyordu; tavan pratikte
-- hic devreye girmiyordu.
--
-- Cozum: once `cf-connecting-ip` (istemci ezemiyor), o yoksa
-- `x-forwarded-for`in SON parcasi (zinciri en son yazan guvenilen
-- vekildir).
--
-- Duzeltmeden sonra canli olarak dogrulandi: her cagride farkli bir
-- uydurma X-Forwarded-For ile 20 cagri denendi, 15'inci cagrida
-- reddedildi.

create or replace function public.telefon_kayitli_mi(p_telefon text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  tavan constant int := 15;
  v_basliklar jsonb;
  v_xff text;
  v_parcalar text[];
  v_kaynak text;
  v_sayi int;
  v_sonuc boolean;
begin
  if p_telefon is null or p_telefon !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefon numarasi bicimi gecersiz';
  end if;

  v_basliklar := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);

  v_kaynak := nullif(trim(coalesce(v_basliklar ->> 'cf-connecting-ip', '')), '');

  if v_kaynak is null then
    v_xff := coalesce(v_basliklar ->> 'x-forwarded-for', '');
    if v_xff <> '' then
      v_parcalar := string_to_array(v_xff, ',');
      v_kaynak := nullif(trim(v_parcalar[array_upper(v_parcalar, 1)]), '');
    end if;
  end if;

  v_kaynak := coalesce(v_kaynak, 'bilinmiyor');

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

-- Olcum icin gecici olarak acilmis yardimci fonksiyon; artik gerekli
-- degil ve disariya baslik icerigi verdigi icin birakilmamali.
drop function if exists public._gecici_basliklar();
