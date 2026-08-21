-- jeton_kaydet'i atomik yap: `on conflict (kullanici_id, jeton)` yalnizca
-- PK'yi hedefliyor. Iki FARKLI kullanici ayni jetonu es zamanli kaydederse
-- ikinci transaction'in INSERT'i PK'de cakisma gormez ama tablodaki global
-- `unique(jeton)` kisitina takilip islenmemis 23505 ile patlar - tam da bu
-- fonksiyonun var olus sebebi olan senaryo (ayni cihazda hizli cikis/giris).
-- Cozum: ayni jeton icin islemleri pg_advisory_xact_lock ile serilestirmek,
-- exception-retry dongusu kurmaktan daha sade.
--
-- Guvenlik varsayimi: jeton degerleri yuksek entropilidir (Expo/FCM/APNs
-- uretir), tahmin edilemez; bu yuzden "baska kullanicidan sil" adimi keyfi
-- hedefli silmeye donusturulemez.
create or replace function public.jeton_kaydet(
  p_jeton text,
  p_platform text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_jeton is null or length(trim(p_jeton)) = 0 then
    raise exception 'Jeton bos olamaz';
  end if;

  if length(trim(p_jeton)) > 500 then
    raise exception 'Jeton cok uzun';
  end if;

  if p_platform is null or p_platform not in ('ios', 'android') then
    raise exception 'Gecersiz platform';
  end if;

  -- Ayni jeton icin es zamanli cagrilari serilestirir; transaction sonunda
  -- kendiliginden serbest kalir. Bu satir olmadan iki farkli kullanici ayni
  -- jetonu ayni anda kaydettiginde ikincinin INSERT'i global unique(jeton)
  -- kisitina cakisip ham 23505 ile patlayabilirdi.
  perform pg_advisory_xact_lock(hashtext(trim(p_jeton)));

  -- Cihazi devralan hesap eskisinin bildirimini almamali.
  delete from public.bildirim_jetonlari
   where jeton = trim(p_jeton)
     and kullanici_id <> auth.uid();

  insert into public.bildirim_jetonlari (kullanici_id, jeton, platform, guncellendi)
  values (auth.uid(), trim(p_jeton), p_platform, now())
  on conflict (kullanici_id, jeton)
  do update set platform = excluded.platform,
                guncellendi = now();
end;
$$;

revoke execute on function public.jeton_kaydet(text, text) from public, anon;
grant execute on function public.jeton_kaydet(text, text) to authenticated;
