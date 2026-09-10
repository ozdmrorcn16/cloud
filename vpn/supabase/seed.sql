-- Yerel gelistirme icin ornek veri (supabase start / supabase db reset).
--
-- UZAK PROJEDE CALISTIRMA. Buradaki acik anahtar ve endpoint sahtedir;
-- gercek degerleri VPS'te kur.sh calistiktan sonra elde edeceksin.

insert into public.servers (ulke, ulke_kodu, ad, endpoint, port, public_key, alt_ag, siralama)
values
  ('Almanya',  'DE', 'Frankfurt 1', '203.0.113.10', 51820,
   'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', '10.66.66.0/24', 10),
  ('Hollanda', 'NL', 'Amsterdam 1', '203.0.113.20', 51820,
   'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', '10.66.67.0/24', 20)
on conflict (endpoint, port) do nothing;
