-- BEGENI VE YORUM BILDIRIMLERI (kullanicinin istegi 2026-09-22: "begeni
-- ve yorum yapan kisilerden bildirim gelsin, bildirimlerde de gorunsun").
--
-- 1) profiller.bildirim_etkilesim: yeni push anahtari ("Begeniler ve
--    yorumlar"), varsayilan acik; authenticated UPDATE yetkisi ACIKCA
--    (2026-09-18 dersi: sutun eklenip yetki verilmeyince anahtar hic
--    kaydedilemiyordu).
-- 2) bildirim.olay_gonder: iki yeni kol -
--      begeniler INSERT -> olay 'begeni'  {check_in_id, begenen_id, sahip_id}
--      yorumlar  INSERT -> olay 'yorum'   {check_in_id, yorum_id, yorumlayan_id, sahip_id}
--    Alici check-in'in SAHIBI (sahip_id govdede gider; Edge Function
--    kaynak satirdan yeniden dogrular). Kisi kendi paylasimini
--    begenir/yorumlarsa olay hic uretilmez. Gizli (sikayet/moderasyon)
--    yorum olay uretmez. Govde CANLI tanimla karsilastirildi
--    (pg_get_functiondef, 2026-09-22) - eski dosyadan kopyalanmadi.
-- 3) Tetikleyiciler: begeni_bildirimi, yorum_bildirimi.
--
-- Uygulama ici Bildirimler ekrani ayri tablo TUTMAZ: begeniler/yorumlar
-- satirlarini RLS ile (sahibi oldugum check-in'ler) dogrudan okur.

-- 1) tercih sutunu
alter table public.profiller
  add column if not exists bildirim_etkilesim boolean not null default true;

grant update (bildirim_etkilesim) on public.profiller to authenticated;

-- 2) olay_gonder
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
  v_sahip uuid;
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
    if tg_op = 'INSERT' and new.durum = 'kabul' then
      if coalesce(current_setting('bag.dogrudan_ekleme', true), '') <> '1'
         or new.takip_eden_id is distinct from v_aktor then
        return null;
      end if;
      v_govde := jsonb_build_object(
        'olay', 'takip_eklendi',
        'takip_eden_id', new.takip_eden_id,
        'takip_edilen_id', new.takip_edilen_id,
        'aktor_id', v_aktor
      );
    else
      v_govde := jsonb_build_object(
        'olay', case when tg_op = 'INSERT' then 'takip_istegi' else 'takip_kabul' end,
        'takip_eden_id', new.takip_eden_id,
        'takip_edilen_id', new.takip_edilen_id,
        'aktor_id', v_aktor
      );
    end if;

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

  elsif tg_table_name = 'begeniler' then
    -- BEGENI (2026-09-22): alici paylasimin sahibi; kendi paylasimini
    -- begenen icin olay yok.
    select kullanici_id into v_sahip
    from public.check_inler where id = new.check_in_id;
    if v_sahip is null or v_sahip = new.kullanici_id then
      return null;
    end if;
    v_govde := jsonb_build_object(
      'olay', 'begeni',
      'check_in_id', new.check_in_id,
      'begenen_id', new.kullanici_id,
      'sahip_id', v_sahip,
      'aktor_id', v_aktor
    );

  elsif tg_table_name = 'yorumlar' then
    -- YORUM (2026-09-22): gizli yorum (sikayet/moderasyon) ve kendi
    -- paylasimina yorum olay uretmez. Anonim yorum (kullanici_id null)
    -- olamaz - RLS insert'te kimlik ister.
    if new.kullanici_id is null or new.sikayet_gizli or new.moderasyon_gizli then
      return null;
    end if;
    select kullanici_id into v_sahip
    from public.check_inler where id = new.check_in_id;
    if v_sahip is null or v_sahip = new.kullanici_id then
      return null;
    end if;
    v_govde := jsonb_build_object(
      'olay', 'yorum',
      'check_in_id', new.check_in_id,
      'yorum_id', new.id,
      'yorumlayan_id', new.kullanici_id,
      'sahip_id', v_sahip,
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

-- 3) tetikleyiciler
drop trigger if exists begeni_bildirimi on public.begeniler;
create trigger begeni_bildirimi
  after insert on public.begeniler
  for each row execute function bildirim.olay_gonder();

drop trigger if exists yorum_bildirimi on public.yorumlar;
create trigger yorum_bildirimi
  after insert on public.yorumlar
  for each row execute function bildirim.olay_gonder();
