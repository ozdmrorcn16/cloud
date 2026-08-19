-- Ayri sema: RLS'in cagirdigi security definer yardimcilar public'te
-- durmamali, yoksa PostgREST bunlari istemciye RPC olarak sunar.
-- Faz 2b'deki gizli semasi tam bu sebeple acilmisti.
create schema if not exists bag;

-- Politikalar takipler tablosuna DOGRUDAN bakmaz. takipler'in kendi
-- RLS'i "yalnizca kendi taraf oldugum satirlar" dedigi icin dogrudan
-- alt sorgu ucuncu bir kisinin takip iliskisini goremez; ayrica Faz
-- 2b'de check_inler politikasinin kendi tablosuna bakmasi Postgres'te
-- "infinite recursion detected in policy" hatasina yol acmisti.
create or replace function bag.takip_ediyor_mu(p_takip_eden uuid, p_takip_edilen uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.takipler
    where takip_eden_id = p_takip_eden
      and takip_edilen_id = p_takip_edilen
      and durum = 'kabul'
  );
$$;

grant usage on schema bag to authenticated;
grant execute on function bag.takip_ediyor_mu(uuid, uuid) to authenticated;
