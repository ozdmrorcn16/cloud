-- BEGENI, YORUM VE SIKAYET
--
-- Kullanicinin istegi (2026-09-02) ve verdigi uc karar:
--   1. Yorumu, PAYLASIMI GOREBILEN yazar. Ayri bir yetki kavrami
--      EKLENMEDI: gorunurluk kurallari (gizli profil dahil) yorumlar
--      icin de kendiliginden gecerli, cunku butun kontroller ayni
--      check-in gorunurlugune dayaniyor.
--   2. Paylasim sahibi kendi paylasimindaki yorumu SILEBILIR.
--   3. Sikayet edilen yorum ANINDA gizlenir.
--
-- (3) tek basina bir sansur araci olabilirdi - biri begenmedigi her
-- yorumu sikayet edip susturabilirdi. Bu yuzden iki kisit kondu: ayni
-- kisi ayni yorumu BIR KEZ sikayet edebilir, ve gunde en fazla 20
-- sikayet gonderebilir.

-- ---------------------------------------------------------------------
-- BEGENILER
-- ---------------------------------------------------------------------
create table if not exists public.begeniler (
  check_in_id uuid not null references public.check_inler(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  olusturuldu timestamptz not null default now(),
  primary key (check_in_id, kullanici_id)
);

create index if not exists begeniler_check_in_idx on public.begeniler (check_in_id);

alter table public.begeniler enable row level security;

-- Alt sorgu CAGIRANIN RLS'ine tabi: check-in'i goremeyen begenilerini
-- de goremiyor. Gorunurluk kurali tek yerde (check_inler politikasi)
-- kaliyor, burada tekrar edilmiyor.
drop policy if exists "begeni gorunurlugu" on public.begeniler;
create policy "begeni gorunurlugu" on public.begeniler
for select to authenticated
using (exists (select 1 from public.check_inler c where c.id = check_in_id));

drop policy if exists "kendi begenisini ekler" on public.begeniler;
create policy "kendi begenisini ekler" on public.begeniler
for insert to authenticated
with check (
  kullanici_id = auth.uid()
  and moderasyon.hesap_aktif_mi(auth.uid())
  and exists (select 1 from public.check_inler c where c.id = check_in_id)
);

drop policy if exists "kendi begenisini siler" on public.begeniler;
create policy "kendi begenisini siler" on public.begeniler
for delete to authenticated
using (kullanici_id = auth.uid());

-- ---------------------------------------------------------------------
-- YORUMLAR
-- ---------------------------------------------------------------------
create table if not exists public.yorumlar (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid not null references public.check_inler(id) on delete cascade,
  -- Hesap silinince yorum ANONIMLESIR, silinmez: karsi tarafin gordugu
  -- akis bozulmasin (mesajlardaki desenin aynisi, karar 69).
  kullanici_id uuid references auth.users(id) on delete set null,
  metin text not null check (length(trim(metin)) between 1 and 500),
  olusturuldu timestamptz not null default now(),
  -- Sikayet uzerine ANINDA true olur; moderator karar verene kadar
  -- kimseye gorunmez, YAZANI DAHIL.
  sikayet_gizli boolean not null default false,
  moderasyon_gizli boolean not null default false
);

create index if not exists yorumlar_check_in_idx
  on public.yorumlar (check_in_id, olusturuldu);

alter table public.yorumlar enable row level security;

drop policy if exists "yorum gorunurlugu" on public.yorumlar;
create policy "yorum gorunurlugu" on public.yorumlar
for select to authenticated
using (
  not sikayet_gizli
  and not moderasyon_gizli
  and (kullanici_id is null or not gizli.engelli_mi(kullanici_id))
  and exists (select 1 from public.check_inler c where c.id = check_in_id)
);

drop policy if exists "kendi yorumunu ekler" on public.yorumlar;
create policy "kendi yorumunu ekler" on public.yorumlar
for insert to authenticated
with check (
  kullanici_id = auth.uid()
  and moderasyon.hesap_aktif_mi(auth.uid())
  and exists (select 1 from public.check_inler c where c.id = check_in_id)
);

-- Yorumu YAZAN ya da PAYLASIMIN SAHIBI siler (kullanicinin karari).
drop policy if exists "yorumu yazan ya da paylasim sahibi siler" on public.yorumlar;
create policy "yorumu yazan ya da paylasim sahibi siler" on public.yorumlar
for delete to authenticated
using (
  kullanici_id = auth.uid()
  or exists (
    select 1 from public.check_inler c
    where c.id = check_in_id and c.kullanici_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------
-- SIKAYET: 'yorum' turu
-- ---------------------------------------------------------------------
alter table public.sikayetler drop constraint if exists sikayetler_hedef_tur_check;
alter table public.sikayetler add constraint sikayetler_hedef_tur_check
  check (hedef_tur in ('kullanici', 'check_in', 'mesaj', 'yorum'));

-- ---------------------------------------------------------------------
-- RPC'LER
-- ---------------------------------------------------------------------

-- Begeni/yorum sayilari ve "ben begendim mi" - TOPLU.
-- Akista satir basina ayri sorgu atmak otuz gidis-donus demekti.
-- SECURITY INVOKER bilerek: sayimlar cagiranin RLS'i altinda yapiliyor,
-- yani goremedigi bir paylasimin sayilarini da alamiyor.
create or replace function public.etkilesim_ozetleri(p_check_in_ids uuid[])
returns table(check_in_id uuid, begeni int, yorum int, begendim boolean)
language sql
stable
security invoker
set search_path to 'public'
as $$
  select
    c.id,
    (select count(*)::int from public.begeniler b where b.check_in_id = c.id),
    (select count(*)::int from public.yorumlar y where y.check_in_id = c.id),
    exists (
      select 1 from public.begeniler b
      where b.check_in_id = c.id and b.kullanici_id = auth.uid()
    )
  from public.check_inler c
  where c.id = any(p_check_in_ids);
$$;

revoke all on function public.etkilesim_ozetleri(uuid[]) from public;
grant execute on function public.etkilesim_ozetleri(uuid[]) to authenticated;

-- Yorumlari YAZARIYLA getirir.
--
-- Neden RPC: `profiller` uzerinde "yalnizca kendi profilini oku" kurali
-- var, yani istemci join ile yazar adini okuyamiyor. Ayni sinif hata
-- Faz 2a'da yasandi - mekan detayi 66 test yesilken canlida hic
-- calismiyordu.
--
-- `security definer` RLS'i atladigi icin gorunurluk kontrolu BURADA
-- acikca yapiliyor.
create or replace function public.yorumlari_getir(p_check_in_id uuid)
returns table(
  id uuid,
  kullanici_id uuid,
  kullanici_adi text,
  ad text,
  metin text,
  olusturuldu timestamptz,
  silebilir_mi boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not exists (
    select 1 from public.check_inler c where c.id = p_check_in_id
      and (
        c.kullanici_id = auth.uid()
        or (
          not c.moderasyon_gizli
          and moderasyon.hesap_aktif_mi(c.kullanici_id)
          and not gizli.engelli_mi(c.kullanici_id)
          and (
            not gizli.profil_gizli_mi(c.kullanici_id)
            or bag.takip_ediyor_mu(auth.uid(), c.kullanici_id)
          )
        )
      )
  ) then
    return;
  end if;

  return query
    select y.id, y.kullanici_id, p.kullanici_adi, p.ad, y.metin, y.olusturuldu,
           (
             y.kullanici_id = auth.uid()
             or exists (
               select 1 from public.check_inler c
               where c.id = y.check_in_id and c.kullanici_id = auth.uid()
             )
           ) as silebilir_mi
    from public.yorumlar y
    left join public.profiller p on p.id = y.kullanici_id
    where y.check_in_id = p_check_in_id
      and not y.sikayet_gizli
      and not y.moderasyon_gizli
      and (y.kullanici_id is null or not gizli.engelli_mi(y.kullanici_id))
    order by y.olusturuldu asc;
end;
$function$;

revoke all on function public.yorumlari_getir(uuid) from public;
grant execute on function public.yorumlari_getir(uuid) to authenticated;

-- Yorum sikayeti: ANINDA gizler (kullanicinin karari).
create or replace function public.yorumu_sikayet_et(
  p_yorum_id uuid,
  p_sebep text,
  p_aciklama text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  gunluk_tavan constant int := 20;
  v_sayi int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Bu islem su an yapilamiyor';
  end if;

  if not exists (select 1 from public.yorumlar where id = p_yorum_id) then
    raise exception 'Yorum bulunamadi';
  end if;

  -- Ayni yorumu ikinci kez sikayet etmek yeni kayit ACMAZ; sessizce
  -- doner, cunku kullanici acisindan istedigi sey zaten olmus durumda.
  if exists (
    select 1 from public.sikayetler
    where sikayet_eden_id = auth.uid()
      and hedef_tur = 'yorum'
      and hedef_id = p_yorum_id
  ) then
    return;
  end if;

  select count(*) into v_sayi
  from public.sikayetler
  where sikayet_eden_id = auth.uid()
    and olusturuldu > now() - interval '1 day';

  if v_sayi >= gunluk_tavan then
    raise exception 'Bugunluk sikayet sinirina ulastin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama, durum)
  values (auth.uid(), 'yorum', p_yorum_id, p_sebep, p_aciklama, 'yeni');

  update public.yorumlar set sikayet_gizli = true where id = p_yorum_id;
end;
$function$;

revoke all on function public.yorumu_sikayet_et(uuid, text, text) from public;
grant execute on function public.yorumu_sikayet_et(uuid, text, text) to authenticated;
