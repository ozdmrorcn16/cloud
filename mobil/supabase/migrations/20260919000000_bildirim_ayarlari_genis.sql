-- BILDIRIM AYARLARI - REFERANS EKRAN (2026-09-19, kullanicinin gorseli):
--   Anlik bildirimler (ana anahtar)          -> bildirim_anlik
--   Arkadaslik istekleri                     -> bildirim_arkadas (takip_*)
--   Mesajlar (mesajlar + mesaj istekleri)    -> bildirim_mesaj (mesaj, sohbet_*)
--   Etiketler (istek + onay)                 -> bildirim_ani (etiket_*)
--   Ani hatirlatmalari ("bir yil once bugun") -> bildirim_ani_hatirlatma
--   Gece sessize al (22.00-08.00 yerel)      -> sessiz_gece + saat_dilimi
-- "Mekan onerileri" BILEREK YOK: arkada oneri ureten bir sey yok;
-- sahte anahtar koymak "yaklasik" olurdu.
--
-- Sohbet olaylari 2026-09-18'de "arkadas" anahtarindaydi; referans
-- "Mesajlar - yeni mesajlar ve mesaj istekleri" dedigi icin mesaj
-- anahtarina tasindi (Edge Function surum 7).
--
-- ANI HATIRLATMASI: gunluk pg_cron isi (07:00 UTC = 10:00 TR) tam bir
-- yil onceki (ayni gun) check-in'i olan ve anahtari ACIK kullanicilara
-- Edge Function uzerinden push atar (olay `ani_hatirlatma`; EF
-- check-in'in kisiye ait oldugunu dogrular). Gunde kisi basina en
-- fazla bir (en yeni check-in).
--
-- GECE SESSIZI: EF alicinin `saat_dilimi`ne (istemci Intl'den yazar,
-- ornek Europe/Istanbul) gore yerel saati hesaplar; 22-08 arasi push
-- atmaz. Uygulama ici liste etkilenmez (ekrandaki not).

alter table public.profiller
  add column if not exists bildirim_anlik boolean not null default true,
  add column if not exists bildirim_ani_hatirlatma boolean not null default false,
  add column if not exists sessiz_gece boolean not null default false,
  add column if not exists saat_dilimi text;

grant update (bildirim_anlik, bildirim_ani_hatirlatma, sessiz_gece, saat_dilimi)
  on public.profiller to authenticated;

-- Gunluk ani hatirlatmasi: pg_net ile EF'ye olay yollar (olay_gonder ile
-- ayni sir basligi).
create or replace function bildirim.ani_hatirlatmalarini_gonder()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sir text;
  v_sayac integer := 0;
  r record;
begin
  v_sir := bildirim.sir_oku();
  if v_sir is null then
    raise warning 'bildirim: Vault''ta bildirim_siri yok, ani hatirlatmasi gonderilmedi';
    return 0;
  end if;

  for r in
    select distinct on (c.kullanici_id) c.kullanici_id, c.id as check_in_id
    from public.check_inler c
    join public.profiller p on p.id = c.kullanici_id
    where p.bildirim_ani_hatirlatma
      and p.bildirim_anlik
      and c.moderasyon_gizli = false
      and (c.olusturma_zamani at time zone 'Europe/Istanbul')::date
          = (now() at time zone 'Europe/Istanbul')::date - interval '1 year'
    order by c.kullanici_id, c.olusturma_zamani desc
  loop
    begin
      perform net.http_post(
        url := 'https://swpiibyuoffykbmirvgq.supabase.co/functions/v1/bildirim-gonder',
        body := jsonb_build_object(
          'olay', 'ani_hatirlatma',
          'kullanici_id', r.kullanici_id,
          'check_in_id', r.check_in_id,
          'aktor_id', null
        ),
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-Bildirim-Sir', v_sir)
      );
      v_sayac := v_sayac + 1;
    exception when others then
      raise warning 'bildirim: ani hatirlatmasi kuyruga yazilamadi (%)', r.kullanici_id;
    end;
  end loop;
  return v_sayac;
end;
$$;

revoke all on function bildirim.ani_hatirlatmalarini_gonder() from public;

select cron.unschedule(jobid) from cron.job where jobname = 'ani-hatirlatmalari';
select cron.schedule(
  'ani-hatirlatmalari',
  '0 7 * * *',
  $$select bildirim.ani_hatirlatmalarini_gonder()$$
);
