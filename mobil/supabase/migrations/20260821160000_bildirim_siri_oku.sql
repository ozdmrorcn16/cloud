-- Bildirimler Task 3: Edge Function'in paylasilan sirri okuyabilmesi icin
-- `bildirim.sir_oku()` uzerine public semasinda ince bir sarmalayici.
--
-- Neden gerekli: `bildirim` semasi PostgREST'e acilmiyor (Task 2 karari) ve
-- acilmasi da istenmiyor - sema listesine eklenmesi sirri her authenticated
-- kullaniciya acar. Edge Function ise veritabanina yalnizca PostgREST
-- uzerinden (supabase-js) ulasiyor, yani kapali semadaki fonksiyonu
-- cagiramaz. Sarmalayici bu yuzden `public`te duruyor.
--
-- Sarmalayici public'te olmasi TEK BASINA bir risk degil; riski tasiyan sey
-- ACL. Bu yuzden EXECUTE burada da yalnizca `service_role`'de: PUBLIC'ten
-- (create function'in varsayilan grant'i) ve anon/authenticated'dan acikca
-- geri aliniyor. Ayni kalip `bildirim_kurulum_ozeti()` ile birebir.
--
-- Govde tek satir: hicbir donusum, filtre ya da kayit yapmiyor. Sirri
-- log'a yazan, hata mesajina koyan bir yol bilerek yok.
create or replace function public.bildirim_siri_oku()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select bildirim.sir_oku();
$$;

revoke all on function public.bildirim_siri_oku() from public;
revoke all on function public.bildirim_siri_oku() from anon, authenticated;
grant execute on function public.bildirim_siri_oku() to service_role;

notify pgrst, 'reload schema';
