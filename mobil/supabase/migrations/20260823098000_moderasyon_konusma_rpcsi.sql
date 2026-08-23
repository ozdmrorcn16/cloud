-- Karar 75 bu RPC'nin merkezinde:
--   KADEME 1 (p_merkez_mesaj_id dolu)  = sikayet baglami, VARSAYILAN
--   KADEME 2 (p_merkez_mesaj_id null)  = konusmanin tamami, GENIS
-- Ikisi denetim izine AYRI TURDE duser; ayrim izde gorunmezse karar 75'in
-- tek somut ciktisi kaybolur.
create or replace function public.moderasyon_konusma_mesajlari(
  p_konusma_id      uuid,
  p_gerekce         text,
  p_merkez_mesaj_id uuid default null,
  p_limit           int default 100,
  p_ofset           int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_mesajlar jsonb;
  v_merkez   timestamptz;
  v_eylem    text;
begin
  perform moderasyon.yetkili_mi_zorla();

  -- Gerekce ZORUNLU. Bos gerekceyle okuma izi degersiz kilar: "neden
  -- bakildi" sorusunun cevabi kalmaz.
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  if not exists (select 1 from public.konusmalar where id = p_konusma_id) then
    raise exception 'Konusma bulunamadi';
  end if;

  if p_merkez_mesaj_id is not null then
    select olusturuldu into v_merkez
      from public.mesajlar
     where id = p_merkez_mesaj_id and konusma_id = p_konusma_id;

    if v_merkez is null then
      raise exception 'Mesaj bu konusmada bulunamadi';
    end if;

    v_eylem := 'mesaj_baglami';

    select jsonb_agg(t.satir order by t.zaman) into v_mesajlar
      from (
        (select to_jsonb(m) as satir, m.olusturuldu as zaman
           from public.mesajlar m
          where m.konusma_id = p_konusma_id and m.olusturuldu <= v_merkez
          order by m.olusturuldu desc limit 21)
        union all
        (select to_jsonb(m), m.olusturuldu
           from public.mesajlar m
          where m.konusma_id = p_konusma_id and m.olusturuldu > v_merkez
          order by m.olusturuldu asc limit 20)
      ) t;
  else
    v_eylem := 'konusma_tam';

    select jsonb_agg(to_jsonb(t) order by t.olusturuldu) into v_mesajlar
      from (
        select * from public.mesajlar
         where konusma_id = p_konusma_id
         order by olusturuldu
         limit least(coalesce(p_limit, 100), 500)
        offset greatest(coalesce(p_ofset, 0), 0)
      ) t;
  end if;

  perform moderasyon.kaydet(
    v_eylem, 'konusma', p_konusma_id,
    jsonb_build_object('gerekce', p_gerekce, 'merkez_mesaj_id', p_merkez_mesaj_id)
  );

  return jsonb_build_object(
    'kademe', case when p_merkez_mesaj_id is null then 2 else 1 end,
    'uyeler', coalesce((
      select jsonb_agg(u.kullanici_id) from public.konusma_uyeleri u
       where u.konusma_id = p_konusma_id), '[]'::jsonb),
    'mesajlar', coalesce(v_mesajlar, '[]'::jsonb)
  );
end;
$fn$;

revoke execute on function public.moderasyon_konusma_mesajlari from public, anon;
grant execute on function public.moderasyon_konusma_mesajlari to authenticated;
