-- Faz 3a sonrasi sertlestirme, iki bagimsiz madde:
--
-- 1) check_inler uzerindeki "kendi check-in'ini guncelleyebilir" UPDATE
--    politikasi olu: authenticated rolunden UPDATE yetkisi tamamen geri
--    alindi (20260820052249_check_inler_sutun_yetkileri.sql). Politika
--    hicbir sey vermiyor ama "kullanicilar kendi check-in'lerini
--    guncelleyebilir" diye okunuyor - ileride biri buna bakip sutun
--    yetkisini geri verirse konum sizintisi acigi yeniden acilir.
--    Dusurmek daha guvenli bir varsayilan da birakiyor: RLS acik ve
--    UPDATE politikasi yoksa, yanlislikla verilen bir sutun yetkisi bile
--    guncellemeyi reddeder.
drop policy "kendi check-in'ini guncelleyebilir" on public.check_inler;

-- 2) SQL'de `x not in (...)` ifadesi x NULL oldugunda NULL doner, `true`
--    degil - yani `if` govdesi calismaz ve gecersiz-deger korumasi
--    sessizce atlanir. Deger sonra ilgili sutunun `not null` kisitina
--    carpar ve kullaniciya dostane Turkce mesaj yerine ham Postgres
--    hatasi (23502) doner. Uc fonksiyonun govdesi kaynaktan birebir
--    kopyalandi; tek degisiklik ilgili `if` kosuluna `is null or`
--    eklenmesi. Hata mesajlari degismedi.

-- 2a) ani_gorunurlugunu_ayarla
--     Kaynak: 20260820052249_check_inler_sutun_yetkileri.sql
create or replace function public.ani_gorunurlugunu_ayarla(p_deger text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_deger is null or p_deger not in ('herkese_acik', 'takipcilerim', 'kimse') then
    raise exception 'Gecersiz gorunurluk degeri';
  end if;

  update public.check_inler
     set gorunurluk = bag.ani_gorunurlugu(bulunurluk, p_deger)
   where kullanici_id = auth.uid() and konum is null;
end;
$$;

revoke execute on function public.ani_gorunurlugunu_ayarla(text) from public, anon;
grant execute on function public.ani_gorunurlugunu_ayarla(text) to authenticated;

-- 2b) check_in_yap
--     Kaynak: 20260819194021_ani_gorunurlugu_yardimcisi.sql (EN SON
--     surum; 20260819190832_check_in_yap_bulunurluk.sql eski surumdur,
--     kullanilmadi).
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
as $$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
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
$$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;

-- 2c) sikayet_gonder
--     Kaynak: 20260816114002_sikayet_rpc.sql
--     Kapsam disi (bilerek DOKUNULMADI): p_sebep ve p_hedef_id parametrelerinde
--     hic dogrulama yok, NULL verilirse onlar da ham hata uretir. Ayri bir is.
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

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
