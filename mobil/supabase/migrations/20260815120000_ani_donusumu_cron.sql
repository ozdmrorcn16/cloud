create extension if not exists pg_cron;

select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler set konum = null where konum is not null and bitis_zamani <= now(); $$
);
