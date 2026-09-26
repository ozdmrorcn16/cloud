-- ANLIGA IFADE, EN SIK KULLANILANLAR (2026-09-26, kullanicinin istegi:
-- "anligini goren biri fotografin altinda en sik kullanilan bir kac ifade
-- gorsun; bastigi zaman ifade direk birakilmis olacak; daha fazlasi icin
-- arti isareti").
--
-- Sira: once KISININ KENDI en sik kullandiklari (anliklara biraktigi
-- ifadeler + check-in ifadeleri), sonra butun uygulamada en sik
-- kullanilanlar (yalnizca ADET - kimin kullandigi donmez), en son
-- sozlugun sirasi. Istemci ilk p_adet kadarini gosterir.

create or replace function public.sik_ifadeler(p_adet integer default 6)
 returns table(slug text)
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  with kendi as (
    select ifade as slug, count(*) as adet from (
      select g.ifade from public.hikaye_goruntulemeler g
       where g.kullanici_id = auth.uid() and g.ifade is not null
      union all
      select c.ifade from public.check_inler c
       where c.kullanici_id = auth.uid() and c.ifade is not null
    ) k group by ifade
  ),
  genel as (
    select ifade as slug, count(*) as adet from (
      select g.ifade from public.hikaye_goruntulemeler g where g.ifade is not null
      union all
      select c.ifade from public.check_inler c where c.ifade is not null
    ) t group by ifade
  ),
  sirali as (
    select i.slug,
           coalesce(k.adet, 0) as kendi_adet,
           coalesce(g.adet, 0) as genel_adet,
           i.sira
      from public.ifadeler i
      left join kendi k on k.slug = i.slug
      left join genel g on g.slug = i.slug
  )
  select s.slug from sirali s
   where auth.uid() is not null
   order by s.kendi_adet desc, s.genel_adet desc, s.sira asc
   limit least(greatest(coalesce(p_adet, 6), 1), 20);
$function$;

revoke execute on function public.sik_ifadeler(integer) from public, anon;
grant execute on function public.sik_ifadeler(integer) to authenticated;
