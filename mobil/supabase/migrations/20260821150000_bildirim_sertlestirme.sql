-- Bildirimler Task 2 incelemesi: uc sertlestirme.
--
-- 1) `net` semasi kilitlendi. pg_net'in kuyruk tablolari kurulusta
--    PUBLIC'e ALL veriyor ve `net.http_request_queue.headers` sutunu
--    `X-Bildirim-Sir` degerini DUZ METIN tutuyor. Bugun tek engel
--    PostgREST'in sema expose listesi - tek bir config dugmesi sirri
--    her authenticated kullaniciya acar.
-- 2) `bildirim.olay_gonder()` payload'a `aktor_id` ekliyor.
-- 3) `public.bildirim_kurulum_ozeti()` kacak kontrolu genisletildi.

-- ---------------------------------------------------------------------
-- 1) net semasi
-- ---------------------------------------------------------------------
-- SIRA ONEMLI ve duz bir revoke tetikleyiciyi KIRAR.
--
-- `bildirim.olay_gonder()` security definer ve sahibi `postgres`.
-- Ama postgres'in `net.http_request_queue` uzerindeki INSERT yetkisi
-- YALNIZCA PUBLIC uzerinden geliyor: tablonun relacl'inde ayri bir
-- `postgres=` girdisi yok, yalnizca `=arwdDxtm` (PUBLIC, ALL) var.
-- Yani PUBLIC'ten revoke etmek postgres'i de yetkisiz birakir ve her
-- bildirim denemesi kuyruga yazamadan patlar (asil islemi dusurmez -
-- olay_gonder'deki exception blogu yakalar - ama bildirim hic gitmez).
--
-- Dogru sira: once PUBLIC'ten al, sonra postgres'e ACIKCA geri ver.
revoke all on all tables in schema net from public;
revoke usage on schema net from public, anon, authenticated;
grant usage on schema net to postgres, service_role;
grant all on all tables in schema net to postgres;

-- ---------------------------------------------------------------------
-- 2) olay_gonder: aktor_id + search_path sertlestirmesi
-- ---------------------------------------------------------------------
-- `aktor_id` = islemi YAPAN kisi. T3 kurali: alici == aktor ise bildirim
-- gonderilmez.
--
-- Cozdugu somut kusur: karsilikli takipte iki taraf da birbirine istek
-- gondermisse, kabul edenin ayna insert'i `on conflict do update` ile
-- karsi satiri da beklemede -> kabul yapar; o UPDATE'in
-- `takip_eden_id`'si KABUL EDENIN KENDISIDIR, yani kisi kendi eylemi
-- icin bildirim alirdi. Ayni alan kendi mesajina bildirim gibi butun
-- oz-bildirim siniflarini yapisal olarak kapatiyor - T3'un olay bazinda
-- ozel kural yazmasi gerekmiyor.
--
-- `auth.uid()` trigger baglaminda RPC'yi cagiran kullanicidir. Service
-- role ile ya da dogrudan SQL ile yazildiginda NULL olur; null payload'a
-- oldugu gibi konur ve T3 bunu "aktor bilinmiyor, gonder" diye yorumlar.
--
-- search_path artik `''` (sir_oku ile ayni sertlik): butun referanslar
-- zaten tam nitelikli, `public` aramasina ihtiyac yok.
create or replace function bildirim.olay_gonder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_govde jsonb;
  v_sir text;
  v_aktor uuid;
begin
  v_aktor := auth.uid();

  if tg_table_name = 'mesajlar' then
    v_govde := jsonb_build_object(
      'olay', 'mesaj',
      'mesaj_id', new.id,
      'konusma_id', new.konusma_id,
      'gonderen_id', new.gonderen_id,
      'aktor_id', v_aktor
    );

  elsif tg_table_name = 'takipler' then
    -- INSERT yalnizca 'beklemede' satirlar icin atesleniyor (WHEN
    -- kosulu tetikleyici tanimida), UPDATE yalnizca beklemede -> kabul.
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'takip_istegi' else 'takip_kabul' end,
      'takip_eden_id', new.takip_eden_id,
      'takip_edilen_id', new.takip_edilen_id,
      'aktor_id', v_aktor
    );

  elsif tg_table_name = 'sohbet_istekleri' then
    -- Tablodaki sutun adi `alan_id`; sozlesmedeki alan adi `hedef_id`.
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'sohbet_istegi' else 'sohbet_kabul' end,
      'gonderen_id', new.gonderen_id,
      'hedef_id', new.alan_id,
      'aktor_id', v_aktor
    );

  else
    -- Tanimadigimiz bir tabloya baglanmissa sessizce hicbir sey yapma;
    -- yanlis bicimli bir govde gondermekten iyidir.
    return null;
  end if;

  -- Bildirim yolundaki HICBIR hata asil islemi dusurmemeli: mesaj
  -- yazilamamasi, bildirim gonderilememesinden cok daha kotu. pg_net
  -- zaten asenkron ve teslim hatalarini yutuyor, ama kuyruga YAZMA
  -- hatasi (extension yok, kuyruk tablosu yetkisi, Vault okunamiyor)
  -- ayni transaction'da patlar - bu blok onu da yakalar.
  begin
    v_sir := bildirim.sir_oku();

    if v_sir is null then
      -- Sirri log'a yazmiyoruz; yalnizca yoklugunu bildiriyoruz.
      raise warning 'bildirim: Vault''ta bildirim_siri yok, bildirim gonderilmedi (tablo=%)', tg_table_name;
      return null;
    end if;

    perform net.http_post(
      url := 'https://swpiibyuoffykbmirvgq.supabase.co/functions/v1/bildirim-gonder',
      body := v_govde,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Bildirim-Sir', v_sir
      )
    );
  exception when others then
    -- sqlerrm BILEREK basilmiyor: hata metni cagri parametrelerini
    -- (dolayisiyla basliktaki sirri) tasiyabilir. Teshis icin tablo,
    -- islem ve sqlstate yetiyor.
    raise warning 'bildirim gonderilemedi (tablo=%, op=%, sqlstate=%)', tg_table_name, tg_op, sqlstate;
  end;

  return null;
