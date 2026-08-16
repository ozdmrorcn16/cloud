create schema if not exists gizli;

create or replace function gizli.engelli_mi(p_diger_kullanici uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_diger_kullanici)
       or (e.engelleyen_id = p_diger_kullanici and e.engellenen_id = auth.uid())
  );
$$;

grant usage on schema gizli to authenticated;
grant execute on function gizli.engelli_mi(uuid) to authenticated;

drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    -- 1) Engelleme: iki yonden herhangi biri varsa hicbir sey gorunmez.
    --    engellemeler tablosunun kendi RLS'i (engelleyen_id = auth.uid())
    --    dogrudan bir alt sorguda "kim beni engelledi" yonunu gormeyi
    --    engelledigi icin, security definer bir yardimci fonksiyon
    --    kullaniliyor (gizli.engelli_mi).
    not gizli.engelli_mi(check_inler.kullanici_id)
    and
    -- 2) Ani gorunurlugu: 'kimse' ise yalnizca sahibi gorur.
    (
      kullanici_id = auth.uid()
      or konum is not null
      or gorunurluk <> 'kimse'
    )
    and
    -- 3) Faz 2a'nin uc kosulu (degismedi).
    (
      kullanici_id = auth.uid()
      or konum is null
      or exists (
        select 1 from public.check_inler benim
        where benim.kullanici_id = auth.uid()
          and benim.mekan_id = check_inler.mekan_id
          and benim.konum is not null
          and benim.bitis_zamani > now()
      )
    )
  );
