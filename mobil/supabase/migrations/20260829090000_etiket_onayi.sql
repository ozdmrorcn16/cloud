-- ETIKETLEME ARTIK ONAY ISTIYOR.
--
-- Kullanicinin karari (2026-08-29): "bir kullanici baska bir
-- kullaniciyi checkinine etiketlemek istediginde oraya onay verme yada
-- reddetme bildirimi duesucek".
--
-- ONCEKI DAVRANIS: etiket aninda gecerliydi; etiketlenen kisi ancak
-- sonradan kendi etiketini KALDIRABILIYORDU. Yani "once yayinla, sonra
-- itiraz et" modeli. Yeni model tersi: etiket ONAYLANANA KADAR
-- baskalarina gorunmez.
--
-- Bu, tacize karsi anlamli bir fark: birinin adini bilmedigi bir yere
-- yazmak artik mumkun degil.
--
-- REDDEDILEN SATIR SILINMIYOR. Sebep: birincil anahtar
-- (check_in_id, kullanici_id) oldugu icin duran satir AYNI check-in'e
-- tekrar etiketlemeyi de engelliyor. Silseydik israrli biri ayni
-- etiketi tekrar tekrar gonderebilirdi.

alter table public.check_in_etiketleri
  add column if not exists durum text not null default 'bekliyor';

-- Var olan etiketler ESKI KURALLARLA kondu ve o gun gorunur haldeydi;
-- geriye donuk gizlemek yanlis olur.
update public.check_in_etiketleri set durum = 'onaylandi' where durum = 'bekliyor';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_in_etiketleri_durum_gecerli'
  ) then
    alter table public.check_in_etiketleri
      add constraint check_in_etiketleri_durum_gecerli
      check (durum in ('bekliyor', 'onaylandi', 'reddedildi'));
  end if;
end $$;

create index if not exists check_in_etiketleri_bekleyen
  on public.check_in_etiketleri (kullanici_id, durum);

-- ---------------------------------------------------------------- --
-- Politikalar
-- ---------------------------------------------------------------- --

-- SELECT: onaylanmis etiket check-in'i gorebilen herkese gorunur.
-- Bekleyen ya da reddedilmis etiketi YALNIZCA iki taraf gorur:
-- check-in'in sahibi ve etiketlenen kisi.
drop policy if exists "etiketler check-in ile birlikte gorunur" on public.check_in_etiketleri;
create policy "etiketler check-in ile birlikte gorunur"
  on public.check_in_etiketleri for select
  to authenticated
  using (
    exists (select 1 from public.check_inler c where c.id = check_in_id)
    and (
      durum = 'onaylandi'
      or kullanici_id = auth.uid()
      or exists (
        select 1 from public.check_inler c
        where c.id = check_in_id and c.kullanici_id = auth.uid()
      )
    )
  );

-- INSERT: eskisi gibi yalnizca karsilikli bagli kisi etiketlenebilir,
-- AMA satir 'bekliyor' olarak giriyor. `durum` kontrolu olmasaydi
-- etiketleyen kisi kendi etiketini onaylanmis yazabilirdi.
drop policy if exists "kendi check-in'ine bagli oldugu kisiyi etiketleyebilir"
  on public.check_in_etiketleri;
create policy "kendi check-in'ine bagli oldugu kisiyi etiketleyebilir"
  on public.check_in_etiketleri for insert
  to authenticated
  with check (
    kullanici_id <> auth.uid()
    and durum = 'bekliyor'
    and exists (
      select 1 from public.check_inler c
      where c.id = check_in_id and c.kullanici_id = auth.uid()
    )
    and bag.takip_ediyor_mu(auth.uid(), kullanici_id)
  );

-- UPDATE: yalnizca ETIKETLENEN kisi karar verir, yalnizca bekleyen bir
-- etikette, ve yalnizca onayla/reddet yonunde. Check-in'in sahibi
-- kendi etiketini onaylayamaz.
drop policy if exists "etiketlenen kisi karar verir" on public.check_in_etiketleri;
create policy "etiketlenen kisi karar verir"
  on public.check_in_etiketleri for update
  to authenticated
  using (kullanici_id = auth.uid() and durum = 'bekliyor')
  with check (kullanici_id = auth.uid() and durum in ('onaylandi', 'reddedildi'));

-- ---------------------------------------------------------------- --
-- Bekleyen etiketler: bildirim ekraninin okudugu liste
-- ---------------------------------------------------------------- --
--
-- Neden RPC: ekran "kim etiketledi, nerede" bilgisini bir arada
-- istiyor. `profiller` tablosunun select politikasi yalnizca kendi
-- satirini okumaya izin veriyor, yani etiketleyenin adini duz bir
-- join ile alamiyoruz.
create or replace function public.bekleyen_etiketlerim()
returns table (
  check_in_id uuid,
  mekan_adi text,
  etiketleyen_id uuid,
  etiketleyen_ad text,
  etiketleyen_kullanici_adi text,
  olusturuldu timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  select e.check_in_id, m.ad, c.kullanici_id, p.ad, p.kullanici_adi, e.olusturuldu
  from public.check_in_etiketleri e
  join public.check_inler c on c.id = e.check_in_id
  join public.mekanlar m on m.id = c.mekan_id
  join public.profiller p on p.id = c.kullanici_id
  where e.kullanici_id = auth.uid()
    and e.durum = 'bekliyor'
    -- Etiketleyen hesap askiya alinmis ya da yasaklanmissa istegi
    -- gostermiyoruz; diger okuma yollari da ayni kontrolu yapiyor.
    and moderasyon.hesap_aktif_mi(c.kullanici_id)
    -- Engelleme iki yonlu keser.
    and not exists (
      select 1 from public.engellemeler b
      where (b.engelleyen_id = auth.uid() and b.engellenen_id = c.kullanici_id)
         or (b.engelleyen_id = c.kullanici_id and b.engellenen_id = auth.uid())
    )
  order by e.olusturuldu desc
  limit 50;
end;
$function$;

revoke all on function public.bekleyen_etiketlerim() from public;
grant execute on function public.bekleyen_etiketlerim() to authenticated;

comment on function public.bekleyen_etiketlerim() is
  'Bildirim ekrani: kullaniciyi etiketlemek isteyen bekleyen istekler.';
