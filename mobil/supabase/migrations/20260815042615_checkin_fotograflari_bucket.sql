insert into storage.buckets (id, name, public)
values ('check-in-fotograflari', 'check-in-fotograflari', false);

create policy "kendi check-in fotografini yukleyebilir"
  on storage.objects for insert
  with check (
    bucket_id = 'check-in-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select
  using (
    bucket_id = 'check-in-fotograflari'
    and exists (
      select 1 from public.check_inler c
      where c.fotograf = storage.objects.name
        and (
          c.kullanici_id = auth.uid()
          or c.konum is null
          or exists (
            select 1 from public.check_inler benim
            where benim.kullanici_id = auth.uid()
              and benim.mekan_id = c.mekan_id
              and benim.konum is not null
              and benim.bitis_zamani > now()
          )
        )
    )
  );
