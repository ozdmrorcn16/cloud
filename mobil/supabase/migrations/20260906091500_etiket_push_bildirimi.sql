-- ETIKET OLAYLARI PUSH BILDIRIM ZINCIRINE GIRIYOR
--
-- Kullanicinin istegi (2026-09-06): "Push bildirimine ekle."
--
-- 20260906090000 etiket onayini bir gizlilik ayari yapmisti; onay
-- isteyen kisiye "seni etiketlemek istiyor" bildirimi YALNIZCA
-- uygulama ici bildirim ekraninda gorunuyordu. Uygulama kapaliyken
-- kimse haberdar olmuyordu, yani onay bekleyen etiket gunlerce
-- oylece kalabilirdi.
--
-- IKI AYRI OLAY uretiliyor, cunku metin farkli:
--   durum = 'bekliyor'   -> etiket_istegi   "X seni etiketlemek istiyor"
--   durum = 'onaylandi'  -> etiket_eklendi  "X seni bir check-in'de etiketledi"
-- Durumu 20260906090000'deki BEFORE INSERT tetikleyicisi belirliyor,
-- yani buraya gelen deger hedefin ayarini zaten yansitiyor.
--
-- ETIKETLEYENIN KIMLIGI GOVDEDE YOK, check-in'den okunuyor:
-- `check_in_etiketleri` satiri kimin etiketledigini tasimiyor; sahip
-- check-in'in sahibidir. Check-in bulunamazsa bildirim gonderilmiyor
-- (adsiz bir bildirim uretmektense hic uretmemek dogru).
--
-- Edge Function tarafi bu olaylari `saf.ts` ve `index.ts` icinde
-- karsiliyor; `kaynakDogrula` hem etiket satirini hem check-in'in
-- sahibini dogruluyor, boylece sahte bir `etiketleyen_id` ile
-- bildirimde YANLIS AD gosterilemiyor.

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
  v_etiketleyen uuid;
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
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'takip_istegi' else 'takip_kabul' end,
      'takip_eden_id', new.takip_eden_id,
      'takip_edilen_id', new.takip_edilen_id,
      'aktor_id', v_aktor
    );

  elsif tg_table_name = 'sohbet_istekleri' then
    v_govde := jsonb_build_object(
      'olay', case when tg_op = 'INSERT' then 'sohbet_istegi' else 'sohbet_kabul' end,
      'gonderen_id', new.gonderen_id,
      'hedef_id', new.alan_id,
      'aktor_id', v_aktor
    );

  elsif tg_table_name = 'check_in_etiketleri' then
    select kullanici_id into v_etiketleyen
    from public.check_inler where id = new.check_in_id;

    if v_etiketleyen is null then
      return null;
    end if;

    v_govde := jsonb_build_object(
      'olay', case when new.durum = 'bekliyor' then 'etiket_istegi' else 'etiket_eklendi' end,
      'check_in_id', new.check_in_id,
      'etiketlenen_id', new.kullanici_id,
      'etiketleyen_id', v_etiketleyen,
      'aktor_id', v_aktor
    );

  else
    return null;
  end if;

  begin
    v_sir := bildirim.sir_oku();

    if v_sir is null then
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
    raise warning 'bildirim: kuyruga yazilamadi (tablo=%)', tg_table_name;
  end;

  return null;
end;
$$;

drop trigger if exists etiket_bildirimi on public.check_in_etiketleri;
create trigger etiket_bildirimi
  after insert on public.check_in_etiketleri
  for each row execute function bildirim.olay_gonder();
