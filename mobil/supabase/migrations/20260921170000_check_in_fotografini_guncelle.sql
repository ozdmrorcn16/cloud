-- FOTOGRAFI SONRADAN DEGISTIRME / KALDIRMA (kullanicinin istegi
-- 2026-09-21: akis kartindaki yerinde duzenlemede "isterse koydugu
-- fotografi kaldirabilir ya da yenisini ekleyebilir").
--
-- Uc parca:
--   1) RPC `check_in_fotografini_guncelle`: `check_in_notunu_guncelle`
--      ve `check_in_ifadesini_guncelle` ile AYNI kapi (yalnizca kendi,
--      moderasyonla gizlenmemis paylasim); yeni yol `<kendi id>/<dosya>`
--      olmak zorunda (2026-09-19 sahiplik kurali - storage okuma
--      politikasi bu sutuna bakarak dosyayi acar, baskasinin yolu
--      buraya girerse o dosya sizardi). ESKI YOLU dondurur ki istemci
--      dosyayi kovadan silebilsin. null = kaldir.
--   2) Kovada SILME politikasi: bugune kadar yalnizca yukleme + okuma
--      vardi; kaldirilan fotograf sunucuda kalmamali (KVKK: kullanici
--      kaldirdigini gercekten kaldirmis olmali).
--   3) Okuma politikasina "kendi klasoru" istisnasi: Storage `remove`
--      nesneyi once SELECT ile gorur; okuma kurali `check_inler.fotograf
--      = name` bagina dayandigi icin RPC yolu degistirdikten sonra eski
--      dosya sahibine bile gorunmez olur ve silinemezdi. Kisinin kendi
--      yukledigi dosyayi okumasi yeni bir sizinti degil.

create or replace function public.check_in_fotografini_guncelle(p_check_in_id uuid, p_fotograf text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eski text;
  v_fotograf text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  select fotograf into v_eski
  from public.check_inler
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and not moderasyon_gizli
  for update;

  if not found then
    raise exception 'Bu paylasim bulunamadi';
  end if;

  update public.check_inler
  set fotograf = v_fotograf
  where id = p_check_in_id
  returning id into v_id;

  -- Ayni yol yeniden yazildiysa silinecek eski dosya yok.
  if v_eski is not distinct from v_fotograf then
    return null;
  end if;
  return v_eski;
end;
$$;

revoke execute on function public.check_in_fotografini_guncelle(uuid, text) from public, anon;
grant execute on function public.check_in_fotografini_guncelle(uuid, text) to authenticated, service_role;

-- 2) Kendi klasorundeki check-in fotografini silebilir.
drop policy if exists "kendi check-in fotografini silebilir" on storage.objects;
create policy "kendi check-in fotografini silebilir"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'check-in-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Okuma: satira bagli kural aynen + kendi klasoru.
drop policy if exists "check-in fotografini gorunurluk kuraliyla okuyabilir" on storage.objects;
create policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'check-in-fotograflari'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.check_inler c
        where c.fotograf = storage.objects.name
      )
    )
  );
