-- HESAP VE GUVENLIK > ACIK OTURUMLAR (2026-09-18 gece, kullanicinin
-- istegi: ayarlarin en ustune "Hesap ve guvenlik - E-posta, sifre ve
-- acik oturumlar").
--
-- supabase-js istemciden oturum listesi vermiyor; `auth.sessions`
-- yalnizca SQL'den okunabiliyor. Iki security definer RPC:
--   oturumlarim()      -> kisinin KENDI oturumlari (cihaz, IP, zaman,
--                         hangisi bu cihaz). auth.uid() disina asla.
--   oturumu_kapat(id)  -> kendi oturumlarindan birini siler; refresh
--                         token'lar FK ile birlikte gider, cihaz bir
--                         sonraki yenilemede dusur (erisim jetonu en
--                         fazla 1 saat daha yasar - GoTrue tasarimi).
-- Mevcut oturum `auth.jwt() ->> 'session_id'` ile isaretleniyor;
-- onu kapatmak istemcide `signOut` ile yapiliyor, RPC'den degil.
--
-- KVKK: IP ve cihaz bilgisi Supabase Auth'un zaten tuttugu veri; burada
-- yalnizca sahibine gosteriliyor (m.11 erisim). Gizlilik metnine
-- "oturum kayitlari: cihaz ve IP" satiri eklendi.

create or replace function public.oturumlarim()
returns table (
  id uuid,
  olusturuldu timestamptz,
  son_etkinlik timestamptz,
  cihaz text,
  ip text,
  bu_cihaz boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.created_at,
    coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at),
    s.user_agent,
    host(s.ip),
    s.id::text = (auth.jwt() ->> 'session_id')
  from auth.sessions s
  where auth.uid() is not null and s.user_id = auth.uid()
  order by (s.id::text = (auth.jwt() ->> 'session_id')) desc,
           coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke execute on function public.oturumlarim() from public, anon;
grant execute on function public.oturumlarim() to authenticated;

create or replace function public.oturumu_kapat(p_oturum_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if p_oturum_id::text = (auth.jwt() ->> 'session_id') then
    raise exception 'Bu cihazdan cikmak icin Cikis yap kullan';
  end if;
  delete from auth.sessions
  where id = p_oturum_id and user_id = auth.uid();
  if not found then
    raise exception 'Oturum bulunamadi';
  end if;
end;
$$;

revoke execute on function public.oturumu_kapat(uuid) from public, anon;
grant execute on function public.oturumu_kapat(uuid) to authenticated;
