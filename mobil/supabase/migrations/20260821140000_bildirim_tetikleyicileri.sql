-- Bildirimler Task 2: Vault sirri okuma fonksiyonu ve olay tetikleyicileri.
--
-- Akis: mesajlar / takipler / sohbet_istekleri tablosundaki bir yazma
-- -> AFTER trigger -> pg_net ile Edge Function'a POST -> Edge Function
-- aliciyi ve gonderen adini kendisi okur, Expo Push API'ye iletir.
--
-- Sir (`bildirim_siri`) Vault'ta durur ve BU DOSYADA HICBIR YERDE
-- gecmez: migrasyon `vault.create_secret` cagirmaz, sirri log'a yazmaz,
-- hata mesajina koymaz. Yalnizca okuyan fonksiyonu kurar.

-- pg_net bu projede kurulu degil; asenkron HTTP cagrisini o sagliyor.
create extension if not exists pg_net with schema extensions;

-- Ayri sema, `bag` ve `gizli` ile ayni gerekce: security definer
-- yardimcilar public'te durursa PostgREST bunlari istemciye RPC olarak
-- sunar. Bildirim yardimcilarindan biri Vault sirrini donduruyor, yani
-- burada gerekce guvenlik acisindan daha da baglayici.
create schema if not exists bildirim;

-- Sema kullanimi YALNIZCA service_role'e aciliyor. anon/authenticated'a
-- usage verilmiyor; boylece fonksiyon ACL'i yanlislikla gevsetilse bile
-- ikinci bir kapi kapali kaliyor.
grant usage on schema bildirim to service_role;

-- ---------------------------------------------------------------------
-- Sirri okuyan fonksiyon
-- ---------------------------------------------------------------------
-- Sir veritabani icinde uretildi ve Vault'ta duruyor; degeri depoda
-- yok. `vault.decrypted_secrets` gorunumunu yalnizca ayricalikli roller
-- okuyabilir, bu yuzden okuma security definer bir sarmalayiciyla
-- yapiliyor ve sarmalayicinin EXECUTE yetkisi service_role disinda
-- herkesten geri aliniyor.
create or replace function bildirim.sir_oku()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select s.decrypted_secret
  from vault.decrypted_secrets s
  where s.name = 'bildirim_siri'
  limit 1;
$$;

-- `create function` varsayilan olarak PUBLIC'e EXECUTE verir; asil
-- kapatma bu revoke. anon/authenticated ayrica ve acikca yaziliyor ki
-- niyet dosyadan okunabilsin.
revoke all on function bildirim.sir_oku() from public;
revoke all on function bildirim.sir_oku() from anon, authenticated;
grant execute on function bildirim.sir_oku() to service_role;

-- ---------------------------------------------------------------------
-- Trigger fonksiyonu
-- ---------------------------------------------------------------------
-- Tek fonksiyon, TG_TABLE_NAME/TG_OP ile ayrisiyor: bes olayin govdesi
-- de ayni sekilde uretilip ayni adrese gidiyor, ayirmak kod tekrari
-- olurdu.
--
-- Payload YALNIZCA isaretci tasir (id'ler). Ad, metin, telefon gibi
-- hicbir icerik gitmez; Edge Function ilgili satirlari service role ile
-- kendisi okur. Sebep: pg_net kuyrugu ve HTTP gunlukleri kisisel veri
-- tasimasin.
create or replace function bildirim.olay_gonder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_govde jsonb;
  v_sir text;
begin
  if tg_table_name = 'mesajlar' then
    v_govde := jsonb_build_object(
      'olay', 'mesaj',
      'mesaj_id', new.id,
      'konusma_id', new.konusma_id,
      'gonderen_id', new.gonderen_id
    );

  elsif tg_table_name = 'takipler' then
    -- INSERT yalnizca 'beklemede' satirlar icin atesleniyor (WHEN
    -- kosulu asagida), UPDATE yalnizca beklemede -> kabul gecisi icin.
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'takip_istegi' else 'takip_kabul' end,
      'takip_eden_id', new.takip_eden_id,
      'takip_edilen_id', new.takip_edilen_id
    );

  elsif tg_table_name = 'sohbet_istekleri' then
    -- Tablodaki sutun adi `alan_id`; sozlesmedeki alan adi `hedef_id`.
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'sohbet_istegi' else 'sohbet_kabul' end,
      'gonderen_id', new.gonderen_id,
      'hedef_id', new.alan_id
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
-- Tetikleyiciler
-- ---------------------------------------------------------------------

