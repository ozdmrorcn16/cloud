-- HIKAYE GORUNURLUGU: "Arkadaslar" / "Herkese" (kullanicinin karari,
-- 2026-09-22). Hikaye artik kendi gorunurlugunu tasiyor; secim HIKAYE
-- BASINA gecerli ve oldugu gibi uygulanir - profil gizli olsa da
-- "herkese_acik" secilen hikaye herkese acilir, cunku bu sahibinin o
-- icerik icin verdigi acik karardir.
--
-- Engel HER IKI halde de mutlak: engellenen ya da engelleyen goremez.
-- Yeni olan "herkese_acik" dalinda ayrica hesabin AKTIF olmasi araniyor
-- (askidaki/yasakli bir hesabin icerigi yabancilara acilmaz); arkadas
-- dali bilerek aynen korundu - oradaki davranis degismiyor.

alter table public.hikayeler
  add column if not exists gorunurluk text not null default 'arkadaslar'
    check (gorunurluk in ('arkadaslar', 'herkese_acik'));

-- Gorunurluk artik satira bagli: eski tek parametreli surum DUSURULUYOR
-- (asiri yukleme tuzagi - ayni adda iki fonksiyon kalirsa RLS hangisini
-- cagirdigini soylemez).
drop policy if exists "hikaye gorunurlugu" on public.hikayeler;
drop function if exists public.hikaye_gorunur_mu(uuid);

create function public.hikaye_gorunur_mu(p_sahip uuid, p_gorunurluk text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select p_sahip = auth.uid()
      or (
        auth.uid() is not null
        and not gizli.engelli_mi(p_sahip)
        and (
          exists (
            select 1 from public.takipler t
            where t.takip_eden_id = auth.uid()
              and t.takip_edilen_id = p_sahip
              and t.durum = 'kabul'
          )
          or (p_gorunurluk = 'herkese_acik' and moderasyon.hesap_aktif_mi(p_sahip))
        )
      );
$$;

revoke execute on function public.hikaye_gorunur_mu(uuid, text) from public, anon;
grant execute on function public.hikaye_gorunur_mu(uuid, text) to authenticated, service_role;

create policy "hikaye gorunurlugu" on public.hikayeler
  for select
  using (bitis > now() and not moderasyon_gizli and public.hikaye_gorunur_mu(kullanici_id, gorunurluk));

-- ------------------------------------------------------------------
-- Akis: SERIT yalnizca kendim + arkadaslarim (yabancinin herkese acik
-- hikayesi ana sayfaya DUSMEZ - burasi bir kesif akisi degil). Bir
-- kisinin hikayeleri profilinden aciliyor: p_kullanici verilince
-- yalnizca o kisi, kapiyi RLS tutuyor.
drop function if exists public.hikaye_akisi();

create function public.hikaye_akisi(p_kullanici uuid default null)
returns table (
  id uuid, kullanici_id uuid, fotograf text, yazi text, ifade text,
  mekan_id uuid, mekan_adi text, etiketler jsonb,
  olusturuldu timestamptz, bitis timestamptz,
  gordum boolean, goruntulenme_sayisi integer, gorunurluk text
)
language sql
set search_path to 'public'
as $$
  select
    h.id,
    h.kullanici_id,
    h.fotograf,
    h.yazi,
    h.ifade,
    h.mekan_id,
    mk.ad,
    gizli.hikaye_etiketleri_json(h.id),
    h.olusturuldu,
    h.bitis,
    (h.kullanici_id = auth.uid())
      or exists (select 1 from public.hikaye_goruntulemeler g
                  where g.hikaye_id = h.id and g.kullanici_id = auth.uid()),
    case when h.kullanici_id = auth.uid()
      then (select count(*)::integer from public.hikaye_goruntulemeler g where g.hikaye_id = h.id)
      else 0 end,
    h.gorunurluk
  from public.hikayeler h
  left join public.mekanlar mk on mk.id = h.mekan_id
  where case
    when p_kullanici is not null then h.kullanici_id = p_kullanici
    else h.kullanici_id = auth.uid()
      or exists (
        select 1 from public.takipler t
        where t.takip_eden_id = auth.uid()
          and t.takip_edilen_id = h.kullanici_id
          and t.durum = 'kabul'
      )
  end
  order by h.olusturuldu asc;
$$;

revoke execute on function public.hikaye_akisi(uuid) from public, anon;
grant execute on function public.hikaye_akisi(uuid) to authenticated, service_role;

-- ------------------------------------------------------------------
-- Ekleme: gorunurluk parametresi. Eski bes parametreli imza DUSURULUYOR.
drop function if exists public.hikaye_ekle(text, text, uuid, text, uuid[]);

create function public.hikaye_ekle(
  p_fotograf text,
  p_yazi text default null,
  p_mekan_id uuid default null,
  p_ifade text default null,
  p_etiketler uuid[] default null,
  p_gorunurluk text default 'arkadaslar'
)
returns public.hikayeler
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ben uuid := auth.uid();
  v_hikaye public.hikayeler;
  v_kisi uuid;
begin
  if v_ben is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if not moderasyon.hesap_aktif_mi(v_ben) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;
  if p_fotograf is null or split_part(p_fotograf, '/', 1) <> v_ben::text then
    raise exception 'Bu fotograf sana ait degil';
  end if;
  if p_yazi is not null and length(p_yazi) > 200 then
    raise exception 'Hikaye yazisi en fazla 200 karakter olabilir';
  end if;
  if p_gorunurluk is null or p_gorunurluk not in ('arkadaslar', 'herkese_acik') then
    raise exception 'Gecersiz gorunurluk';
  end if;
  if p_mekan_id is not null and not exists (select 1 from public.mekanlar where id = p_mekan_id) then
    raise exception 'Mekan bulunamadi';
  end if;
  if p_ifade is not null and not exists (select 1 from public.ifadeler where slug = p_ifade) then
    raise exception 'Gecersiz ifade';
  end if;
  if (select count(*) from public.hikayeler
       where kullanici_id = v_ben and bitis > now()) >= 10 then
    raise exception 'Ayni anda en fazla 10 hikayen olabilir';
  end if;

  insert into public.hikayeler (kullanici_id, fotograf, yazi, mekan_id, ifade, gorunurluk)
  values (v_ben, p_fotograf, nullif(trim(p_yazi), ''), p_mekan_id, p_ifade, p_gorunurluk)
  returning * into v_hikaye;

  if p_etiketler is not null then
    foreach v_kisi in array p_etiketler loop
      if v_kisi = v_ben then
        raise exception 'Kendini etiketleyemezsin';
      end if;
      if not bag.takip_ediyor_mu(v_ben, v_kisi) then
        raise exception 'Yalnizca arkadaslarini etiketleyebilirsin';
      end if;
      insert into public.hikaye_etiketleri (hikaye_id, kullanici_id)
      values (v_hikaye.id, v_kisi)
      on conflict do nothing;
    end loop;
  end if;

  return v_hikaye;
end;
$$;

revoke execute on function public.hikaye_ekle(text, text, uuid, text, uuid[], text) from public, anon;
grant execute on function public.hikaye_ekle(text, text, uuid, text, uuid[], text) to authenticated, service_role;

notify pgrst, 'reload schema';
