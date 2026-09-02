-- "Bu e-posta adresiyle zaten hesap var mi?" - dogrulama postasi
-- GONDERILMEDEN once sorulur.
--
-- Kullanicinin ilkesi (2026-08-27, telefon icin konmustu; e-postaya
-- gecerken korundu): kayitli bir adres girilirse hata KAYIT ekraninda
-- cikmali, bosuna posta gonderilmemeli.
--
-- Telefon surumunun (public.telefon_kayitli_mi) birebir kardesi: AYNI
-- iki katmanli hiz siniri, AYNI gunluk tablosu ve AYNI ozet tablosu.
-- Tek katmanli (yalnizca IP) bir tasarim yetmiyor: mobil operatorler
-- CGNAT kullaniyor, yuzlerce abone ayni IP'den cikiyor. Cihaz basina
-- dar, IP basina genis tavan ikisini birden koruyor.
--
-- ACIK RISK, bilerek kabul edildi: bu RPC bir adresin kayitli olup
-- olmadigini soyluyor, yani hedefli tek sorguyla "bu kisi uye mi"
-- ogrenilebilir. Tavan TOPLU taramayi engelliyor, hedefli sorguyu
-- degil. Ayrinti: docs/kvkk-uyum-listesi.md "Acik karar" bolumu.
create or replace function public.eposta_kayitli_mi(
  p_eposta text,
  p_cihaz text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
  v_basliklar jsonb;
  v_xff text;
  v_parcalar text[];
  v_ip text;
  v_cihaz text;
  v_ip_tavan int;
  v_cihaz_tavan int;
  v_sayi int;
  v_eposta text;
  v_sonuc boolean;
begin
  -- Bicim disi girdi hic sorgulanmadan reddediliyor. Desen istemcideki
  -- lib/eposta.ts ile ayni olcude dar tutuldu.
  v_eposta := lower(trim(coalesce(p_eposta, '')));
  if v_eposta !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'E-posta adresi bicimi gecersiz';
  end if;

  select coalesce(
    (select deger from public.hiz_limitleri where anahtar = 'telefon_kontrol_ip'),
    300
  ) into v_ip_tavan;

  select coalesce(
    (select deger from public.hiz_limitleri where anahtar = 'telefon_kontrol_cihaz'),
    10
  ) into v_cihaz_tavan;

  v_basliklar := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
  v_ip := nullif(trim(coalesce(v_basliklar ->> 'cf-connecting-ip', '')), '');
  if v_ip is null then
    v_xff := coalesce(v_basliklar ->> 'x-forwarded-for', '');
    if v_xff <> '' then
      v_parcalar := string_to_array(v_xff, ',');
      v_ip := nullif(trim(v_parcalar[array_upper(v_parcalar, 1)]), '');
    end if;
  end if;
  v_ip := coalesce(v_ip, 'bilinmiyor');

  v_cihaz := nullif(trim(coalesce(p_cihaz, '')), '');
  if v_cihaz is null or v_cihaz !~ '^[a-zA-Z0-9-]{8,64}$' then
    v_cihaz := 'ipten:' || v_ip;
  end if;

  -- Saklama suresi 1 saat; silinen satirlar kimlik tasimayan saatlik
  -- ozete akiyor (IP ya da adres YOK, yalnizca sayilar).
  with silinen as (
    delete from public.telefon_kontrol_gunlugu
    where zaman < now() - interval '1 hour'
    returning kaynak, tur, zaman
  ), toplam as (
    select date_trunc('hour', zaman) as saat,
           tur,
           count(*)::int as cagri,
           count(distinct kaynak)::int as farkli
    from silinen
    group by 1, 2
  )
  insert into public.telefon_kontrol_ozeti (saat, tur, cagri, farkli_kaynak)
  select saat, tur, cagri, farkli from toplam
  on conflict (saat, tur) do update
    set cagri = public.telefon_kontrol_ozeti.cagri + excluded.cagri,
        farkli_kaynak = greatest(
          public.telefon_kontrol_ozeti.farkli_kaynak,
          excluded.farkli_kaynak
        );

  select count(*) into v_sayi
  from public.telefon_kontrol_gunlugu
  where tur = 'cihaz' and kaynak = v_cihaz and zaman > now() - interval '1 hour';

  if v_sayi >= v_cihaz_tavan then
    raise exception 'Cok fazla deneme yapildi, biraz sonra tekrar deneyin';
  end if;

  select count(*) into v_sayi
  from public.telefon_kontrol_gunlugu
  where tur = 'ip' and kaynak = v_ip and zaman > now() - interval '1 hour';

  if v_sayi >= v_ip_tavan then
    raise exception 'Cok fazla deneme yapildi, biraz sonra tekrar deneyin';
  end if;

  insert into public.telefon_kontrol_gunlugu (kaynak, tur)
  values (v_cihaz, 'cihaz'), (v_ip, 'ip');

  -- "Kayitli" olmanin olcutu PROFIL SATIRIDIR, auth kaydi degil:
  -- yarim kalmis bir kayit (auth kaydi var, profil yok) kayit akisina
  -- devam edebilmeli. Dogrula ekranindaki son kapi da ayni olcutu
  -- kullaniyor.
  select exists (
    select 1
    from auth.users u
    join public.profiller p on p.id = u.id
    where lower(u.email) = v_eposta
  ) into v_sonuc;

  return v_sonuc;
end;
$function$;

revoke all on function public.eposta_kayitli_mi(text, text) from public;
grant execute on function public.eposta_kayitli_mi(text, text) to anon, authenticated;
