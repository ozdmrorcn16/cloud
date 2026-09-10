-- vpn — Row Level Security kurallari
--
-- Temel ilke: istemci (anon/authenticated anahtar) yalnizca KENDI verisini
-- okur. Abonelik ve peer kayitlarini yalnizca sunucu tarafi (service_role,
-- yani Edge Function) yazar. service_role RLS'i baypas eder, bu yuzden ona
-- ayrica policy yazilmaz.

alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.servers       enable row level security;
alter table public.peers         enable row level security;

-- ------------------------------------------------------------------ profiles

drop policy if exists "profil kendi okur" on public.profiles;
create policy "profil kendi okur"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profil kendi gunceller" on public.profiles;
create policy "profil kendi gunceller"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Insert yok: profil trigger ile olusuyor. Delete yok: hesap silinince cascade.

-- ------------------------------------------------------------- subscriptions

drop policy if exists "abonelik kendi okur" on public.subscriptions;
create policy "abonelik kendi okur"
  on public.subscriptions for select
  to authenticated
  using ((select auth.uid()) = kullanici_id);

-- Insert/update/delete YOK. Abonelik yalnizca odeme webhook'u (service_role)
-- tarafindan yazilir; yoksa herkes kendine sinirsiz abonelik yazar.

-- ------------------------------------------------------------------- servers

drop policy if exists "sunuculari aboneler gorur" on public.servers;
create policy "sunuculari aboneler gorur"
  on public.servers for select
  to authenticated
  using (
    aktif
    and public.abonelik_gecerli_mi((select auth.uid()))
  );

-- Sunucu listesi herkese acik degil: abonesi olmayan endpoint'leri goremez.
-- Yazma yalnizca service_role.

-- --------------------------------------------------------------------- peers

drop policy if exists "peer kendi okur" on public.peers;
create policy "peer kendi okur"
  on public.peers for select
  to authenticated
  using ((select auth.uid()) = kullanici_id);

drop policy if exists "peer kendi siler" on public.peers;
create policy "peer kendi siler"
  on public.peers for delete
  to authenticated
  using ((select auth.uid()) = kullanici_id);

-- Insert/update YOK: peer kaydini yalnizca issue-config Edge Function acar.
-- Aksi halde kullanici kendine istedigi kadar cihaz/IP yazabilirdi.

-- ------------------------------------------------------------ yetki kisitlama

-- Yardimci fonksiyonlar security definer; anon'un cagirmasina gerek yok.
-- Not: `revoke ... from public` service_role'un ortulu yetkisini de kaldirir,
-- bu yuzden Edge Function'in kullandigi yetki ayrica veriliyor.
revoke all on function public.sonraki_tunel_ip(uuid) from public, anon, authenticated;
grant execute on function public.sonraki_tunel_ip(uuid) to service_role;

revoke all on function public.abonelik_gecerli_mi(uuid) from public, anon;
grant execute on function public.abonelik_gecerli_mi(uuid) to authenticated, service_role;
