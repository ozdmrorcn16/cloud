-- HIKAYELER (kullanicinin istegi 2026-09-22: "ana sayfaya Instagram gibi
-- hikaye ekleme akisi"). Spec: docs/superpowers/specs/2026-09-22-hikaye-akisi-design.md
--
-- Tek fotograf + istege bagli yazi + istege bagli mekan; 24 saat omur
-- (saatlik cron satiri VE dosyayi siler); gorunurluk check-in'lerle ayni
-- (sahibi + arkadaslar, engelleme iki yonlu, moderasyon gizli kimseye);
-- goruntuleme kaydi yalnizca sahibine; sikayet hedefi 'hikaye';
-- moderator gizler/acar. Push yok.

-- ---------------------------------------------------------------------
-- 1) Tablolar
-- ---------------------------------------------------------------------
create table if not exists public.hikayeler (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  -- Kova yolu: <kullanici_id>/<dosya>. Sahiplik RPC'de dogrulanir.
  fotograf text not null,
  yazi text check (yazi is null or length(btrim(yazi)) between 1 and 200),
  mekan_id uuid references public.mekanlar(id) on delete set null,
  olusturuldu timestamptz not null default now(),
  bitis timestamptz not null default now() + interval '24 hours',
  moderasyon_gizli boolean not null default false
);
create index if not exists hikayeler_kullanici_bitis_idx on public.hikayeler (kullanici_id, bitis);
create index if not exists hikayeler_bitis_idx on public.hikayeler (bitis);
create index if not exists hikayeler_fotograf_idx on public.hikayeler (fotograf);

