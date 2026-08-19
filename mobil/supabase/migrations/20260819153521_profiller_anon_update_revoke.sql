-- Derinlemesine savunma: RLS zaten anon'u bloklar (auth.uid() null),
-- ama fonksiyonlarda tutarli sekilde anon'dan yetki cekiliyor.
revoke update on public.profiller from anon;
