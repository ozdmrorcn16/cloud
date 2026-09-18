-- ACIK PROFILDE "ARKADAS EKLE" DOGRUDAN ARKADAS YAPAR (2026-09-18 aksam).
-- Kullanicinin karari: "profili herkese acik birisini arkadas ekleye
-- bastiginda istek gonderilmesine gerek kalmadan arkadas olarak eklemis
-- olur; profili gizli birisine arkadas ekleye basinca istek gonderilir."
--
-- `takip_istegi_gonder` artik hedefin `profil_gizli` alanina bakiyor:
--   * gizli  -> eskisi gibi 'beklemede' satiri (istek), 'beklemede' doner
--   * acik   -> IKI YONDE 'kabul' satiri (karsilikli bag; yanitla'daki
--               ayna deseniyle ayni), 'kabul' doner
-- Donus tipi void -> text oldugu icin drop + create. Istemci donen degere
-- gore dugmeyi "Beklemede" ya da "Arkadassin" yapar - tahmin etmez.
--
-- ON KONTROLLER DEGISMEDI: askidaki taraf, engelleme, gunluk 50 istek
-- siniri (`bag.istek_on_kontrol`) dogrudan eklemede de gecerli - aksi
-- halde acik profiller toplu ekleme icin sinirsiz bir yol olurdu.
-- Gunluk sayaca dogrudan ekleme de yaziliyor.
--
-- BILDIRIM: acik profildeki kisiye "X seni arkadas olarak ekledi" push'u
-- gitsin diye yeni olay `takip_eklendi`. Tetikleyici 'kabul' insert'inde
-- calisir; ama `takip_istegini_yanitla`nin AYNA insert'i de 'kabul' ve
-- o zaten 'takip_kabul' bildirimi uretiyor - cift bildirim olmasin diye
-- RPC islem-yerel bir ayar koyuyor (`bag.dogrudan_ekleme`), fonksiyon
-- yalnizca o ayar varken ve satirin takip_eden'i aktorken (ayna satir
-- degil) olay uretiyor.

-- -------------------------------------------------------------------
-- 1) bildirim.olay_gonder: takipler INSERT + durum 'kabul' -> takip_eklendi
--    Govde 20260906091500'den kopyalandi; yalnizca takipler kolu degisti.
-- -------------------------------------------------------------------
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
    if tg_op = 'INSERT' and new.durum = 'kabul' then
      -- Dogrudan ekleme: yalnizca RPC'nin koydugu islem-yerel ayar
      -- varken ve satir aktorun kendi yonuyse (ayna satir degil).
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

-- Tetikleyici: 'kabul' insert'i de fonksiyona gitsin (fonksiyon ayarsiz
-- cagriyi kendisi eliyor - yanitla'nin ayna insert'i boylece bildirim
-- uretmiyor, eski davranis korunuyor).
drop trigger if exists takip_eklendi_bildirimi on public.takipler;
create trigger takip_eklendi_bildirimi
  after insert on public.takipler
  for each row
  when (new.durum = 'kabul')
  execute function bildirim.olay_gonder();

-- -------------------------------------------------------------------
-- 2) takip_istegi_gonder: acik profilde dogrudan bag, sonucu doner
-- -------------------------------------------------------------------
drop function if exists public.takip_istegi_gonder(uuid);

create or replace function public.takip_istegi_gonder(p_kullanici_id uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gizli boolean;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  perform bag.istek_on_kontrol(p_kullanici_id);

  if exists (
    select 1 from public.takipler
    where takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id
  ) then
    raise exception 'Istegin zaten gonderilmis';
  end if;

  select p.profil_gizli into v_gizli
  from public.profiller p where p.id = p_kullanici_id;

  -- Profil satiri yoksa (kayit yarim) istek yolu: eski davranis.
  if coalesce(v_gizli, true) then
    begin
      insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
      values (auth.uid(), p_kullanici_id, 'beklemede');
    exception
      when unique_violation then
        raise exception 'Istegin zaten gonderilmis';
    end;

    insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
    return 'beklemede';
  end if;

  -- ACIK PROFIL: iki yon birden 'kabul'. Karsi tarafin bana zaten
  -- bekleyen bir istegi varsa o satir 'kabul'e cekilir (on conflict) ve
  -- o gecis zaten 'takip_kabul' bildirimini uretir; bu durumda
  -- `takip_eklendi` ayrica gonderilmiyor (cift push olmasin).
  if not exists (
    select 1 from public.takipler
    where takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid()
  ) then
    perform set_config('bag.dogrudan_ekleme', '1', true);
  end if;

  begin
    insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
    values (auth.uid(), p_kullanici_id, 'kabul');
  exception
    when unique_violation then
      raise exception 'Istegin zaten gonderilmis';
  end;

  insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
  values (p_kullanici_id, auth.uid(), 'kabul')
  on conflict (takip_eden_id, takip_edilen_id)
    do update set durum = 'kabul';

  insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
  return 'kabul';
end;
$$;

revoke execute on function public.takip_istegi_gonder(uuid) from public, anon;
grant execute on function public.takip_istegi_gonder(uuid) to authenticated;
