alter table public.check_inler
  add column moderasyon_gizli boolean not null default false;

-- Sutun bazli grant VERILMEZ: 20260820052249 zaten authenticated
-- rolunden butun update yetkisini geri almisti, o durum korunur.
-- Tek yazma yolu moderasyon_icerigi_gizle / moderasyon_gizlemeyi_kaldir.

-- Gizlenen icerik SAHIBINE DE gorunmez (spec karar 60). Bu yuzden filtre
-- en distaki kosuldur, sahiplik kolunun de onunde. Govdenin geri kalani
-- 20260822095000'den birebir kopyalandi.
drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select to authenticated
  using (
    not moderasyon_gizli
    and (
      kullanici_id = auth.uid()
      or (
        moderasyon.hesap_aktif_mi(check_inler.kullanici_id)
        and not gizli.engelli_mi(check_inler.kullanici_id)
        and case
          when konum is null then
            gorunurluk = 'herkese_acik'
            or (
              gorunurluk = 'takipcilerim'
              and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
            )
          else
            (
              bulunurluk = 'herkese_acik'
              and (
                gizli.ayni_mekanda_canli_mi(check_inler.mekan_id)
                or bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
              )
            )
            or (
              bulunurluk = 'takipcilerim'
              and bag.takip_ediyor_mu(auth.uid(), check_inler.kullanici_id)
            )
        end
      )
    )
  );

-- RLS'i atlayan okuyucular. Liste canlida uretildi:
--   select n.nspname, p.proname from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where p.prosecdef and pg_get_functiondef(p.oid) ilike '%check_inler%';
-- Sonuc: gizli.ayni_mekanda_canli_mi ve public.yakin_mekanlar_yogunluk
-- OKUYOR; check_in_yap, check_inden_ayril, ani_gorunurlugunu_ayarla ve
-- hesabimi_dondur yalnizca kendi satirina YAZIYOR, filtre gerekmiyor.
-- NOT: spec public.baskasinin_profili'ni de sayiyordu ama o fonksiyon
-- artik check_inler'e hic dokunmuyor (canlida dogrulandi).

-- Gizlenmis bir canli check-in "ayni mekanda canliyim" hakkini da
-- vermemeli: gizlenen kisi o mekandaki digerlerini gormeye devam
-- edemez, cunku varligi kaldirilmis sayilir.
create or replace function gizli.ayni_mekanda_canli_mi(p_mekan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.check_inler
    where kullanici_id = auth.uid()
      and mekan_id = p_mekan_id
      and konum is not null
      and bitis_zamani > now()
      and not moderasyon_gizli
  );
$fn$;

-- Gizlenen check-in yogunluk sayacinda da sayilmaz. (Karar 71 gizli
-- BULUNURLUK'un sayacta gorunmeye devam ettigini soyluyor; bu ondan
-- farkli bir sey - moderasyon gizlemesi icerigin tamamen kaldirilmasi.)
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default 5000,
  p_arama text default null
)
returns table(
  id uuid, ad text, tur text, konum geography, adres text,
  osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamp with time zone, kisi_sayisi integer
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
    select m.id, m.ad, m.tur, m.konum, m.adres, m.osm_id,
           m.ekleyen_kullanici, m.olusturuldu,
           (
             select count(*)::int
             from public.check_inler c
             where c.mekan_id = m.id
               and c.konum is not null
               and c.bitis_zamani > now()
               and moderasyon.hesap_aktif_mi(c.kullanici_id)
               and not c.moderasyon_gizli
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$fn$;