create table if not exists public.hikaye_goruntulemeler (
  hikaye_id uuid not null references public.hikayeler(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  goruldu timestamptz not null default now(),
  primary key (hikaye_id, kullanici_id)
);
create index if not exists hikaye_goruntulemeler_kullanici_idx on public.hikaye_goruntulemeler (kullanici_id);

alter table public.hikayeler enable row level security;
alter table public.hikaye_goruntulemeler enable row level security;

grant select on public.hikayeler to authenticated;
grant select on public.hikaye_goruntulemeler to authenticated;

-- Arkadaslik: takipler'de kabul satiri (ayna satirlar oldugu icin tek yon yeter).
create or replace function public.hikaye_gorunur_mu(p_sahip uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_sahip = auth.uid()
      or (
        not gizli.engelli_mi(p_sahip)
        and exists (
          select 1 from public.takipler t
          where t.takip_eden_id = auth.uid()
            and t.takip_edilen_id = p_sahip
            and t.durum = 'kabul'
        )
      );
$$;
revoke execute on function public.hikaye_gorunur_mu(uuid) from public, anon;
grant execute on function public.hikaye_gorunur_mu(uuid) to authenticated, service_role;

drop policy if exists "hikaye gorunurlugu" on public.hikayeler;
create policy "hikaye gorunurlugu" on public.hikayeler
for select to authenticated
using (
  bitis > now()
  and not moderasyon_gizli
  and public.hikaye_gorunur_mu(kullanici_id)
);

drop policy if exists "goruntuleme gorunurlugu" on public.hikaye_goruntulemeler;
create policy "goruntuleme gorunurlugu" on public.hikaye_goruntulemeler
for select to authenticated
using (
  kullanici_id = auth.uid()
  or exists (select 1 from public.hikayeler h where h.id = hikaye_id and h.kullanici_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- 2) Kova
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('hikaye-medyalari', 'hikaye-medyalari', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "kendi hikaye medyasini yukleyebilir" on storage.objects;
create policy "kendi hikaye medyasini yukleyebilir"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'hikaye-medyalari' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "hikaye medyasini gorunurluk kuraliyla okuyabilir" on storage.objects;
create policy "hikaye medyasini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'hikaye-medyalari'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      -- hikayeler RLS'i bu alt sorguda uygulanir: gorunmeyen hikayenin dosyasi acilmaz.
      or exists (select 1 from public.hikayeler h where h.fotograf = storage.objects.name)
      or moderasyon.yetkili_mi()
    )
  );

drop policy if exists "kendi hikaye medyasini silebilir" on storage.objects;
create policy "kendi hikaye medyasini silebilir"
  on storage.objects for delete to authenticated
  using (bucket_id = 'hikaye-medyalari' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 3) RPC'ler
-- ---------------------------------------------------------------------
create or replace function public.hikaye_ekle(p_fotograf text, p_yazi text default null, p_mekan_id uuid default null)
returns public.hikayeler
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_yazi text;
  v_yeni public.hikayeler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;
  if p_fotograf is null or btrim(p_fotograf) = ''
     or split_part(p_fotograf, '/', 1) <> auth.uid()::text
     or split_part(p_fotograf, '/', 2) = '' then
    raise exception 'Bu fotograf sana ait degil';
  end if;
  v_yazi := nullif(btrim(coalesce(p_yazi, '')), '');
  if length(coalesce(v_yazi, '')) > 200 then
    raise exception 'Hikaye yazisi en fazla 200 karakter olabilir';
  end if;
  if p_mekan_id is not null and not exists (select 1 from public.mekanlar m where m.id = p_mekan_id) then
    raise exception 'Mekan bulunamadi';
  end if;
  if (select count(*) from public.hikayeler h where h.kullanici_id = auth.uid() and h.bitis > now()) >= 10 then
    raise exception 'Ayni anda en fazla 10 hikayen olabilir';
  end if;

  insert into public.hikayeler (kullanici_id, fotograf, yazi, mekan_id)
  values (auth.uid(), btrim(p_fotograf), v_yazi, p_mekan_id)
  returning * into v_yeni;
  return v_yeni;
end;
$$;
revoke execute on function public.hikaye_ekle(text, text, uuid) from public, anon;
grant execute on function public.hikaye_ekle(text, text, uuid) to authenticated, service_role;

-- Akis: gorunur hikayeler (RLS - security INVOKER), izleyicinin gordum
-- bayragi, sahibiyse goruntulenme sayisi.
create or replace function public.hikaye_akisi()
returns table (
  id uuid,
  kullanici_id uuid,
  fotograf text,
  yazi text,
  mekan_id uuid,
  mekan_adi text,
  olusturuldu timestamptz,
  bitis timestamptz,
  gordum boolean,
  goruntulenme_sayisi integer
)
language sql
stable
security invoker
set search_path to 'public'
as $$
  select h.id, h.kullanici_id, h.fotograf, h.yazi, h.mekan_id, m.ad as mekan_adi,
         h.olusturuldu, h.bitis,
         exists (select 1 from public.hikaye_goruntulemeler g where g.hikaye_id = h.id and g.kullanici_id = auth.uid()) as gordum,
         case when h.kullanici_id = auth.uid()
              then (select count(*)::int from public.hikaye_goruntulemeler g where g.hikaye_id = h.id)
              else 0 end as goruntulenme_sayisi
  from public.hikayeler h
  left join public.mekanlar m on m.id = h.mekan_id
  order by h.olusturuldu asc;
$$;
revoke execute on function public.hikaye_akisi() from public, anon;
grant execute on function public.hikaye_akisi() to authenticated, service_role;

create or replace function public.hikaye_goruntulendi(p_hikaye_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sahip uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  select h.kullanici_id into v_sahip
    from public.hikayeler h
   where h.id = p_hikaye_id and h.bitis > now() and not h.moderasyon_gizli
     and public.hikaye_gorunur_mu(h.kullanici_id);
  -- Gorunmeyen ya da kendi hikayesi: sessizce yok say.
  if v_sahip is null or v_sahip = auth.uid() then
    return;
  end if;
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id)
  values (p_hikaye_id, auth.uid())
  on conflict do nothing;
end;
$$;
revoke execute on function public.hikaye_goruntulendi(uuid) from public, anon;
grant execute on function public.hikaye_goruntulendi(uuid) to authenticated, service_role;

create or replace function public.hikaye_goruntuleyenler(p_hikaye_id uuid)
returns table (kullanici_id uuid, goruldu timestamptz)
language sql
stable
security definer
set search_path to 'public'
as $$
  select g.kullanici_id, g.goruldu
  from public.hikaye_goruntulemeler g
  join public.hikayeler h on h.id = g.hikaye_id
  where g.hikaye_id = p_hikaye_id
    and h.kullanici_id = auth.uid()
  order by g.goruldu desc
  limit 500;
$$;
revoke execute on function public.hikaye_goruntuleyenler(uuid) from public, anon;
grant execute on function public.hikaye_goruntuleyenler(uuid) to authenticated, service_role;

create or replace function public.hikaye_sil(p_hikaye_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_yol text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  delete from public.hikayeler
   where id = p_hikaye_id and kullanici_id = auth.uid()
  returning fotograf into v_yol;
  if v_yol is null then
    raise exception 'Hikaye bulunamadi';
  end if;
  return v_yol;
end;
$$;
revoke execute on function public.hikaye_sil(uuid) from public, anon;
grant execute on function public.hikaye_sil(uuid) to authenticated, service_role;

-- Moderasyon
create or replace function public.moderasyon_hikayeyi_gizle(p_hikaye_id uuid, p_gerekce text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sahip uuid;
begin
  perform moderasyon.yetkili_mi_zorla();
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;
  select kullanici_id into v_sahip from public.hikayeler where id = p_hikaye_id;
  if not found then
    raise exception 'Hikaye bulunamadi';
  end if;
  update public.hikayeler set moderasyon_gizli = true where id = p_hikaye_id;
  perform moderasyon.kaydet('icerik_gizlendi', 'hikaye', p_hikaye_id,
    jsonb_build_object('sahip', v_sahip, 'gerekce', p_gerekce));
end;
$$;
revoke execute on function public.moderasyon_hikayeyi_gizle(uuid, text) from public, anon;
grant execute on function public.moderasyon_hikayeyi_gizle(uuid, text) to authenticated, service_role;

create or replace function public.moderasyon_hikaye_gizlemeyi_kaldir(p_hikaye_id uuid, p_gerekce text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform moderasyon.yetkili_mi_zorla();
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;
  if not exists (select 1 from public.hikayeler where id = p_hikaye_id) then
    raise exception 'Hikaye bulunamadi';
  end if;
  update public.hikayeler set moderasyon_gizli = false where id = p_hikaye_id;
  perform moderasyon.kaydet('icerik_gizlemesi_kaldirildi', 'hikaye', p_hikaye_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$$;
revoke execute on function public.moderasyon_hikaye_gizlemeyi_kaldir(uuid, text) from public, anon;
grant execute on function public.moderasyon_hikaye_gizlemeyi_kaldir(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4) Sikayet hedefi 'hikaye'
-- ---------------------------------------------------------------------
alter table public.sikayetler drop constraint if exists sikayetler_hedef_tur_check;
alter table public.sikayetler add constraint sikayetler_hedef_tur_check
  check (hedef_tur in ('kullanici', 'check_in', 'mesaj', 'yorum', 'hikaye'));

create or replace function public.sikayet_gonder(
  p_hedef_tur text, p_hedef_id uuid, p_sebep text,
  p_aciklama text default null, p_fotograf text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_gonderen uuid;
  v_konusma  uuid;
  v_fotograf text;
  v_hikaye_sahibi uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj', 'hikaye') then
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

  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  if p_hedef_tur = 'mesaj' then
    select m.gonderen_id, m.konusma_id
      into v_gonderen, v_konusma
      from public.mesajlar m
     where m.id = p_hedef_id;

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

    if v_gonderen is not null and v_gonderen = auth.uid() then
      raise exception 'Kendi mesajini sikayet edemezsin';
    end if;
  end if;

  if p_hedef_tur = 'hikaye' then
    -- HIKAYE (2026-09-22): yalnizca goren sikayet eder (arkadas, engel
    -- yok, suresi dolmamis) ve kendi hikayesi olamaz.
    select h.kullanici_id into v_hikaye_sahibi
      from public.hikayeler h
     where h.id = p_hedef_id
       and h.bitis > now()
       and h.kullanici_id <> auth.uid()
       and public.hikaye_gorunur_mu(h.kullanici_id);
    if v_hikaye_sahibi is null then
      raise exception 'Bu hikayeyi sikayet edemezsin';
    end if;
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama, fotograf)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama, v_fotograf);
end;
$$;

revoke execute on function public.sikayet_gonder(text, uuid, text, text, text) from public, anon;
grant execute on function public.sikayet_gonder(text, uuid, text, text, text) to authenticated, service_role;

create or replace function public.moderasyon_sikayet_detayi(p_sikayet_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
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
  elsif s.hedef_tur = 'yorum' then
    select jsonb_build_object(
             'id', y.id,
             'check_in_id', y.check_in_id,
             'kullanici_id', y.kullanici_id,
             'metin', y.metin,
             'olusturuldu', y.olusturuldu,
             'sikayet_gizli', y.sikayet_gizli,
             'moderasyon_gizli', y.moderasyon_gizli,
             'paylasim_sahibi', c.kullanici_id,
             'paylasim_notu', c.not_metni,
             'mekan_adi', mk.ad)
      into v_hedef
      from public.yorumlar y
      join public.check_inler c on c.id = y.check_in_id
      join public.mekanlar mk on mk.id = c.mekan_id
     where y.id = s.hedef_id;
  elsif s.hedef_tur = 'hikaye' then
    -- HIKAYE (2026-09-22): suresi dolup silinmis olabilir -> hedef null,
    -- panel "artik yok" yazar.
    select jsonb_build_object(
             'id', h.id, 'kullanici_id', h.kullanici_id,
             'fotograf', h.fotograf, 'yazi', h.yazi,
             'mekan_adi', mk.ad, 'olusturuldu', h.olusturuldu, 'bitis', h.bitis,
             'moderasyon_gizli', h.moderasyon_gizli)
      into v_hedef
      from public.hikayeler h
      left join public.mekanlar mk on mk.id = h.mekan_id
     where h.id = s.hedef_id;
  end if;

  return jsonb_build_object(
    'sikayet', to_jsonb(s),
    'sikayet_eden', (select to_jsonb(p) from public.profiller p where p.id = s.sikayet_eden_id),
    'hedef', v_hedef
  );
end;
$$;

revoke execute on function public.moderasyon_sikayet_detayi(uuid) from public, anon;
grant execute on function public.moderasyon_sikayet_detayi(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5) Cron: suresi dolanlar (once dosya satiri, sonra hikaye)
-- ---------------------------------------------------------------------
select cron.unschedule(jobid) from cron.job where jobname = 'hikaye-suresi-dolanlari-sil';
select cron.schedule(
  'hikaye-suresi-dolanlari-sil',
  '7 * * * *',
  $$
    delete from storage.objects
     where bucket_id = 'hikaye-medyalari'
       and name in (select fotograf from public.hikayeler where bitis <= now());
    delete from public.hikayeler where bitis <= now();
  $$
);

-- ---------------------------------------------------------------------
-- 6) verilerimi_disa_aktar: hikayelerim + hikaye_goruntulemelerim
-- ---------------------------------------------------------------------
create or replace function public.verilerimi_disa_aktar()
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare
  v_kisi uuid := auth.uid();
  v_sonuc jsonb;
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  select jsonb_build_object(
    'surum', 1,
    'olusturuldu', now(),
    'aciklama',
      'Slooin hesabindaki kendi verilerin. Fotograf baglantilari 24 saat gecerlidir.',

    'profil', (
      select to_jsonb(x) from (
        select p.id, p.kullanici_adi, p.ad, p.biyografi, p.instagram,
               p.yasadigi_ulke, p.yasadigi_il, p.yasadigi_ilce, p.dogum_tarihi,
               p.fotograflar, p.aramada_gorunsun, p.profil_gizli,
               p.etiket_onayi_gerekli, p.varsayilan_bulunurluk,
               p.dil, p.olusturuldu
        from public.profiller p where p.id = v_kisi
      ) x
    ),

    'check_inler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturma_zamani desc) from (
        select c.id, m.ad as mekan, m.semt as ilce, m.il,
               c.not_metni, c.ifade, c.fotograf, c.fotograflar, c.bulunurluk, c.gorunurluk,
               c.olusturma_zamani, c.bitis_zamani,
               case when c.konum is null then null
                    else jsonb_build_object(
                      'enlem', ST_Y(c.konum::geometry),
                      'boylam', ST_X(c.konum::geometry))
               end as konum
        from public.check_inler c
        join public.mekanlar m on m.id = c.mekan_id
        where c.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'yorumlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select y.id, y.check_in_id, y.metin, y.olusturuldu
        from public.yorumlar y where y.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'begenilerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select b.check_in_id, b.olusturuldu
        from public.begeniler b where b.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'etiketlendiklerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select e.check_in_id, e.durum, e.olusturuldu, p.kullanici_adi as etiketleyen
        from public.check_in_etiketleri e
        join public.check_inler c on c.id = e.check_in_id
        left join public.profiller p on p.id = c.kullanici_id
        where e.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'arkadaslarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi, t.durum, t.olusturuldu
        from public.takipler t
        join public.profiller p on p.id = t.takip_edilen_id
        where t.takip_eden_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'sohbet_isteklerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select case when s.gonderen_id = v_kisi then 'gonderdim' else 'aldim' end as yon,
               p.kullanici_adi as karsi_taraf, s.durum, s.olusturuldu
        from public.sohbet_istekleri s
        join public.profiller p
          on p.id = case when s.gonderen_id = v_kisi then s.alan_id else s.gonderen_id end
        where s.gonderen_id = v_kisi or s.alan_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'gonderdigim_mesajlar', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select m.konusma_id, m.metin, m.olusturuldu
        from public.mesajlar m where m.gonderen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'aldigim_mesajlar_ozeti', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.son_mesaj desc) from (
        select p.kullanici_adi as karsi_taraf,
               count(*)::int as mesaj_sayisi,
               max(m.olusturuldu) as son_mesaj
        from public.mesajlar m
        join public.konusma_uyeleri ben
          on ben.konusma_id = m.konusma_id and ben.kullanici_id = v_kisi
        left join public.profiller p on p.id = m.gonderen_id
        where m.gonderen_id <> v_kisi
        group by p.kullanici_adi
      ) x
    ), '[]'::jsonb),

    'engelledigim_kisiler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi, e.olusturuldu
        from public.engellemeler e
        join public.profiller p on p.id = e.engellenen_id
        where e.engelleyen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'gonderdigim_sikayetler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select s.hedef_tur, s.sebep, s.aciklama, s.durum, s.olusturuldu
        from public.sikayetler s where s.sikayet_eden_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'mekan_duzenleme_taleplerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select t.onerilen_ad, t.onerilen_adres, t.onerilen_tur,
               t.onerilen_mahalle, t.onerilen_il, t.onerilen_ilce,
               t.kapali_bildirimi, t.durum, t.olusturuldu, t.karar_zamani
        from public.mekan_duzenleme_talepleri t where t.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'mekan_puanlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncelleme_zamani desc) from (
        select m.ad as mekan, m.semt as ilce, m.il, mp.puan,
               mp.olusturma_zamani, mp.guncelleme_zamani
        from public.mekan_puanlari mp
        join public.mekanlar m on m.id = mp.mekan_id
        where mp.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hikayelerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select h.id, h.yazi, h.fotograf, m.ad as mekan, h.olusturuldu, h.bitis
        from public.hikayeler h
        left join public.mekanlar m on m.id = h.mekan_id
        where h.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hikaye_goruntulemelerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.goruldu desc) from (
        select g.hikaye_id, p.kullanici_adi as izleyen, g.goruldu
        from public.hikaye_goruntulemeler g
        join public.hikayeler h on h.id = g.hikaye_id
        left join public.profiller p on p.id = g.kullanici_id
        where h.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'onaylarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.zaman desc) from (
        select k.onay_turu, k.metin_surumu, k.verildi_mi, k.zaman
        from public.kvkk_onaylari k where k.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hesap_durumu', (
      select to_jsonb(x) from (
        select h.durum, h.gerekce, h.aski_bitisi, h.guncellendi
        from public.hesap_durumlari h where h.kullanici_id = v_kisi
      ) x
    ),

    'bildirim_cihazlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncellendi desc) from (
        select j.platform, j.guncellendi
        from public.bildirim_jetonlari j where j.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb)
  ) into v_sonuc;

  return v_sonuc;
end;
$$;

revoke execute on function public.verilerimi_disa_aktar() from public, anon;
grant execute on function public.verilerimi_disa_aktar() to authenticated, service_role;
