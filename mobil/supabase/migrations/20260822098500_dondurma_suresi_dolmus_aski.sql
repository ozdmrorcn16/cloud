-- Suresi dolmus bir askiyi hesap_aktif_mi zaten AKTIF sayiyor
-- (aski_bitisi > now() bakiyor), ama onceki surumdeki ham
-- `if exists (select 1 from public.hesap_durumlari ...)` her turlu
-- hesap_durumlari satirini "kullanilamaz" sayiyordu. Sonuc: suresi
-- dolmus bir 'askida' satiri olan kullanici, o satir
-- hesap-durumlari-buda cron'u tarafindan 90 gun sonra silinene kadar
-- hesabini donduramiyordu - gercek urun kusuru, "Hesabin zaten
-- kullanilamaz durumda" hatasi yalan soyluyordu (kod inceleme bulgusu
-- Important-1, 2026-08-22). Bu migrasyon 20260822098000'deki fonksiyonu
-- degistirmiyor (uygulanmis dosyaya dokunulmuyor), yalnizca ayni
-- fonksiyonu yeniden tanimliyor.

create or replace function public.hesabimi_dondur(p_gerekce text default null)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Aktiflik yardimcisi ile sor: suresi dolmus bir `askida` satiri olan
  -- kullanici zaten AKTIF (hesap_aktif_mi `aski_bitisi > now()` bakiyor),
  -- dolayisiyla hesabini dondurebilmeli. Ham `if exists` bu satiri da
  -- sayiyordu ve kullaniciyi cron budayana kadar (90 gun) kilitliyordu.
  -- `yasakli` ve `dondurulmus` durumlarinda hesap_aktif_mi zaten false
  -- dondugu icin bu ikisi de dogru sekilde reddediliyor, delete'e hic
  -- ulasilmiyor.
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin zaten kullanilamaz durumda';
  end if;

  -- Suresi dolmus kalinti satir varsa temizle, yoksa insert birincil
  -- anahtar cakismasina duser.
  delete from public.hesap_durumlari where kullanici_id = auth.uid();

  insert into public.hesap_durumlari (kullanici_id, durum, gerekce, moderator_id)
  values (
    auth.uid(),
    'dondurulmus',
    coalesce(nullif(trim(p_gerekce), ''), 'Kullanici kendi dondurdu'),
    null
  );

  -- Dondurmanin ilk etkisi canli varligin sonlanmasi olmali; aksi halde
  -- bitis_zamani dolana kadar bir "hayalet" satir kalirdi. Gorunurluk
  -- politikasi zaten gizliyor, ama veriyi de tutarli birakiyoruz.
  -- Daraltma check_in_yap'takiyle ayni kurali kullaniyor.
  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();
end;
$fn$;

revoke execute on function public.hesabimi_dondur(text) from public, anon;
grant execute on function public.hesabimi_dondur(text) to authenticated;
