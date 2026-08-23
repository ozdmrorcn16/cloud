-- Karar 62: mesaj sikayeti kaliyor ve DUZGUN uygulaniyor. Govde
-- 20260820140113'ten alindi; eklenen tek sey 'mesaj' dalindaki uc
-- dogrulama. Hepsi security definer govdesinde, cunku mesajlar RLS'i
-- burada atlaniyor - istemciye sorulamaz.
create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_gonderen uuid;
  v_konusma  uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_id is null then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_sebep is null or trim(p_sebep) = '' then
    raise exception 'Sikayet sebebi belirtilmeli';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  if p_hedef_tur = 'mesaj' then
    select m.gonderen_id, m.konusma_id
      into v_gonderen, v_konusma
      from public.mesajlar m
     where m.id = p_hedef_id;

    -- Var olmayan bir mesaj id'si de buraya duser: uydurma id ile
    -- sahte sikayet uretilemez.
    if v_konusma is null then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if not exists (
      select 1 from public.konusma_uyeleri u
       where u.konusma_id = v_konusma
         and u.kullanici_id = auth.uid()
    ) then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    -- gonderen_id null olabilir (gonderen hesabini silmis); o mesaj
    -- sikayet edilebilir kalir, kimse sahiplenmiyor demektir.
    if v_gonderen is not null and v_gonderen = auth.uid() then
      raise exception 'Kendi mesajini sikayet edemezsin';
    end if;
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$fn$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
