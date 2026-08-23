-- Liste ekranlarinda gezinme ize DUSMEZ (spec karar 61): aksi halde iz
-- gurultuye bogulur ve icinde gercek erisimler kaybolur.
create or replace function public.moderasyon_sikayetleri_listele(
  p_durum      text default null,
  p_hedef_tur  text default null,
  p_baslangic  timestamptz default null,
  p_bitis      timestamptz default null,
  p_sirala     text default 'yeni_once',
  p_limit      int default 50,
  p_ofset      int default 0
)
returns table (
  id               uuid,
  hedef_tur        text,
  hedef_id         uuid,
  sebep            text,
  aciklama         text,
  durum            text,
  olusturuldu      timestamptz,
  sikayet_eden_adi text,
  hedef_adi        text,
  hedefin_sikayeti bigint
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select s.id, s.hedef_tur, s.hedef_id, s.sebep, s.aciklama, s.durum,
         s.olusturuldu,
         se.kullanici_adi,
         case s.hedef_tur
           when 'kullanici' then (select p.kullanici_adi from public.profiller p where p.id = s.hedef_id)
           when 'check_in'  then (select mk.ad from public.check_inler c
                                    join public.mekanlar mk on mk.id = c.mekan_id
                                   where c.id = s.hedef_id)
           else null
         end,
         -- Tekrar eden suclu rozetle hemen goze carpsin.
         (select count(*) from public.sikayetler s2
           where s2.hedef_tur = s.hedef_tur and s2.hedef_id = s.hedef_id)
    from public.sikayetler s
    left join public.profiller se on se.id = s.sikayet_eden_id
   where (p_durum is null or s.durum = p_durum)
     and (p_hedef_tur is null or s.hedef_tur = p_hedef_tur)
     and (p_baslangic is null or s.olusturuldu >= p_baslangic)
     and (p_bitis is null or s.olusturuldu <= p_bitis)
   order by
     case when p_sirala = 'eski_once' then s.olusturuldu end asc,
     case when p_sirala is distinct from 'eski_once' then s.olusturuldu end desc
   limit least(coalesce(p_limit, 50), 200)
  offset greatest(coalesce(p_ofset, 0), 0);
end;
$fn$;

-- Detay: hedefin TAM icerigi. Mesaj turunde mesajin kendisi burada gelir
-- ama CEVRESI gelmez - baglam ayri bir cagridir
-- (moderasyon_konusma_mesajlari) ve o cagri ize duser.
create or replace function public.moderasyon_sikayet_detayi(p_sikayet_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  s public.sikayetler%rowtype;
  v_hedef jsonb;
begin
  perform moderasyon.yetkili_mi_zorla();

  select * into s from public.sikayetler where id = p_sikayet_id;
  if s.id is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  if s.hedef_tur = 'kullanici' then
    select to_jsonb(p) into v_hedef
      from public.profiller p where p.id = s.hedef_id;
  elsif s.hedef_tur = 'check_in' then
    select jsonb_build_object(
             'id', c.id, 'kullanici_id', c.kullanici_id,
             'not_metni', c.not_metni, 'fotograf', c.fotograf,
             'mekan_adi', mk.ad, 'olusturma_zamani', c.olusturma_zamani,
             'gorunurluk', c.gorunurluk, 'bulunurluk', c.bulunurluk,
             'moderasyon_gizli', c.moderasyon_gizli)
      into v_hedef
      from public.check_inler c
      join public.mekanlar mk on mk.id = c.mekan_id
     where c.id = s.hedef_id;
  elsif s.hedef_tur = 'mesaj' then
    select jsonb_build_object(
             'id', m.id, 'konusma_id', m.konusma_id,
             'gonderen_id', m.gonderen_id, 'metin', m.metin,
             'olusturuldu', m.olusturuldu)
      into v_hedef
      from public.mesajlar m where m.id = s.hedef_id;
  end if;

  return jsonb_build_object(
    'sikayet', to_jsonb(s),
    'sikayet_eden', (select to_jsonb(p) from public.profiller p where p.id = s.sikayet_eden_id),
    'hedef', v_hedef
  );
end;
$fn$;

-- Ayni hedefe ait butun sikayetler ve verilmis kararlar.
create or replace function public.moderasyon_hedef_gecmisi(
  p_hedef_tur text,
  p_hedef_id  uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return coalesce((
    select jsonb_agg(to_jsonb(s) order by s.olusturuldu desc)
      from public.sikayetler s
     where s.hedef_tur = p_hedef_tur
       and s.hedef_id = p_hedef_id
  ), '[]'::jsonb);
end;
$fn$;

revoke execute on function public.moderasyon_sikayetleri_listele from public, anon;
revoke execute on function public.moderasyon_sikayet_detayi from public, anon;
revoke execute on function public.moderasyon_hedef_gecmisi from public, anon;
grant execute on function public.moderasyon_sikayetleri_listele to authenticated;
grant execute on function public.moderasyon_sikayet_detayi to authenticated;
grant execute on function public.moderasyon_hedef_gecmisi to authenticated;
