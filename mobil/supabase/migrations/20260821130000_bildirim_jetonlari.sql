-- Bildirimler Task 1: itme (push) bildirim jetonlarini tutan tablo ve
-- kayit/silme RPC'leri. Jeton global olarak benzersiz: ayni cihaz jetonu
-- ayni anda yalnizca tek kullanicida durabilir. Cihazi devralan hesap
-- eskisinin bildirimini almamali, bu yuzden kaydetme sirasinda ayni jeton
-- baska kullanicidan siliniyor.
create table public.bildirim_jetonlari (
  kullanici_id  uuid not null references auth.users(id) on delete cascade,
  jeton         text not null,
  platform      text not null check (platform in ('ios', 'android')),
  guncellendi   timestamptz not null default now(),
  primary key (kullanici_id, jeton),
  constraint bildirim_jetonlari_jeton_benzersiz unique (jeton)
);

alter table public.bildirim_jetonlari enable row level security;

-- Yalnizca kendi jeton satirlarini gorursun.
create policy "kendi jetonlarim"
  on public.bildirim_jetonlari for select
  to authenticated
  using (kullanici_id = auth.uid());

revoke insert, update, delete on public.bildirim_jetonlari from authenticated;

-- jeton_kaydet: giris sonrasi ve her acilista istemciden cagrilir. Once
-- ayni jeton baska bir kullanicida kayitliysa siler (cihaz devri), sonra
-- kendi satirini upsert eder.
create or replace function public.jeton_kaydet(
  p_jeton text,
  p_platform text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_jeton is null or length(trim(p_jeton)) = 0 then
    raise exception 'Jeton bos olamaz';
  end if;

  if length(trim(p_jeton)) > 500 then
    raise exception 'Jeton cok uzun';
  end if;

  if p_platform is null or p_platform not in ('ios', 'android') then
    raise exception 'Gecersiz platform';
  end if;

  -- Cihazi devralan hesap eskisinin bildirimini almamali.
  delete from public.bildirim_jetonlari
   where jeton = trim(p_jeton)
     and kullanici_id <> auth.uid();

  insert into public.bildirim_jetonlari (kullanici_id, jeton, platform, guncellendi)
  values (auth.uid(), trim(p_jeton), p_platform, now())
  on conflict (kullanici_id, jeton)
  do update set platform = excluded.platform,
                guncellendi = now();
end;
$$;

revoke execute on function public.jeton_kaydet(text, text) from public, anon;
grant execute on function public.jeton_kaydet(text, text) to authenticated;

-- jeton_sil: cikis akisinda cagrilir. Satir yoksa hata YOK (mukerrer
-- cagri zararsiz olmali - DELETE zaten 0 satir eslesince hata vermez).
create or replace function public.jeton_sil(p_jeton text) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_jeton is null or length(trim(p_jeton)) = 0 then
    raise exception 'Jeton bos olamaz';
  end if;

  delete from public.bildirim_jetonlari
   where kullanici_id = auth.uid()
     and jeton = trim(p_jeton);
end;
$$;

revoke execute on function public.jeton_sil(text) from public, anon;
grant execute on function public.jeton_sil(text) to authenticated;
