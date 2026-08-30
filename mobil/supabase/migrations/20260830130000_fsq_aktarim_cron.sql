-- ---------------------------------------------------------------- --
-- Foursquare aktarimi SUNUCUDA, pg_cron ile (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Istemciden (PostgREST) dilim dilim cagirmak en kucuk compute'ta
-- calismadi: disk kotasi tukenince bir dilim 60 sn'lik gateway sinirini
-- asiyor, istemci vazgeciyor ama ifade sunucuda suruyor, tekrar deneme
-- onunla kilit yarisina giriyor. Cozum: aktarim tamamen sunucuda,
-- pg_cron her dakika bir adim atar; adim en fazla ~50 sn calisir,
-- ilerlemeyi tabloya yazar, ust uste binmeyi advisory lock keser.
--
-- Bitince: cron.unschedule('fsq-aktarim'); indeksler yeniden kurulur
-- (bkz. CLAUDE.md devir notu).

create table if not exists public.fsq_aktarim_ilerleme (
  bant integer primary key,
  lng0 double precision not null,
  lng1 double precision not null,
  simdiki double precision not null,
  eklenen bigint not null default 0,
  bitti boolean not null default false,
  guncellendi timestamptz not null default now()
);
alter table public.fsq_aktarim_ilerleme enable row level security;
revoke all on public.fsq_aktarim_ilerleme from anon, authenticated;

-- Onceki istemci kosumlarinin kaldigi yerler (2,4 milyon satir zaten aktarildi).
insert into public.fsq_aktarim_ilerleme (bant, lng0, lng1, simdiki) values
  (1, 28.70, 32.00, 28.70),
  (2, 36.10, 38.00, 36.10),
  (3, 38.30, 44.90, 38.30)
on conflict (bant) do nothing;

create or replace function public.fsq_aktarim_adimi()
returns void
language plpgsql
security definer
set search_path to 'public'
set statement_timeout to '3600s'
as $function$
declare
  v_baslangic timestamptz := clock_timestamp();
  v_bant record;
  v_adet integer;
  v_dilim constant double precision := 0.02;
begin
  -- Onceki adim hala calisiyorsa bu adim hic dokunmadan cikar.
  if not pg_try_advisory_xact_lock(424242) then
    return;
  end if;

  loop
    -- Zaman butcesi: cron dakikada bir; bir adim 45 sn'yi gecmesin.
    exit when clock_timestamp() - v_baslangic > interval '45 seconds';

    select * into v_bant from public.fsq_aktarim_ilerleme
    where not bitti order by bant limit 1;
    exit when not found;

    v_adet := public.fsq_aktar(v_bant.simdiki, least(v_bant.simdiki + v_dilim, v_bant.lng1));

    update public.fsq_aktarim_ilerleme
       set simdiki = least(v_bant.simdiki + v_dilim, v_bant.lng1),
           eklenen = eklenen + v_adet,
           bitti = (v_bant.simdiki + v_dilim >= v_bant.lng1),
           guncellendi = now()
     where bant = v_bant.bant;
  end loop;
end;
$function$;

revoke all on function public.fsq_aktarim_adimi() from public, anon, authenticated;

select cron.schedule('fsq-aktarim', '* * * * *', 'select public.fsq_aktarim_adimi()');
