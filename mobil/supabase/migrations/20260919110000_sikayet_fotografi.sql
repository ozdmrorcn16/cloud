-- SIKAYETE FOTOGRAF (kullanicinin istegi 2026-09-19: "sikayet etme
-- ekranina fotograf ekleme olsun").
--
-- Model: sikayet eden kendi klasorune (`<kendi id>/<zaman>.jpg`) bir
-- gorsel yukler, yolu `sikayet_gonder`e verir; sunucu yolun sahibini
-- dogrular (check_in_yap ile ayni kural, 20260919100000). Kova OZEL:
-- yalnizca yukleyen (kendi klasoru) ve moderator (AAL2 + moderatorler)
-- okur; hicbir baska kullaniciya acilmaz. Panel `moderasyon_sikayet_detayi`
-- zaten `to_jsonb(sikayet)` dondurdugu icin yeni sutun kendiliginden
-- gidiyor; panel imzali adresi kendi oturumuyla uretiyor.
--
-- KVKK (docs/kvkk-uyum-listesi.md, "Sikayet fotografi"): fotograf ucuncu
-- kisi icerigi tasiyabilir; amac kotuye kullanimin incelenmesi (mesru
-- menfaat), saklama sikayet kaydiyla ayni (anonimlesen sikayetle
-- birlikte kalir), erisim yalnizca moderasyon. Gizlilik metni 7 dilde
-- guncellendi.

alter table public.sikayetler
  add column if not exists fotograf text;

-- Kova: private, 10 MB, yalnizca gorsel (diger kovalarla ayni sinir).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sikayet-fotograflari', 'sikayet-fotograflari', false,
        10 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "sikayet fotografini yukler" on storage.objects;
create policy "sikayet fotografini yukler" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sikayet-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
    and moderasyon.hesap_aktif_mi(auth.uid())
  );

-- Kendi yukledigini siler: sikayet gonderilmeden vazgecilirse dosya
-- kovada kalmasin.
drop policy if exists "sikayet fotografini siler" on storage.objects;
create policy "sikayet fotografini siler" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sikayet-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "sikayet fotografini yukleyen ve moderator okur" on storage.objects;
create policy "sikayet fotografini yukleyen ve moderator okur" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'sikayet-fotograflari'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or moderasyon.yetkili_mi()
    )
  );

-- RPC: parametre eklenirken ESKI imza dusuruluyor - create or replace
-- ayni adla ikinci bir asiri yukleme yaratir ve PostgREST "could not
-- choose the best candidate" verir (CLAUDE.md tuzagi).
drop function if exists public.sikayet_gonder(text, uuid, text, text);

create function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null,
  p_fotograf text default null
) returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_gonderen uuid;
  v_konusma  uuid;
  v_fotograf text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj') then
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

  -- Fotograf yolu cagiranin KENDI klasorunde olmali (Storage okuma
  -- politikasi klasore bakiyor; baskasinin yolu kabul edilseydi
  -- moderatore baskasinin dosyasi "kanit" diye gosterilebilirdi).
  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  if p_hedef_tur = 'mesaj' then
    select m.gonderen_id, m.konusma_id
      into v_gonderen, v_konusma
      from public.mesajlar m
     where m.id = p_hedef_id;

    if v_konusma is null then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if not exists (
      select 1 from public.konusma_uyeleri u
       where u.konusma_id = v_konusma
         and u.kullanici_id = auth.uid()
    ) then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if v_gonderen is not null and v_gonderen = auth.uid() then
      raise exception 'Kendi mesajini sikayet edemezsin';
    end if;
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama, fotograf)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama, v_fotograf);
end;
$function$;

revoke execute on function public.sikayet_gonder(text, uuid, text, text, text) from public, anon;
grant execute on function public.sikayet_gonder(text, uuid, text, text, text) to authenticated;

notify pgrst, 'reload schema';
