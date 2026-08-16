drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    -- 1) Engelleme: iki yonden herhangi biri varsa hicbir sey gorunmez.
    not exists (
      select 1 from public.engellemeler e
      where (e.engelleyen_id = auth.uid() and e.engellenen_id = check_inler.kullanici_id)
         or (e.engelleyen_id = check_inler.kullanici_id and e.engellenen_id = auth.uid())
    )
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
