-- MESAJ IZINLERI (2026-09-18 gece, kullanicinin referans gorseli:
-- Gizlilik > Sosyal izinlerin > "Mesaj izinleri - Sana kimler mesaj
-- gonderebilir? - Arkadaslar / Herkes").
--
-- `profiller.mesaj_izni` (referans ekrandaki uc secenek):
--   'herkes'     varsayilan - bugune kadarki davranis: yabanci TEK mesaj
--                yazar, istek olur
--   'arkadaslar' yeni konusmayi yalnizca arkadaslar baslatir; yabancinin
--                istek yolu KAPALI
--   'hic_kimse'  yeni mesaj istegi YOK ve arkadas bile YENI konusma
--                acamaz; mevcut konusmalar surer (eski mesajlasma
--                kesilmez - kisi "beni rahat birak" demistir, "sustur"
--                degil)
-- Kural `mesaj_gonder` icinde. Hata metni MEVCUT olanla ayni ("Bu kisiye
-- su an mesaj gonderemezsin") - sessizlik ilkesi: tercih disaridan
-- sorgulanabilir olmasin.
--
-- Govde canli tanimdan (pg_get_functiondef, 2026-09-18) kopyalandi;
-- degisen yalnizca `elsif not exists` dalindaki izin kontrolu.
-- Sonraki degisiklik BU dosyadan devam etmeli.

alter table public.profiller
  add column if not exists mesaj_izni text not null default 'herkes';

alter table public.profiller
  drop constraint if exists profiller_mesaj_izni_check;
alter table public.profiller
  add constraint profiller_mesaj_izni_check
  check (mesaj_izni in ('herkes', 'arkadaslar', 'hic_kimse'));

grant update (mesaj_izni) on public.profiller to authenticated;

create or replace function public.mesaj_gonder(p_kullanici_id uuid, p_metin text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_anahtar text;
  v_konusma_id uuid;
  v_yeni_istek boolean := false;
  v_izin text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kullanici_id = auth.uid() then
    raise exception 'Kendine mesaj gonderemezsin';
  end if;

  if p_metin is null or length(trim(p_metin)) = 0 then
    raise exception 'Mesaj bos olamaz';
  end if;

  if length(trim(p_metin)) > 2000 then
    raise exception 'Mesaj cok uzun';
  end if;

  select p.mesaj_izni into v_izin from public.profiller p where p.id = p_kullanici_id;

  if bag.yazabilir_mi(p_kullanici_id) then
    -- Bagli ya da kabul edilmis: sinirsiz... 'hic_kimse' disinda: o
    -- zaman yalnizca MEVCUT konusma surer, yeni konusma acilmaz.
    if coalesce(v_izin, 'herkes') = 'hic_kimse' and not exists (
      select 1 from public.konusmalar k
      where k.birebir_anahtar = least(auth.uid()::text, p_kullanici_id::text)
                                || ':' ||
                                greatest(auth.uid()::text, p_kullanici_id::text)
    ) then
      raise exception 'Bu kisiye su an mesaj gonderemezsin';
    end if;

  elsif exists (
    select 1 from public.sohbet_istekleri s
    where s.gonderen_id = p_kullanici_id
      and s.alan_id = auth.uid()
      and s.durum = 'beklemede'
  ) then
    -- BEN aliciyim ve cevap yaziyorum: cevap ONAYDIR.
    update public.sohbet_istekleri
       set durum = 'kabul'
     where gonderen_id = p_kullanici_id and alan_id = auth.uid();

  elsif not exists (
    select 1 from public.sohbet_istekleri s
    where s.gonderen_id = auth.uid() and s.alan_id = p_kullanici_id
  ) then
    -- MESAJ IZNI (2026-09-18): alici "yalnizca arkadaslar" ya da "hic
    -- kimse" demisse yeni istek yolu kapali. Ayni hata metni.
    if coalesce(v_izin, 'herkes') <> 'herkes' then
      raise exception 'Bu kisiye su an mesaj gonderemezsin';
    end if;

    -- Yeni istek: TEK mesaj. Engelleme, aski ve gunluk tavan burada
    -- zorlaniyor - bu kontrol atlanirsa engelledigin kisi sana yazar.
    perform bag.istek_on_kontrol(p_kullanici_id);
    insert into public.sohbet_istekleri (gonderen_id, alan_id, durum)
    values (auth.uid(), p_kullanici_id, 'beklemede');
    v_yeni_istek := true;

  else
    -- Bekleyen kendi istegim var: ikinci mesaj YOK.
    -- Kapi kapaliyken TEK ve AYNI hata (Faz 2b sessizlik ilkesi).
    raise exception 'Bu kisiye su an mesaj gonderemezsin';
  end if;

  v_anahtar := least(auth.uid()::text, p_kullanici_id::text)
               || ':' ||
               greatest(auth.uid()::text, p_kullanici_id::text);

  select id into v_konusma_id
  from public.konusmalar
  where birebir_anahtar = v_anahtar;

  if v_konusma_id is null then
    insert into public.konusmalar (tur, birebir_anahtar)
    values ('birebir', v_anahtar)
    on conflict (birebir_anahtar) do nothing
    returning id into v_konusma_id;

    if v_konusma_id is null then
      select id into v_konusma_id
      from public.konusmalar
      where birebir_anahtar = v_anahtar;
    end if;

    insert into public.konusma_uyeleri (konusma_id, kullanici_id)
    values (v_konusma_id, auth.uid()), (v_konusma_id, p_kullanici_id)
    on conflict do nothing;
  end if;

  insert into public.mesajlar (konusma_id, gonderen_id, metin)
  values (v_konusma_id, auth.uid(), trim(p_metin));

  update public.konusma_uyeleri
     set gizlendi_mi = false,
         son_okuma = case when kullanici_id = auth.uid() then now() else son_okuma end
   where konusma_id = v_konusma_id;

  -- Gunluk tavanin isleyebilmesi icin istek kaydi gunluge yazilir.
  if v_yeni_istek then
    insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
  end if;

  return v_konusma_id;
end;
$function$;