-- Yeni mesaj. mesajlar tablosuna yalnizca mesaj_gonder RPC'si yaziyor,
-- yani her INSERT zaten bag.yazabilir_mi kapisindan gecmis demek
-- (karar 50: engelleme icin ikinci kontrol katmani yok).
drop trigger if exists mesaj_bildirimi on public.mesajlar;
create trigger mesaj_bildirimi
  after insert on public.mesajlar
  for each row
  execute function bildirim.olay_gonder();

-- Takip istegi. WHEN kosulu KRITIK: takip karsilikli oldugu icin
-- takip_istegini_yanitla, kabul kolunda `takipler` tablosuna
-- durum='kabul' olan bir AYNA SATIR da INSERT ediyor
-- (20260820123552_takip_karsilikli.sql). O insert bir istek degil,
-- bagin ikinci yonu; bildirim uretmemeli. `new.durum = 'beklemede'`
-- filtresi onu disariyor.
drop trigger if exists takip_istegi_bildirimi on public.takipler;
create trigger takip_istegi_bildirimi
  after insert on public.takipler
  for each row
  when (new.durum = 'beklemede')
  execute function bildirim.olay_gonder();

-- Takip kabulu. Alici, istegi GONDEREN taraf (takip_eden_id); Edge
-- Function bunu olay adindan biliyor.
drop trigger if exists takip_kabul_bildirimi on public.takipler;
create trigger takip_kabul_bildirimi
  after update on public.takipler
  for each row
  when (old.durum = 'beklemede' and new.durum = 'kabul')
  execute function bildirim.olay_gonder();

-- Sohbet istegi ve kabulu. Yapi takipler ile birebir ayni.
drop trigger if exists sohbet_istegi_bildirimi on public.sohbet_istekleri;
create trigger sohbet_istegi_bildirimi
  after insert on public.sohbet_istekleri
  for each row
  when (new.durum = 'beklemede')
  execute function bildirim.olay_gonder();

drop trigger if exists sohbet_kabul_bildirimi on public.sohbet_istekleri;
create trigger sohbet_kabul_bildirimi
  after update on public.sohbet_istekleri
  for each row
  when (old.durum = 'beklemede' and new.durum = 'kabul')
  execute function bildirim.olay_gonder();

-- ---------------------------------------------------------------------
-- Dogrulama penceresi (test:sema icin)
-- ---------------------------------------------------------------------
-- `bildirim` semasi PostgREST'e acilmadigi ve pg_catalog'a PostgREST
-- uzerinden erisilemedigi icin, kurulumu disaridan dogrulamanin baska
-- yolu yok. Bu fonksiyon YALNIZCA dogrulama icindir; uygulama kodu
-- cagirmaz.
--
-- `security invoker` (varsayilan) bilerek: hicbir role fazladan
-- ayricalik vermiyor, yalnizca service_role'un zaten sahip oldugu
-- katalog okumasina PostgREST uzerinden bir pencere aciyor. Sir
-- dondurmez, yalnizca yetki bayraklari ve tetikleyici tanimlari.
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
    'pg_net_kurulu', exists (select 1 from pg_catalog.pg_extension where extname = 'pg_net'),
    'tetikleyiciler', coalesce((
      select jsonb_object_agg(t.tgname, pg_catalog.pg_get_triggerdef(t.oid))
      from pg_catalog.pg_trigger t
      join pg_catalog.pg_class c on c.oid = t.tgrelid
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where not t.tgisinternal
        and n.nspname = 'public'
        and c.relname in ('mesajlar', 'takipler', 'sohbet_istekleri')
    ), '{}'::jsonb)
  );
$$;

revoke all on function public.bildirim_kurulum_ozeti() from public;
revoke all on function public.bildirim_kurulum_ozeti() from anon, authenticated;
grant execute on function public.bildirim_kurulum_ozeti() to service_role;

notify pgrst, 'reload schema';
