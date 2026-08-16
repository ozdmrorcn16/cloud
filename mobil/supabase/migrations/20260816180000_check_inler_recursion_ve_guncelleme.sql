-- Task 11 dogrulamasi sirasinda bulundu: "check-in gorunurlugu" SELECT
-- politikasinin ucuncu kosulu, check_inler tablosunu kendi politikasi
-- icinde dogrudan bir alt sorguda referans veriyordu ("benim" alias'i).
-- Postgres bunu "infinite recursion detected in policy for relation
-- check_inler" (42P17) ile reddediyor; authenticated bir istemcinin
-- check_inler'a yaptigi HER select/update/delete bu hatayla patliyordu.
-- Cozum, gizli.engelli_mi() icin zaten kullanilan desenin ayni:
-- self-join'i security definer bir fonksiyona tasimak, boylece RLS
-- kendi kendini yeniden tetiklemiyor.

create or replace function gizli.ayni_mekanda_canli_mi(p_mekan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.check_inler
    where kullanici_id = auth.uid()
      and mekan_id = p_mekan_id
      and konum is not null
      and bitis_zamani > now()
  );
$$;

grant execute on function gizli.ayni_mekanda_canli_mi(uuid) to authenticated;

drop policy "check-in gorunurlugu" on public.check_inler;

create policy "check-in gorunurlugu"
  on public.check_inler for select
  to authenticated
  using (
    not gizli.engelli_mi(check_inler.kullanici_id)
    and
    (
      kullanici_id = auth.uid()
      or konum is not null
      or gorunurluk <> 'kimse'
    )
    and
    (
      kullanici_id = auth.uid()
      or konum is null
      or gizli.ayni_mekanda_canli_mi(check_inler.mekan_id)
    )
  );

-- Ayrica eksikti: check_inler icin hicbir UPDATE politikasi yoktu, bu da
-- Task 11'in "gorunurluk = kimse" senaryosunu (ve check_inden_ayril'in
-- alternatifi olan dogrudan-guncelleme yolunu) kurulamaz hale getiriyordu.
create policy "kendi check-in'ini guncelleyebilir"
  on public.check_inler for update
  to authenticated
  using (kullanici_id = auth.uid())
  with check (kullanici_id = auth.uid());
