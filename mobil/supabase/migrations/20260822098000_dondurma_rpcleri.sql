-- Kullanicinin kendi hesabini dondurmesi (spec karar 66). Moderasyon
-- askisiyla ayni tabloyu ve ayni hesap_aktif_mi yardimcisini kullaniyor,
-- yani butun zorlama noktalari kendiliginden gecerli.

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

  -- Satir zaten varsa basarisiz oluyoruz. Bu, askidaki bir kullanicinin
  -- askisini dondurmaya cevirip sureyi sifirlamasini engelliyor; ayni
  -- zamanda ust uste dondurmayi da anlamsiz bir islem olmaktan cikariyor.
  if exists (select 1 from public.hesap_durumlari where kullanici_id = auth.uid()) then
    raise exception 'Hesabin zaten kullanilamaz durumda';
  end if;

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

-- Geri acma. Istemci HER OTURUM ACILISINDA cagiriyor (spec karar 66),
-- bu yuzden govdesindeki `durum = 'dondurulmus'` kosulu kritik:
-- olmasaydi moderasyon askisi kullanicinin uygulamayi acmasiyla
-- kalkardi. Bu kosul, otomatik geri acilmayi guvenli kilan tek seydir.
--
-- boolean donuyor ki istemci "hesabin yeniden aktif" bilgisini yalnizca
-- gercekten bir sey degistiginde gostersin.
create or replace function public.hesabimi_geri_ac()
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_silindi int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  delete from public.hesap_durumlari
   where kullanici_id = auth.uid()
     and durum = 'dondurulmus';

  get diagnostics v_silindi = row_count;
  return v_silindi > 0;
end;
$fn$;

revoke execute on function public.hesabimi_geri_ac() from public, anon;
grant execute on function public.hesabimi_geri_ac() to authenticated;
