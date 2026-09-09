-- MEKAN FOTOGRAFLARI KOVASI
--
-- Duzenleme talebine iliştirilen kapak fotografi burada duruyor.
-- Kova PUBLIC DEGIL: onaylanmamis bir fotograf yalnizca yukleyen ve
-- moderator tarafindan gorulebilmeli - moderasyondan gecmemis bir
-- gorseli herkese acmak, uygunsuz icerigin onay beklerken yayinda
-- olmasi demekti.

insert into storage.buckets (id, name, public)
values ('mekan-fotograflari', 'mekan-fotograflari', false)
on conflict (id) do nothing;

-- YUKLEME: yalnizca kendi klasorune. Talep RPC'si de ayni kurali
-- ayrica dogruluyor (baskasinin dosyasini kendi talebine
-- iliştiremesin diye); ikisi birbirinin yedegi degil, iki ayri kapi.
create policy "kendi mekan fotografini yukleyebilir"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mekan-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- OKUMA UC DURUMDA:
--   1) dosya senin klasorundeyse (kendi talebini gorursun),
--   2) fotograf ONAYLANMIS ve bir mekanin kapak fotografiysa (herkes),
--   3) moderatorsen (karar verebilmek icin gormek zorunda).
create policy "mekan fotografini onay durumuna gore okuyabilir"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'mekan-fotograflari'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.mekanlar m where m.kapak_fotograf = storage.objects.name
      )
      or moderasyon.yetkili_mi()
    )
  );

-- SILME: yalnizca kendi klasorunden. Onaylanmis bir kapak fotografini
-- yukleyenin sonradan silmesi mekani gorselsiz birakirdi; o durum
-- kabul ediliyor - dosya kisinin kendi urunu ve kaldirma hakki var
-- (KVKK: veri sahibinin silme hakki).
create policy "kendi mekan fotografini silebilir"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'mekan-fotograflari'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
