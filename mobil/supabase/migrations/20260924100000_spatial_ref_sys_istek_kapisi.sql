-- SPATIAL_REF_SYS API'DEN KAPALI (2026-09-24).
--
-- Supabase guvenlik danismani (e-posta 2026-09-23, "rls_disabled_in_public",
-- CRITICAL): public.spatial_ref_sys RLS'siz ve anon/authenticated'a
-- INSERT/UPDATE/DELETE yetkili. Tablo PostGIS'in kendi tablosu (8.500
-- koordinat sistemi tanimi), KISISEL VERI YOK - ama biri SRID 4326 satirini
-- silerse ya da bozarsa geography hesaplari (1 km check-in kurali, yakin
-- mekanlar) bozulur. Butunluk ve erisilebilirlik riski.
--
-- NEDEN RLS / REVOKE DEGIL (olculdu): tablonun sahibi supabase_admin;
-- postgres RLS acamaz, yetkileri supabase_admin verdigi icin REVOKE etkisiz
-- kalir (denendi, has_table_privilege degismedi). PostGIS "public"te ve
-- tasinamaz (relocatable degil). pg_graphql kurulu degil - tek giris yolu
-- PostgREST.
--
-- COZUM: PostgREST'in her istekten once cagirdigi pre-request fonksiyonu
-- /spatial_ref_sys yolunu 42501 (403) ile reddeder. Uygulama bu tabloyu
-- hic cagirmiyor. Fonksiyon HER istekte kosar: yalnizca bir ayar okuyup
-- metin karsilastirir, tablo okumaz.
--
-- GERI ALMA: alter role authenticator reset pgrst.db_pre_request;
--            notify pgrst, 'reload config';

create or replace function public.istek_kapisi()
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  yol text := lower(coalesce(current_setting('request.path', true), ''));
begin
  if yol = '/spatial_ref_sys' or yol like '/spatial_ref_sys/%' then
    raise exception 'Bu kaynak kapali' using errcode = '42501';
  end if;
end
$$;

-- PostgREST istegi anon/authenticated/service_role olarak cagirir.
revoke all on function public.istek_kapisi() from public;
grant execute on function public.istek_kapisi() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.istek_kapisi';
notify pgrst, 'reload config';
