-- mesaj_gonder: uc tabloya (konusmalar, konusma_uyeleri, mesajlar) tek
-- yazma yolu. Kapi bag.yazabilir_mi HER cagrida sorulur, konusma acilirken
-- bir kez degil (karar 45) -- bag koparsa konusma salt-okunur olur.
create or replace function public.mesaj_gonder(
  p_kullanici_id uuid,
  p_metin text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anahtar text;
  v_konusma_id uuid;
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

  -- Kapi kapaliyken TEK ve AYNI hata: "engellendin" ile "henuz bagli
  -- degilsiniz" ayirt edilmiyor (Faz 2b sessizlik ilkesi).
  if not bag.yazabilir_mi(p_kullanici_id) then
    raise exception 'Bu kisiye su an mesaj gonderemezsin';
  end if;

  -- Sirali cift anahtari: bir ciftin tek konusmasi olur.
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

    -- Yaris: baska bir islem ayni anda olusturmus olabilir.
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

  -- Iki uyenin de gizliligi kalkar: karar 44'un "karsi taraf yazinca
  -- konusma geri gelir" kismi burada kuruluyor. Gonderenin son_okuma'si
  -- ilerler, kendi mesaji okunmamis sayilmasin diye.
  update public.konusma_uyeleri
     set gizlendi_mi = false,
         son_okuma = case when kullanici_id = auth.uid() then now() else son_okuma end
   where konusma_id = v_konusma_id;

  return v_konusma_id;
end;
$$;

revoke execute on function public.mesaj_gonder(uuid, text) from public, anon;
grant execute on function public.mesaj_gonder(uuid, text) to authenticated;
