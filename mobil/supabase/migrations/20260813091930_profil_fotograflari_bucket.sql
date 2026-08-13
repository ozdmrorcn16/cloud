insert into storage.buckets (id, name, public)
values ('profil-fotograflari', 'profil-fotograflari', false);

create policy "kendi fotografini yukleyebilir"
  on storage.objects for insert
  with check (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "kendi fotografini okuyabilir"
  on storage.objects for select
  using (
    bucket_id = 'profil-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
