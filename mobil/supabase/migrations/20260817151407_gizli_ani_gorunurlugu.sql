-- Gizli check-in (gizli_mi = true) ani haline gelirken gorunurluk de
-- 'kimse' olarak kapatilir. Ters yon gecerli degil: gizli_mi = false olan
-- check-in'in gorunurluk degeri degistirilmez (case ifadesi bunu saglar).
--
-- Iki donusum yolu var, ikisi de guncelleniyor:
--   1) check_inden_ayril(p_check_in_id) RPC (kullanici "ayrildim" der)
--   2) pg_cron isi 'check-in-suresi-dolanlari-aniya-cevir' (4 saat dolunca)
--
-- check_inden_ayril govdesi 20260815110000_check_inden_ayril_rpc.sql'den
-- birebir kopyalandi (auth guard dahil); yalnizca update ifadesi genisledi.

create or replace function public.check_inden_ayril(p_check_in_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.check_inler
  set konum = null,
      gorunurluk = case when gizli_mi then 'kimse' else gorunurluk end
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and konum is not null;
end;
$$;

revoke execute on function public.check_inden_ayril from public, anon;
grant execute on function public.check_inden_ayril to authenticated;

-- Ayni jobname ile cagirmak isi degistirir, ikinci bir is yaratmaz.
select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler
     set konum = null,
         gorunurluk = case when gizli_mi then 'kimse' else gorunurluk end
     where konum is not null and bitis_zamani <= now(); $$
);
