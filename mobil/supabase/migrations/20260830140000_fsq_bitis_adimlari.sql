-- ---------------------------------------------------------------- --
-- Foursquare tek kaynak - BITIS ADIMLARI (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Aktarim bitti: 5.980.471 Foursquare satiri mekanlar'da. Kullanicinin
-- onayi (aksam): "check-in yapilmis 16 mekan da silinebilir, test
-- icindi; test icin yapilmis seyleri sil, Foursquare ile yeni temiz bir
-- konum verisi baslat." Yani BUTUN Overture satirlari silinir; onlara
-- bagli test check-in'leri ve etiketleri cascade ile gider. Kullanici
-- hesaplari, profiller ve otomatik testlerin kullandigi uc 'kullanici'
-- kaynakli test mekani (GORUNURLUK-TEST-*) KALIR.
--
-- Her adim ayri cron kosumunda (uzun DDL'ler HTTP/MCP zaman asimina
-- takilmasin); durum `fsq_bitis` tablosunda, advisory lock ust uste
-- binmeyi keser. Sira:
--   1 Overture silinir
--   2 Overture satirina baglanmis 11 Foursquare kaydi eklenir
--     (islendi sifirlanir, fsq_aktar tum ulke - on conflict atlar)
--   3 mekanlar_konum_idx (gist)      4 mekanlar_ad_trgm_idx (gin)
--   5 tur/kategori indeksleri        6 fsq_hazirlik bosaltilir, is kapanir
-- Canliya MCP apply_migration ile uygulandi (fsq_bitis_adimlari).

select cron.unschedule('fsq-aktarim');

create table if not exists public.fsq_bitis (
  tek boolean primary key default true check (tek),
  adim integer not null default 1,
  not_ text,
  guncellendi timestamptz not null default now()
);
insert into public.fsq_bitis (adim) values (1) on conflict do nothing;
alter table public.fsq_bitis enable row level security;
revoke all on public.fsq_bitis from anon, authenticated;

create or replace function public.fsq_bitis_adimi()
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_adim integer;
  v_adet bigint;
begin
  if not pg_try_advisory_xact_lock(424243) then
    return;
  end if;
  select adim into v_adim from public.fsq_bitis;

  if v_adim = 1 then
    delete from public.mekanlar m where m.kaynak = 'overture';
    get diagnostics v_adet = row_count;
    update public.fsq_bitis set adim = 2, not_ = 'overture silindi: ' || v_adet, guncellendi = now();

  elsif v_adim = 2 then
    update public.fsq_hazirlik set islendi = false where islendi;
    v_adet := public.fsq_aktar(25.6, 44.9);
    update public.fsq_bitis set adim = 3, not_ = 'eksik Foursquare eklendi: ' || v_adet, guncellendi = now();

  elsif v_adim = 3 then
    create index if not exists mekanlar_konum_idx on public.mekanlar using gist (konum);
    update public.fsq_bitis set adim = 4, not_ = 'konum indeksi kuruldu', guncellendi = now();

  elsif v_adim = 4 then
    create index if not exists mekanlar_ad_trgm_idx
      on public.mekanlar using gin (public.tr_kucuk(ad) extensions.gin_trgm_ops);
    update public.fsq_bitis set adim = 5, not_ = 'trgm indeksi kuruldu', guncellendi = now();

  elsif v_adim = 5 then
    create index if not exists mekanlar_tur_idx on public.mekanlar (tur);
    create index if not exists mekanlar_kategori_idx on public.mekanlar (kategori);
    update public.fsq_bitis set adim = 6, not_ = 'tur/kategori indeksleri kuruldu', guncellendi = now();

  elsif v_adim = 6 then
    truncate table public.fsq_hazirlik;
    update public.fsq_bitis set adim = 7, not_ = 'hazirlik bosaltildi; BITTI', guncellendi = now();
    perform cron.unschedule('fsq-bitis');
  end if;
end;
$function$;
revoke all on function public.fsq_bitis_adimi() from public, anon, authenticated;

select cron.schedule('fsq-bitis', '* * * * *', $$set statement_timeout = '0'; select public.fsq_bitis_adimi();$$);