end;
$$;

revoke all on function bildirim.olay_gonder() from public;
revoke all on function bildirim.olay_gonder() from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Dogrulama penceresi: gercek kacak kontrolu
-- ---------------------------------------------------------------------
-- Onceki surum tetikleyicileri `relname in ('mesajlar','takipler',
-- 'sohbet_istekleri')` ile suzuyordu; baska bir tabloya eklenecek
-- altinci bir bildirim tetikleyicisi "tam bes" iddiasinin altindan
-- gorunmeden gecerdi. Artik filtre TABLOYA degil FONKSIYONA bakiyor
-- (`tgfoid`), yani `public` semasindaki her tablo taraniyor ve
-- ad tahminine de guvenilmiyor.
--
-- Not: pg_net `extensions` semasina kuruluyor ama objelerini `net`
-- semasinda yaratiyor; asagidaki kontroller bu yuzden `net.*` adlarina
-- bakiyor. `to_regclass` sarmalayicisi tablolar yoksa fonksiyonun
-- patlamamasi icin.
create or replace function public.bildirim_kurulum_ozeti()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'sema_var', exists (select 1 from pg_catalog.pg_namespace where nspname = 'bildirim'),
    'sema_usage_anon', pg_catalog.has_schema_privilege('anon', 'bildirim', 'usage'),
    'sema_usage_authenticated', pg_catalog.has_schema_privilege('authenticated', 'bildirim', 'usage'),
    'sema_usage_service_role', pg_catalog.has_schema_privilege('service_role', 'bildirim', 'usage'),
    'sir_oku_anon', pg_catalog.has_function_privilege('anon', 'bildirim.sir_oku()', 'execute'),
    'sir_oku_authenticated', pg_catalog.has_function_privilege('authenticated', 'bildirim.sir_oku()', 'execute'),
    'sir_oku_service_role', pg_catalog.has_function_privilege('service_role', 'bildirim.sir_oku()', 'execute'),
    'olay_gonder_anon', pg_catalog.has_function_privilege('anon', 'bildirim.olay_gonder()', 'execute'),
    'olay_gonder_authenticated', pg_catalog.has_function_privilege('authenticated', 'bildirim.olay_gonder()', 'execute'),
    'pg_net_kurulu', exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net'),
    -- Fonksiyon KAYNAGI disari verilmiyor, yalnizca iki bayrak: payload'da
    -- aktor_id var mi ve search_path sertlestirildi mi. Trigger tanimina
    -- bakmak bunlari goremez (govde tanimda gecmez).
    'olay_gonder_aktor_alani', (
      select pg_catalog.pg_get_functiondef('bildirim.olay_gonder()'::regprocedure)
        like '%''aktor_id''%'
    ),
    'olay_gonder_search_path', (
      select pg_catalog.array_to_string(p.proconfig, ',')
      from pg_catalog.pg_proc p
      where p.oid = 'bildirim.olay_gonder()'::regprocedure
    ),
    -- Sir pg_net kuyrugunda duz metin duruyor; bu bayraklarin hepsi
    -- false kalmali, aksi halde tek bir PostgREST ayari sirri acar.
    'net_usage_anon', pg_catalog.has_schema_privilege('anon', 'net', 'usage'),
    'net_usage_authenticated', pg_catalog.has_schema_privilege('authenticated', 'net', 'usage'),
    'net_kuyruk_anon', case
      when pg_catalog.to_regclass('net.http_request_queue') is null then null
      else pg_catalog.has_table_privilege('anon', 'net.http_request_queue', 'select')
    end,
    'net_kuyruk_authenticated', case
      when pg_catalog.to_regclass('net.http_request_queue') is null then null
      else pg_catalog.has_table_privilege('authenticated', 'net.http_request_queue', 'select')
    end,
    'net_yanit_anon', case
      when pg_catalog.to_regclass('net._http_response') is null then null
      else pg_catalog.has_table_privilege('anon', 'net._http_response', 'select')
    end,
    'net_yanit_authenticated', case
      when pg_catalog.to_regclass('net._http_response') is null then null
      else pg_catalog.has_table_privilege('authenticated', 'net._http_response', 'select')
    end,
    -- Pozitif kontrol: kilit topyekun degil. postgres kuyruga hala
    -- yazabiliyor olmali, yoksa hicbir bildirim gitmez.
    'net_usage_postgres', pg_catalog.has_schema_privilege('postgres', 'net', 'usage'),
    'net_kuyruk_postgres_insert', case
      when pg_catalog.to_regclass('net.http_request_queue') is null then null
      else pg_catalog.has_table_privilege('postgres', 'net.http_request_queue', 'insert')
    end,
    'tetikleyiciler', coalesce((
      select jsonb_object_agg(t.tgname, pg_catalog.pg_get_triggerdef(t.oid))
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal
        and n.nspname = 'public'
        and t.tgfoid = 'bildirim.olay_gonder()'::regprocedure
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.bildirim_kurulum_ozeti() from public;
revoke all on function public.bildirim_kurulum_ozeti() from anon, authenticated;
grant execute on function public.bildirim_kurulum_ozeti() to service_role;

notify pgrst, 'reload schema';
